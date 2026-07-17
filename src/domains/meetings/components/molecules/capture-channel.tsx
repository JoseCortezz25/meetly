import { Mic, MicOff, Monitor, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LevelMeter } from '../atoms/level-meter';
import { LiveWaveform } from '../atoms/live-waveform';
import { Waveform } from '../atoms/waveform';
import { channelMeta, formatPeakDb, recordingMessages } from '../../messages';
import type { ChannelKind } from '../../types/recording.types';

type CaptureChannelProps = {
  channel: ChannelKind;
  isMuted: boolean;
  /** Meter animates only when the session is capturing this channel. */
  isActive: boolean;
  muteLabel: string;
  /** Live audio source; when present the waveform/meter read real audio. */
  analyser?: AnalyserNode | null;
  onToggleMute: () => void;
};

const channelIcon: Record<ChannelKind, typeof Mic> = {
  mic: Mic,
  sys: Monitor
};

const channelAccent: Record<ChannelKind, string> = {
  mic: 'bg-mic/15 text-mic',
  sys: 'bg-sys/15 text-sys'
};

const activeMuteAccent: Record<ChannelKind, string> = {
  mic: 'border-transparent bg-mic/15 text-mic',
  sys: 'border-transparent bg-sys/15 text-sys'
};

/** Deterministic seed per channel so the two waveforms read differently. */
const channelSeed: Record<ChannelKind, number> = {
  mic: 7.3,
  sys: 13.1
};

export const CaptureChannel = ({
  channel,
  isMuted,
  isActive,
  muteLabel,
  analyser,
  onToggleMute
}: CaptureChannelProps) => {
  const meta = channelMeta[channel];
  const ChannelIcon = channelIcon[channel];
  const MuteIcon =
    channel === 'mic' ? (isMuted ? MicOff : Mic) : isMuted ? VolumeX : Volume2;
  const muteText = isMuted
    ? recordingMessages.channel.unmute
    : recordingMessages.channel.mute;

  return (
    <div
      className={cn(
        'border-line rounded-card bg-ink flex flex-col items-stretch overflow-hidden border transition-[opacity,filter] duration-200 sm:flex-row',
        isMuted && 'opacity-50 grayscale-[0.6]'
      )}
    >
      <div className="border-line flex w-full shrink-0 flex-col justify-between gap-4 border-b p-[18px] sm:w-[220px] sm:border-r sm:border-b-0">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              'grid size-[38px] shrink-0 place-items-center rounded-[10px]',
              channelAccent[channel]
            )}
          >
            <ChannelIcon className="size-[18px]" />
          </span>
          <span className="flex flex-col">
            <strong className="text-cream text-[15px] font-semibold">
              {meta.title}
            </strong>
            <small className="text-sand text-[12.5px] leading-tight">
              {meta.source}
            </small>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={muteLabel}
            aria-pressed={isMuted}
            className={cn(
              'border-line-2 text-sand hover:border-cream hover:text-cream inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[13px] font-semibold transition-colors',
              isMuted && activeMuteAccent[channel]
            )}
          >
            <MuteIcon className="size-[15px]" />
            {muteText}
          </button>
          <span className="text-sand-2 font-mono text-[12.5px] tabular-nums">
            {formatPeakDb(meta.peakDb)}
          </span>
        </div>
      </div>
      <div className="flex flex-1 items-stretch gap-3.5 p-[18px] pr-5">
        {analyser ? (
          <LiveWaveform
            channel={channel}
            analyser={analyser}
            isActive={isActive}
            className="h-16 flex-1"
          />
        ) : (
          <Waveform
            channel={channel}
            seed={channelSeed[channel]}
            bars={72}
            className="h-16 flex-1"
          />
        )}
        <LevelMeter channel={channel} isActive={isActive} analyser={analyser} />
      </div>
    </div>
  );
};
