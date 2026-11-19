// Chat client for the halo gateway, reached through the Vite dev proxy at
// /halo (which injects the Authorization header server-side). The amd-halo
// gateway is OpenAI-compatible; `enable_thinking:false` is required or the
// model spends its whole token budget on hidden reasoning and returns empty
// content.

export interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export const DEFAULT_MODEL = 'gemma-4-26b';

const ENDPOINT = '/halo/v1/chat/completions';

export class AIError extends Error {}

export async function chatComplete(
  messages: ChatMsg[],
  opts: { model?: string; temperature?: number; maxTokens?: number; signal?: AbortSignal } = {}
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: opts.model || DEFAULT_MODEL,
        messages,
        temperature: opts.temperature ?? 0.6,
        max_tokens: opts.maxTokens ?? 800,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: opts.signal,
    });
  } catch {
    throw new AIError('network');
  }

  if (!res.ok) {
    throw new AIError(`status ${res.status}`);
  }

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new AIError('bad response');
  }

  const content = (data as { choices?: { message?: { content?: string } }[] })
    ?.choices?.[0]?.message?.content;
  if (!content || !content.trim()) {
    throw new AIError('empty response');
  }
  return content.trim();
}
