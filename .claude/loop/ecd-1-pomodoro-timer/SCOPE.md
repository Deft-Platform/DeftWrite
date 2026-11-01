# SCOPE: ECD-1 — Pomodoro Timer with Work/Break Cycles and Session Tracking

## Goal

Replace the cosmetic pomodoro ring in the header with a real countdown timer that cycles between 25-minute work sessions and 5-minute breaks (configurable), plays an audio notification when a session ends, tracks daily sessions, and displays session counts in the header. In focus mode, show an enlarged timer.

## Changes

### Modified files

**`web/src/contexts/AppContext.tsx`:**
- Replace `pomodoro` state with full lifecycle:
  - `workDuration` (default 25 min), `breakDuration` (default 5 min), `longBreakDuration` (default 15 min)
  - `sessionsCompleted` (count per long break cycle, resets at 4)
  - `dailySessions` (reset at midnight, stored in localStorage)
  - `isWork` (work vs break), `timeLeft` (seconds remaining), `isRunning`
- Implement interval-based countdown in `AppProvider` using `useEffect` + `setInterval`
- Auto-transition: work → break → work (long break after 4 work sessions)
- Audio notification on session end using `new Audio()` with inline base64 beep
- Persist daily sessions to localStorage under `deftwrite-pomodoro-daily`
- Expose `dailySessions`, `sessionsCompleted`, `sessionStreak` (consecutive days with ≥1 session)

**`web/src/components/layout/Header.tsx`:**
- Add daily word count display next to active persona indicator
- Add daily pomodoro session count badge (e.g., "3 sessions today")
- Keep existing ring visual but wire it to real countdown
- On focus mode toggle, show enlarged timer overlay (ring + large digits)

### New files

**`web/src/lib/pomodoraudio.ts`:**
- Base64-encoded short beep sound for notifications
- `playPomodoroSound(): void` function

## Non-goals
- **No persistence of durations/config** — defaults stay hardcoded (ECD-10 handles config later)
- **No Pomodoro stats page** — just daily count in header
- **No browser notifications** — audio only
- **No integration with productivity dashboard** (ECD-13)
- **No skip-to-next-session button** — wait for natural completion

## Test plan

1. Open app, click play on pomodoro ring → counts down from 25:00
2. Session ends → audio plays → switches to 5-min break
3. Break ends → switches back to work
4. After 4 work sessions → long break (15 min) instead of short break
5. Close tab, reopen → daily session count persists (localStorage)
6. Enter focus mode → enlarged timer shown
7. Reset button → returns to 25:00 work state

## Acceptance Criteria

1. [ ] Timer counts down correctly from 25:00 and decrements every second
2. [ ] Audio notification plays when a session ends (work or break)
3. [ ] Automatic transition between work (25min) and break (5min) sessions
4. [ ] After 4 consecutive work sessions, long break (15min) is offered instead of short break
5. [ ] Header shows daily word count written
6. [ ] Header shows daily pomodoro session count
7. [ ] Focus mode displays an enlarged pomodoro ring + countdown digits
8. [ ] Daily session count persists across page reloads (localStorage)

## Irreversibility
- localStorage key `deftwrite-pomodoro-daily` will be created — non-destructive, safe.
- Inline base64 audio embedded in source — trivial to remove.

## Rollback
- Revert this single commit; no data or migration impact.

## Contract gaps
- `qa.test` — no test command configured (noted in sdlc.yml check).
- `browser.login` — no authentication; testing on public pages only.
