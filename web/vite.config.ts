import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import fs from 'fs';

// Resolve halo (amd-halo OpenAI-compatible gateway) config without baking the
// API key into the client bundle or the repo. Precedence: process.env, then a
// dotenv-style file (HALO_ENV_FILE, default: the shared halo-inference env).
// The dev server proxies browser calls to /halo/* through to the gateway and
// injects the Authorization header here (Node side), so the key never ships to
// the browser. The built static app has no proxy — AI is a dev-server feature
// for this prototype stage.
function loadHalo(): { origin: string; key: string } | null {
  let base = process.env.HALO_BASE_URL;
  let key = process.env.HALO_API_KEY;
  if (!base || !key) {
    const file =
      process.env.HALO_ENV_FILE ||
      path.join(
        process.env.HOME || '',
        'share-ethand320/agent-setup-share/halo-inference/halo.env'
      );
    try {
      for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const v = m[2].replace(/^["']|["']$/g, '');
        if (m[1] === 'HALO_BASE_URL' && !base) base = v;
        if (m[1] === 'HALO_API_KEY' && !key) key = v;
      }
    } catch {
      /* no halo env available — proxy not registered, AI calls fail gracefully */
    }
  }
  if (!base || !key) return null;
  try {
    return { origin: new URL(base).origin, key };
  } catch {
    return null;
  }
}

const halo = loadHalo();

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Pre-bundle the heavy docx export lib so the first export doesn't stall on a
  // cold on-demand transform.
  optimizeDeps: {
    include: ['docx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/trpc': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      ...(halo
        ? {
            '/halo': {
              target: halo.origin,
              changeOrigin: true,
              rewrite: (p: string) => p.replace(/^\/halo/, ''),
              configure: (proxy: { on: (e: string, cb: (req: { setHeader: (k: string, v: string) => void }) => void) => void }) => {
                proxy.on('proxyReq', (proxyReq) => {
                  proxyReq.setHeader('Authorization', `Bearer ${halo.key}`);
                });
              },
            },
          }
        : {}),
    },
  },
});
