#!/usr/bin/env bash
set -euo pipefail

# Script to create a public GitHub repo and push current folder using GitHub CLI (gh)
# Requires: gh authenticated (`gh auth login`) and git initialized locally.

REPO_NAME=${1:-medalino-cms}
OWNER=${2:-$(gh api user --jq .login)}

if ! command -v gh >/dev/null 2>&1; then
  echo "gh CLI not found. Install from https://cli.github.com/"
  exit 1
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Initializing git repository"
  git init
  git add .
  git commit -m "chore: initial commit"
fi

echo "Creating repo ${OWNER}/${REPO_NAME} (public)"
gh repo create "${OWNER}/${REPO_NAME}" --public --source=. --remote=origin --push

echo "Repository created and pushed: https://github.com/${OWNER}/${REPO_NAME}"
