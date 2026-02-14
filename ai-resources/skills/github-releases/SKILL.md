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

## Workflows

This skill supports two main workflows:

### 1. Perform a Release

When the user wants to create a release, read the **release workflow** document:

**[release-workflow.md](references/release-workflow.md)** — Complete release process from quality gates to GitHub release creation.

**Before starting**, load project-specific release instructions:
1. Check `docs/RELEASING.md`
2. Check `AGENTS.md` for a release section
3. Check `README.md` and `CONTRIBUTING.md` for release info

If no project-specific guide exists, ask the user about build, test, and publish steps.

### 2. Setup or Modify Release Workflow

When the user wants to create or improve their release process, read the **setup guide**:

**[setup-modify-release-workflow.md](references/setup-modify-release-workflow.md)** — Guide for creating or updating a project's RELEASING.md file with project-specific instructions.

## References

- **[release-workflow.md](references/release-workflow.md)** — Step-by-step release execution process
- **[setup-modify-release-workflow.md](references/setup-modify-release-workflow.md)** — Creating/updating release documentation
- **[quality-gates.md](references/quality-gates.md)** — Pre-release validation
- **[documentation-checklist.md](references/documentation-checklist.md)** — Doc validation
- **[version-management.md](references/version-management.md)** — Semver and bumping
- **[release-notes-guide.md](references/release-notes-guide.md)** — Writing release notes
- **[gh-release-commands.md](references/gh-release-commands.md)** — gh CLI reference
- **[troubleshooting.md](references/troubleshooting.md)** — Common issues and fixes
