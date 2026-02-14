# Version Management

## Semver Rules

`MAJOR.MINOR.PATCH`

| Bump | When | Examples |
|------|------|----------|
| **MAJOR** | Breaking changes | Removed API, changed behavior, incompatible config |
| **MINOR** | New features (backward-compatible) | New endpoint, new option, new command |
| **PATCH** | Bug fixes (backward-compatible) | Fix crash, fix typo, fix regression |

## Analyzing Changes

```bash
# Get last release tag
LAST_TAG=$(gh release view --json tagName --jq '.tagName')

# List commits since last release
git log "$LAST_TAG"..HEAD --oneline

# Detailed diff
gh api "repos/:owner/:repo/compare/$LAST_TAG...HEAD" --jq '.commits[].commit.message'
```

**Bump rules:**
- Any commit with "BREAKING" or removed/changed API → MAJOR
- Any "feat:" or new functionality → MINOR
- Only "fix:", "docs:", "chore:" → PATCH

## Common Version Files

| File | Update method |
|------|--------------|
| package.json | `npm version X.Y.Z --no-git-tag-version` or edit `"version"` field |
| pyproject.toml | Edit `version = "X.Y.Z"` |
| Cargo.toml | Edit `version = "X.Y.Z"` |
| VERSION / version.txt | Write version string |
| setup.py | Edit `version="X.Y.Z"` |

## Pre-release Versions

For pre-release testing: `X.Y.Z-alpha.1`, `X.Y.Z-beta.1`, `X.Y.Z-rc.1`

```bash
gh release create v2.0.0-rc.1 --prerelease --title "v2.0.0-rc.1" --notes "Release candidate"
```
