# Proofboard frontend build brief

Hand this file to the frontend agent. The agent owns the user interface. The backend (`lib/`, `fixtures/`, `app/api/`) is built separately and is not part of this brief.

## The product

Proofboard is a public board for the verification history of a GitHub repository. A visitor pastes a public GitHub repository URL and the board shows the TestSprite checks found on its pull requests: what ran, what passed, what failed, and the moment a failing run went green after a fix. Proofboard does not run tests. It reads the runs TestSprite posts on pull requests and gives them a permanent, linkable page.

The repository is public. All copy is English. Build window: Oct 19 to Oct 23, 2026.

## Read first, in this order

1. `DESIGN.md` at the repository root. The locked design direction, authoritative for every visual and copy decision. If anything in this brief disagrees with it, DESIGN.md wins. Report the conflict instead of guessing.
2. `PRD.md` sections 6, 8, 9, and 12. Functional requirements, API contract, pages and copy, and the determinism rules the automated suite lives by.
3. `AGENTS.md` at the repository root. This is Next.js 16: read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code. Do not rely on training-data conventions. In particular, `params` and `searchParams` are async in page components (`const { owner, repo } = await params`).
4. If the antislop skills exist in your environment, resolve the usage mode per the core file and read the skills before writing UI:
   - `C:\Users\Shalahuddin\.config\opencode\skills\antislop\SKILL.md`
   - `C:\Users\Shalahuddin\.config\opencode\skills\antislop-ui\SKILL.md`
   - `C:\Users\Shalahuddin\.config\opencode\skills\antislop-human\SKILL.md`
   - `C:\Users\Shalahuddin\.config\opencode\skills\antislop-layoutmobile\SKILL.md`
   - `C:\Users\Shalahuddin\.config\opencode\skills\antislop-copywriting\SKILL.md`
   If those paths do not exist where you run, the "Hard rules" section below is the inline digest. Follow it.

## Scope

Build these files:

- `app/layout.tsx`: fonts, theme boot script, top bar, footer, metadata.
- `app/globals.css`: design tokens and base styles from DESIGN.md.
- `app/page.tsx`: landing page.
- `app/r/[owner]/[repo]/page.tsx` and `loading.tsx`: repository board.
- `app/r/[owner]/[repo]/pr/[number]/page.tsx` and `loading.tsx`: PR run timeline.
- `components/`: as needed, colocated, named clearly.
- Both themes, every state, keyboard access, correct at 360px.

Do not touch:

- `lib/**`, `fixtures/**`, `app/api/**`, `PRD.md`, `DESIGN.md`, `docs/fe-build-prompt.md`, `docs/evidence.md`.
- Screenshots are yours: save them under `docs/screenshots/`.
- If a backend contract feels wrong or is missing, describe it in the PR instead of patching it.

Do not add npm dependencies. If you believe one is required, stop and ask.

## Backend contract

The backend ships these modules. Import them; do not reimplement them.

`lib/types.ts`:

```ts
export type RunStatus = "passed" | "failed" | "in_progress" | "unknown";

export interface Run {
  status: RunStatus;
  passed: number | null; // null means "not reported"
  failed: number | null;
  createdAt: string; // ISO 8601
  url: string | null; // link to the bot comment on GitHub
  raw?: string; // present only for unrecognized formats
}

export interface RepoInfo {
  owner: string;
  name: string;
  url: string;
  description: string | null;
}

export interface BoardStats {
  runs: number;
  passed: number;
  failed: number;
  inProgress: number;
  unknown: number;
  passRate: number | null; // integer percent; null when there are no runs
  lastStatus: RunStatus | "none";
  lastRunAt: string | null; // ISO 8601
}

export interface PullRequestData {
  number: number;
  title: string;
  state: "open" | "merged" | "closed";
  url: string;
  runs: Run[]; // oldest first
  summary: { passed: number; failed: number }; // totals across this PR's runs
}

export interface BoardData {
  repo: RepoInfo;
  stats: BoardStats;
  pullRequests: PullRequestData[]; // newest PR first
}

export type BoardErrorKind = "invalid" | "not_found" | "rate_limited" | "upstream";

export type BoardResult =
  | { ok: true; data: BoardData }
  | { ok: false; error: BoardErrorKind; resetAt: string | null }; // resetAt only for rate_limited
```

`lib/board.ts`:

```ts
export async function getBoard(owner: string, name: string): Promise<BoardResult>;
```

- Server-side only. Caches live data for 300 seconds. Never throws.
- Demo slugs render from fixtures with no network calls and exact known numbers:
  - `demo/proofboard`: passing runs, failing runs, a PR with a red-to-green sequence, one unrecognized run.
  - `demo/empty`: a repository with zero runs.
  - `demo/ratelimited`: the rate-limit state with a reset time.
  - `demo/missing`: the not-found state.
- The PR page reuses `getBoard` and finds the PR by number in `pullRequests`. If the number is not in the list, render the "no runs" state.

`lib/parse-url.ts`:

```ts
export function parseRepoInput(input: string): { owner: string; name: string } | null;
```

- Accepts `owner/repo`, `https://github.com/owner/repo`, trailing slashes, and a `.git` suffix. Returns null otherwise. Use it for landing form validation before navigating.

Staging:

