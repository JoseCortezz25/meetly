import type { AudioMode } from '../types/meeting.types';
import type { ChannelKind, RecordingErrorCode } from '../types/recording.types';

/** A capture failure the UI can translate into a message. */
export class RecordingError extends Error {
  constructor(
    public readonly code: RecordingErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'RecordingError';
  }
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];

const pickMimeType = (): string =>
  MIME_CANDIDATES.find(type => MediaRecorder.isTypeSupported(type)) ?? '';

const channelsForMode = (mode: AudioMode): ChannelKind[] => {
  if (mode === 'mic') return ['mic'];
  if (mode === 'sys') return ['sys'];
  return ['mic', 'sys'];
};

type ChannelNodes = {
  stream: MediaStream;
  source: MediaStreamAudioSourceNode;
  gain: GainNode;
  analyser: AnalyserNode;
};

/**
 * Imperative Web Audio + MediaRecorder engine. Framework-agnostic: the React
 * hook owns lifecycle and state, this class owns the browser audio graph.
 *
 * Graph per channel:  source → gain (mute) → analyser (meter) → destination
 * The single destination stream is what MediaRecorder captures.
 */
export class RecordingEngine {
  private audioContext: AudioContext | null = null;
  private destination: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private readonly chunks: Blob[] = [];
  private readonly channels = new Map<ChannelKind, ChannelNodes>();
  private mimeType = '';

  async start(mode: AudioMode): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      throw new RecordingError(
        'unsupported',
        'Media capture is not available in this browser.'
      );
    }
    if (typeof MediaRecorder === 'undefined') {
      throw new RecordingError(
        'unsupported',
        'MediaRecorder is not supported in this browser.'
      );
    }

    const audioContext = new AudioContext();
    await audioContext.resume();
    const destination = audioContext.createMediaStreamDestination();
    this.audioContext = audioContext;
    this.destination = destination;

    try {
      for (const channel of channelsForMode(mode)) {
        const stream = await this.captureStream(channel);
        this.wireChannel(channel, stream);
      }
    } catch (error) {
      // Roll back any partial graph so a retry starts clean.
      this.teardownGraph();
      throw error;
    }

    this.mimeType = pickMimeType();
    const recorder = new MediaRecorder(
      destination.stream,
      this.mimeType ? { mimeType: this.mimeType } : undefined
    );
    recorder.ondataavailable = event => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    recorder.start();
    this.mediaRecorder = recorder;
  }

  private async captureStream(channel: ChannelKind): Promise<MediaStream> {
    try {
      if (channel === 'mic') {
        return await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
      }

      // getDisplayMedia requires a video constraint; we only keep the audio track.
      const display = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      if (display.getAudioTracks().length === 0) {
        display.getTracks().forEach(track => track.stop());
        throw new RecordingError(
          'no-system-audio',
          'No system audio was shared. On macOS, share a browser tab and enable "Share tab audio".'
        );
      }
      return display;
    } catch (error) {
      if (error instanceof RecordingError) throw error;
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw new RecordingError(
          'permission-denied',
          'Capture permission was denied.'
        );
      }
      throw new RecordingError(
        'unknown',
        'Could not start capture for this source.'
      );
    }
  }

  private wireChannel(channel: ChannelKind, stream: MediaStream): void {
    const audioContext = this.audioContext;
    const destination = this.destination;
    if (!audioContext || !destination) return;

    // Feed the graph from an audio-only stream so display video is ignored.
    const audioStream = new MediaStream(stream.getAudioTracks());
    const source = audioContext.createMediaStreamSource(audioStream);
    const gain = audioContext.createGain();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(gain);
    gain.connect(analyser);
    analyser.connect(destination);

    this.channels.set(channel, { stream, source, gain, analyser });
  }

  getAnalyser(channel: ChannelKind): AnalyserNode | null {
    return this.channels.get(channel)?.analyser ?? null;
  }

  setMuted(channel: ChannelKind, isMuted: boolean): void {
    const nodes = this.channels.get(channel);
    if (!nodes || !this.audioContext) return;
    nodes.gain.gain.setValueAtTime(
      isMuted ? 0 : 1,
      this.audioContext.currentTime
    );
  }

  pause(): void {
    if (this.mediaRecorder?.state === 'recording') this.mediaRecorder.pause();
  }

  resume(): void {
    if (this.mediaRecorder?.state === 'paused') this.mediaRecorder.resume();
  }

  stop(): Promise<Blob> {
    return new Promise(resolve => {
      const recorder = this.mediaRecorder;
      if (!recorder) {
        resolve(new Blob([], { type: this.mimeType || 'audio/webm' }));
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(this.chunks, {
          type: this.mimeType || 'audio/webm'
        });
        this.teardownGraph();
        resolve(blob);
      };
      recorder.stop();
    });
  }

  private teardownGraph(): void {
    this.channels.forEach(nodes => {
      nodes.source.disconnect();
      nodes.gain.disconnect();
      nodes.analyser.disconnect();
      nodes.stream.getTracks().forEach(track => track.stop());
    });
    this.channels.clear();
    this.destination = null;
    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close();
    }
    this.audioContext = null;
  }

  /** Stops everything without producing a Blob (unmount / navigation cleanup). */
  dispose(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    this.mediaRecorder = null;
    this.teardownGraph();
  }
}
