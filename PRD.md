# Proofboard: Product Requirements Document

**Status:** Draft v0.1 (pre-build)
**Date:** 2026-10-19
**Author:** solo builder
**Build window:** Oct 19 to Oct 23, 2026 (submission deadline: Fri Oct 23, 13:59 WIB)
**Name:** Proofboard is the working title; the public name is confirmed before the first public asset ships.

## 1. Summary

Proofboard is a public board for the verification history of a GitHub repository. A visitor pastes a repository URL, and the board shows the TestSprite checks on its pull requests: what ran, what passed, what failed, and the moment a failing run turned green after a fix.

Proofboard does not run tests. The runs are TestSprite's work, triggered by its GitHub App on pull requests. Proofboard reads those runs from the public GitHub record and gives them a permanent, linkable page.

## 2. Context and problem

The Season 4 flow: open a pull request, TestSprite runs the suite against the preview deployment, the check holds the merge until it passes, you fix what failed, the run goes green, you merge. The evidence of that work lives in the pull request thread.

After the merge, the evidence is effectively lost. The README does not show it, the deployed app does not show it, and anyone who wants to know whether a project is actually verified has to open pull requests one at a time and read bot comments.

Proofboard turns those threads into a public record. It reads the comments the TestSprite bot posts, parses each run, and renders the history: a health summary, a run strip, per-PR timelines, and an embeddable badge.

The entry dogfoods the same loop: the Proofboard repository carries the TestSprite GitHub App, its pull requests are held by the check once the suite is stable, and Proofboard's own board is the first board the site shows.

## 3. Goals and non-goals

### Goals (ship by Oct 23)
- A visitor goes from repository URL to a readable verification board in one action.
- Board, PR timeline, and badge read from real TestSprite runs on real pull requests; a fixtures-based demo board makes testing deterministic.
- Every pull request on the Proofboard repository runs the suite automatically through the GitHub App; the check blocks the merge once the suite is stable.
- At least two recorded runs catch a real defect first and go green after the fix; both threads are linked as evidence.
- Light and dark themes, keyboard access, and empty, loading, and error states ship in the first version.

### Non-goals
- Running or scheduling tests. Proofboard only reads what a test bot posts.
- Accounts, login, subscriptions.
- Private repositories. Public data only, and never a visitor's token.
- Other test providers (Jest, Cypress, Playwright, other bots). The parser accepts new formats when they appear, but acceptance targets TestSprite.
- Notifications, alerts, webhooks.
- A database. Data is fetched live and cached; fixtures cover the demo.

## 4. Rubric alignment

Season 4 scores three things. Proofboard is shaped around each one.

| Score | How this entry earns it |
|---|---|
| Project quality (40) | One clear job done completely: URL in, board out. Every state designed; both themes; responsive; keyboard access. The README explains the app, links the live URL, and states what the suite covers. |
| Tests that run themselves (40) | The suite lives in the TestSprite portal and fires on every pull request through the GitHub App. The demo board and fixtures make it deterministic. Runs catch real bugs during the week, and the PR threads stay linked as evidence. |
| Innovation: how verification is wired into shipping (20) | The product consumes TestSprite's artifact, the PR check, and turns it into a public verification record. The badge puts that record into READMEs. The loop runs on the project's own repository. |
| Engagement | Build-in-public posts during the week (Discord, X, a dev.to write-up) and a 2 to 3 minute demo video. Real screenshots only. |

## 5. Users and stories

- **Maintainer (primary):** runs TestSprite on a public repository and wants a linkable record for the README and for users. Story: paste the repository, copy the badge snippet, done.
- **Reviewer or teammate:** wants to know whether a fix addressed a failure. Story: open the PR page, read the run sequence from red to green.
- **Visitor or evaluator:** curious whether a project is verified at all. Story: open the sample board from the landing page and understand the product in under a minute.
- **Hackathon judge:** checks that the loop is real. Story: land on a board, follow a link to the PR thread, see the check that blocked the merge and the commit that fixed it.

## 6. Functional requirements

### FR-1 Repository input and validation
The landing page has one field for a public GitHub repository URL and one button.
- Accepts `owner/repo`, `https://github.com/owner/repo`, trailing slashes, and `.git` suffixes.
- Rejects anything else with an inline message: "Enter a GitHub repository URL like https://github.com/owner/repo."
- On submit, the app navigates to `/r/{owner}/{repo}` and shows the board's loading state immediately.
- The submit button shows a pending state while the board loads and cannot double-submit.

