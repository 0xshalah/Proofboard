import { getBoard } from "@/lib/board";
import type { BoardResult } from "@/lib/types";

type BadgeState = "passing" | "failing" | "no runs" | "unknown";

const STATE_FILL: Record<BadgeState, string> = {
  passing: "#1C6E45",
  failing: "#B3261E",
  "no runs": "#6B6459",
  unknown: "#6B6459",
};

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/badge/[owner]/[repo]">,
) {
  const { owner, repo } = await ctx.params;
  const result = await getBoard(owner, repo);
  const state = badgeState(result);

  return new Response(renderBadge(state), {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
    },
  });
}

function badgeState(result: BoardResult): BadgeState {
  if (!result.ok) return "unknown";
  if (result.data.stats.runs === 0) return "no runs";
  if (result.data.stats.lastStatus === "passed") return "passing";
  if (result.data.stats.lastStatus === "failed") return "failing";
  return "unknown";
}

const MONO_STACK = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

function textWidth(text: string): number {
  return Math.round(text.length * 6.6) + 14;
}

// Two flat fields, 24px tall, radius 3, the same ink and status fills as the
// board. One look for both themes: an SVG in an <img> cannot see the reader's.
function renderBadge(state: BadgeState): string {
  const label = "proofboard";
  const labelWidth = textWidth(label);
  const messageWidth = textWidth(state);
  const totalWidth = labelWidth + messageWidth;
  const title = `${label}: ${state}`;

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="24" role="img" aria-label="${title}">`,
    `<title>${title}</title>`,
    `<rect width="${totalWidth}" height="24" rx="3" fill="${STATE_FILL[state]}"/>`,
    `<path d="M3 0 H${labelWidth} V24 H3 Q0 24 0 21 V3 Q0 0 3 0 Z" fill="#1B1815"/>`,
    `<g font-family="${MONO_STACK}" font-size="11" font-weight="600" text-anchor="middle">`,
    `<text x="${labelWidth / 2}" y="16" fill="#FAF7F1" letter-spacing="0.2">${label}</text>`,
    `<text x="${labelWidth + messageWidth / 2}" y="16" fill="#FFFFFF" letter-spacing="0.2">${state}</text>`,
    `</g>`,
    `</svg>`,
  ].join("");
}
