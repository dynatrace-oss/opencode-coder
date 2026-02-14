---
name: github-releases
description: "GitHub release workflow for any project. Language-agnostic release process with quality gates, documentation validation, version management, and GitHub release execution. Use when: (1) User wants to create a GitHub release, (2) User asks about release process or versioning, (3) User mentions 'release', 'publish', 'ship', or 'version bump'. Supports both manual releases and GitHub Actions workflows."
---

# GitHub Releases

Language-agnostic release workflow for GitHub projects.

## Prerequisites

Verify environment before any release:

```bash
bash scripts/check-release-prereqs.sh
```

If prerequisites fail, see [troubleshooting.md](references/troubleshooting.md).

## Project-Specific Configuration

Before starting, load project-specific release instructions:

1. Check `AGENTS.md` for a release section
2. Check `docs/RELEASING.md`
3. Check `README.md` and `CONTRIBUTING.md` for release info

If no project-specific guide exists, ask the user about build, test, and publish steps.

Project-specific instructions override the generic phases below. Each phase supports project-specific overrides — check loaded release guide before applying generic steps.

## Release Workflow

### Phase 1: Quality Gates

All quality gates MUST pass before proceeding.

1. **Clean working tree** — no uncommitted or untracked changes
2. **All tests pass** — run the full test suite (unit, integration, E2E)
3. **Build succeeds** — build the project
4. **CI green** — latest commit passes all checks

If unsure how to build or test the project, ask the user.

> Check project-specific release guide for custom quality gates.

**Details**: [quality-gates.md](references/quality-gates.md)

### Phase 2: Documentation

Load a documentation skill to validate and fix documentation before release.

Key checks:
1. **Version references** — all match the release version
2. **CHANGELOG** — entry exists for new version
3. **Breaking changes** — migration guide if needed

> Check project-specific release guide for additional documentation requirements.

**Details**: [documentation-checklist.md](references/documentation-checklist.md)

### Phase 3: Version Bump

1. **Analyze changes** since last release tag
2. **Determine bump** — major (breaking), minor (features), patch (fixes)
3. **Update version files** — detect and update all relevant files
4. **Commit** — `release: vX.Y.Z`

> Check project-specific release guide for custom version file locations.

**Details**: [version-management.md](references/version-management.md)

### Phase 4: Create Release

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

**Details**: [gh-release-commands.md](references/gh-release-commands.md)

### Phase 5: Release Notes

Write clear, structured release notes:

- **Highlights** — 3-5 emoji-prefixed key changes
- **What's Changed** — Added / Changed / Fixed / Removed
- **Breaking Changes** — if applicable, with migration guide

> Check project-specific release guide for release notes format.

**Details**: [release-notes-guide.md](references/release-notes-guide.md)

## Quick Reference

```bash
gh release list --limit 5           # Recent releases
gh release view                     # Latest release
gh api repos/:owner/:repo/compare/v1.0.0...HEAD  # Changes since tag
```

## References

- **[quality-gates.md](references/quality-gates.md)** — Pre-release validation
- **[documentation-checklist.md](references/documentation-checklist.md)** — Doc validation
- **[version-management.md](references/version-management.md)** — Semver and bumping
- **[release-notes-guide.md](references/release-notes-guide.md)** — Writing release notes
- **[gh-release-commands.md](references/gh-release-commands.md)** — gh CLI reference
- **[troubleshooting.md](references/troubleshooting.md)** — Common issues and fixes
