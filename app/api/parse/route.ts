import { parseCommentBody } from "@/lib/parse";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_body" }, 400);
  }

  const text = (body as { text?: unknown } | null)?.text;
  if (typeof text !== "string") return json({ error: "invalid_body" }, 400);

  const pinned = (body as { createdAt?: unknown } | null)?.createdAt;
  const createdAt = typeof pinned === "string" ? pinned : new Date().toISOString();
  return json({ runs: parseCommentBody(text, { createdAt, url: null }) }, 200);
}

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
