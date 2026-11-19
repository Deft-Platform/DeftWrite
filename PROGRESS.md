# DeftWrite Progress Tracker

## Completed (main)
| ID | Feature | PR | Status | Notes |
|---|---|---|---|---|
| ECD-1 | Pomodoro Timer | #17 | ✅ Merged | Work/break cycles, daily session + streak tracking, header + focus-mode display. |
| ECD-2 | Focus Mode | #18 | ✅ Merged | Distraction-free overlay, hides sidebars/toolbar, `Ctrl+Shift+F` toggle, `Esc` exit. |
| ECD-3 | Content Type Switching | #18 | ✅ Merged | Article/Book/Social selector, book outline panel, social post modes. |

## MUP hardening (branch feat/deftwrite-mup, 2026-11-19)
Picked up from the previous agent, QA'd with real assertions, fixed the bugs it
shipped as "passing", and closed the gap to a minimum usable product.

Fixed:
- **Blank icons** — the editor toolbar and every sidebar used `<i data-lucide>`
  processed by a one-shot `createIcons()` in `main.tsx`, so icons rendered blank
  after the first React re-render. Replaced all of them with a `lucide-react`
  `<Icon>` registry (`web/src/components/ui/icon.tsx`); removed `createIcons`.
- **Draft persistence** — content was saved as `JSON.stringify(getJSON())` but
  loaded via `setContent(string)` (parsed as HTML), so reopening a draft dumped
  raw JSON or lost the content. Now parsed back to JSON on load. The autosave was
  also a leading throttle capturing a stale first-keystroke snapshot; rewrote it
  as a trailing 400ms debounce reading the latest content, plus a
  pagehide/visibilitychange flush so a quick reload can't lose edits.
- **Dead controls** — the draft-management panel's row click was a no-op (now
  opens the draft, switching persona if needed); the "Suggest Edit" button had no
  handler (now routes to chat); removed the non-functional comment toolbar button
  (comments are deferred to ECD-8).
- **Wrong queue highlight** — the writing queue highlighted the newest draft
  instead of the one actually open; now tracks the real active draft.
- **Font switcher** (ECD-5 lite) — the footer font label is now a working
  serif/sans/mono cycle.

Added:
- **Markdown export** — footer Export menu: copy to clipboard or download `.md`
  (`web/src/lib/markdown.ts` serializes the Tiptap doc + title).

## QA (2026-11-19)
`web/tests/e2e/mup-qa.spec.ts` — 6/6 pass against the dev server: no console
errors on load, icons render (0 blank placeholders), draft survives reload,
management-panel navigation, queue highlight, Markdown export. The previous
`devwrite.spec.ts` suite was mostly screenshots with `if (visible)` guards and no
hard assertions — that is how real bugs shipped as "9/9 pass".

## Backlog (GitHub issues ECD-4 … ECD-15)
AI chat / provider integration (ECD-7), AI suggestions (ECD-9), persona prompts
(ECD-10), outline/TOC auto-generation (ECD-4), inline comments (ECD-8), version
history (ECD-12), DOCX/PDF export (ECD-11), productivity dashboard (ECD-13),
inbox drag-and-drop (ECD-14), custom keyboard shortcuts (ECD-15).
