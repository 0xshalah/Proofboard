# Proofboard design direction

Status: locked Oct 19, 2026. This file is the authority for all UI work in this repository: identity, palette, typography, layout, motion, and copy rules. `PRD.md` section 10 summarizes it; if the two disagree, this file wins. Apply it as direction, not as a task list.

## Identity and personality

A verification instrument on paper. Proofboard is a public record, so the interface borrows from fine stationery and instrument panels: warm paper, dark ink, hairline rules, and one order of color reserved for run status. Precise, quiet, unhurried. The tool reports state; it does not celebrate. Nothing on the page competes with the run strip.

Why paper and ink: the product's metaphor is a ledger of verification history, and warm paper separates it from the sterile white of generic AI tools without adding any decoration.

## Design read and dials

Reading this as: a public verification board for developers and maintainers, in a quiet editorial-instrument language on warm paper, dial ENERGY 1 / RHYTHM 2 / MOTION 1.

- ENERGY 1: the page is scanned, not performed. Calm serves scanning.
- RHYTHM 2: consistent structures, with a visible break where the content changes (landing, board, PR page).
- MOTION 1: hover and focus transitions only. One functional exception: an in-progress run may pulse, because it signals activity.

Premium here means craft, not effects: exact spacing, quiet hairlines, one accent, and typography with clear roles. No gradients, no glow, no glassmorphism, no icon set, no decorative motion.

## Palette

Every text pairing below was verified with the antislop contrast checker on Oct 19, 2026. The worst verified text pairing is 5.47:1 against a 4.5:1 bar. The border tokens marked strong pass the 3:1 non-text bar. Re-verify with `skills/antislop-human/contrast-check.py` after any change.

Light (default):

| Token | Value | Role |
|---|---|---|
| `--paper` | `#FAF7F1` | page background |
| `--surface` | `#FFFFFF` | cards and panels |
| `--line` | `#E6DFD3` | dividers and row rules (decorative) |
| `--line-strong` | `#8B8374` | input and control outlines (3:1) |
| `--ink` | `#1B1815` | primary text |
| `--ink-secondary` | `#5B5449` | secondary text |
| `--accent` | `#1E3A5F` | links, primary button, focus ring |
| `--accent-strong` | `#172F4E` | accent hover and active |
| `--on-accent` | `#FFFFFF` | text on accent fills |
| `--pass` | `#1C6E45` | passed runs |
| `--fail` | `#B3261E` | failed runs |
| `--progress` | `#8A5A0F` | in-progress runs |
| `--unknown` | `#6B6459` | unrecognized runs |

Dark:

| Token | Value | Role |
|---|---|---|
| `--paper` | `#16130F` | page background |
| `--surface` | `#1E1A15` | cards and panels |
| `--line` | `#2E2820` | dividers and row rules |
| `--line-strong` | `#7A705F` | input and control outlines (3:1) |
| `--ink` | `#F2EDE3` | primary text |
| `--ink-secondary` | `#B7AE9E` | secondary text |
| `--accent` | `#9BBAE4` | links, primary button, focus ring |
| `--accent-strong` | `#B3CDEF` | accent hover and active |
| `--on-accent` | `#10131A` | text on accent fills |
| `--pass` | `#4FB07E` | passed runs |
| `--fail` | `#E5766A` | failed runs |
| `--progress` | `#D9A441` | in-progress runs |
| `--unknown` | `#9A9184` | unrecognized runs |

Rules:

- One accent. It appears on links, the primary button, and the focus ring. Nowhere else.
- Status colors appear only as run status, never as decoration. A status is always a marker plus a text label; color alone never carries meaning.
- The run strip and the status chips are the only places multiple status colors sit together.
- Why navy instead of a warmer red: the accent must read as ink on paper and stay clearly distinct from the fail red that carries status.
- Why these status hues: pass green, fail red, and progress amber are conventions engineers already read. The job is to keep them quiet and exact, not novel.

## Typography

| Role | Face | Weights | Notes |
|---|---|---|---|
| Display and headings | Newsreader | 500, 600 | the record voice: page titles, section headings, wordmark |
| Prose and UI | IBM Plex Sans | 400, 500, 600 | body text, labels, buttons |
| Data | IBM Plex Mono | 400, 500 | all numbers: counts, PR numbers, timestamps, slugs, pass rate |

Load with `next/font/google` and expose as `--font-display`, `--font-sans`, `--font-mono`. Numerals in data contexts use `font-variant-numeric: tabular-nums`.

| Token | Size / line height | Use |
|---|---|---|
| display | 44 / 48, 34 / 38 under 640px | landing headline |
| h1 | 30 / 36, 26 / 32 under 640px | page titles |
| h2 | 22 / 28 | section headings |
| h3 | 16 / 24, Plex Sans 600 | sub-headings, row titles |
| body | 16 / 26 | prose |
| small | 14 / 20 | labels, secondary lines |
| data | 14 / 20 mono | numbers |
| data-dense | 13 / 18 mono | dense table cells only |

- Why Newsreader: headings are the record voice. A serif gives the page its editorial identity and separates it from the default devtool sans.
- Why Plex: a technical documentation character with strong small-size legibility, and its mono shares the sans skeleton so numbers read native, not decorative.
- Why mono for numbers only: alignment makes run data scannable; the rest of the page stays prose.