### FR-2 Repository board
`/r/{owner}/{repo}` shows the verification record for one repository.
- Header: repository name, description, and a link to GitHub.
- Health strip: total runs, passed runs, failed runs, current status, and last run time. Pass rate shown as passed / total with an exact percentage.
- Run strip: one small square per run in chronological order, green for passed and red for failed. Each square links to the PR page for that run. Status text accompanies the color, never color alone.
- PR list: newest first. Each row shows the PR number, title, state, latest run status, and the latest run's pass and fail counts. Each row links to the PR page and to GitHub.
- Empty state: "No TestSprite runs found on this repository yet." followed by one line: "The board fills in as pull requests run. Check that the TestSprite GitHub App is installed, or open the sample board to see the layout."
- Error states: a missing or private repository shows a not-found message with a retry link; the GitHub rate limit has its own message (see FR-8).

### FR-3 PR detail page
`/r/{owner}/{repo}/pr/{number}` shows the run timeline for one pull request.
- Header: PR title, state (open, merged, closed), and a link to GitHub.
- Timeline: one entry per run, oldest to newest, each with status, passed and failed counts, time, and a link to the bot comment on GitHub.
- Summary: total runs, the first failure if any, and a marker when a run went green after a failure (the red-to-green moment).
- Runs the parser cannot interpret still appear, labeled "unrecognized format", with the raw comment text inside a collapsible.

### FR-4 Demo board
`/r/demo/proofboard` renders the full board and PR pages from local fixtures, with no GitHub calls.
- The landing page links to it with the label "Open the sample board".
- Fixtures cover: a passing run, a failing run, a PR with a red-to-green sequence, a comment in an unrecognized format, a repository with zero runs, and a repository that returns 404.
- Suite tests assert exact numbers only on the demo board.

### FR-5 Badge
`/api/badge/{owner}/{repo}` returns an SVG badge for README embeds.
- States: passing (green), failing (red), no runs (grey), unknown (grey). Left label reads "proofboard"; the right field reads the state.
- The badge links to the repository's board page.
- A missing repository returns the unknown badge with HTTP 200, because a README must not embed a broken image.
- The board page shows the Markdown and HTML snippets with a Copy button that confirms with the text "Copied".
- Response header: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.

### FR-6 Comment parser
`lib/parse.ts` turns one comment body into zero or more run records.
- Fields per run: `status` (`passed`, `failed`, `in_progress`, `unknown`), `passed` (number or null), `failed` (number or null), `createdAt`, and `url`.
- The parser never throws on arbitrary input. Text it cannot recognize returns a run with `status: "unknown"` and the raw text preserved for display.
- Bot matching is one configuration constant, the TestSprite App login, so a rename is a one-line change.
- Fixtures collected from real runs on Day 0 and Day 1 exercise the parser before any change to it.

### FR-7 Public API routes
- `GET /api/repo?url=...` returns the board data (shape in section 8).
- `POST /api/parse` wraps the parser so tests and other tools can reuse it.
- Both routes return JSON in every case, including errors.

### FR-8 Caching, request budget, and rate limits
- Board data is cached per repository for 300 seconds.
- One board build costs at most one repository request, one pull-list request, and one comment request per inspected pull request. Budget: 12 requests, covering the 10 newest pull requests.
- An optional `GITHUB_TOKEN` environment variable raises the hourly request ceiling from 60 to 5,000. The app works without it.
- When GitHub returns 429 and no cached copy exists, the board shows the rate-limit state with the reset time instead of an error page. Cached boards keep loading.

### FR-9 Themes, keyboard, and focus
- Light and dark themes, both fully styled, toggled from the header; the choice persists in `localStorage`.
- Every interactive element is reachable with Tab and operable with Enter or Space; focus is always visible.
- Status is communicated with text labels in addition to color.

### FR-10 Dogfood
- The landing page links to Proofboard's own board, and the README embeds the badge.
- The repository's pull requests run the suite through the GitHub App; the check holds merges once the suite is stable.

## 7. Data sources and parsing rules

### Sources
- `GET https://api.github.com/repos/{owner}/{repo}` for repository metadata.
- `GET https://api.github.com/repos/{owner}/{repo}/pulls?state=all&per_page=20` for the pull request list.
- `GET https://api.github.com/repos/{owner}/{repo}/issues/{number}/comments` for the comments on each inspected pull request.

All calls run server-side with a `User-Agent` header, plus an `Authorization` header when `GITHUB_TOKEN` is configured.

### Bot identification
A comment counts as a TestSprite run when its author is the TestSprite GitHub App. The exact author login is pinned during Day 0 calibration against the first real run and stored in one constant, so a bot rename is a one-line change.

