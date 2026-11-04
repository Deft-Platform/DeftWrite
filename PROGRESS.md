# DeftWrite Progress Tracker

## Completed (main)
| ID | Feature | PR | Status | QA | Notes |
|---|---|---|---|---|---|
| ECD-1 | Pomodoro Timer | #17 | ✅ Merged | ✅ Pass (2/2 tests) | Audio notifications, session tracking (work/break), header timer display, focus mode UI in header. Controls use SVG icons without text labels — intentional. |
| ECD-2 | Focus Mode | #18 | ✅ Merged | ✅ Pass (3/3 tests) | Distraction-free overlay, hides sidebars/toolbars, narrows to `max-w-2xl`. Toggle is icon-only in editor toolbar (`data-lucide="maximize"`), keyboard shortcut `Ctrl+Shift+F`, exits via Escape. |
| ECD-3 | Content Type Switching | #18 | ✅ Merged | ✅ Pass (4/4 tests) | Article/Book/Social selector bar, dynamic placeholders, book outline panel, social post modes (single/thread/cross-platform). All layout regions visible. |

## QA Summary (2025-01-10)
| Test Suite | Result | Details |
|---|---|---|
| ECD-1: Pomodoro Timer | ✅ 2/2 pass | Header visible, controls respond to start/pause/reset |
| ECD-2: Focus Mode | ✅ 3/3 pass | Toggles via keyboard, exits on Escape, sidebar visibility toggles correctly |
| ECD-3: Content Type Switching | ✅ 4/4 pass | Selector buttons present, placeholder updates per type, right sidebar panels swap correctly |
| Layout Smoke Test | ✅ Pass | All 4 regions (header, left sidebar, main, right sidebar) visible |
| Console Errors | ✅ Pass | Zero errors on load |
| Screenshots | ✅ 8 captured | All features documented in `web/screenshots/` |

## Dev Notes
- **Dependency fix**: `@tanstack/react-query` downgraded from `^5.66.0` to `^4.36.0` to resolve `hashQueryKey` import conflict with `@trpc/react-query@10.x`. Clear Vite cache (`rm -rf node_modules/.vite .vite dist`) and restart dev server after this change.

## In Progress
| ID | Feature | Branch | Notes |
|---|---|---|---|

## Blocked
| ID | Feature | Reason |
|---|---|---|

## Backlog
| ID | Feature | Notes |
|---|---|---|
| ECD-4 | AI Writing Assistance | Integration with OpenAI/Claude APIs — auto-suggestions, rewrites, tone adjustments |
| ECD-5 | Version History | Draft snapshots, diff view, restore from history |
| ECD-6 | Markdown Export | Export to .md, .pdf via print dialog |
| ECD-7 | Draft Templates | Pre-built structures per content type |
| ECD-8 | Collaborative Editing | Multi-user cursors, presence indicators |
| ECD-9 | Keyboard Shortcuts | Customizable shortcut map, command palette |
