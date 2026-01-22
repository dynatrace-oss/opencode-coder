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

**IMPORTANT**: Execute these checks sequentially. If any check fails, stop and report the error to the user.

### Check 1: GitHub CLI Authentication

Run the following command to check if gh CLI is authenticated:

```bash
gh auth status 2>&1
```

**Success Criteria**: The command exits with status 0 and outputs authentication info.

**If the command fails** (non-zero exit code or error output):

Show this error message to the user:
```
❌ Error: GitHub CLI is not authenticated.

The gh CLI is either not installed or you're not logged in.

Please run:
  gh auth login

Then retry this command.
```

**Stop execution** - do not proceed to the next check.

### Check 2: Beads CLI Availability

Run the following command to check if bd CLI is available:

```bash
bd stats 2>&1
```

**Success Criteria**: The command executes successfully and returns project statistics.

**If the command fails** (command not found, no .beads directory, or other errors):

Show this error message to the user:
```
❌ Error: Beads CLI (bd) is not available.

This could mean:
- Beads is not installed
- You're not in a beads-enabled project directory
- The beads daemon is not running

Please ensure beads is set up:
  bd doctor

If you're not in a beads project, run:
  bd init

Then retry this command.
```

**Stop execution** - do not proceed to Step 2.

### Check 3: Success Message

If both checks pass, show a success message:
```
✅ Environment verified
- GitHub CLI: authenticated
- Beads CLI: available
```

## Step 2: Get Current Repository

Once the environment is verified, detect the GitHub repository.

### Detect Repository

Run the following command to get the repository from the git remote:

```bash
gh repo view --json nameWithOwner -q '.nameWithOwner' 2>&1
```

**Success Criteria**: The command outputs a repository name in the format `owner/repo` (e.g., `hk9890/opencode-coder`).

**Store the repository name** as `REPO` for use in subsequent steps.

### If Repository Detection Fails

If the command fails or returns empty output:

Show this error message to the user:
```
❌ Error: Could not determine GitHub repository.

This directory doesn't appear to have a GitHub remote configured,
or the remote doesn't point to a GitHub repository.

Please ensure you're in a repository with a GitHub remote:
  git remote -v

If the remote is not set up:
  git remote add origin https://github.com/owner/repo.git

Then retry this command.
```

**Stop execution** - do not proceed to Step 3.

### Success Message

If repository detection succeeds, show:
```
✅ Repository detected: <REPO>
```

### Summary After Steps 1-2

Once both steps complete successfully, show a summary:
```
## Environment Ready

- ✅ GitHub CLI authenticated
- ✅ Beads CLI available
- ✅ Repository: <REPO>

Ready to sync issues.
```

At this point, Steps 1-2 are complete. The environment is verified and the repository is known. Proceed to Step 3 (Import GitHub Issues).

## Step 3: Import GitHub Issues

**IMPORTANT**: This step assumes Steps 1-2 completed successfully and `REPO` variable contains the repository name.

Import open GitHub issues from the repository into beads tracking system.

### Fetch Open Issues

Run the following command to fetch all open GitHub issues:

```bash
gh issue list --repo $REPO --state open --json number,title,body,labels,createdAt --limit 100
```

**Success Criteria**: Command returns JSON array of issues.

**If the command fails**:
- Check for rate limiting errors
- Verify repository has issues enabled
- Ensure `$REPO` is set correctly

**Store the output** as a JSON array for processing.

### Process Each GitHub Issue

For each issue in the fetched list, perform the following steps:

#### Step 3.1: Check for Existing Bead

Before creating a new bead, check if this GitHub issue is already imported.

**Method 1: Check by label**
```bash
bd list --json | jq '.[] | select(.labels[]? == "github:<number>")'
```

**Method 2: Check by title pattern**
```bash
bd list --json | jq '.[] | select(.title | contains("github:#<number>"))'
```

**Decision**:
- If found → Skip this issue (already imported)
- If not found → Proceed to create new bead

#### Step 3.2: Determine Priority

Map GitHub labels to beads priority using this table:

| GitHub Label | Beads Priority | Priority Value |
|--------------|----------------|----------------|
| `critical`, `P0` | P0 | 0 |
| `high`, `P1` | P1 | 1 |
| `medium`, `P2` | P2 | 2 |
| (no label) | P2 (default) | 2 |
| `low`, `P3` | P3 | 3 |
| `backlog`, `P4` | P4 | 4 |