### Run record
```json
{
  "status": "passed | failed | in_progress | unknown",
  "passed": 12,
  "failed": 0,
  "createdAt": "ISO 8601",
  "url": "https://github.com/.../pull/12#issuecomment-..."
}
```

### Tolerance rules
- The parser never throws. Unknown text returns no runs; a recognizable comment with missing details returns a run with `status: "unknown"` and the raw text kept for display.
- Counts are parsed when present. Missing counts stay null, and the UI renders "not reported" instead of guessing.
- New comment formats appear as the product evolves. Each new format gets a fixture and a test before the parser changes.

## 8. API contract

All responses are `application/json` except the badge, which is `image/svg+xml`.

### GET /api/repo?url={repository}
- 200 with:
```json
{
  "repo": { "owner": "string", "name": "string", "url": "string", "description": "string | null" },
  "stats": {
    "runs": 0, "passed": 0, "failed": 0, "inProgress": 0, "unknown": 0,
    "passRate": null,
    "lastStatus": "passed | failed | in_progress | unknown | none",
    "lastRunAt": "ISO 8601 | null"
  },
  "pullRequests": [
    {
      "number": 12, "title": "string", "state": "open | merged | closed", "url": "string",
      "runs": [ { "status": "...", "passed": null, "failed": null, "createdAt": "...", "url": "..." } ],
      "summary": { "passed": 0, "failed": 0 }
    }
  ]
}
```
- 400 `{ "error": "invalid_url" }` when the input is not a GitHub repository reference.
- 404 `{ "error": "not_found" }` when GitHub reports the repository missing.
- 429 `{ "error": "rate_limited", "resetAt": "ISO 8601 | null" }` when the hourly limit is reached and no cached response exists.

