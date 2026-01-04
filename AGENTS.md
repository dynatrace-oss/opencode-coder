# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

## Releases

**MANDATORY: Use the GitHub Actions release workflow for all releases.**

DO NOT manually:
- Bump version in package.json
- Create git tags
- Run `npm publish`
- Create GitHub releases

### How to Release

1. Go to **Actions** > **Release** > **Run workflow**
2. Enter:
   - **version**: Semver format (e.g., `0.8.0`)
   - **release_notes**: Markdown release notes
3. Click **Run workflow**

The workflow will:
1. Run full build and all tests
2. Update `package.json` version
3. Commit and create annotated git tag
4. Publish to GitHub Packages npm registry
5. Create GitHub Release with notes

### Version Guidelines

- **Patch** (0.0.X): Bug fixes, minor updates
- **Minor** (0.X.0): New features, new commands, backward-compatible changes
- **Major** (X.0.0): Breaking changes

