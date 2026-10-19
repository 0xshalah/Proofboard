import { getBoard } from "@/lib/board";
import { parseRepoInput } from "@/lib/parse-url";

export async function GET(request: Request) {
  const input = new URL(request.url).searchParams.get("url") ?? "";
  const ref = parseRepoInput(input);
  if (!ref) return json({ error: "invalid_url" }, 400);

  const result = await getBoard(ref.owner, ref.name);
  if (result.ok) return json(result.data, 200);

  switch (result.error) {
    case "not_found":
      return json({ error: "not_found" }, 404);
    case "rate_limited":
      return json({ error: "rate_limited", resetAt: result.resetAt }, 429);
    case "invalid":
      return json({ error: "invalid_url" }, 400);
    default:
      return json({ error: "upstream" }, 502);
  }
}

function json(body: unknown, status: number): Response {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}
