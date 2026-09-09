'use client';

import { useEffect, useRef, useState } from 'react';

/** Reads below this are treated as silence and clamped to the floor. */
const DB_FLOOR = -100;
/** Throttle text updates so the number stays readable, not a blur. */
const UPDATE_INTERVAL_MS = 120;
/** Easing toward the target for a stable read. */
const SMOOTHING = 0.3;

const readDbfs = (
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
  if (rms <= 0) return DB_FLOOR;
  return Math.max(DB_FLOOR, 20 * Math.log10(rms));
};

/**
 * Live peak level in dBFS for a capture channel, or `null` when nothing is
 * being captured (idle, paused, or muted). Reads the real analyser signal.
 */
export const usePeakDb = (
  analyser: AnalyserNode | null | undefined,
  isActive: boolean
): number | null => {
  const [peakDb, setPeakDb] = useState<number | null>(null);
  const smoothedRef = useRef(DB_FLOOR);

  useEffect(() => {
    if (!isActive || !analyser) {
      smoothedRef.current = DB_FLOOR;
      setPeakDb(null);
      return;
    }

    const buffer = new Uint8Array(analyser.fftSize);
    let frameId = 0;
    let lastEmit = 0;

    const step = (now: number) => {
      const target = readDbfs(analyser, buffer);
      smoothedRef.current += (target - smoothedRef.current) * SMOOTHING;
      if (now - lastEmit >= UPDATE_INTERVAL_MS) {
        setPeakDb(smoothedRef.current);
        lastEmit = now;
      }
      frameId = window.requestAnimationFrame(step);
    };
    frameId = window.requestAnimationFrame(step);

    return () => window.cancelAnimationFrame(frameId);
  }, [analyser, isActive]);

  return peakDb;
};
