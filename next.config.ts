import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // browser-whisper (transcription) runs threaded WASM, which only initializes on
  // a cross-origin isolated page — hence these headers. They are scoped to /record
  // ONLY: WebLLM (note generation on /meeting/*) does NOT need isolation, and
  // `require-corp` can block its cross-origin model-weight downloads.
  async headers() {
    return [
      {
        source: '/record',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'require-corp' }
        ]
      }
    ];
  }
};

export default nextConfig;