**Algorithm**:
1. Check issue labels for priority keywords (case-insensitive)
2. Use the highest priority found
3. Default to P2 if no priority label found

#### Step 3.3: Create Bead Issue

For issues that don't exist in beads, create a new bead:

```bash
cat << 'ISSUEEOF' | bd create \
  --title="<GitHub issue title> (github:#<number>)" \
  --type=bug \
  --priority=<determined-priority> \
  --add-label="source:external" \
  --add-label="github:<number>" \
  --body-file -
## Original GitHub Issue

**GitHub**: <repo>#<number>
**Created**: <created date>
**URL**: https://github.com/<repo>/issues/<number>

## Description

<body from GitHub issue>

---
*Imported from GitHub via /github/sync-issues*
ISSUEEOF
```

**Important Notes**:
- Use `--add-label` for each label (two separate flags)
- Title format: Original title + ` (github:#<number>)`
- Type is always `bug` for imported issues
- Body should include GitHub metadata and original description

**Capture the created bead ID** from the output for the import report.

#### Step 3.4: Track Statistics

Keep counters for:
- `imported_count` - Number of new beads created
- `skipped_count` - Number of issues already in beads
- `imported_issues[]` - Array of {github_number, bead_id, title}

### Handle Errors

**If `gh issue list` fails**:
```
❌ Error: Failed to fetch GitHub issues.

<error message from gh>

Possible causes:
- API rate limiting (wait and retry)
- Repository doesn't exist
- Issues are disabled on this repository
- Network connectivity issues

Please resolve the issue and retry.
```

**If `bd create` fails**:
```
⚠️ Warning: Failed to create bead for GitHub issue #<number>

Error: <error message>

Continuing with remaining issues...
```

Log the error but continue processing other issues.

### Report Import Results

After processing all issues, show a summary report:

```
## Import Results

Imported <imported_count> new issue(s) from GitHub:

| GitHub # | Beads ID | Title |
|----------|----------|-------|
| #123 | oc-abc123 | Fix login timeout (github:#123) |
| #124 | oc-def456 | Add dark mode (github:#124) |

Skipped <skipped_count> issue(s) already in beads.

---
Total: <total_issues> GitHub issues processed
```

**If no new issues imported**:
```
## Import Results

No new issues to import. All <total_issues> open GitHub issues are already tracked in beads.
```

**If no issues found**:
```
## Import Results

No open issues found in GitHub repository <REPO>.
```

### Step 3 Complete

After the import report, Step 3 is complete. The command should proceed to Step 4 (Sync Closures).

## Step 4: Sync Closures (Beads → GitHub)

**IMPORTANT**: This step syncs closed beads back to GitHub by closing corresponding GitHub issues.

Find beads issues that were imported from GitHub and are now closed, then close the corresponding GitHub issues.

### Find Closed Beads with GitHub Links

Run the following command to find all closed beads that came from GitHub:

```bash
bd list --status=closed --json
```

**Filter the results** to find issues with:
- Label `source:external` present
- Label matching pattern `github:<number>` present

**Store these** as candidates for GitHub closure sync.

### Process Each Closed Bead

For each closed bead found, perform the following steps:

#### Step 4.1: Extract GitHub Issue Number

From the bead labels, find the label matching `github:<number>` pattern.

**Example**: Label `github:123` → GitHub issue number is `123`

