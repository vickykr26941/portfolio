const GITHUB_USERNAME = "vickykr26941";
const GITHUB_API = "https://api.github.com";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min in-memory cache per isolate

interface GhRepo {
  name: string;
  description: string;
  url: string;
  stars: number;
  language: string;
  updated: string;
}

interface GhProfile {
  public_repos?: number;
  followers?: number;
  bio?: string;
}

export interface GitHubSnapshot {
  profile: GhProfile;
  repos: GhRepo[];
}

// Module-level cache (lives as long as the isolate stays warm).
// Edge `caches.default` had issues with the GitHub API response headers,
// so we keep this simple and in-memory — good enough for portfolio traffic.
const memCache = new Map<string, { ts: number; data: unknown }>();

function cacheGet<T>(key: string): T | null {
  const hit = memCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) {
    memCache.delete(key);
    return null;
  }
  return hit.data as T;
}

function cacheSet(key: string, data: unknown): void {
  memCache.set(key, { ts: Date.now(), data });
}

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    // GitHub requires a User-Agent on every request — Cloudflare's default UA
    // works but being explicit avoids occasional 403s.
    "User-Agent": "vicky-portfolio-agent",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function fetchJson<T>(url: string, token?: string): Promise<T | null> {
  try {
    const resp = await fetch(url, { headers: headers(token) });
    if (!resp.ok) {
      const body = await resp.text().catch(() => "");
      console.error(`[github] ${url} → ${resp.status}: ${body.slice(0, 200)}`);
      return null;
    }
    return (await resp.json()) as T;
  } catch (e: any) {
    console.error(`[github] fetch threw for ${url}: ${e?.message ?? e}`);
    return null;
  }
}

export async function fetchGitHub(token?: string): Promise<GitHubSnapshot> {
  const cacheKey = `snapshot:${token ? "auth" : "anon"}`;
  const cached = cacheGet<GitHubSnapshot>(cacheKey);
  if (cached) return cached;

  const [profileJson, reposJson] = await Promise.all([
    fetchJson<any>(`${GITHUB_API}/users/${GITHUB_USERNAME}`, token),
    fetchJson<any[]>(
      `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=100&type=public`,
      token
    ),
  ]);

  const snapshot: GitHubSnapshot = {
    profile: {
      public_repos: profileJson?.public_repos,
      followers: profileJson?.followers,
      bio: profileJson?.bio,
    },
    repos: (reposJson ?? [])
      .filter((r) => !r.fork)
      .map((r) => ({
        name: r.name,
        description: r.description || "No description",
        url: r.html_url,
        stars: r.stargazers_count,
        language: r.language || "Unknown",
        updated: (r.updated_at || "").slice(0, 10),
      })),
  };

  console.log(
    `[github] snapshot built: ${snapshot.repos.length} repos, public_repos=${snapshot.profile.public_repos ?? "?"}`
  );

  // Only cache a successful snapshot (avoid pinning an empty result for 5 min).
  if (snapshot.repos.length > 0 || snapshot.profile.public_repos) {
    cacheSet(cacheKey, snapshot);
  }
  return snapshot;
}

export function formatGitHubBlock(snapshot: GitHubSnapshot): string {
  if (!snapshot.repos.length && !snapshot.profile.public_repos) {
    return "GitHub data not currently available.";
  }
  const header = `Public Repos: ${snapshot.profile.public_repos ?? "N/A"} | Followers: ${snapshot.profile.followers ?? "N/A"}`;
  if (!snapshot.repos.length) return header;
  const lines = snapshot.repos.map(
    (r) => `  • ${r.name} [${r.language}] ⭐${r.stars} — ${r.url}`
  );
  return `${header}\nAll Public Repositories (most recently updated first):\n${lines.join("\n")}`;
}
