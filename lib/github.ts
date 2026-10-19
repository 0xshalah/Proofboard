import type { RepoInfo } from "./types";

const API_BASE = "https://api.github.com";
const USER_AGENT = "Proofboard (https://github.com/0xshalah/Proofboard)";

export interface GitHubPull {
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  htmlUrl: string;
}

export interface GitHubComment {
  body: string;
  createdAt: string;
  htmlUrl: string;
  authorLogin: string;
  authorType: string | null;
}

export type GitHubError = "not_found" | "rate_limited" | "upstream";

export type GitHubResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: GitHubError; resetAt: string | null };

function requestHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": USER_AGENT,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

function rateLimitResetAt(response: Response): string | null {
  const raw = response.headers.get("x-ratelimit-reset");
  const seconds = raw ? Number(raw) : NaN;
  return Number.isFinite(seconds) ? new Date(seconds * 1000).toISOString() : null;
}

// GitHub reports the hourly limit as 429, or as 403 with x-ratelimit-remaining
// at zero. Everything else non-OK becomes "upstream".
async function request<T>(url: string): Promise<GitHubResult<T>> {
  let response: Response;
  try {
    response = await fetch(url, { headers: requestHeaders(), cache: "no-store" });
  } catch {
    return { ok: false, error: "upstream", resetAt: null };
  }

  if (response.ok) {
    try {
      return { ok: true, data: (await response.json()) as T };
    } catch {
      return { ok: false, error: "upstream", resetAt: null };
    }
  }

  if (response.status === 404) return { ok: false, error: "not_found", resetAt: null };
  if (
    response.status === 429 ||
    (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")
  ) {
    return { ok: false, error: "rate_limited", resetAt: rateLimitResetAt(response) };
  }
  return { ok: false, error: "upstream", resetAt: null };
}

interface RepoJson {
  full_name?: string;
  html_url?: string;
  description?: string | null;
}

export async function fetchRepo(owner: string, name: string): Promise<GitHubResult<RepoInfo>> {
  const result = await request<RepoJson>(`${API_BASE}/repos/${owner}/${name}`);
  if (!result.ok) return result;

  const [canonicalOwner, canonicalName] = (result.data.full_name ?? `${owner}/${name}`).split("/");
  return {
    ok: true,
    data: {
      owner: canonicalOwner ?? owner,
      name: canonicalName ?? name,
      url: result.data.html_url ?? `https://github.com/${owner}/${name}`,
      description: result.data.description ?? null,
    },
  };
}

interface PullJson {
  number?: number;
  title?: string;
  state?: string;
  merged_at?: string | null;
  html_url?: string;
}

export async function fetchPulls(
  owner: string,
  name: string,
): Promise<GitHubResult<GitHubPull[]>> {
  const query = "state=all&sort=created&direction=desc&per_page=10";
  const result = await request<PullJson[]>(
    `${API_BASE}/repos/${owner}/${name}/pulls?${query}`,
  );
  if (!result.ok) return result;

  const pulls: GitHubPull[] = [];
  for (const pull of result.data) {
    if (typeof pull.number !== "number" || typeof pull.title !== "string") continue;
    pulls.push({
      number: pull.number,
      title: pull.title,
      state: pull.state === "open" ? "open" : "closed",
      merged: Boolean(pull.merged_at),
      htmlUrl: pull.html_url ?? `https://github.com/${owner}/${name}/pull/${pull.number}`,
    });
  }
  return { ok: true, data: pulls };
}

interface CommentJson {
  body?: string | null;
  created_at?: string;
  html_url?: string;
  user?: { login?: string; type?: string } | null;
}

export async function fetchComments(
  owner: string,
  name: string,
  number: number,
): Promise<GitHubResult<GitHubComment[]>> {
  const result = await request<CommentJson[]>(
    `${API_BASE}/repos/${owner}/${name}/issues/${number}/comments?per_page=100`,
  );
  if (!result.ok) return result;

  const comments: GitHubComment[] = [];
  for (const comment of result.data) {
    if (!comment.created_at) continue;
    comments.push({
      body: comment.body ?? "",
      createdAt: comment.created_at,
      htmlUrl: comment.html_url ?? "",
      authorLogin: comment.user?.login ?? "",
      authorType: comment.user?.type ?? null,
    });
  }
  return { ok: true, data: comments };
}
