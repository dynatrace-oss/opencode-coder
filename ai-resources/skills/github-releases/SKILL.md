---
name: github-releases
description: "GitHub release workflow for any project. Use when: (1) User wants to create a GitHub release, (2) User asks about release process or versioning, (3) User mentions 'release', 'publish', 'ship', or 'version bump'. Handles quality gates, documentation validation, version management, and GitHub release creation."
---

# GitHub Releases

Language-agnostic release workflow for GitHub projects.

## Workflow

```bash
# 1. Check prerequisites
bash scripts/check-release-prereqs.sh

# 2. Create task structure
bash scripts/create-release-tasks.sh <version>

# 3. Fill TODOs in all tasks (read docs/RELEASING.md)

# Validate TODOs filled
bash scripts/validate-release-tasks.sh <epic-id>

# 4. Spawn reviewer to review

# 5. Spawn tasker for each ready task

# 6. Spawn verifier to verify
```

## Filling TODOs

**YOU MUST fill TODOs in all tasks.**

Read `docs/RELEASING.md` and replace TODO markers with actual project commands.

**Only skip if:**
- No project docs exist
- Generic guidance is truly sufficient

**Not OK:** Leaving TODOs when `docs/RELEASING.md` exists.

## References

- [release-workflow.md](references/release-workflow.md) — Detailed process
- [quality-gates.md](references/quality-gates.md) — Pre-release validation
- [documentation-checklist.md](references/documentation-checklist.md) — Doc checks
- [version-management.md](references/version-management.md) — Semver guide
- [release-notes-guide.md](references/release-notes-guide.md) — Writing notes
- [troubleshooting.md](references/troubleshooting.md) — Common issues
- [setup-modify-release-workflow.md](references/setup-modify-release-workflow.md) — Setup and customize release workflow