- Stage 1 needs no imports: tokens, layout, top bar, footer, landing markup.
- Stage 2 wires data: landing validation, board, PR page, states, badge section. If `lib/board.ts` and `lib/parse-url.ts` do not exist when you start Stage 2, stop and report; do not stub them.
- The demo pages must work with the network off.

## Pages, states, and copy

Exact strings live in `PRD.md` section 9 and are used verbatim.

| Route | What it shows | States |
|---|---|---|
| `/` | Headline, subline, repository form, sample link, data note | idle, invalid input, pending submit |
| `/r/{owner}/{repo}` | Repository board | loading, loaded, empty, not found, rate limited |
| `/r/{owner}/{repo}/pr/{number}` | Run timeline for one PR | loading, no runs, loaded, unrecognized run |
| `/r/demo/proofboard` and the other demo slugs | The same pages over fixtures | deterministic for the suite |

Behavior:

- Landing form: label "Repository"; accept the input formats above; on invalid input show the PRD inline message, associated with the field; on valid input navigate to `/r/{owner}/{name}`; the button reads "Check this repository", shows a pending state, and cannot double-submit.
- Board: header with repository name, description, GitHub link. Health strip: runs, passed, failed, pass rate as "8 of 10 runs, 80%", last status with its time. Run strip per DESIGN.md. PR list newest first with latest-run status and counts. Badge section: preview, Markdown snippet, HTML snippet, and a copy button that reads "Copy" and then "Copied" for two seconds.
- PR page: header with title, state, GitHub link. Timeline oldest first; each entry has the time, a status chip, counts as "12 passed, 0 failed", and a "View comment" link. Summary shows total runs and marks the red-to-green moment when a passing run follows a failure. An unrecognized run renders as "Unrecognized format" with the raw text inside a `<details>` element.
- Times: absolute UTC, one format, inside a `<time datetime="...">` element, for example `Oct 21, 2026, 14:02 UTC`. Never relative times and never timezone-dependent formatting: the suite asserts on these strings, and server and client must render them identically.
- Missing counts (`null`): render "not reported". Never invent a number.

## Stability for the automated suite

An external browser suite drives this interface. Keep it testable:

- One `h1` per page; headings in order.
- Visible button and link text comes from PRD section 9 and does not change after this build.
- The form uses a real `<label for>` and associates its error text with the field.
- Status is always readable text ("Passed", "Failed", "In progress", "Unrecognized"), never color or shape alone.
- `<html lang="en">`. Titles: landing `Proofboard: every pull request check, on the record`; board `{owner}/{repo}, Proofboard`; PR `PR #{number} in {owner}/{repo}, Proofboard`. Description metadata: the subline from PRD section 9.

## Hard rules

These are checked before delivery. They come from DESIGN.md and the antislop filter.

- Palette: the exact tokens in DESIGN.md. One accent (navy). Status colors only for run status. No gradients, no glow, no glassmorphism, no third accent.
- Contrast: every pairing is already verified. Do not invent colors. If you must adjust one, verify with the antislop contrast checker against the values in DESIGN.md (4.5:1 normal text, 3:1 large text).
- Type: Newsreader for headings, IBM Plex Sans for UI, IBM Plex Mono for all numbers, loaded with `next/font/google` and exposed as the CSS variables in DESIGN.md. No other faces.
- Shape: radius 3px for controls, 6px for panels, 2px for run squares. No pills. Hairlines, not floating shadows.
- Theme: light default; the toggle does not follow the system setting; it persists under `proofboard-theme` in `localStorage`; a pre-paint inline script prevents a flash; both modes fully styled; toggle labeled "Dark mode" with `aria-pressed`. Hand-rolled, no dependency.
- Mobile: no horizontal overflow at 360px; tap targets at least 44px; the run strip wraps; rows stay inside their container.
- Keyboard: everything reachable with Tab, activatable with Enter or Space, visible focus (2px accent ring, 2px offset), Escape closes overlays if any exist.
- States: loading, empty, not found, rate limited, upstream error on every data view. No happy path only.
- Copy: sentence case, no exclamation marks, no em dashes anywhere, no marketing vocabulary, no invented numbers, no testimonials, no "trusted by" rows.
- Controls: no dead links or buttons; navigation shows only pages that exist; the favicon stays the scaffold default until an approved mark exists; no logo, icon set, or illustration gets generated.
- Motion: hover and focus transitions only (120ms), theme switch 200ms, the in-progress pulse per DESIGN.md, `prefers-reduced-motion` honored.

## Before calling it done

1. `npm run build` and `npm run lint` pass. Click through every interactive element with the console open; no errors.
2. Click-through evidence, element by element, in the PR description (for example: "theme toggle -> dark applied, persists after reload"; "copy button -> reads Copied for two seconds").
3. Exercise both themes, 360px width, and a keyboard-only path from the landing form to the demo board.
4. Screenshots under `docs/screenshots/`: landing (light and dark), demo board (light and dark), PR page showing the red-to-green marker, copy button in the "Copied" state.
5. Output the antislop Delivery Gate as PASS/FAIL lines with evidence in the PR description, one line per block (Hard Gate, Purpose-Gate, Liveliness, Craftsmanship and Quality Locks).

## Git

- Branch `feat/frontend`. Create it from `main` if the scaffold PR has merged; otherwise from `scaffold-next-app`.
- Small commits, English, present tense, one concern each.
- Never commit `node_modules/`, `.next/`, `.env*`.
- Open a PR titled "Build the frontend" against `main` when the gate passes, and link the screenshots.
