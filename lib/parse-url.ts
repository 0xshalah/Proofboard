const OWNER_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;
const REPO_PATTERN = /^[A-Za-z0-9._-]{1,100}$/;

export interface RepoRef {
  owner: string;
  name: string;
}

export function isValidRepoRef(owner: string, name: string): boolean {
  return (
    OWNER_PATTERN.test(owner) &&
    REPO_PATTERN.test(name) &&
    name !== "." &&
    name !== ".."
  );
}

// Accepts owner/repo, full github.com URLs (extra path segments like
// /tree/main are dropped), trailing slashes, and a .git suffix.
export function parseRepoInput(input: string): RepoRef | null {
  if (typeof input !== "string") return null;
  const value = input
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .replace(/\.git$/i, "");
  if (!value) return null;

  let path = value;
  const hostMatch = value.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/(.+)$/i);
  if (hostMatch) {
    path = hostMatch[1];
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) {
    return null; // any other scheme is not a repository reference
  }

  const segments = path.split("/").filter(Boolean);
  const shaped = hostMatch ? segments.length >= 2 : segments.length === 2;
  if (!shaped) return null;

  const [owner, name] = segments;
  if (!isValidRepoRef(owner, name)) return null;
  return { owner, name };
}
