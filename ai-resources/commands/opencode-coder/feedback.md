---
description: Report issues with the opencode-coder plugin
---

# Coder Feedback

> **Purpose**: This command reports issues with the **opencode-coder plugin itself** - NOT general project issues.

Report issues with:
- bd CLI commands and behavior
- Knowledge-base loading and commands
- Beads agents (planner, task, review, verify)
- Plugin documentation gaps

Do NOT use this for:
- Your own code bugs
- Build/test failures in your project
- General coding mistakes

## User Context

The user may provide additional context via arguments:

```
$ARGUMENTS
```

If arguments were provided, use them as primary context for understanding the issue. Otherwise, analyze the session.

## Step 1: Session Analysis & Issue Classification

Review the session (and any user arguments) to identify issues.

### Classify Each Issue

**Plugin Issues** (create GitHub issue):
| Category | Examples |
|----------|----------|
| bd CLI errors | Command not found, invalid arguments, unexpected failures |
| Plugin errors | Knowledge-base loading failures, command execution failures |
| Agent behavior | Wrong actions, poor responses from beads agents |
| Documentation gaps | Unclear instructions, missing examples in plugin docs |

**User Project Issues** (do NOT create GitHub issue):
| Category | Examples |
|----------|----------|
| User code bugs | Errors in user's own source files |
| Build/test failures | npm/yarn errors, test failures in user's project |
| Configuration issues | User's own config files, environment setup |
| General coding | Syntax errors, logic bugs in user's code |

### For Plugin Issues, Extract

- **Component**: What command/feature was involved (bd, agent, knowledge-base)
- **Expected behavior**: What should have happened
- **Actual behavior**: What actually happened
- **Error messages**: Any outputs or error messages
- **Reproduction steps**: How to reproduce (if determinable)

## Step 2: Generate Report

**Important**: Show the user the analysis before taking action.

### If Plugin Issues Found

```
## Feedback Analysis Report

Found X plugin issue(s):

### Issue 1: <short title>
- **Category**: bd CLI / Plugin / Agent / Documentation
- **Component**: <specific command or feature>
- **Problem**: <summary of what went wrong>
- **Expected**: <what should have happened>
- **Actual**: <what actually happened>

---
Would you like me to create GitHub issues in hk9890/opencode-coder for these problems?
- Say "yes" to create all issues
- Say "yes to issue 1" to create specific issues
- Modify descriptions before creation
- Say "no" to skip
```

### If Only User Project Issues Found

```
## Feedback Analysis Report

The issues found appear to be in your own project, not the opencode-coder plugin:

### Found: <short description>
- **Type**: <build error / test failure / code bug>
- **Location**: <file or component in user's project>
- **Summary**: <what's happening>

---
This isn't a plugin issue. To track this:
- If using beads: `bd create --type=bug --title="<description>"`
- Otherwise: Fix directly in your codebase

Would you like help debugging this issue?
```

### If No Issues Found

```
## Feedback Analysis Report

No issues detected in this session.

If you experienced a problem, please describe it:
- For plugin issues: I'll help create a GitHub issue
- For project issues: I'll help you debug or create a beads bug
```

## Step 3: User Confirmation (For Plugin Issues Only)

**Do NOT create GitHub issues until the user confirms.**

Wait for:
- Approve all: "yes" or "create them"
- Approve specific: "yes to issue 1 and 3"
- Modify: Allow editing descriptions
- Decline: "no" or "skip"

## Step 4: Create GitHub Issues

After confirmation, create issues for **plugin problems only**:

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
- Include component in brackets:
  - `[bd ready] Returns empty when issues exist`
  - `[plugin] Knowledge-base fails to load custom commands`
  - `[agent] Task agent doesn't follow closing rules`

### Important Rules

1. **One issue per problem** - Do not batch multiple issues
2. **Plugin issues only** - Never create issues for user project bugs
3. **Use heredoc for body** - Ensures proper formatting
4. **Include footer** - Add "Created via /coder/feedback command" marker

## Step 5: Report Results

### For Plugin Issues Created

```
## Issues Created

Created X issue(s) in hk9890/opencode-coder:

1. [<title>](<github-url>)
2. [<title>](<github-url>)

Thank you for your feedback!
```

### For User Project Issues

```
## Summary

No GitHub issues created - the problems are in your project, not the plugin.

Suggested next steps:
- Create a beads bug: `bd create --type=bug --title="<description>"`
- Or fix directly in your code

Let me know if you'd like help debugging!
```

## Target Repository

Plugin issues go to: https://github.com/hk9890/opencode-coder

This is hardcoded because this command specifically reports opencode-coder plugin issues.

## Error Handling

### If gh CLI Fails

- Check authentication: `gh auth status`
- Suggest: "Please run `gh auth login` to authenticate with GitHub"

### If Repository Not Accessible

- Report the error
- Provide the issue content so user can create manually

## Summary Flowchart

```
1. Analyze session + user arguments
         |
         v
2. Classify: Plugin issue or User project issue?
         |
    +----+----+
    |         |
    v         v
Plugin     User Project
Issue      Issue
    |         |
    v         v
3. Show     Suggest beads bug
   report   or direct fix
    |
    v
4. User confirms?
    |
   yes
    |
    v
5. Create GitHub issue in hk9890/opencode-coder
    |
    v
6. Report links
```
