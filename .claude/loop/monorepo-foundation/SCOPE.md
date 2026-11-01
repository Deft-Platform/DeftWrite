# SCOPE: Monorepo Foundation — Docker, tRPC, Drizzle, Shared Types

## Goal

Replace the current flat Vite scaffold with a proper monorepo architecture that supports full-stack TypeScript development. This sets up the infrastructure (PostgreSQL via Docker, shared database schema, tRPC API layer, React Query client, Zod validation) that all 15 feature issues will build on.

## Changes

### New files

**Root:**
- `package.json` — bun workspaces root, scripts for all packages
- `turbo.json` — (or bun workspaces equivalent) build orchestration
- `docker-compose.yml` — PostgreSQL service + adminer
- `.env.example` — shared env var template
- `.gitignore` — updated for monorepo layout

**`packages/db/`:**
- `package.json` — Drizzle ORM, pg, drizzle-kit
- `drizzle.config.ts` — Drizzle CLI config
- `schema.ts` — initial database schema (users, personas, drafts, ideas, comments, chat_messages, ai_config, suggestions)
- `migrations/` — initial migration SQL + meta/
- `index.ts` — drizzle client export + type helpers

**`packages/types/`:**
- `package.json` — zod, shared type exports
- `schemas.ts` — Zod validation schemas matching DB schema
- `trpc.ts` — tRPC router inference types, AppRouter interface

**`server/`:**
- `package.json` — express, @trpc/server, @trpc/adapters-node, zod, better-auth, cors, helmet
- `src/index.ts` — Express server entry, tRPC middleware setup, tRPC router attachment
- `src/trpc/routers/` — tRPC route handlers (drafts, personas, ideas, chat, settings stubs)
- `src/trpc/context.ts` — tRPC context (DB connection, session)
- `src/middleware/auth.ts` — Better-Auth session middleware
- `src/lib/db.ts` — Drizzle client, migration runner
- `tsconfig.json`

**`web/` (updates to existing):**
- `package.json` — add @trpc/client, @trpc/react-query, @trpc/server (shared), react-query, zod
- `src/trpc/` — tRPC client setup (createTRPCReact, proxy, reactQueryProvider)
- `src/lib/api.ts` — typed API helper
- `src/components/providers/QueryProvider.tsx` — React Query provider
- `src/App.tsx` — update to include QueryProvider + tRPC provider
- `vite.config.ts` — add proxy for /trpc to local server

### Modified files
- `src/contexts/AppContext.tsx` — will be refactored to use DB + tRPC (or kept as fallback during transition)
- `src/types/index.ts` — will be replaced by shared types from `packages/types`

## Non-goals

- **No feature logic** — no pomodoro timer, no AI chat, no focus mode, etc. Those are issues #1–#15.
- **No auth UI** — Better-Auth is wired up but no login/register screens yet.
- **No migrations from old data** — we're starting fresh.
- **No deployment config** — docker-compose is local-only.
- **No testing infrastructure** — vitest setup is minimal (can add later).
- **No real AI integration** — tRPC routers return stub data for now.

## Test plan

1. `docker compose up -d` starts PostgreSQL on port 5432
2. `bun run db:generate` creates Drizzle migration from schema.ts
3. `bun run db:migrate` applies migration to local PostgreSQL
4. `bun run db:studio` opens Drizzle Studio (optional, verifies schema)
5. `bun --filter server dev` starts Express + tRPC on port 3001
6. `bun --filter web dev` starts Vite on port 5173 with /trpc proxy to 3001
7. Call `api.drafts.list()` from web → returns [] (empty, no data)
8. Call `api.personas.list()` from web → returns stub personas
9. Check that TypeScript compilation is clean (no type errors across all packages)

## Acceptance criteria

1. [ ] `docker compose up -d` starts PostgreSQL successfully, accessible on localhost:5432
2. [ ] `bun run db:generate` produces a valid migration file
3. [ ] `bun run db:migrate` applies migration, tables visible in psql/adminer
4. [ ] `bun --filter server dev` starts Express on port 3001 with tRPC endpoint at /trpc
5. [ ] `bun --filter web dev` starts Vite on port 5173 with /trpc proxy to server
6. [ ] `api.personas.list()` returns typed data (3 stub personas) with full TS autocomplete in web
7. [ ] `api.drafts.list()` returns typed empty array with full TS autocomplete
8. [ ] TypeScript type check passes across all packages (`bun run typecheck`)
9. [ ] Shared types in `packages/types/` are importable from both server and web
10. [ ] Database schema includes all tables: users, personas, drafts, ideas, comments, chat_messages, ai_config, suggestions

## Irreversibility

- Database migrations are additive (can always add columns, never remove).
- Docker volumes will store local DB data — safe to wipe with `docker compose down -v`.
- No existing data to migrate (starting fresh).

## Rollback

- Delete the monorepo structure, revert to flat Vite scaffold.
- `git reset --hard HEAD~1` to undo this commit.
- Docker volumes: `docker compose down -v` to clean DB state.

## Contract gaps

- `qa.test` — no test command configured. Will add `vitest run` as test command.
- `browser.login` — no auth UI yet. Browser QA will test public endpoints only for now.
