import type { Env } from "../_lib/types";
import { fetchGitHub } from "../_lib/github";
import { getProfile } from "../_lib/portfolio";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const [profile, github] = await Promise.all([
    Promise.resolve(getProfile()),
    fetchGitHub(env.GITHUB_TOKEN),
  ]);

  return new Response(JSON.stringify({ profile, github }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
};
