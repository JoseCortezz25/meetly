/**
 * Cross-cutting UI text shared across domains (app shell, navigation, settings).
 * Domain-specific copy stays inside each domain's messages.ts.
 */

import type { CapabilityKey } from '@/lib/system-capabilities';

export const navMessages = {
  brand: 'Meetly',
  home: 'Home',
  notes: 'Meeting notes',
  settings: 'Settings'
} as const;

/** Friendly labels for each detected capability (shown in the modal). */
export const capabilityLabels: Record<CapabilityKey, string> = {
  secureContext: 'Secure connection (HTTPS)',
  webgpu: 'WebGPU (GPU acceleration)',
  getUserMedia: 'Microphone access',
  getDisplayMedia: 'Tab/system audio sharing',
  mediaRecorder: 'Audio recording',
  audioContext: 'Web Audio',
  indexedDB: 'Local storage'
};

export const systemRequirementsMessages = {
  title: 'Your browser can’t run on-device AI',
  description:
    'Meetly transcribes and summarizes meetings entirely on your device. That needs a modern browser with WebGPU — this browser or device is missing what follows.',
  missingHeading: 'Missing requirements',
  detectedHeading: 'Detected',
  browserLabel: 'Browser',
  gpuLabel: 'GPU',
  coresLabel: 'CPU cores',
  memoryLabel: 'Memory',
  unknown: 'Unknown',
  memoryValue: (gb: number) => `~${gb} GB`,
  versionGuidance:
    'Use an up-to-date desktop browser: Chrome or Edge 113+, Firefox 141+, or Safari 26+. On some browsers WebGPU must be enabled in settings.',
  continueAnyway: 'Continue anyway',
  recheck: 'Re-check',
  checking: 'Checking your browser…'
} as const;
