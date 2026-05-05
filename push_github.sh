#!/usr/bin/env bash
# Push cp-dashboard to GitHub
# Run this with: bash push_github.sh YOUR_GITHUB_PAT

set -e
GIT=/usr/bin/git
ROOT="/home/vinh-hung/D:/Vibe_Coding/cp-dashboard"
GITHUB_PAT="${1:-}"
USERNAME="0xKurian"
REPO="cp-dashboard"

cd "$ROOT"

# Configure git
$GIT config user.email "0xKurian@users.noreply.github.com"
$GIT config user.name "0xKurian"

# Init repo if not already
if [ ! -d ".git" ]; then
  $GIT init
  echo "✓ Git repo initialized"
fi

# Set up .gitignore properly before staging
echo "Adding files..."
$GIT add -A

# Commit
$GIT commit -m "feat: initial commit — CP Analytics Dashboard

- Next.js 16 frontend with dark theme, Recharts
- NestJS 11 API with Prisma 5 + Redis caching
- Codeforces sync + analytics + recommendations engine
- Tag weakness scoring algorithm
- Obsidian-compatible note editor" 2>/dev/null || echo "Nothing to commit (already committed)"

# Set remote
$GIT remote remove origin 2>/dev/null || true
if [ -n "$GITHUB_PAT" ]; then
  $GIT remote add origin "https://${USERNAME}:${GITHUB_PAT}@github.com/${USERNAME}/${REPO}.git"
else
  $GIT remote add origin "https://github.com/${USERNAME}/${REPO}.git"
fi

# Push
$GIT branch -M main
$GIT push -u origin main --force

echo ""
echo "✅ Pushed to https://github.com/${USERNAME}/${REPO}"
