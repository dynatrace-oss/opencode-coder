---
description: Check health of opencode-coder plugin setup
---

# Coder Doctor

Your task is to perform a health check on the opencode-coder plugin setup and report any issues found.

## Overview

This command checks all components managed by the coder plugin and reports their status. It shows a high-level summary with component status and only displays issues that need attention.

## Health Checks

Perform each check and collect results:

### 1. Coder Config Check

- Check if `.coder/coder.json` exists
- If exists, verify it's valid JSON with `active` field
- Status: OK / Missing / Invalid

### 2. Beads Check

- Check if `.beads/` directory exists
- If exists, run `bd doctor` and capture output
- Check for critical issues (not recommendations)
- Status: OK / Not initialized / Issues found

### 3. Git Hooks Check

- Check if beads git hooks are installed
- Look for `.git/hooks/post-commit` or similar beads hooks
- Status: OK / Not installed

### 4. Git Status Check

- Check if there are uncommitted beads changes
- Run `bd sync --status` if beads is initialized
- Status: OK / Uncommitted changes

## Output Format

Display a summary showing component status and any issues:

```
Coder Health Check

Components:
  Coder config:  OK
  Beads:         OK
  Git hooks:     OK
  Git sync:      OK

No issues found.
```

Or if issues exist:

```
Coder Health Check

Components:
  Coder config:  OK
  Beads:         OK
  Git hooks:     MISSING
  Git sync:      WARN

Issues:
  - Git hooks not installed. Run: bd hooks install
  - Uncommitted beads changes. Run: bd sync

```

## Handling bd doctor Output

When running `bd doctor`, filter the output:

| bd doctor suggestion | Action |
|---------------------|--------|
| Install git hooks | Report as issue with fix command |
| Set upstream | Report as warning (not critical) |
| Upgrade CLI (curl script) | **Ignore** - npm users should use `npm install -g @beads/bd@latest` |

**Important**: Never show the curl/bash upgrade suggestion. If an upgrade is needed, show: "Beads update available. Run: `npm install -g @beads/bd@latest`"

## Exit Conditions

- If no issues found: Report all OK
- If issues found: List issues with fix commands
- If coder not initialized: Suggest running `/coder/init`
