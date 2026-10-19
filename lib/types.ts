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
