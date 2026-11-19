# DeftWrite

The writing engine for the Deft platform — a deep-work authoring environment:
personas, a Tiptap rich-text editor, a Pomodoro timer, focus mode, content-type
switching (article / book / social), a persona-scoped writing queue, and
Markdown export. Drafts persist locally in the browser.

Tier 2 (staff-only). Prototype stage: draft state is client-only (localStorage);
the tRPC server and Drizzle schema under `server/` and `packages/db/` are
scaffolded for the future DeftPlatform storage layer but not yet wired into the
app.

## AI (halo / Gemma)

The chat sidebar talks to the self-hosted **halo** gateway (OpenAI-compatible,
Tailscale-only), defaulting to `gemma-4-26b`. The Vite dev server proxies browser
calls at `/halo/*` to the gateway and injects the API key server-side, so the key
never reaches the browser or the repo. Config is read from `HALO_BASE_URL` /
`HALO_API_KEY` env vars, else from the shared halo-inference env file
(override with `HALO_ENV_FILE`). This is a **dev-server feature** — the built
static app has no proxy, so production AI will move to the tRPC server later.

## Stack

React · TypeScript · Vite · Tailwind CSS v4 · Tiptap · shadcn/ui · lucide-react.
Monorepo via Bun workspaces (`web`, `server`, `packages/*`).

## Develop

```bash
bun install
bun run dev          # web app on http://localhost:5173
bun run dev:all      # web + tRPC server together
```

## Quality gates

```bash
bun --filter web typecheck      # tsc --noEmit
bun --filter web run build      # tsc -b && vite build
cd web && bunx playwright test  # E2E (needs the dev server running)
```

`web/tests/e2e/mup-qa.spec.ts` is the minimum-usable-product gate: it asserts
icons render, drafts survive a reload, the draft list navigates, the writing
queue highlights the open draft, Markdown export works, and the app loads with
no console errors.

## Status

Working: pick a persona, create/open/switch/delete drafts, write rich text,
autosave + reload-safe persistence, switch content types, focus mode, Pomodoro,
a live outline/TOC from headings (ECD-4), AI chat on the halo gateway (ECD-7),
and export the current draft to Markdown, DOCX, and PDF/print (ECD-11).

Deferred (see GitHub issues): inline comments (ECD-8), AI suggestions that edit
the draft (ECD-9), persona prompt management UI (ECD-10), version history
(ECD-12), productivity dashboard (ECD-13), inbox drag-and-drop (ECD-14),
custom keyboard shortcuts (ECD-15).
