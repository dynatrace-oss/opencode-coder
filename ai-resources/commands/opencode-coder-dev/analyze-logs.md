---
description: Analyze OpenCode logs for errors and create beads bugs
---

# Analyze Logs

This command analyzes OpenCode logs for errors and warnings, checks for duplicate beads issues, and creates new bugs for untracked errors.

## Overview

The analyze-logs command performs these steps:
1. Discover available log sessions
2. Let user select a session to analyze
3. Extract errors and warnings from logs
4. Check for existing beads issues (duplicate detection)
5. Show analysis report and ask for user confirmation
6. Create bugs for new errors

## Step 1: Discover Sessions

List available log sessions using the log analyzer:

```bash
bun run scripts/log-analyzer list sessions
```

This outputs session information including:
- Session ID (ses_xxx)
- Process ID
- Start/end timestamps
- Log line counts
- Services used

Show the user the list of sessions and ask which one to analyze:
- Default to the most recent session
- Allow user to specify by session ID
- Option to analyze multiple sessions

## Step 2: Extract Errors and Warnings

For the selected session, extract errors and warnings:

```bash
bun run scripts/log-analyzer --session=<session_id> --level=WARN,ERROR --json
```

Parse the JSON output to get structured log entries. Each entry contains:
- `level`: ERROR, WARN, INFO, etc.
- `timestamp`: When the log occurred
- `service`: Which service/component logged it
- `message`: The log message
- `fields`: Additional structured data

### Processing the Output

1. **Group by error message** - Deduplicate repeated errors
2. **Count occurrences** - Track how many times each error appeared
3. **Note first/last occurrence** - Track timestamps
4. **Categorize by service**:
   - Plugin errors: `service=opencode-coder`
   - Beads errors: `service` contains 'beads'
   - Agent errors: `service` contains 'agent'
   - Other service errors

### If No Errors Found

If no errors or warnings are found:
```
## Log Analysis Report

**Session**: ses_xxx
No errors or warnings found in this session.

The session logs appear clean. If you expected issues,
try analyzing a different session or check the log level filter.
```

## Step 3: Check for Duplicate Issues

For each unique error found, search for existing beads issues:

```bash
bd search "<error message or key phrase>"
```

### Match Criteria

Consider an issue a duplicate if:
- Title contains the error message or key identifiers
- Description mentions the same service/component
- Error pattern matches (not just exact string match)

### Classification

- **Exact match**: Issue already exists for this exact error
- **Similar match**: Related issue exists, may need update
- **No match**: New error, needs new bug created

### Decision Rules

| Existing Issue | Status | Action |
|----------------|--------|--------|
| Exact match | Open | Skip creation, note as duplicate |
| Exact match | Closed | Consider reopening or create new |
| Similar match | Open | Add comment with new occurrence |
| Similar match | Closed | Create new bug (different issue) |
| No match | N/A | Create new bug |

### Key Commands

- `bd search "<query>"` - Search issues by text
- `bd show <id>` - Get full issue details to check match
- `bd list --status=open` - List open issues only

## Step 4: Generate Analysis Report

**Important**: Show the report and ask for user confirmation BEFORE creating any bugs.

### Report Format

```
## Log Analysis Report

**Session**: ses_xxx
**Time Range**: 2026-01-05 08:00 - 09:30
**Total Errors**: 5
**Total Warnings**: 12

### Errors Found (grouped by type)

#### 1. [opencode-coder] Plugin initialization failed
- Occurrences: 3
- First seen: 08:15:23
- Existing issue: None found
- Action: CREATE NEW BUG (P2)

#### 2. [beads] Sync failed with timeout
- Occurrences: 1
- First seen: 08:42:11
- Existing issue: oc-abc (open) - similar error
- Action: ADD COMMENT to oc-abc

#### 3. [WARNING] Deprecated API usage
- Occurrences: 8
- First seen: 08:05:00
- Existing issue: oc-xyz (closed)
- Action: SKIP (already addressed)

---

**Proposed Actions**:
- Create 1 new bug
- Add comments to 1 existing issue
- Skip 1 error (already tracked)

Would you like me to proceed with these actions?
You can:
- Say "yes" to proceed with all actions
- Say "yes to #1 only" to selectively create
- Modify the plan before proceeding
- Say "no" to skip all actions
```

