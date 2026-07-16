import { cn } from '@/lib/utils';
import type { ChannelKind } from '../../types/recording.types';

type WaveformProps = {
  /** Stable value used to derive bar heights deterministically (avoids hydration drift). */
  seed: number;
  bars?: number;
  /** When set, bars use the channel color and a burst profile with quiet gaps. */
  channel?: ChannelKind;
  className?: string;
};

const channelBar: Record<ChannelKind, string> = {
  mic: 'bg-mic',
  sys: 'bg-sys'
};

const barHeight = (seed: number, index: number, isChannel: boolean): number => {
  const detail = Math.abs(Math.sin(seed * 12.9898 + index * 0.7));
  if (!isChannel) {
    // Compact decorative profile: mostly full, gentle variation.
    return 20 + Math.round(detail * 80);
  }
  // Channel profile: a low-frequency envelope carves loud bursts and quiet gaps.
  const envelope = (Math.sin(seed + index * 0.16) + 1) / 2;
  const energy = Math.pow(envelope, 2.4) * detail;
  return 4 + Math.round(energy * 96);
};

export const Waveform = ({
  seed,
  bars = 28,
  channel,
  className
}: WaveformProps) => {
  const isChannel = Boolean(channel);

  return (
    <div
      className={cn('flex h-[34px] items-center gap-[2px]', className)}
      aria-hidden
    >
      {Array.from({ length: bars }, (_, index) => (
        <span
          key={index}
          className={cn(
            'min-w-[2px] flex-1',
            channel
              ? cn('rounded-full', channelBar[channel])
              : 'bg-ink-4 group-hover:bg-mic/35 rounded-[2px] transition-colors'
          )}
          style={{ height: `${barHeight(seed, index, isChannel)}%` }}
        />
      ))}
    </div>
  );
};
