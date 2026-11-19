# DeftWrite

The writing engine for the Deft platform — a deep-work authoring environment:
personas, a Tiptap rich-text editor, a Pomodoro timer, focus mode, content-type
switching (article / book / social), a persona-scoped writing queue, and
Markdown export. Drafts persist locally in the browser.

Tier 2 (staff-only). Prototype stage: the UI is client-only today; the tRPC
server and Drizzle schema under `server/` and `packages/db/` are scaffolded for
the future DeftPlatform inference + storage layer but are not yet wired into the
app.

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

Minimum usable product: pick a persona, create/open/switch/delete drafts, write
rich text, autosave + reload-safe persistence, switch content types, focus mode,
Pomodoro, and export the current draft to Markdown.

Deferred (see GitHub issues ECD-7 … ECD-15): real AI provider integration, inline
comments, AI suggestions, version history, DOCX/PDF export, productivity
dashboard, inbox drag-and-drop, custom keyboard shortcuts.
