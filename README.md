# DeftWrite

A focused producer's cockpit for one creator: capture ideas, see what's highest
priority, pick up the top one and draft it (Tiptap editor, AI, outline, focus
mode, Pomodoro), then export/publish it. The whole loop lives in one place —
**idea → prioritized queue → draft → feedback → publish → done** — so the writing
surface and the "what to work on next" tracker aren't split across two tools.

Tier 2 (staff-only). Prototype stage: draft state is client-only (localStorage);
the tRPC server and Drizzle schema under `server/` and `packages/db/` are
scaffolded for the future storage/auth layer but not yet wired into the app.

### Scope (decided)

DeftWrite is the system of record for Ethan's own production. **Out of scope:**
external task tracking (Jira) and two-way sync with Confluence/DeftDocs — priority
and status live natively on the draft, not mirrored from somewhere else.
**Feedback** is handled in-app via shareable reviewer links (needs the server +
auth). **Publishing** is one-way push *out* to a destination (email, LinkedIn,
DeftDocs as a native target later), never a sync.

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

100% web — no install step beyond deps. One command opens it:

```bash
bun install
bun run dev          # starts the app AND auto-opens http://localhost:5173
bun run dev:all      # web + tRPC server together
```

`bun run dev` works from the repo root or from `web/`. It auto-opens a browser
tab; AI only works under `bun run dev` (that's what runs the `/halo` proxy).

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

The suite (20 checks, real assertions) covers every main feature:
- `mup-qa` — icons render, reload-safe draft persistence, draft-list navigation,
  queue highlight, Markdown + DOCX export, no console errors.
- `features-qa` — pomodoro countdown, focus mode, content-type switching +
  persistence, outline auto-generation + scroll (ECD-4), toolbar formatting.
- `ai-qa` — a live halo/Gemma chat reply (ECD-7).
- `core-flows` — draft create/delete, persona switch, font cycle, Save/File-It
  status advance, inbox capture → promote, priority sorting.

## Status

Working: one **Queue** that holds ideas and drafts together — capture a line and
it enters as a lightweight idea; click it to start writing and it promotes to a
draft and rises above untouched ideas. Priority chips (High/Med/Low) focus items,
with an "Up Next" on top; deleting asks to confirm first. Open/switch items,
write rich text, autosave + reload-safe persistence, switch content types, focus
mode, Pomodoro, a live outline/TOC from headings (ECD-4), AI chat on the halo
gateway (ECD-7), **Visual boxes** (see below), and export to Markdown, DOCX, and
PDF/print (ECD-11).

### Visuals

Insert a **Visual** box in the editor ("Visual" in the toolbar). Click it to select
it; the right sidebar becomes an iteration panel where you prompt and
Generate/Regenerate — the model writes a self-contained SVG figure in your house
style. Generation is async, so you keep writing while it builds. The co-pilot can
also propose a visual ("Suggest Visual"): it drops a *Suggested* box with a prompt
for you to approve and generate. The house style is configured in Settings →
Visuals. Today the engine produces SVG via halo; raster image-gen / gif-sourcing
can slot behind the same box later.

Deferred (see GitHub issues): inline comments (ECD-8), AI suggestions that edit
the draft (ECD-9), persona prompt management UI (ECD-10), version history
(ECD-12), productivity dashboard (ECD-13), inbox drag-and-drop (ECD-14),
custom keyboard shortcuts (ECD-15).
