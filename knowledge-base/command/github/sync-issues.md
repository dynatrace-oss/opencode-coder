---
description: Sync GitHub issues with beads - import, close, and discover work
---

# Sync GitHub Issues

Synchronize GitHub issues with the beads tracking system. This command imports open GitHub issues, syncs closures, and helps discover work to tackle.

## Overview

This command performs bidirectional synchronization between GitHub issues and beads:

1. **Import** - Bring open GitHub issues into beads (with `source:external` label)
2. **Sync Closures** - Close GitHub issues when corresponding beads are closed
3. **Discover Work** - Find bugs that are open in both systems and prompt to work on them

## Prerequisites

- `gh` CLI installed and authenticated (`gh auth status`)
- Repository has GitHub issues enabled
- `bd` CLI available for beads operations

## Step 1: Verify Environment

Before starting sync, verify the environment is ready:

```bash
# Check gh CLI authentication
gh auth status

# Check beads availability
bd stats
```

### If Authentication Fails

```
GitHub CLI is not authenticated.
Please run: gh auth login
```

## Step 2: Get Current Repository

Determine the GitHub repository from git remote:

```bash
# Get repo from git remote (format: owner/repo)
gh repo view --json nameWithOwner -q '.nameWithOwner'
```

Store this as `REPO` for subsequent commands.

## Step 3: Import GitHub Issues

Fetch all open GitHub issues and import them as beads issues.

### Fetch Open Issues

```bash
gh issue list --repo $REPO --state open --json number,title,body,labels,createdAt --limit 100
```

### For Each GitHub Issue

Check if it already exists in beads (by checking for `github:#<number>` in title or label):

```bash
bd list --json | jq '.[] | select(.title | contains("github:#<number>") or .labels[]? == "github:<number>")'
```

### If Issue Does NOT Exist in Beads

Create it with the `source:external` label:

```bash
cat << 'EOF' | bd create --title="<GitHub issue title> (github:#<number>)" \
  --type=bug \
  --priority=2 \
  --label="source:external" \
  --label="github:<number>" \
  --body-file -
## Original GitHub Issue

**GitHub**: <repo>#<number>
**Created**: <created date>

## Description

<body from GitHub issue>

---
*Imported from GitHub via /github/sync-issues*
EOF
```

### Priority Mapping

Map GitHub labels to beads priorities:

| GitHub Label | Beads Priority |
|--------------|----------------|
| `critical`, `P0` | P0 |
| `high`, `P1` | P1 |
| `medium`, `P2` (default) | P2 |
| `low`, `P3` | P3 |
| `backlog`, `P4` | P4 |

### Report Import Results

```
## Import Results

Imported X new issue(s) from GitHub:

| GitHub # | Beads ID | Title |
|----------|----------|-------|
| #123 | beads-abc | Fix login timeout (github:#123) |
| #124 | beads-def | Add dark mode (github:#124) |

Skipped Y issue(s) already in beads.
```

## Step 4: Sync Closures (Beads -> GitHub)

Find beads issues that were imported from GitHub and are now closed, then close the corresponding GitHub issues.

### Find Closed Beads with GitHub Links

```bash
bd list --status=closed --label="source:external" --json
```

Filter for issues with `github:<number>` labels.

### For Each Closed Bead with GitHub Link

1. Extract GitHub issue number from label or title
2. Check if GitHub issue is still open:

```bash
gh issue view <number> --repo $REPO --json state -q '.state'
```

3. If GitHub issue is still OPEN, close it with the beads close reason:

```bash
# Get the close reason from beads (from comments or close event)
CLOSE_REASON=$(bd show <bead-id> --json | jq -r '.comments[-1].body // "Resolved"')

gh issue close <number> --repo $REPO --comment "Closed via beads sync.

**Reason**: $CLOSE_REASON

---
*Synced from beads issue <bead-id> via /github/sync-issues*"
```

### Report Closure Results

```
## Closure Sync Results

Closed X GitHub issue(s):

| GitHub # | Beads ID | Reason |
|----------|----------|--------|
| #123 | beads-abc | Implemented fix in PR #456 |
| #125 | beads-xyz | Duplicate of #124 |

No GitHub issues needed closing.
```

## Step 5: Discover Work

Find bugs that are open in both GitHub and beads, and prompt the user to work on them.

### Find Open External Bugs

```bash
bd list --status=open --label="source:external" --type=bug --json
```

