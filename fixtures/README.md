# Fixtures

Sample data for the demo slugs and the parser cases. Nothing here touches the network.

## fixtures/board/demo.json

Rendered at `/r/demo/proofboard`. Five pull requests, eight runs. Numbers the automated suite can assert:

- runs: 8, passed: 5, failed: 2, in progress: 0, unknown: 1
- pass rate: 63%
- last status: passed, last run at: Oct 18, 2026, 16:40 UTC
- PR 47 holds the red-to-green moment: a failed run at 14:05 UTC, then a passing run at 15:12 UTC
- PR 44 holds the unrecognized run with its raw text

## fixtures/board/empty.json

Rendered at `/r/demo/empty`. A repository with no runs: zero counts, `lastStatus` is `none`, no pull requests.

## fixtures/parser/cases.json

Cases for `POST /api/parse`. `createdAt` and `url` are pinned by the caller, so each case only fixes `status`, `passed`, and `failed`. Replace the placeholder bodies with real TestSprite comment bodies during calibration, and add a case before changing the parser.

The other demo states (`/r/demo/ratelimited`, `/r/demo/missing`) carry no data files; they are constants in `lib/demo.ts` and `lib/board.ts`.
