# Project checkpoint

Last updated: October 20, 2026. This is the handover document between machines and sessions. Update it at every milestone.

## One paragraph

The backend is built, verified locally, and pushed as the branch feat/backend (3 commits; PR not opened yet). main carries the plan and the docs: README, PRD, DESIGN, the frontend brief, the competition reference, and the Next.js scaffold merged in PR #1. Nothing from TestSprite has touched the repository yet: the Vercel import and the TestSprite account are still open, so the comment parser is calibrated against fixtures and must be recalibrated against the first real bot comment. The frontend is not started; its build brief is ready at docs/fe-build-prompt.md.

## Branch map

| Branch | State | Notes |
|---|---|---|
| main | 3386d46, plus the commit that added this file | Scaffold merged via PR #1. No backend yet. |
| feat/backend | e2c5114, pushed to origin | 3 commits ahead of main. PR #2 (into main) not created yet. |

Commits on feat/backend:

- 2be35e8: data types, repository input parsing, comment parser, parser fixtures
- 04b3a84: GitHub layer, board assembly, demo fixtures, PRD section 7 alignment
- e2c5114: API routes (/api/repo, /api/parse, /api/badge/[owner]/[repo]), PRD section 8 alignment

The branch scaffold-next-app was deleted after PR #1 merged, locally and on the remote.

## What is built

### lib/

- lib/types.ts: the shared contract: Run, RepoInfo, BoardStats, PullRequestData, BoardData, BoardErrorKind, BoardResult.
- lib/parse-url.ts: parseRepoInput(input) accepts owner/repo, full github.com URLs, trailing slashes, and a .git suffix; returns null otherwise. isValidRepoRef validates the two parts.
- lib/parse.ts: TESTSPRITE_BOT_LOGIN (currently "testsprite[bot]"; pin it against the first real run), isTestSpriteComment, parseCommentBody (never throws; unrecognized text returns one run with status "unknown" and the raw text; an empty body returns no runs), and parseComments (bot filter over a comment list).
- lib/github.ts: fetchRepo, fetchPulls (per_page=10), fetchComments. Maps 404 to not_found, 429 or 403 with the rate limit exhausted to rate_limited with resetAt from x-ratelimit-reset, and everything else to upstream. Sends a User-Agent always, Authorization only when GITHUB_TOKEN is set.
- lib/board.ts: getBoard(owner, name). Validates the input, serves the demo slugs from fixtures with no network, caches live boards for 300 seconds, and serves a stale cached board when a refresh hits rate_limited or upstream. Build budget: 1 repository + 1 pull list + up to 10 comment calls, so at most 12 requests.
- lib/demo.ts: the demo fixture loader and the rate limit reset constant.

### fixtures/

- fixtures/board/demo.json: mounted at /r/demo/proofboard. 5 pull requests, 8 runs: 5 passed, 2 failed, 1 unknown. Pass rate 63 percent, last status passed at 2026-10-18T16:40:00Z. PR 47 holds the red-to-green sequence (failed, then passed twice). PR 44 holds the unrecognized run with its raw text.
- fixtures/board/empty.json: mounted at /r/demo/empty. Zero runs, lastStatus "none".
- fixtures/parser/cases.json: 9 parser cases for POST /api/parse. Placeholder bodies to replace with real ones during calibration.
- fixtures/README.md: the exact numbers the automated suite asserts on the demo board.

### app/api/

- GET /api/repo?url=... returns 200 board data; 400 invalid_url; 404 not_found; 429 rate_limited with resetAt; 502 upstream. Responses carry Cache-Control: no-store.
- POST /api/parse returns 200 { runs }; 400 invalid_body. An optional createdAt pins the run timestamps for deterministic tests.
- GET /api/badge/[owner]/[repo] returns an SVG with status 200 in every case, four states (passing, failing, no runs, unknown), and the header Cache-Control: public, max-age=300, stale-while-revalidate=86400.

## Verified on October 20, 2026

Windows, Node v24.21.0, Next.js 16.4.2.

- Parser: 9 of 9 fixture cases pass.
- npx next typegen, then npx tsc --noEmit: pass.
- npm run lint: pass.
- npm run build: pass; the three API routes register as dynamic.
- Production smoke test on PORT=3100:
  - /api/repo?url=demo/proofboard: 200, stats exactly runs 8, passed 5, failed 2, inProgress 0, unknown 1, passRate 63, lastStatus passed, lastRunAt 2026-10-18T16:40:00Z; pull request order 47, 46, 45, 44, 43; PR 47 run statuses failed, passed, passed.
  - /api/repo?url=demo/empty: 200, all counts zero, lastStatus none.
  - /api/repo?url=demo/ratelimited: 429 with resetAt 2026-10-22T06:00:00Z.
  - /api/repo?url=demo/missing: 404 not_found.
  - /api/repo?url=not-a-repo and a gitlab.com URL: both 400 invalid_url.
  - /api/parse with a failing body: 200 with one run (failed, 11, 3); a body without text: 400.
  - /api/badge/demo/proofboard: 200 image/svg+xml, contains "passing", cache header exact; /api/badge/demo/missing: "unknown"; /api/badge/demo/empty: "no runs".
