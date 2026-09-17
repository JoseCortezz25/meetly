import { streamText } from 'ai';
import {
  findRemoteProvider,
  REMOTE_NOTES_PROVIDERS,
  type RemoteNotesProviderId
} from '@/lib/notes-settings';
import { createRemoteNotesModel } from '@/domains/meetings/services/notes-providers.service';

// Node runtime: the AI SDK providers rely on Node APIs, not the Edge runtime.
export const runtime = 'nodejs';

type NotesRequestBody = {
  provider: RemoteNotesProviderId;
  model: string;
  apiKey: string;
  system: string;
  prompt: string;
};

const isKnownProvider = (id: string): id is RemoteNotesProviderId =>
  REMOTE_NOTES_PROVIDERS.some(provider => provider.id === id);

/**
 * Same-origin proxy for remote notes generation. The browser cannot call
 * providers like OpenAI or OpenCode Go directly (they send no CORS headers), so
 * it posts here and this handler streams the provider's response back.
 *
 * The user's API key is used only to build the request and is never stored. The
 * provider's base URL is resolved server-side from the known provider list, so
 * this is not an open proxy to arbitrary endpoints.
 */
export async function POST(req: Request): Promise<Response> {
  let body: NotesRequestBody;
  try {
    body = (await req.json()) as NotesRequestBody;
  } catch {
    return Response.json({ error: 'invalid-body' }, { status: 400 });
  }

  const { provider, model, apiKey, system, prompt } = body;

  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    return Response.json({ error: 'api-key-missing' }, { status: 401 });
  }
  if (!isKnownProvider(provider)) {
    return Response.json({ error: 'unknown-provider' }, { status: 400 });
  }
  const resolvedProvider = findRemoteProvider(provider);
  if (!resolvedProvider.modelIds.includes(model)) {
    return Response.json({ error: 'unknown-model' }, { status: 400 });
  }
  if (typeof system !== 'string' || typeof prompt !== 'string') {
    return Response.json({ error: 'invalid-body' }, { status: 400 });
  }

  const languageModel = createRemoteNotesModel(resolvedProvider, model, apiKey);
  const result = streamText({
    model: languageModel,
    system,
    prompt,
    abortSignal: req.signal
  });

  return result.toTextStreamResponse();
}
