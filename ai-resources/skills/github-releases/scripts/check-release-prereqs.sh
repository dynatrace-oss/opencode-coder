#!/usr/bin/env bash
set -euo pipefail

ERRORS=0

# gh CLI
if ! gh auth status &>/dev/null; then
    echo "❌ gh CLI not authenticated (run: gh auth login)"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ gh CLI authenticated"
fi

# Git repo
if ! git rev-parse --git-dir &>/dev/null; then
    echo "❌ Not a git repository"
    exit 1
fi
echo "✅ Git repository"

# GitHub remote
if ! git remote get-url origin 2>/dev/null | grep -q github.com; then
    echo "❌ No GitHub remote"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ GitHub remote"
fi

# Clean working tree
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    echo "❌ Uncommitted changes"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Clean working tree"
fi

if [ -n "$(git ls-files --others --exclude-standard)" ]; then
    echo "⚠️  Untracked files present"
fi

# Branch check
CURRENT=$(git branch --show-current)
DEFAULT=$(gh repo view --json defaultBranchRef --jq '.defaultBranchRef.name' 2>/dev/null || echo "main")
if [ "$CURRENT" != "$DEFAULT" ]; then
    echo "⚠️  On branch '$CURRENT', not '$DEFAULT'"
fi

# Up to date with remote
git fetch origin "$DEFAULT" --quiet 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$DEFAULT" 2>/dev/null || echo "unknown")
if [ "$LOCAL" != "$REMOTE" ]; then
    echo "⚠️  Not up to date with origin/$DEFAULT"
fi

echo ""
if [ $ERRORS -gt 0 ]; then
    echo "❌ $ERRORS prerequisite(s) failed"
    exit 1
fi
echo "✅ All prerequisites met"
