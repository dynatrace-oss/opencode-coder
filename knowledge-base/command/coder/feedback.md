---
description: Analyze session for issues and create GitHub tickets
---

# Coder Feedback

Your task is to analyze the current session for problems with bd commands or plugin features, show the user a report, and create GitHub issues for any problems found after user confirmation.

## Overview

This command helps users report issues they've encountered during their session. It:
1. Analyzes the session for problems
2. Shows a structured report to the user
3. Creates GitHub issues (after confirmation) for problems found

## Step 1: Session Analysis

Review the current session/conversation history and look for:

### Types of Issues to Detect

| Category | Examples |
|----------|----------|
| bd CLI errors | Command not found, invalid arguments, unexpected failures |
| Plugin errors | Knowledge-base loading failures, command execution failures |
| Agent behavior issues | Wrong actions, poor responses, misunderstanding intent |
| Documentation gaps | Unclear instructions, missing examples, confusing output |
| UX issues | Hard-to-use features, unhelpful error messages |

### What to Look For

- bd command failures or errors
- Unexpected behavior from plugin features
- User frustrations or repeated attempts at the same thing
- Exceptions or stack traces
- Commands that returned unexpected results
- Confusion about how something works

### For Each Issue, Extract

- **Component**: What command/feature was involved
- **Expected behavior**: What should have happened
- **Actual behavior**: What actually happened
- **Error messages**: Any outputs or error messages
- **Reproduction steps**: How to reproduce (if determinable)

## Step 2: Generate Report (BEFORE Creating Issues)

**Important**: Show the user the analysis before creating any GitHub issues.

### If Issues Found

Display this format:

```
## Feedback Analysis Report

Found X potential issue(s):

### Issue 1: <short title>
- **Category**: bd CLI / Plugin / Agent / Documentation / UX
- **Component**: <specific command or feature>
- **Problem**: <summary of what went wrong>
- **Expected**: <what should have happened>
- **Actual**: <what actually happened>

### Issue 2: ...

---
Would you like me to create GitHub issues for these problems?
You can:
- Say "yes" to create all issues
- Say "yes to issue 1" to create specific issues
- Modify the descriptions before I create them
- Say "no" to skip issue creation
```

### If No Issues Found

Display this format:

```
## Feedback Analysis Report

No issues detected in this session.

Everything appears to be working correctly. If you experienced 
a problem that wasn't detected, please describe it and I can 
help create a ticket manually.
```

## Step 3: User Confirmation

**Do NOT create GitHub issues until the user confirms.**

Wait for the user to:
- Approve all issues: "yes" or "create them"
- Approve specific issues: "yes to issue 1 and 3"
- Modify issues: Allow editing descriptions
- Decline: "no" or "skip"

## Step 4: Create GitHub Issues

After user confirmation, create issues using the gh CLI:

### Command Format

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "<descriptive title>" \
  --body "$(cat <<'EOF'
## Problem
<Clear description of what went wrong>

## Expected Behavior
<What should have happened>

## Actual Behavior
<What actually happened>

## Steps to Reproduce
<If known, list steps>

## Environment
- Session context: <what user was doing>
- Commands involved: <list of commands>

## Additional Context
<Error messages, outputs, or relevant info>

---
*Created via /coder/feedback command*
EOF
)"
```

### Title Format Guidelines

- Short, descriptive summary
- Include affected component in brackets
- Examples:
  - `[bd ready] Returns empty when issues exist`
  - `[plugin] Knowledge-base fails to load custom commands`
  - `[agent] Task agent doesn't follow closing rules`

### Important Rules

1. **One issue per problem** - Do not batch multiple issues into one ticket
2. **Use heredoc for body** - Ensures proper formatting with newlines
3. **Include footer** - Add "Created via /coder/feedback command" marker

## Step 5: Report Results

After creating issues, report back:

```
## Issues Created

Created X issue(s):

1. [<title>](<github-url>)
2. [<title>](<github-url>)

Thank you for your feedback! The issues have been created and 
will be reviewed by the maintainers.
```

## Target Repository

All issues should be created in: https://github.com/hk9890/opencode-coder

## Error Handling

### If gh CLI Fails

- Check if user is authenticated: `gh auth status`
- Suggest: "Please run `gh auth login` to authenticate with GitHub"

### If Repository Not Accessible

- Report the error to the user
- Suggest creating the issue manually with the prepared content

## Summary Flowchart

```
1. Analyze session for issues
         |
         v
2. Generate report (show to user)
         |
         v
3. Ask for confirmation
         |
    +----+----+
    |         |
    v         v
 No issues  User confirms
    |         |
    v         v
  Done    4. Create GitHub issues
              |
              v
          5. Report links to user
```
