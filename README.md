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

## Quality gates / browser QA routine

```bash
cd web
bun run typecheck   # tsc --noEmit
bun run build       # tsc -b && vite build
bun run qa          # typecheck + full browser E2E (one command)
bun run e2e         # just the E2E suite
bun run e2e:headed  # watch it run in a real browser
bun run e2e:ui      # Playwright's interactive UI mode
bun run e2e:report  # open the last HTML report
```

`bun run e2e` is **self-contained**: Playwright boots its own dev server on port
`5199` (with the `/halo` AI proxy) for the run and shuts it down after, so you
don't need a server running. It won't touch a dev server you have open on
5173/5174. Point it at an already-running instance with `QA_BASE_URL=...`.
Failures capture a screenshot + video + trace under `web/test-results/`.

The suite (18 checks, real assertions) covers every main feature:
- `mup-qa` — icons render, reload-safe draft persistence, draft-list navigation,
  queue highlight, Markdown + DOCX export, no console errors.
- `features-qa` — pomodoro countdown, focus mode, content-type switching +
  persistence, outline auto-generation + scroll (ECD-4), toolbar formatting.
- `ai-qa` — a live halo/Gemma chat reply (ECD-7).
- `core-flows` — draft create/delete, persona switch, font cycle, Save/File-It
  status advance.

## Status

Working: pick a persona, create/open/switch/delete drafts, write rich text,
autosave + reload-safe persistence, switch content types, focus mode, Pomodoro,
a live outline/TOC from headings (ECD-4), AI chat on the halo gateway (ECD-7),
and export the current draft to Markdown, DOCX, and PDF/print (ECD-11).

Deferred (see GitHub issues): inline comments (ECD-8), AI suggestions that edit
the draft (ECD-9), persona prompt management UI (ECD-10), version history
(ECD-12), productivity dashboard (ECD-13), inbox drag-and-drop (ECD-14),
custom keyboard shortcuts (ECD-15).