- Live GitHub read: /api/repo?url=https://github.com/0xshalah/Proofboard returns 200 with PR #1 listed; a nonexistent repository returns 404.

## Not done yet

- PR #2: create feat/backend into main and merge it, or ask the build agent to fast-forward main to feat/backend. The frontend agent needs lib/ on main.
- Vercel: import the repository, get the first preview, and confirm the preview URL pattern for the PR trigger (PRD section 13).
- TestSprite: create the account with the same email as the submission, build the suite in the 3.0 portal against the live URL, install the GitHub App, enable Run on Pull Requests and Include Draft PRs, and enable Blocking once the suite is stable.
- First real run: recalibrate lib/parse.ts against the real comment body, pin TESTSPRITE_BOT_LOGIN, and add the real body to fixtures/parser/cases.json.
- Frontend: hand docs/fe-build-prompt.md to the frontend agent. Branch feat/frontend from main after PR #2 merges, otherwise from feat/backend.
- Public assets: README rewrite (app, live URL, suite coverage), SUBMISSION.md, docs/evidence.md with the red-to-green arcs, demo video, dev.to write-up, X thread. Capture screenshots before the portal's 30-day window ages runs out.
- Discord questions: payout route for Indonesia; API-test support in the PR check (fallback is in PRD section 12).

## Migrating to Linux

The repository is the only thing that matters; everything else is re-creatable.

1. Clone or move the repository and fetch all branches: git fetch origin. The backend lives on feat/backend.
2. Install Node 24 or newer, then run npm install.
3. Recreate the local git identity used on the Windows machine (the global identity was not linked to the GitHub account):
   git config user.name "0xshalah"
   git config user.email "0xshalah@users.noreply.github.com"
4. Authenticate the GitHub CLI if available: gh auth login. That lets the agent open and update pull requests directly.
5. Optional: export GITHUB_TOKEN to raise the GitHub limit from 60 to 5,000 requests per hour. Never commit it; .env files are ignored.
6. Re-run the checks:
   npx next typegen && npx tsc --noEmit
   npm run lint
   npm run build
   PORT=3100 npm run start
   curl -s 'http://localhost:3100/api/repo?url=demo/proofboard'
7. Nothing secret lives in the repository. Accounts to sign into on the new machine: GitHub, Vercel, TestSprite, Discord.

## Resume order

1. Create and merge PR #2 so main carries the backend.
2. Hand docs/fe-build-prompt.md to the frontend agent and unblock the frontend build.
3. Import the repo in Vercel and confirm the first preview URL.
4. Create the TestSprite account and build the suite in the portal against the live URL.
5. Install the GitHub App; enable Run on Pull Requests and Include Draft PRs; enable Blocking once the suite is stable.
6. Open the pull request that triggers the first real run; recalibrate the parser; record the first red-to-green arc.
7. Keep docs/evidence.md current; capture screenshots while the portal window is fresh.
8. Submit in Discord on October 22 evening WIB (deadline October 23, 13:59 WIB).

## Environment notes

- Node v24.21.0; Next.js 16.4.2 with Turbopack; cacheComponents and partialPrefetching are enabled in next.config.ts.
- npm scripts: dev, build, start, lint.
- RouteContext types come from npx next typegen; a bare tsc on a fresh clone fails until it runs.
- npm audit reports 5 high severity issues in scaffold dependencies; review during hardening; never run npm audit fix --force.
- The smoke and parser check scripts used on Windows lived in the temp directory, not in the repository. The curl commands above re-cover the same checks.

## Reference map

- PRD.md: what to build. Section 4 is the rubric mapping, section 12 the suite plan, section 14 the milestones, section 13 the GitHub App wiring.
- DESIGN.md: the locked visual direction and tokens.
- docs/fe-build-prompt.md: the frontend agent's brief, including the backend contract.
- docs/hackathon.md: the competition reference (dates, prizes, rules, submission steps).
- fixtures/README.md: the demo board numbers the suite asserts.
- AGENTS.md: Next.js 16 rules for agents working in this repo.
