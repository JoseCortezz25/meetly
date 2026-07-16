'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import type { ChannelKind } from '../../types/recording.types';

type LevelMeterProps = {
  channel: ChannelKind;
  /** When false the meter flatlines (paused, muted, or idle). */
  isActive: boolean;
  /** Live audio source for this channel; null when no capture is running. */
  analyser?: AnalyserNode | null;
};

const MIN_HEIGHT = 5;
/** Empirical gain so speech peaks reach near the top of the meter. */
const LEVEL_GAIN = 2.4;

const channelFill: Record<ChannelKind, string> = {
  mic: 'bg-mic',
  sys: 'bg-sys'
};

const readLevel = (
  analyser: AnalyserNode,
  buffer: Uint8Array<ArrayBuffer>
): number => {
  analyser.getByteTimeDomainData(buffer);
  let sum = 0;
  for (let i = 0; i < buffer.length; i += 1) {
    const centered = (buffer[i] - 128) / 128;
    sum += centered * centered;
  }
  const rms = Math.sqrt(sum / buffer.length);
  return Math.min(1, rms * LEVEL_GAIN);
};

export const LevelMeter = ({
  channel,
  isActive,
  analyser
}: LevelMeterProps) => {
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);

  useEffect(() => {
    if (!isActive || !analyser) {
      levelRef.current = 0;
      setLevel(0);
      return;
    }

    const buffer = new Uint8Array(analyser.fftSize);
    let frameId = 0;
    const step = () => {
      const target = readLevel(analyser, buffer);
      // Ease toward the target so the meter reads smoothly.
      levelRef.current += (target - levelRef.current) * 0.4;
      setLevel(levelRef.current);
      frameId = window.requestAnimationFrame(step);
    };
    frameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameId);
  }, [isActive, analyser]);

  const heightPct = Math.max(MIN_HEIGHT, Math.round(level * 100));

  return (
    <div className="relative h-full w-[5px] shrink-0" aria-hidden>
      <span className="bg-ink-4 absolute inset-0 rounded-full" />
      <span
        className={cn(
          'absolute inset-x-0 bottom-0 rounded-full transition-[height] duration-75',
          channelFill[channel]
        )}
        style={{ height: `${heightPct}%` }}
      />
      <span
        className={cn(
          'absolute inset-x-0 h-[5px] rounded-full',
          channelFill[channel]
        )}
        style={{ bottom: `calc(${heightPct}% + 4px)` }}
      />
    </div>
  );
};
