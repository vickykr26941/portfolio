# VickyBot — AI Portfolio Agent

A streaming chatbot that answers questions about Vicky Kumar's portfolio.
Frontend + backend both run on **Cloudflare Pages** (Pages Functions for the API).
LLM inference is powered by **Groq** (gpt-oss-120b) with token streaming.
Live GitHub data is fetched at request time and cached at the edge for 5 minutes.

```
public/index.html              ← static UI served by Cloudflare Pages
functions/api/chat-stream.ts   ← POST  /api/chat-stream  (token streaming)
functions/api/chat.ts          ← POST  /api/chat         (single JSON reply)
functions/api/health.ts        ← GET   /api/health
functions/_lib/                ← shared agent + groq + github + portfolio logic
data/portfolio_data.json       ← Vicky's resume data (bundled into the worker)
```

## Local development

```bash
npm install
cp .env.example .dev.vars       # paste real GROQ_API_KEY here
npm run dev                     # wrangler pages dev — serves UI + functions
```

Open http://localhost:8788.

## Deploy to Cloudflare Pages

1. **One-time:** create the project in the dashboard or via CLI:
   ```bash
   wrangler pages project create vicky-portfolio-agent --production-branch main
   ```
2. **Push secrets** (do not commit them):
   ```bash
   export GROQ_API_KEY="gsk_..."
   export GITHUB_TOKEN="ghp_..."   # optional
   ./cf-deploy.sh --secrets
   ```
3. **Deploy:**
   ```bash
   ./cf-deploy.sh                  # equivalent to: wrangler pages deploy ./public
   ```
4. Tail logs:
   ```bash
   ./cf-deploy.sh --tail
   ```

Your site goes live at `https://vicky-portfolio-agent.pages.dev`.

## Environment variables

| Name           | Required | Where set                                  |
| -------------- | -------- | ------------------------------------------ |
| `GROQ_API_KEY` | yes      | `.dev.vars` locally, Pages secrets in prod |
| `GROQ_MODEL`   | no       | defaults to `openai/gpt-oss-120b`          |
| `GITHUB_TOKEN` | no       | avoids GitHub rate limits                  |

## Typecheck

```bash
npm run typecheck
```