### Build Work Discovery Report

```
## Work Discovery

Found X bug(s) open in both GitHub and beads:

### Ready to Work (no blockers)

| Priority | Beads ID | Title | GitHub |
|----------|----------|-------|--------|
| P1 | beads-abc | Fix auth timeout | #123 |
| P2 | beads-def | Memory leak in worker | #127 |

### Blocked

| Beads ID | Title | Blocked By |
|----------|-------|------------|
| beads-ghi | API rate limiting | beads-jkl |

---

Would you like to work on any of these bugs?
- Say "work on beads-abc" to claim and start working
- Say "show #123" to see full GitHub issue details
- Say "skip" to finish sync
```

## Step 6: Work on Selected Bug (Optional)

If user selects a bug to work on:

1. Claim the issue:
```bash
bd update <bead-id> --status in_progress
```

2. Show full context:
```bash
bd show <bead-id>
gh issue view <github-number> --repo $REPO
```

3. Guide the user:
```
## Working on: <title>

**Beads**: <bead-id>
**GitHub**: <repo>#<number>

### GitHub Issue Details
<full GitHub issue body>

### Next Steps
1. Implement the fix
2. Test your changes
3. Close the bead: `bd close <bead-id> --reason="<what you did>"`
4. The GitHub issue will be closed on next sync

Ready to help you implement this fix!
```

## Error Handling

### gh CLI Not Authenticated

```
Error: GitHub CLI not authenticated.

Please run:
  gh auth login

Then retry this command.
```

### No GitHub Remote Found

```
Error: Could not determine GitHub repository.

This directory doesn't appear to have a GitHub remote configured.
Please run this command from a repository with a GitHub remote.
```

### bd CLI Not Available

```
Error: beads CLI (bd) not found.

Please ensure beads is installed and configured.
Run: bd doctor
```

### Rate Limiting

If GitHub API rate limit is hit:

```
Warning: GitHub API rate limit reached.

Partial results:
- Imported: X issues
- Pending: Y issues

Please wait and retry, or authenticate with `gh auth login` for higher limits.
```

## Summary Flowchart

```
1. Verify environment (gh, bd)
         |
         v
2. Get repository info
         |
         v
3. Import GitHub issues
   - Fetch open issues
   - Create beads for new ones
   - Label with source:external
         |
         v
4. Sync closures
   - Find closed beads with GitHub links
   - Close corresponding GitHub issues
   - Use beads close reason as comment
         |
         v
5. Discover work
   - Find bugs open in both systems
   - Show ready vs blocked
   - Prompt to work on one
         |
         v
6. (Optional) Work on selected bug
   - Claim issue
   - Show full context
   - Guide implementation
```

## Example Session

```
> /github/sync-issues

## Sync GitHub Issues

Checking environment...
- GitHub CLI: authenticated as @username
- Repository: hk9890/opencode-coder
- Beads: 12 open, 45 closed

## Import Results

Imported 2 new issue(s) from GitHub:

| GitHub # | Beads ID | Title |
|----------|----------|-------|
| #89 | beads-abc | Fix OAuth refresh (github:#89) |
| #91 | beads-def | Add retry logic (github:#91) |

Skipped 3 issue(s) already in beads.

## Closure Sync Results

Closed 1 GitHub issue(s):

| GitHub # | Beads ID | Reason |
|----------|----------|--------|
| #85 | beads-xyz | Fixed in PR #87 |

## Work Discovery

Found 3 bug(s) open in both GitHub and beads:

### Ready to Work (no blockers)

| Priority | Beads ID | Title | GitHub |
|----------|----------|-------|--------|
| P1 | beads-abc | Fix OAuth refresh | #89 |
| P2 | beads-ghi | Timeout on large files | #78 |

### Blocked

| Beads ID | Title | Blocked By |
|----------|-------|------------|
| beads-def | Add retry logic | beads-jkl |

---

Would you like to work on any of these bugs?

> work on beads-abc

## Working on: Fix OAuth refresh (github:#89)

Claiming issue...
[details shown]

Ready to help you implement this fix!
```

## Target Repository

Default repository is determined from git remote. Can be overridden if needed.

## Notes

- Issues are tracked bidirectionally via the `github:<number>` label
- The `source:external` label identifies issues imported from GitHub
- Closure sync uses beads comments/close reason for the GitHub close comment
- Only bugs are shown in work discovery (not features or tasks)
