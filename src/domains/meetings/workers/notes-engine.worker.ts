/**
 * Web Worker that hosts the WebLLM engine so model loading and token
 * generation run off the main thread. The provider's
 * `CreateWebWorkerMLCEngine` drives this handler over postMessage, keeping the
 * page responsive during long map-reduce generations.
 */

import { WebWorkerMLCEngineHandler } from '@browser-ai/web-llm';

const handler = new WebWorkerMLCEngineHandler();

self.onmessage = (message: MessageEvent) => {
  handler.onmessage(message);
};
