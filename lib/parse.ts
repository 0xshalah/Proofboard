import type { Run, RunStatus } from "./types";

// The TestSprite GitHub App login, pinned during calibration against the first
// real run. A rename is a one-line change here.
export const TESTSPRITE_BOT_LOGIN = "testsprite[bot]";

export interface CommentAuthor {
  login: string;
  type?: string | null;
}

export interface CommentInput {
  body: string;
  createdAt: string;
  url: string | null;
  author: CommentAuthor;
}

export interface ParseMeta {
  createdAt: string;
  url: string | null;
}

export function isTestSpriteComment(author: CommentAuthor): boolean {
  const login = (author.login ?? "").trim().toLowerCase();
  if (!login) return false;
  if (login === TESTSPRITE_BOT_LOGIN.toLowerCase()) return true;
  // GitHub posts App comments as "<app-slug>[bot]", so match the slug prefix
  // as a fallback until the exact login is pinned.
  return (author.type ?? "").toLowerCase() === "bot" && login.startsWith("testsprite");
}

// Returns an array so a format that posts several runs in one body needs no
// signature change; today one comment maps to one run.
export function parseCommentBody(text: string, meta: ParseMeta): Run[] {
  if (typeof text !== "string") return [];
  const trimmed = text.trim();
  if (!trimmed) return [];

  const counts = extractCounts(trimmed);
  const status = detectStatus(trimmed, counts);
  const run: Run = {
    status,
    passed: counts.passed,
    failed: counts.failed,
    createdAt: meta.createdAt,
    url: meta.url,
  };
  if (status === "unknown") run.raw = trimmed;
  return [run];
}

// Filters to bot comments and parses each one. Order follows the input.
export function parseComments(comments: CommentInput[]): Run[] {
  const runs: Run[] = [];
  for (const comment of comments) {
    if (!isTestSpriteComment(comment.author)) continue;
    runs.push(
      ...parseCommentBody(comment.body, {
        createdAt: comment.createdAt,
        url: comment.url,
      }),
    );
  }
  return runs;
}

interface Counts {
  passed: number | null;
  failed: number | null;
}

function toCount(raw: string): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// Counts come from a few shapes seen in CI reports: "14/14 passed",
// "12 passed", "Passed: 12", "0 failed". First value wins, and the ratio
// only fills a field the word scans left empty.
function extractCounts(text: string): Counts {
  let passed: number | null = null;
  let failed: number | null = null;

  const ratio = text.match(/\b(\d+)\s*(?:of|\/)\s*(\d+)\s*(?:tests?\s+)?passed\b/i);
  if (ratio) {
    const done = toCount(ratio[1]);
    const total = toCount(ratio[2]);
    passed = done;
    if (done !== null && total !== null && total >= done) failed = total - done;
  }

  const ordered = /\b(\d+)\s*(?:tests?\s+)?(passed|failed)\b/gi;
  for (const match of text.matchAll(ordered)) {
    const n = toCount(match[1]);
    if (n === null) continue;
    if (match[2].toLowerCase() === "passed" && passed === null) passed = n;
    if (match[2].toLowerCase() === "failed" && failed === null) failed = n;
  }

  const labeled = /\b(passed|failed)\s*(?:tests)?\s*[:\-]\s*(\d+)\b/gi;
  for (const match of text.matchAll(labeled)) {
    const n = toCount(match[2]);
    if (n === null) continue;
    if (match[1].toLowerCase() === "passed" && passed === null) passed = n;
    if (match[1].toLowerCase() === "failed" && failed === null) failed = n;
  }

  return { passed, failed };
}

function detectStatus(text: string, counts: Counts): RunStatus {
  if (counts.failed !== null && counts.failed > 0) return "failed";
  if (counts.failed === 0) return "passed";
  if (counts.passed !== null) return "passed";
  if (/\b(in[ -]?progress|running|queued|started)\b/i.test(text)) return "in_progress";
  if (/\bfailed\b/i.test(text)) return "failed";
  if (/\b(passed|passing|success)\b/i.test(text)) return "passed";
  return "unknown";
}
