#!/usr/bin/env bash
#
# Deploy VickyBot to Cloudflare Pages.
#
# Usage:
#   ./cf-deploy.sh              # Deploy to production
#   ./cf-deploy.sh --preview    # Local preview via wrangler pages dev
#   ./cf-deploy.sh --tail       # Tail production logs
#   ./cf-deploy.sh --secrets    # Push GROQ_API_KEY + GITHUB_TOKEN as Pages secrets
#

set -euo pipefail

PROJECT_NAME="vicky-portfolio-agent"

# Use globally installed wrangler if available, otherwise fall back to npx.
if command -v wrangler >/dev/null 2>&1; then
  WRANGLER="wrangler"
else
  WRANGLER="npx --yes wrangler"
fi

ensure_node() {
  if ! command -v npm >/dev/null 2>&1; then
    echo "npm not found. Install Node.js 18+ first (e.g. brew install node)." >&2
    exit 1
  fi
}

push_secrets() {
  ensure_node
  if [[ -z "${GROQ_API_KEY:-}" ]]; then
    echo "GROQ_API_KEY not in environment. Export it first." >&2
    exit 1
  fi
  echo "Setting GROQ_API_KEY..."
  printf '%s' "$GROQ_API_KEY" | $WRANGLER pages secret put GROQ_API_KEY --project-name "$PROJECT_NAME"

  if [[ -n "${GITHUB_TOKEN:-}" ]]; then
    echo "Setting GITHUB_TOKEN..."
    printf '%s' "$GITHUB_TOKEN" | $WRANGLER pages secret put GITHUB_TOKEN --project-name "$PROJECT_NAME"
  fi
}

deploy() {
  ensure_node
  npm install
  $WRANGLER pages deploy ./public --project-name "$PROJECT_NAME"
}

preview() {
  ensure_node
  npm install
  $WRANGLER pages dev
}

tail_logs() {
  ensure_node
  $WRANGLER pages deployment tail --project-name "$PROJECT_NAME"
}

case "${1:-deploy}" in
  --preview) preview ;;
  --tail)    tail_logs ;;
  --secrets) push_secrets ;;
  -h|--help)
    sed -n '1,12p' "$0"
    ;;
  *) deploy ;;
esac
