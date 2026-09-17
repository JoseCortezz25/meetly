import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import type { LanguageModel } from 'ai';
import type { RemoteNotesProvider } from '@/lib/notes-settings';

/**
 * Builds a Vercel AI SDK language model for a remote notes provider, using the
 * user's own API key. Runs in the browser (bring-your-own-key, local-first).
 *
 * OpenCode Go exposes an OpenAI-compatible endpoint, so it is wired through
 * the openai-compatible adapter with the provider's base URL; OpenAI and Google
 * use their native providers.
 */
export const createRemoteNotesModel = (
  provider: RemoteNotesProvider,
  model: string,
  apiKey: string
): LanguageModel => {
  switch (provider.id) {
    case 'openai':
      return createOpenAI({ apiKey })(model);
    case 'google':
      return createGoogleGenerativeAI({ apiKey })(model);
    case 'opencode-go':
      return createOpenAICompatible({
        name: provider.id,
        baseURL: provider.baseURL ?? '',
        apiKey
      })(model);
  }
};
