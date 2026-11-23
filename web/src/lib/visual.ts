// Visual generation: the model writes a self-contained SVG figure in the
// configured house style. Raster image-gen / gif-sourcing can later slot in
// behind this same function without touching the Visual box UI.
//
// Routed through the Vite /halo proxy (key injected server-side). Uses a
// generous token budget because a full figure runs long, and extracts the
// <svg> even when the model wraps it in a code fence.

const ENDPOINT = '/halo/v1/chat/completions';

export const DEFAULT_VISUAL_STYLE =
  'Clean, modern, minimal editorial figures. Canvas viewBox "0 0 640 360". ' +
  'Dark slate background (#0f172a). Primary accent indigo (#6366f1), secondary ' +
  'emerald (#34d399), muted text slate (#94a3b8), white (#f1f5f9) for key labels. ' +
  'Sans-serif type, generous spacing, rounded corners, thin strokes. No photos, ' +
  'no gradients unless subtle. Favor diagrams, flows, and labeled relationships.';

// Model that writes the SVG. qwen is the stronger code/markup model on halo.
const VISUAL_MODEL = 'qwen3.6-35b';

export class VisualError extends Error {}

function extractSvg(raw: string): string | null {
  const m = raw.match(/<svg[\s\S]*?<\/svg>/i);
  return m ? m[0] : null;
}

export async function generateVisualSvg(
  prompt: string,
  style: string,
  opts: { signal?: AbortSignal } = {}
): Promise<string> {
  const system =
    `You generate a single self-contained SVG figure for an article.\n` +
    `House style: ${style}\n` +
    `Output ONLY the raw <svg>...</svg> markup — no markdown, no code fences, no commentary. ` +
    `The SVG must be valid, self-contained (no external refs), and include its own viewBox.`;

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: VISUAL_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 3200,
        chat_template_kwargs: { enable_thinking: false },
      }),
      signal: opts.signal,
    });
  } catch {
    throw new VisualError('network');
  }
  if (!res.ok) throw new VisualError(`status ${res.status}`);

  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new VisualError('bad response');
  }
  const content = (data as { choices?: { message?: { content?: string } }[] })?.choices?.[0]?.message?.content ?? '';
  const svg = extractSvg(content);
  if (!svg) throw new VisualError('no svg');
  return svg;
}