**If no github label found**: Skip this issue (malformed, shouldn't happen).

#### Step 4.2: Check GitHub Issue State

Before attempting to close, check if the GitHub issue is still open:

```bash
gh issue view <number> --repo $REPO --json state -q '.state' 2>&1
```

**Possible states**:
- `OPEN` → Proceed to close it
- `CLOSED` → Already closed, skip (report as "already synced")
- Error → Issue doesn't exist or API error

**If issue is already CLOSED**: Skip to next issue (count as already synced).

**If command fails**: 
```
⚠️ Warning: Could not check state of GitHub issue #<number>

Error: <error message>

Skipping this issue...
```

#### Step 4.3: Get Close Reason from Bead

Extract the close reason from the bead to use in the GitHub close comment:

```bash
bd show <bead-id> --json
```

**Extract close reason**:
1. Check for `close_reason` field
2. If not present, check last comment body
3. If no comments, use default: "Resolved"

**Store as `CLOSE_REASON`** for the GitHub close comment.

#### Step 4.4: Close GitHub Issue

Close the GitHub issue with a comment explaining the sync:

```bash
gh issue close <number> --repo $REPO --comment "Closed via beads sync.

**Reason**: <CLOSE_REASON>

**Beads Issue**: <bead-id>

---
*Synced from beads via /github/sync-issues*"
```

**Success Criteria**: Command exits successfully.

**If the command fails**:
```
⚠️ Warning: Failed to close GitHub issue #<number>

Error: <error message>

Continuing with remaining issues...
```

Log the error and continue with other issues.

#### Step 4.5: Track Statistics

Keep counters for:
- `closed_count` - Number of GitHub issues closed
- `already_closed_count` - Number already synced
- `error_count` - Number of errors encountered
- `closed_issues[]` - Array of {github_number, bead_id, reason}

### Report Closure Results

After processing all closed beads, show a summary report:

```
## Closure Sync Results

Closed <closed_count> GitHub issue(s):

| GitHub # | Beads ID | Reason |
|----------|----------|--------|
| #123 | oc-abc123 | Implemented fix in PR #456 |
| #125 | oc-xyz789 | Duplicate of #124 |

Already synced: <already_closed_count> issue(s)
Errors: <error_count> issue(s)

---
Total: <total_candidates> closed beads processed
```

**If no issues closed**:
```
## Closure Sync Results

No GitHub issues needed closing. All closed beads are already synced.

Already synced: <already_closed_count> issue(s)
```

**If no closed beads with GitHub links found**:
```
## Closure Sync Results

No closed beads with GitHub links found. Nothing to sync.
```

### Handle Errors

**If `bd list` fails**:
```
❌ Error: Failed to fetch closed beads.

Error: <error message>

Cannot proceed with closure sync.
```

**If rate limiting occurs**:
```
⚠️ Warning: GitHub API rate limit reached.

Partially synced: <closed_count> issues closed
Remaining: <pending_count> issues pending

Please wait for rate limit reset and re-run the command to complete sync.
```

### Step 4 Complete

After the closure sync report, Step 4 is complete. The command should proceed to Step 5 (Work Discovery).

## Step 5: Discover Work

**IMPORTANT**: This step helps users find and select bugs to work on from the imported GitHub issues.

Find bugs that are open in both GitHub and beads, and prompt the user to work on them.

### Find Open External Bugs

Run the following command to find all open bugs imported from GitHub:

```bash
bd list --status=open --json
```

**Filter the results** to find issues with:
- Label `source:external` present
- Type is `bug`
- Status is `open`

**Store these** as the candidate list for work discovery.

### Categorize by Blocked Status

For each bug found, determine if it's ready to work or blocked.

**Method 1: Use bd ready**
```bash
bd ready --json
```

Cross-reference the bug IDs with the ready list:
- If bug ID appears in ready list → Add to "Ready to Work"
- If bug ID does NOT appear → It's blocked

**Method 2: Check dependencies**

For each bug not in the ready list, find what it's blocked by:
```bash
bd show <bead-id> --json
```

Look at the `depends_on` field to identify blockers.

### Extract GitHub Issue Numbers

For each bug, extract the GitHub issue number from:
1. Label matching pattern `github:<number>`
2. Or title pattern `(github:#<number>)`

**Store the mapping**: bead_id → github_issue_number

### Build Work Discovery Report

Present the bugs to the user in a structured report:

```
## Work Discovery

Found <total_bugs> bug(s) open in both GitHub and beads:

### Ready to Work (no blockers)

| Priority | Beads ID | Title | GitHub |
|----------|----------|-------|--------|
| P1 | oc-abc123 | Fix auth timeout | #123 |
| P2 | oc-def456 | Memory leak in worker | #127 |
| P2 | oc-ghi789 | Handle edge case in parser | #130 |

### Blocked

| Beads ID | Title | GitHub | Blocked By |
|----------|-------|--------|------------|
| oc-jkl012 | API rate limiting | #125 | oc-abc123 |
| oc-mno345 | Fix timeout handling | #128 | oc-jkl012 |

---

Would you like to work on any of these bugs?
- Say "work on oc-abc123" to claim and start working
- Say "show #123" to see full GitHub issue details
- Say "skip" to finish sync
```

**If no bugs found**:
```
## Work Discovery

No open bugs from GitHub found in beads.

All imported issues are either:
- Already closed
- Not bugs (features, tasks, etc.)
- Not yet imported

Sync complete!
```

**If all bugs are blocked**:
```
## Work Discovery

Found <total_bugs> bug(s), but all are blocked:

### Blocked

[table of blocked bugs]

---

No bugs are ready to work at this time. 
Focus on unblocking tasks first, or run `/bd-ready` to see other work.
```

### Handle User Response

Based on the user's response, take appropriate action:

#### Response: "work on <bead-id>"

Proceed to Step 6 with the selected bead ID.

#### Response: "show #<number>"

Show full GitHub issue details:

```bash
gh issue view <number> --repo $REPO
```

Display the output to the user, then re-prompt with the work discovery options.

#### Response: "skip" or "done"

End the sync command with a summary:

```
## Sync Complete

Summary:
- Environment verified ✓
- Imported: <imported_count> new issues
- Closed: <closed_count> GitHub issues  
- Available: <ready_bugs> bugs ready to work

Run `/github/sync-issues` again anytime to sync updates.
```

### Step 5 Complete

After showing the work discovery report and handling the initial response, either:
- Proceed to Step 6 if user selected a bug
- End the command if user chose to skip

## Step 6: Work on Selected Bug (Optional)

**IMPORTANT**: This step is only executed if the user selected a specific bug to work on in Step 5.

Guide the user through working on the selected bug with full context from both systems.

### Claim the Issue

Update the bead status to claim it:

```bash
bd update <bead-id> --status=in_progress
```

**Success Criteria**: Command confirms the status update.

**If the command fails**:
```
❌ Error: Failed to claim issue <bead-id>

Error: <error message>

The issue may have been claimed by someone else or deleted.
```

Stop Step 6 and return to Step 5 work discovery.

### Gather Full Context

Collect complete information from both systems:

#### From Beads

```bash
bd show <bead-id>
```

Extract:
- Full title
- Description/body
- Priority
- Labels
- Dependencies
- Comments

#### From GitHub

```bash
gh issue view <github-number> --repo $REPO
```

Extract:
- Original issue body
- Comments from GitHub users
- Labels
- Timestamps

### Present Working Context

Show the user a comprehensive view:

```
## Working on: <title>

**Beads**: <bead-id> (P<priority>)
**GitHub**: <repo>#<number>
**Status**: In Progress (claimed)

### GitHub Issue Details

**Created**: <creation date>
**URL**: https://github.com/<repo>/issues/<number>

<full GitHub issue body>

### GitHub Comments

<recent comments from GitHub, if any>

### Beads Context

<body from beads issue>

### Dependencies

<if there are dependencies, list them>

### Next Steps

1. **Implement the fix**
   - Review the issue description and comments
   - Make necessary code changes
   - Test thoroughly

2. **Close the bead when done**
   ```
   bd close <bead-id> --reason="<describe what you did>"
   ```

3. **GitHub sync**
   The GitHub issue will be automatically closed on the next sync run
   Or run: `/github/sync-issues` to sync immediately

---

Ready to help you implement this fix! Let me know how I can assist.
```

### Interactive Assistance

After presenting the context, offer to help:

- Answer questions about the issue
- Help implement the fix
- Review code changes
- Guide testing approach
- Assist with closing and documenting

### Handle Edge Cases

**If issue is already claimed by another user**:
```
⚠️ Notice: This issue is already in progress

Current assignee: <other-user>

You've claimed it, but someone else may be working on it.
Consider coordinating or choosing a different bug.
```

**If issue has been closed since discovery**:
```
ℹ️ Info: This issue was closed recently

The issue may have been resolved by someone else.
Run `/github/sync-issues` to refresh and see current open bugs.
```

**If GitHub issue is closed but bead is open**:
```
⚠️ Warning: GitHub issue #<number> is closed, but bead is still open

The issues are out of sync. Consider:
- Closing the bead if work is complete
- Reopening GitHub issue if work is ongoing
- Running full sync to reconcile state
```

### Step 6 Complete

After presenting the working context and offering assistance, Step 6 is complete.

The user is now ready to work on the bug with full context from both systems.

### End of Command

At this point, all steps (1-6) are complete:

```
---

## Sync Complete

The GitHub-beads sync is complete. You're now working on:
- <bead-id>: <title>

Summary:
- ✅ Environment verified
- ✅ GitHub issues imported
- ✅ Closed issues synced
- ✅ Bug selected and claimed

Next: Implement the fix and close the bead when done!
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
