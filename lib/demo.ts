import demoFixture from "@/fixtures/board/demo.json";
import emptyFixture from "@/fixtures/board/empty.json";
import type { PullRequestData, RepoInfo } from "./types";

export const DEMO_OWNER = "demo";
export const DEMO_RATE_LIMIT_RESET_AT = "2026-10-22T06:00:00Z";

export interface DemoFixture {
  repo: RepoInfo;
  pullRequests: Array<Omit<PullRequestData, "summary">>;
}

export function loadDemoFixture(name: string): DemoFixture | null {
  if (name === "proofboard") return demoFixture as DemoFixture;
  if (name === "empty") return emptyFixture as DemoFixture;
  return null;
}
