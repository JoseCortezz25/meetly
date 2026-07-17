/**
 * Feature-detects the browser/PC capabilities Meetly's on-device AI needs.
 * Client-only (guards every browser API). Feature detection — not UA version
 * sniffing — is the source of truth; the browser name/version is informational.
 */

export type CapabilityKey =
  | 'secureContext'
  | 'webgpu'
  | 'getUserMedia'
  | 'getDisplayMedia'
  | 'mediaRecorder'
  | 'audioContext'
  | 'indexedDB';

export type GpuInfo = {
  vendor?: string;
  architecture?: string;
  description?: string;
};

export type SystemInfo = {
  browserName: string;
  browserVersion: string;
  hardwareConcurrency?: number;
  /** Approximate device RAM in GB (capped at 8; absent in Safari/Firefox). */
  deviceMemory?: number;
  gpu?: GpuInfo;
  crossOriginIsolated: boolean;
};

export type SystemReport = {
  capabilities: Record<CapabilityKey, boolean>;
  info: SystemInfo;
};

/** Capabilities required to record + transcribe a meeting. */
export const RECORDING_REQUIREMENTS: CapabilityKey[] = [
  'secureContext',
  'getUserMedia',
  'mediaRecorder',
  'audioContext',
  'indexedDB',
  'webgpu'
];

/** Capabilities required to generate AI notes (WebLLM has no fallback). */
export const NOTES_REQUIREMENTS: CapabilityKey[] = ['webgpu'];

type NavigatorUAData = {
  brands?: { brand: string; version: string }[];
};

const detectBrowser = (): { name: string; version: string } => {
  if (typeof navigator === 'undefined') return { name: 'Unknown', version: '' };

  // Prefer UA Client Hints on Chromium — more reliable than parsing the UA.
  const uaData = (navigator as Navigator & { userAgentData?: NavigatorUAData })
    .userAgentData;
  const brand = uaData?.brands?.find(
    entry => !/not.?a.?brand/i.test(entry.brand) && entry.brand !== 'Chromium'
  );
  if (brand) return { name: brand.brand, version: brand.version };

  const ua = navigator.userAgent;
  const match =
    ua.match(/(Edg|OPR)\/(\d+)/) ??
    ua.match(/(Firefox)\/(\d+)/) ??
    ua.match(/Version\/(\d+).*(Safari)/) ??
    ua.match(/(Chrome)\/(\d+)/);
  if (!match) return { name: 'Unknown', version: '' };

  const labels: Record<string, string> = {
    Edg: 'Edge',
    OPR: 'Opera',
    Firefox: 'Firefox',
    Safari: 'Safari',
    Chrome: 'Chrome'
  };
  // Safari's UA puts the version before the "Safari" token.
  const isSafari = match[2] === 'Safari';
  const rawName = isSafari ? 'Safari' : match[1];
  const version = isSafari ? match[1] : match[2];
  return { name: labels[rawName] ?? rawName, version };
};

const detectWebGpu = async (): Promise<{
  supported: boolean;
  gpu?: GpuInfo;
}> => {
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return { supported: false };
  }
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) return { supported: false };
    const info = (adapter as { info?: GpuInfo }).info;
    return {
      supported: true,
      gpu: info
        ? {
            vendor: info.vendor,
            architecture: info.architecture,
            description: info.description
          }
        : undefined
    };
  } catch {
    return { supported: false };
  }
};

const hasAudioContext = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    'AudioContext' in window ||
    'webkitAudioContext' in
      (window as Window & { webkitAudioContext?: unknown })
  );
};

export const detectSystem = async (): Promise<SystemReport> => {
  const webgpu = await detectWebGpu();
  const browser = detectBrowser();

  const mediaDevices =
    typeof navigator !== 'undefined' ? navigator.mediaDevices : undefined;

  return {
    capabilities: {
      secureContext:
        typeof window !== 'undefined' && window.isSecureContext === true,
      webgpu: webgpu.supported,
      getUserMedia: typeof mediaDevices?.getUserMedia === 'function',
      getDisplayMedia: typeof mediaDevices?.getDisplayMedia === 'function',
      mediaRecorder: typeof MediaRecorder !== 'undefined',
      audioContext: hasAudioContext(),
      indexedDB: typeof indexedDB !== 'undefined'
    },
    info: {
      browserName: browser.name,
      browserVersion: browser.version,
      hardwareConcurrency:
        typeof navigator !== 'undefined'
          ? navigator.hardwareConcurrency
          : undefined,
      deviceMemory:
        typeof navigator !== 'undefined'
          ? (navigator as Navigator & { deviceMemory?: number }).deviceMemory
          : undefined,
      gpu: webgpu.gpu,
      crossOriginIsolated:
        typeof globalThis !== 'undefined' &&
        globalThis.crossOriginIsolated === true
    }
  };
};

/** Returns the required capabilities that are missing from the report. */
export const missingCapabilities = (
  report: SystemReport,
  required: CapabilityKey[]
): CapabilityKey[] => required.filter(key => !report.capabilities[key]);
