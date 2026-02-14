# Release Workflow

Complete process for creating a GitHub release.

## Prerequisites

Before starting:
1. **Load project-specific instructions** from `docs/RELEASING.md`
2. Verify environment: `bash scripts/check-release-prereqs.sh`

Project-specific instructions override the generic phases below.

## Phase 1: Quality Gates

All quality gates MUST pass before proceeding.

1. **Clean working tree** — no uncommitted or untracked changes
2. **All tests pass** — run the full test suite (unit, integration, E2E)
3. **Build succeeds** — build the project
4. **CI green** — latest commit passes all checks

If unsure how to build or test the project, check `docs/RELEASING.md` or ask the user.

> Check project-specific release guide for custom quality gates.

**Details**: [quality-gates.md](quality-gates.md)

## Phase 2: Documentation

Load a documentation skill to validate and fix documentation before release.

Key checks:

1. **Version references** — all match the release version
2. **CHANGELOG** — entry exists for new version
3. **Breaking changes** — migration guide if needed

> Check project-specific release guide for additional documentation requirements.

**Details**: [documentation-checklist.md](documentation-checklist.md)

## Phase 3: Version Bump

1. **Analyze changes** since last release tag
2. **Determine bump** — major (breaking), minor (features), patch (fixes)
3. **Update version files** — detect and update all relevant files
4. **Commit** — `release: vX.Y.Z`

> Check project-specific release guide for custom version file locations.

**Details**: [version-management.md](version-management.md)

## Phase 4: Create Release

**Option A — GitHub Actions workflow exists:**

```bash
gh workflow run release.yml -f version="1.2.3"
gh run watch
```

**Option B — Manual release:**

```bash
git tag -a v1.2.3 -m "v1.2.3"
git push origin main && git push origin v1.2.3
gh release create v1.2.3 --title "v1.2.3" --notes-file release-notes.md
```

> Check project-specific release guide for custom release steps.

**Details**: [gh-release-commands.md](gh-release-commands.md)

## Phase 5: Release Notes

Write clear, structured release notes:

- **Highlights** — 3-5 emoji-prefixed key changes
- **What's Changed** — Added / Changed / Fixed / Removed
- **Breaking Changes** — if applicable, with migration guide

> Check project-specific release guide for release notes format.

**Details**: [release-notes-guide.md](release-notes-guide.md)

## Quick Reference

```bash
gh release list --limit 5           # Recent releases
gh release view                     # Latest release
gh api repos/:owner/:repo/compare/v1.0.0...HEAD  # Changes since tag
```
