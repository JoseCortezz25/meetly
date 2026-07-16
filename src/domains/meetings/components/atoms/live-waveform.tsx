'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import type { ChannelKind } from '../../types/recording.types';

type LiveWaveformProps = {
  channel: ChannelKind;
  /** Live audio source; null when no capture is running. */
  analyser: AnalyserNode | null;
  /** When false the bars settle to the baseline (paused / muted). */
  isActive: boolean;
  bars?: number;
  className?: string;
};

const MIN_HEIGHT = 4;

const channelBar: Record<ChannelKind, string> = {
  mic: 'bg-mic',
  sys: 'bg-sys'
};

export const LiveWaveform = ({
  channel,
  analyser,
  isActive,
  bars = 56,
  className
}: LiveWaveformProps) => {
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const settle = () => {
      barRefs.current.forEach(bar => {
        if (bar) bar.style.height = `${MIN_HEIGHT}%`;
      });
    };

    if (!analyser || !isActive) {
      settle();
      return;
    }

    // Focus on the lower ~60% of bins, where voice energy lives.
    const spectrum = new Uint8Array(analyser.frequencyBinCount);
    const usableBins = Math.floor(analyser.frequencyBinCount * 0.6);
    const binsPerBar = Math.max(1, Math.floor(usableBins / bars));
    let frameId = 0;

    const step = () => {
      analyser.getByteFrequencyData(spectrum);
      for (let i = 0; i < bars; i += 1) {
        let sum = 0;
        const start = i * binsPerBar;
        for (let j = 0; j < binsPerBar; j += 1) {
          sum += spectrum[start + j] ?? 0;
        }
        const value = sum / binsPerBar / 255;
        const height = MIN_HEIGHT + value * (100 - MIN_HEIGHT);
        const bar = barRefs.current[i];
        if (bar) bar.style.height = `${height}%`;
      }
      frameId = window.requestAnimationFrame(step);
    };
    frameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameId);
  }, [analyser, isActive, bars]);

  return (
    <div
      className={cn('flex h-full items-center gap-[2px]', className)}
      aria-hidden
    >
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          ref={element => {
            barRefs.current[index] = element;
          }}
          className={cn(
            'min-w-[2px] flex-1 rounded-full transition-[height] duration-75',
            channelBar[channel]
          )}
          style={{ height: `${MIN_HEIGHT}%` }}
        />
      ))}
    </div>
  );
};
