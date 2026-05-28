const GITHUB_USERNAME = "vickykr26941";
const GITHUB_API = "https://api.github.com";
const CACHE_TTL_SECONDS = 300; // 5 min edge cache

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

function headers(token?: string): HeadersInit {
  const h: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

async function cachedFetch(url: string, init: RequestInit): Promise<Response> {
  const cache = caches.default;
  const cacheKey = new Request(url, { method: "GET" });
  const hit = await cache.match(cacheKey);
  if (hit) return hit;

  const resp = await fetch(url, init);
  if (resp.ok) {
    const cloned = new Response(resp.clone().body, resp);
    cloned.headers.set("Cache-Control", `public, max-age=${CACHE_TTL_SECONDS}`);
    await cache.put(cacheKey, cloned);
  }
  return resp;
}

export async function fetchGitHub(token?: string): Promise<GitHubSnapshot> {
  try {
    const [profileResp, reposResp] = await Promise.all([
      cachedFetch(`${GITHUB_API}/users/${GITHUB_USERNAME}`, { headers: headers(token) }),
      cachedFetch(
        `${GITHUB_API}/users/${GITHUB_USERNAME}/repos?sort=updated&per_page=20&type=public`,
        { headers: headers(token) }
      ),
    ]);

    const profileJson = profileResp.ok ? ((await profileResp.json()) as any) : {};
    const reposJson = reposResp.ok ? ((await reposResp.json()) as any[]) : [];

    return {
      profile: {
        public_repos: profileJson.public_repos,
        followers: profileJson.followers,
        bio: profileJson.bio,
      },
      repos: reposJson.map((r) => ({
        name: r.name,
        description: r.description || "No description",
        url: r.html_url,
        stars: r.stargazers_count,
        language: r.language || "Unknown",
        updated: (r.updated_at || "").slice(0, 10),
      })),
    };
  } catch {
    return { profile: {}, repos: [] };
  }
}

export function formatGitHubBlock(snapshot: GitHubSnapshot): string {
  if (!snapshot.repos.length && !snapshot.profile.public_repos) {
    return "GitHub data not currently available.";
  }
  const header = `Public Repos: ${snapshot.profile.public_repos ?? "N/A"} | Followers: ${snapshot.profile.followers ?? "N/A"}`;
  if (!snapshot.repos.length) return header;
  const lines = snapshot.repos
    .slice(0, 10)
    .map(
      (r) => `  • ${r.name} [${r.language}] ⭐${r.stars} — ${r.description} | ${r.url}`
    );
  return `${header}\nTop Repositories:\n${lines.join("\n")}`;
}