## Layout, spacing, and surface

- Base spacing unit 4px; use the Tailwind spacing scale without inventing values.
- Containers: board 1120px max, prose 720px max. Page gutter 16px on mobile, 24px on tablet, 32px on desktop.
- Section rhythm: landing sections 64px apart on mobile and 96px on desktop; board sections 32px and 48px on desktop. The rhythm is allowed to break where the content changes (RHYTHM 2).
- Radius: 3px for controls and chips, 2px for run squares, 6px for panels. Nothing is pill shaped.
- Lines over shadows: 1px hairlines (`--line`) divide rows and sections. Elevation exists only for overlays: `0 8px 24px rgb(20 16 10 / 0.12)` in light, `0 8px 24px rgb(0 0 0 / 0.5)` in dark. If no overlay ships, the token stays unused.
- Why hairlines: the paper metaphor, and a page where every element floats reads as a template, not a record.

## The run strip (identity motif)

One square per run, chronological left to right, oldest first. 10px squares, 2px gap, 2px radius; 6px squares inside the badge.

- Passed: filled `--pass`. Failed: filled `--fail`. In-progress: filled `--progress` with a gentle pulse. Unrecognized: transparent with a 1px `--line-strong` outline.
- Each square links to its PR page, with an accessible name like "Run 12, passed, Oct 21". A text summary always sits next to the strip, for example "9 of 11 runs passed".
- The strip wraps at 360px without horizontal scroll.
- Why: the repository's history is the product. Squares scan faster than text and make progress visible at a glance.

## Components and states

- Top bar: wordmark (link to `/`), "Sample board" link, "GitHub" link, theme toggle labeled "Dark mode" with `aria-pressed`. 1px bottom hairline, no shadow, no blur.
- Landing: headline, subline, repository form (label "Repository", example placeholder), primary button "Check this repository", inline error text under the field, sample link "Open the sample board", data note. The form is the single focal point.
- Health strip: runs, passed, failed, pass rate as "8 of 10 runs, 80%", last status with its time. Numbers in mono, labels in small sans. This is the board's focal point.
- PR list: newest first. Each row shows "PR #12" in mono, the title, state, latest run status chip, latest run counts, and links to the PR page and to GitHub. Hairlines between rows, no card boxes around rows.
- Badge section: badge preview, Markdown and HTML snippets, one copy button that reads "Copy", then "Copied" for two seconds.
- PR page: header with title, state, and GitHub link. Timeline oldest to newest; each entry shows the time in mono, a status chip, counts as "12 passed, 0 failed", and a "View comment" link. The summary shows total runs and marks the red-to-green moment when a passing run follows a failure. A run the parser could not read renders as "Unrecognized format" with the raw text inside a `<details>` element.
- States on every data view: loading (keep the page header, show "Loading the board" with `aria-busy`), empty, not found, rate limited (with the reset time), and upstream error. The demo slugs `/r/demo/proofboard`, `/r/demo/empty`, `/r/demo/ratelimited`, and `/r/demo/missing` expose each state without a network call.
- Status chip: a small square plus a text label in the status color. No capsule, no dot-plus-pill stack, no uppercase, no glow.
- Why ruled rows instead of cards: a ledger reads as ruled lines, not as a grid of boxes.

## Motion

- Transitions: 120ms ease-out for hover and focus changes, 200ms for the theme switch. Nothing animates on scroll, nothing enters with a fade or slide.
- The in-progress square pulses (opacity 1 to 0.55 over 1.6s). `prefers-reduced-motion: reduce` removes the pulse and non-essential transitions.
- Why: scanning surfaces should not move; motion is reserved for live state.

## Theme policy

Light is the default because the paper identity is the brand. Dark is a fully styled counterpart, not an inversion filter: same structure, same rhythm, the dark token values above. The toggle persists in `localStorage` under `proofboard-theme`, and an inline pre-paint script applies it with no flash. Both modes are re-checked against the contrast table before delivery.

## Voice and copy rules

Exact strings live in `PRD.md` section 9 and are used verbatim. Rules that bind all new copy:

- Sentence case. No exclamation marks. No em dashes anywhere.
- Buttons name the action: "Check this repository", "Open the sample board", "Copy".
- Errors say what happened and what to do next, in one or two sentences.
- No marketing vocabulary. No invented numbers, testimonials, or claims. Data comes from the API or the fixtures, nothing else.

## Assets and logo policy

Until the owner approves a mark, the logo is the wordmark: "Proofboard" set in Newsreader 600. No symbol, icon, avatar, illustration, or social image ships without explicit approval. Placeholders are labeled as placeholders, never disguised as final.

## Anti-drift list

These are the failure modes this direction is most likely to drift into. None of them are allowed:

- Gradients, glow, glassmorphism, neon, or colored glow around any element.
- A second accent, or status colors reused as decoration.
- Pill-shaped buttons, chips, or inputs.
- An icon set or mascot. Text labels carry meaning; permitted glyphs are functional only.
- Uppercase micro-labels with wide tracking.
- Em dashes, exclamation marks, and marketing vocabulary.
- Fake data: no statistics, testimonials, "trusted by" rows, or placeholder numbers presented as real.
- Copying another product's look (Linear, Vercel, Stripe, shields.io, and so on). References may inform technique, never identity.
