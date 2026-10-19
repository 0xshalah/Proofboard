import { DEMO_OWNER, DEMO_RATE_LIMIT_RESET_AT, loadDemoFixture } from "./demo";
import { fetchComments, fetchPulls, fetchRepo, type GitHubPull } from "./github";
import { parseComments, type CommentInput } from "./parse";
import { isValidRepoRef } from "./parse-url";
import type { BoardData, BoardResult, BoardStats, PullRequestData, Run } from "./types";

const CACHE_TTL_MS = 300_000;
const MAX_PULLS = 10;

interface CacheEntry {
  fetchedAt: number;
  data: BoardData;
}

const cache = new Map<string, CacheEntry>();

export async function getBoard(owner: string, name: string): Promise<BoardResult> {
  if (!isValidRepoRef(owner, name)) return { ok: false, error: "invalid", resetAt: null };

  if (owner.toLowerCase() === DEMO_OWNER) return getDemoBoard(name);

  const key = `${owner}/${name}`.toLowerCase();
  const cached = cache.get(key);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return { ok: true, data: cached.data };
  }

  const result = await buildBoard(owner, name);
  if (result.ok) {
    cache.set(key, { fetchedAt: Date.now(), data: result.data });
    return result;
  }
  // A rate limit or outage on a cold cache still serves the last good board.
  if (cached && (result.error === "rate_limited" || result.error === "upstream")) {
    return { ok: true, data: cached.data };
  }
  return result;
}

function getDemoBoard(name: string): BoardResult {
  if (name === "ratelimited") {
    return { ok: false, error: "rate_limited", resetAt: DEMO_RATE_LIMIT_RESET_AT };
  }
  const fixture = loadDemoFixture(name);
  if (!fixture) return { ok: false, error: "not_found", resetAt: null };

  const pullRequests = fixture.pullRequests.map((pull) =>
    withSummary({ pull, runs: pull.runs }),
  );
  return {
    ok: true,
    data: { repo: fixture.repo, stats: computeStats(pullRequests), pullRequests },
  };
}

// One build costs at most 12 GitHub requests: the repository, one pull list,
// and one comment call per inspected pull request.
async function buildBoard(owner: string, name: string): Promise<BoardResult> {
  const repo = await fetchRepo(owner, name);
  if (!repo.ok) return { ok: false, error: repo.error, resetAt: repo.resetAt };

  const pulls = await fetchPulls(owner, name);
  if (!pulls.ok) return { ok: false, error: pulls.error, resetAt: pulls.resetAt };

  const inspected = pulls.data.slice(0, MAX_PULLS);
  const commentResults = await Promise.all(
    inspected.map((pull) => fetchComments(owner, name, pull.number)),
  );

  const limited = commentResults.find((result) => !result.ok && result.error === "rate_limited");
  if (limited && !limited.ok) {
    return { ok: false, error: "rate_limited", resetAt: limited.resetAt };
  }

  const pullRequests = inspected.map((pull, index) => {
    const comments = commentResults[index];
    if (!comments.ok) return withSummary({ pull, runs: [] });

    const runs = parseComments(
      comments.data.map(
        (comment): CommentInput => ({
          body: comment.body,
          createdAt: comment.createdAt,
          url: comment.htmlUrl,
          author: { login: comment.authorLogin, type: comment.authorType },
        }),
      ),
    );
    runs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return withSummary({ pull, runs });
  });

  return {
    ok: true,
    data: { repo: repo.data, stats: computeStats(pullRequests), pullRequests },
  };
}

function pullState(pull: GitHubPull): PullRequestData["state"] {
  if (pull.state === "open") return "open";
  return pull.merged ? "merged" : "closed";
}

function withSummary(input: {
  pull: GitHubPull | Omit<PullRequestData, "summary">;
  runs: Run[];
}): PullRequestData {
  const pull = input.pull;
  const state = "htmlUrl" in pull ? pullState(pull) : pull.state;
  const url = "htmlUrl" in pull ? pull.htmlUrl : pull.url;
  return {
    number: pull.number,
    title: pull.title,
    state,
    url,
    runs: input.runs,
    summary: {
      passed: input.runs.reduce((total, run) => total + (run.passed ?? 0), 0),
      failed: input.runs.reduce((total, run) => total + (run.failed ?? 0), 0),
    },
  };
}

function computeStats(pullRequests: PullRequestData[]): BoardStats {
  const runs = pullRequests.flatMap((pull) => pull.runs);
  const count = (status: Run["status"]) => runs.filter((run) => run.status === status).length;
  const passed = count("passed");
  const last = runs.reduce<Run | null>(
    (latest, run) => (!latest || run.createdAt > latest.createdAt ? run : latest),
    null,
  );

  return {
    runs: runs.length,
    passed,
    failed: count("failed"),
    inProgress: count("in_progress"),
    unknown: count("unknown"),
    passRate: runs.length ? Math.round((passed / runs.length) * 100) : null,
    lastStatus: last ? last.status : "none",
    lastRunAt: last ? last.createdAt : null,
  };
}