## Step 5: User Confirmation

**Do NOT create any bugs until the user confirms.**

Wait for the user to:
- Approve all actions: "yes" or "proceed"
- Approve specific items: "yes to #1 and #2"
- Modify the plan: Allow editing titles, priorities, etc.
- Decline: "no" or "skip"

## Step 6: Create Bugs

For each new error (no existing issue found), create a bug using heredoc:

```bash
cat << 'BUGEOF' | bd create --title="[<service>] <error summary>" --type=bug --priority=2 --body-file -
## Description
Error detected in OpenCode logs during session analysis.

## Error Details
- **Service**: <service name>
- **Level**: ERROR/WARN
- **Message**: <error message>
- **First seen**: <timestamp>
- **Occurrences**: <count>

## Context
- Session: <session_id>
- Process ID: <pid>
- Additional fields: <any relevant fields>

## Log Excerpt
```
<relevant log lines>
```

## Notes
This bug was automatically created by /internal/analyze-logs from log analysis.
BUGEOF
```

### Title Format

- Include service/component in brackets: `[opencode-coder] <error summary>`
- Keep concise but descriptive
- Examples:
  - `[opencode-coder] Plugin fails to load when beads disabled`
  - `[beads] Sync timeout after network disconnect`
  - `[agent] Task agent fails to parse JSON response`

### Priority Assignment

| Priority | Criteria |
|----------|----------|
| P1 | Crashes, data loss, blocking errors |
| P2 | Feature failures, significant warnings (default) |
| P3 | Minor warnings, edge cases |

### Update Existing Issues

If new info is found for an existing open issue:

```bash
bd comment <issue-id> "Additional occurrence found in session <session_id> at <timestamp>"
```

## Step 7: Summary Report

After all actions are complete, show a summary:

```
## Actions Taken

### Bugs Created
- oc-new1: [opencode-coder] Plugin initialization failed
- oc-new2: [beads] Database connection timeout

### Issues Updated
- oc-abc: Added comment with new occurrence from ses_xxx

### Skipped
- 1 error (existing issue closed - oc-xyz)
- 8 warnings (low priority, INFO level)

---
Total: 2 bugs created, 1 issue updated, 9 items skipped
```

## Error Handling

### Log Analyzer Not Found

If the log analyzer fails to run:
```
Error: Could not run log analyzer.
Make sure you're in the opencode-coder project root and run:
  bun install
  bun run scripts/log-analyzer list sessions
```

### No Sessions Found

If no log sessions exist:
```
No log sessions found. OpenCode may not have generated logs yet.
Try running some commands first, then re-run /internal/analyze-logs.
```

### bd CLI Errors

If beads commands fail:
```
Error running bd command. Check that beads is installed:
  bd --version
  bd doctor
```

## Summary Flowchart

```
1. List sessions (log-analyzer)
        |
        v
2. User selects session
        |
        v
3. Extract errors/warnings (--json)
        |
        v
4. For each error:
   - Search existing issues (bd search)
   - Classify as: duplicate/similar/new
        |
        v
5. Generate analysis report
        |
        v
6. Ask for user confirmation
        |
    +---+---+
    |       |
    v       v
  "no"    "yes"
    |       |
    v       v
  Done   7. Create bugs / add comments
            |
            v
         8. Show summary report
```

## Quick Reference

### Log Analyzer Commands

```bash
# List all sessions
bun run scripts/log-analyzer list sessions

# Get errors/warnings as JSON
bun run scripts/log-analyzer --session=ses_xxx --level=WARN,ERROR --json

# Get just errors
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --json

# Filter by service
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --json
```

### Beads Commands

```bash
# Search for existing issues
bd search "<error message>"

# Show issue details
bd show <id>

# Create a bug
cat << 'EOF' | bd create --title="Title" --type=bug --priority=2 --body-file -
Body content here
EOF

# Add comment to existing issue
bd comment <id> "Comment text"

# List open issues
bd list --status=open
```
