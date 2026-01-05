---
description: Trigger a release using the GitHub Actions workflow
---

# Release Command

**MANDATORY: Use the GitHub Actions release workflow for all releases.**

## What NOT to Do

DO NOT manually:
- Bump version in package.json
- Create git tags
- Run `npm publish`
- Create GitHub releases

## How to Release

Trigger the release workflow using the `gh` CLI:

```bash
gh workflow run release.yml \
  -f version="0.8.0" \
  -f release_notes="## Features
- Feature description here

## Bug Fixes
- Fix description here"
```

## Monitor the Workflow

After triggering, monitor the workflow:

```bash
gh run list --workflow=release.yml --limit=1
gh run watch  # Watch the latest run
```

## What the Workflow Does

The workflow will:
1. Run full build and all tests
2. Update `package.json` version
3. Commit and create annotated git tag
4. Publish to GitHub Packages npm registry
5. Create GitHub Release with notes

## Version Guidelines

- **Patch** (0.0.X): Bug fixes, minor updates
- **Minor** (0.X.0): New features, new commands, backward-compatible changes
- **Major** (X.0.0): Breaking changes