### GET /api/badge/{owner}/{repo}
- 200 with the SVG in one of four states: `passing`, `failing`, `no runs`, `unknown`.
- A missing repository returns the `unknown` badge with HTTP 200.
- Header: `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.

### POST /api/parse
- Body: `{ "text": "comment body" }`
- 200 `{ "runs": [ ... ] }`
- 400 `{ "error": "invalid_body" }` when text is missing or not a string.

## 9. Pages, states, and copy

| Route | Purpose | States covered |
|---|---|---|
| `/` | Landing: headline, URL form, sample link, data note | idle, invalid input, pending submit |
| `/r/{owner}/{repo}` | Verification board | loading, loaded, empty, not found, rate limited |
| `/r/{owner}/{repo}/pr/{number}` | Run timeline for one PR | loading, no runs, loaded, unrecognized run |
| `/r/demo/proofboard` | Full board from fixtures | the same states as a real board |
| `/api/badge/{owner}/{repo}` | SVG status badge | passing, failing, no runs, unknown |

Copy rules: sentence case, no exclamation marks, buttons name the action ("Check this repository", "Open the sample board"), and error messages say what happened and what to do next. Landing headline: "Every pull request check, on the record." Subline: "Paste a public GitHub repository. Proofboard reads the TestSprite checks on its pull requests and shows what passed, what failed, and when the fix turned it green." Data note: "Proofboard reads public data from the GitHub API. It looks for runs posted by the TestSprite GitHub App. No account, no token, nothing stored."

## 10. Design direction

### Requirement
The repository root carries `DESIGN.md` with identity, palette, typography, dials, and a one-line reason for each major decision. No UI code lands before that file exists; a design built without direction is a draft, not a deliverable. The direction is locked in `DESIGN.md`; this section records the summary, and DESIGN.md wins on any disagreement.

### Direction (locked in DESIGN.md)
- **Personality:** a verification instrument. Precise, quiet, unhurried. The tool reports state; it does not celebrate.
- **Palette:** warm paper background, ink text, one navy accent reserved for interactive elements. Red, amber, and green appear only as run status. Light default with a working dark toggle, both modes styled and tested the same way. Verified hex values and contrast ratios live in `DESIGN.md`.
- **Typography:** Newsreader for display headings, IBM Plex Sans for prose, and IBM Plex Mono for run data (counts, PR numbers, timestamps, slugs). Reason: the serif carries the record voice; Plex has a technical documentation character, and its mono shares the sans skeleton, so numbers read as native to the page rather than decorative.
- **Identity motif:** the run strip. Small squares, one per run, red or green, with text labels. It appears on the board header, in each PR row, and inside the badge. The strip grows as the repository ships, so history is visible at a glance.
- **Dial:** `Reading this as: a public verification board for developers and maintainers, in a quiet instrument-panel language, dial ENERGY 1 / RHYTHM 2 / MOTION 1.`
  - ENERGY 1: the page is scanned, not performed; calm serves scanning.
  - RHYTHM 2: consistent structures throughout, with visible breaks where the content differs (landing, board, PR page).
  - MOTION 1: hover and focus transitions only. One functional exception: the in-progress dot may animate, because it signals activity.
- **Status chips:** a small square plus a text label. No glow, no capsule plus dot stack, no uppercase.
- **Focal point:** the health strip on the board, the input on the landing page. One focal point per screen.
- **Originality:** the direction must be specific to Proofboard and must not copy any product's look, including Linear, Vercel, Stripe, or shields.io. References inform technique only.
- **Assets:** the logo is the wordmark set in the display face (Newsreader) until a replacement mark is designed and approved. No icon, illustration, or social image ships without confirmation.

## 11. Non-functional requirements

- **Secrets:** none in the repository. `GITHUB_TOKEN` is optional, server-side only, and documented in the README and `.env.example`.
- **Budget:** free tiers only (Vercel, GitHub, TestSprite free plan). No paid dependency enters the stack.
- **Performance:** the board is server-rendered and readable before client JavaScript finishes. Targets on the production URL: Lighthouse performance 90+, accessibility 95+.
- **Accessibility:** WCAG AA contrast (4.5:1 normal text, 3:1 large text), keyboard paths through every flow, visible focus, and status never by color alone.
- **Resilience:** malformed input never crashes a route; GitHub failures degrade to a cached copy or an honest error state; the demo board works with the network off because fixtures are local.
- **Privacy:** only public GitHub data is read; no visitor data is stored; the only client storage is the theme preference in `localStorage`.
- **Compatibility:** current Chrome, Firefox, Safari, and Edge; mobile Safari and Chrome at 360 px width.

## 12. Verification plan

### Where the suite lives
The suite is managed in the TestSprite portal and runs through the GitHub App. On pull requests it runs against the preview deployment; on pushes to the main branch it runs against the production URL.

### Coverage (target: 35 tests)

| # | Area | Tests | Example assertions |
|---|---|---|---|
| 1 | Landing and input | 4 | rejects "example.com"; accepts "owner/repo" and a full URL; empty submit shows the message; the sample link reaches the demo board |
| 2 | Board (demo fixtures) | 6 | counts match fixtures; the run strip has one square per run; newest PR first; status text matches color; repository link correct; pass rate math |
| 3 | PR page (demo fixtures) | 4 | runs listed oldest to newest; the red-to-green marker appears on the fixed PR; counts per run; an unrecognized run shows raw text |
| 4 | Error and edge states | 4 | unknown repository shows the not-found state; a zero-run repository shows the empty copy; the rate-limit state from a fixture; a private repository path |
| 5 | Badge | 4 | passing, failing, and no-runs states render with the correct text; a missing repository returns the unknown badge with HTTP 200 |
| 6 | API contract (*) | 9 | `/api/repo` 200 shape and 400 for invalid input; `/api/parse` table-driven formats (pass, fail, template, weird, empty); 404 mapping |
| 7 | Responsive and keyboard | 4 | the board at 360 px has no horizontal overflow; Tab reaches the form and the theme toggle; focus stays visible; the primary flow completes with the keyboard alone |

(*) This group assumes TestSprite supports API testing in the portal (pending confirmation). If it does not, the checks move to UI-level assertions through the demo board and the suite rebalances toward areas 2 to 5.

### Determinism rules
- Exact numbers are asserted only on the demo board, which renders fixed fixtures.
- Live pages are asserted on stable facts: labels, sections, links, and states that do not change between runs.
- Every bug a run catches gets a regression test at the failing spot, not only a fix.

### Evidence
- `docs/evidence.md` logs each red-to-green arc: the PR link, a screenshot of the failing run, a screenshot of the passing run, and one line on the fix.
- The README links the evidence file. Screenshots are captured before the portal's 30-day activity window ages runs out.
- The final full-suite run on the production URL is captured before submission.

### Acceptance run before submission
- [ ] Suite green on the production URL, all tests.
- [ ] Blocking observed on a real PR (the check held the merge, then passed after a fix).
- [ ] Demo board checks pass.
- [ ] Badge renders in the README on GitHub.
- [ ] At least two red-to-green arcs linked with screenshots.
- [ ] No secrets in the repository.

## 13. GitHub App wiring

- Install the TestSprite GitHub App on the repository (Day 0).
- PR trigger fires on deployment events. Preview URL pattern to verify: `https://proofboard-{branch-slug}-{scope}.vercel.app`. Confirm the exact placeholder tokens against the first real preview and record the final pattern here.
- Push trigger on the main branch points at the production environment URL.
- Include draft pull requests: enabled during the build week so iteration PRs get checks early.
- Block pull requests until tests pass: enabled once the suite is stable (target Day 2), then left on. The block itself becomes demo evidence.
- The portal keeps a 30-day activity window; evidence screenshots are captured before runs age out.

