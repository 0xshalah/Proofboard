# TestSprite Hackathon Season 4: competition reference

Everything about the competition Proofboard is entered in. Sources: the official Season 4 page at testsprite.com/hackathon-s4 (fetched October 20, 2026) and the Season 4 Discord. The official page and the Discord pins are authoritative; if this file disagrees with them, they win. Update this file when the rules move.

## The competition

Season 4 runs October 16 to 22, 2026 under one line: "One week. One loop. Every PR." Entrants wire TestSprite into a GitHub repository so every pull request is tested automatically through the TestSprite GitHub App. Human judges score projects out of 100. A separate CLI Improvement Bonus runs on GitHub through October 29. Everything happens through Discord and X.

Two ways to win, two separate pools: project awards ($3,000) and the CLI bonus ($1,000).

## Timeline

All times Pacific unless noted. WIB equivalents are given because the build runs on Jakarta time.

| Date | Event |
|---|---|
| Oct 2 | Full rules published, including the CLI bonus |
| Oct 16 (Day 1) | Season opens; the project track and the CLI window both start |
| Oct 22, 11:59 PM PT (Oct 23, 13:59 WIB) | Project submissions close |
| Oct 23 to Oct 27 (Days 8 to 12) | Judging |
| Oct 29, 11:59 PM PT (Oct 30, 13:59 WIB) | CLI bonus closes; PRs must be open and out of draft |
| Oct 30 to Nov 3 | CLI review and allocation, single batch |
| Nov 6 | Winners announced on X and Discord; payouts from both pools |

The page notes the final schedule is confirmed in Discord, so treat the pins as the last word if anything shifts.

## Prizes

Project awards, $3,000 across five winners:

| Place | Title | Prize |
|---|---|---|
| 1st | Grand Champion | $1,500 |
| 2nd | Runner Up | $750 |
| 3rd | Third Place | $450 |
| 4th | Honorable Mention | $150 |
| 5th | Honorable Mention | $150 |

CLI Improvement Bonus: a separate $1,000 pool, $50 minimum per merged PR, allocated once after the window. Details in its own section below.

The page does not state the payout route for every country; the route for Indonesia is an open question until the organizers answer in Discord.

## How the loop works

1. Write: your coding agent ships code.
2. Test: you open a pull request, and the check runs on its own.
3. Fix: the agent reads the failure bundle off the PR and fixes the root cause.
4. Test again: push the fix, the check reruns, the PR goes green.

Two quotes from the page that frame the judging: "a loop you have to remember to run is a loop that stops running", and on submissions, "A run that caught something first and went green after your fix is the best version of this."

## Setup order

1. Create a TestSprite account with the same email you will submit with, so judges can find the suite.
2. Have a live public URL. Localhost does not count; the tests run against the deployed app.
3. Generate the test suite in the 3.0 portal against that live URL. The PR check runs this suite, so the suite has to exist first.
4. Install the GitHub App on the repository from Settings, then GitHub App, in the dashboard. Existing projects are welcome, and nothing is added to the repository itself.

## The GitHub App

- Results come back as a comment on the PR, and optionally as a status check.
- Three per-repo switches: Run on Pull Requests, Include Draft PRs, and Blocking PRs. Blocking turns the result into a status check that holds the merge.
- Integration docs: https://docs.testsprite.com/web-portal/integrations/github-integration

## Judging

| Score | What it covers |
|---|---|
| 40 points, project quality | Craft, polish, completeness. Does the live app actually work well. |
| 40 points, tests that run themselves | Is it wired up, and is the suite worth running. Coverage breadth, assertion depth, scenario design, whether the check fires on every PR and holds the merge. Read from the PR, the 3.0 portal, and the commits. |
| 20 points, innovation | Creativity of the project, or of how verification is wired into shipping. |
| Open-ended bonus, engagement | Discord polls, X shares, long-form write-ups. Added on top of the 100. |

Five guest creators (Ömer Göçmen, Uğur Keskekçi, Astro K Joseph, Poyraz, Jan Marshal) each select a Creator Pick with a short quote. Creator Picks are separate from the official scoring and do not change the prize pool.

Feedback about the portal, the CLI, or the MCP server is open all season through Discord. It is not scored, but feedback that changes the product may earn extra TestSprite credits.

## Submission

Two steps, both before the deadline.

In the repository:

- Public source with a README covering the app, the live URL, and what the suite covers.
- Commit history that shows the app is yours.
- No secrets in the repo.
- At least one pull request carrying a TestSprite comment or status check, with the tests passing.

In Discord, channel #hackathon-submissions:

- A link to a PR with a TestSprite check (required).
- A live public URL (required).
- The TestSprite email and display name used for the account (required).
- A demo video link (optional, and judges do watch them).

## CLI Improvement Bonus

- Window: October 16 to October 29, 11:59 PM PT. Entirely on GitHub, in the open-source repo https://github.com/TestSprite/testsprite-cli (Apache 2.0).
- Flow: open an issue and assign it to yourself, then open a PR whose body says "Closes #123", ticks the entry checkbox from the PR template, and includes your Discord username. A bot confirms the entry in a comment. PRs titled "docs:" skip the issue step.
- Claim limits: up to three open claimed issues at a time. A claim with no activity gets a warning at 48 hours and is released at 72, so nobody sits on work they are not doing.
- Up to three bonus-eligible PRs per person; other contributions are welcome and just do not count toward the pool.
- Payout: a $50 floor per merged PR, scaled to substance. The $1,000 pool is allocated in a single pass after the window.
- Two separate bars to clear: the PR has to be merged, and it has to be judged a genuine improvement.
- Does not qualify (illustrative list): no problem statement, formatting or typo-level edits, behavior change without tests, comment-only edits, unexplained dependency bumps, one change split across several PRs, spam or bounty farming.

## Links

- Official page: https://www.testsprite.com/hackathon-s4
- Discord: https://discord.com/invite/GXWFjCe4an (rules pinned in #hackathon-info)
- X: https://x.com/test_sprite
- CLI repo: https://github.com/TestSprite/testsprite-cli
- CLI install: npm install -g @testsprite/testsprite-cli
- GitHub App docs: https://docs.testsprite.com/web-portal/integrations/github-integration
- Past projects: https://www.testsprite.com/discover

## What this means for Proofboard

- The product is built around the Season 4 loop: Proofboard reads the TestSprite PR check and turns it into a public record. See PRD section 2.
- The repository dogfoods the loop: the app runs on Proofboard's own repo, pull requests are held by the check once the suite is stable, and Proofboard's own board is the first board the site shows. PRD section 3.
- The rubric mapping is in PRD section 4, the suite plan in PRD section 12, and the milestones in PRD section 14.
- Current build status, the open wiring steps, and the resume plan: docs/checkpoint.md.

## Open questions

- Payout route for Indonesia. Posted in Discord, awaiting an answer.
- API testing inside the portal and the PR check. If unsupported, the API contract checks move to UI-level assertions on the demo board (PRD section 12, group 6 note).
- Preview URL pattern for the PR trigger on Vercel. Verify against the first real preview and record it in PRD section 13.
- The TestSprite App login used on comments. Pin it after the first real run posts (the constant in lib/parse.ts).