## 14. Milestones

| Day | Work | Done means |
|---|---|---|
| Day 0 (Mon Oct 19, evening) | Accounts and scaffolding: TestSprite project, repository published, Next.js running in production, first PR open, GitHub App installed, smoke suite of 4 to 5 tests. | A first run appears on the PR thread; the smoke suite runs on the production URL. |
| Day 1 (Tue Oct 20) | Core build: parser and fixtures, GitHub layer, landing page, board page, demo board. Suite v1 with 12 to 15 tests. | Board reads real runs from real PRs; first red-to-green arc recorded. |
| Day 2 (Wed Oct 21) | PR detail page, badge with embed snippet, API routes, both themes, empty and error states. Suite v2 near 35 tests with parser and API coverage. | Blocking enabled; second red-to-green arc recorded. |
| Day 3 (Thu Oct 22) | Hardening and submission: copy pass, README with live URL and suite coverage, `docs/evidence.md`, `SUBMISSION.md`, demo video (2 to 3 minutes), dev.to write-up, X thread. | Submission posted to Discord in the evening WIB. |
| Buffer (Fri Oct 23, before 13:59 WIB) | Fixes only if a submission item broke. | Nothing new ships on the last morning. |

## 15. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Exact bot comment format is unknown until the first real run. | Day 0 opens a PR that triggers a run; parser calibration and fixtures are the first job of Day 1. Unrecognized formats still render through the raw fallback. |
| GitHub's unauthenticated limit (60 requests/hour) hit under judging traffic. | 300-second cache, 12-request budget per board build, optional token, and a designed rate-limit state. Cached boards keep loading. |
| Portal API testing scope unconfirmed for the PR check. | Question posted in Discord. Fallback: the API checks move to UI-level assertions through the demo board. |
| Vercel preview protection blocks the TestSprite browser. | Verify a preview URL in an incognito window on Day 0. If protected, disable protection for previews or point the PR trigger at a stable deployment URL. |
| Free-tier run quota. | Batch fixes between runs; re-run only affected tests where the portal allows; keep the suite focused. |
| Suite flakiness from live data. | Exact assertions only on the demo board; live pages assert stable facts (section 12). |
| Deadline timezone (Fri Oct 23, 13:59 WIB). | Submission goes out Thursday night WIB; Friday morning is buffer, not build time. |

## 16. Open questions

- Discord (posted, awaiting answer): payout route for Indonesia, and API-test support for the PR check.
- Name and slug: final product name and repository slug before public assets ship.
- URL pattern: the final preview placeholder tokens and Vercel scope name (section 13).
- Bot login: pin the TestSprite App login after the first real run posts.

## 17. Appendix

### A. Repository layout
```
proofboard/
  app/            routes: landing, board, PR pages, API handlers
  lib/            github.ts, parse.ts, board.ts, types.ts
  fixtures/       demo data and parser fixtures
  docs/           evidence.md
  public/         static assets
  DESIGN.md       identity, palette, typography, dials
  PRD.md          this document
  README.md       what it is, live URL, suite coverage, evidence links
  SUBMISSION.md   submission summary and links
```

### B. Glossary
- **Board:** the public page for one repository, built from parsed runs.
- **Run:** one TestSprite check posted as a comment on a pull request.
- **Run strip:** the row of small squares, one per run, red or green.
- **Badge:** the SVG status image embeddable in a README.
- **Demo board:** the fixtures-backed board at `/r/demo/proofboard`.
- **Red to green:** a failure followed by a passing run on the same pull request, the loop working as intended.
- **Preview deployment:** the Vercel URL created for each pull request, where TestSprite runs.

### C. Submission checklist
- [ ] Repository is public with the required README (app, live URL, suite coverage).
- [ ] The pull request link for the submission has a green check and at least one red-to-green arc in its thread.
- [ ] Live URL confirmed in an incognito window.
- [ ] Email and TestSprite display name included in the Discord post.
- [ ] Demo video link attached.
- [ ] No secrets anywhere in the repository.
- [ ] Posted in the submissions channel before the deadline.
