# Reporting Issues

Complete guide for reporting bugs and issues with the opencode-coder plugin.

## Table of Contents

1. [What to Report](#what-to-report)
2. [Before Reporting](#before-reporting)
3. [Information to Include](#information-to-include)
4. [Creating a GitHub Issue](#creating-a-github-issue)
5. [Issue Classification](#issue-classification)
6. [Getting Help](#getting-help)

---

## What to Report

When you encounter problems with the opencode-coder plugin itself (not your project code), you can report them to the plugin maintainers.

**Report issues with:**
- bd CLI commands and behavior
- Knowledge-base loading and commands
- Beads agents (planner, task, review, verify)
- Plugin documentation gaps
- Plugin features not working as expected

**Do NOT report:**
- Your own code bugs
- Build/test failures in your project
- General coding mistakes
- Configuration issues with your project

---

## Before Reporting

1. **Enable debug logging** (see the Debug Logging guide)
2. **Run health checks** (see the Status & Health Checks guide)
3. **Collect information**:
   - What command or feature you were using
   - What you expected to happen
   - What actually happened
   - Error messages or outputs
   - Steps to reproduce (if known)

---

## Information to Include

A good bug report includes:

1. **Component**: What part of the plugin (bd CLI, agent, command)
2. **Expected behavior**: What should have happened
3. **Actual behavior**: What actually happened
4. **Steps to reproduce**: How to trigger the issue
5. **Environment**:
   - Operating system
   - Node.js version (`node --version`)
   - bd version (`bd --version`)
   - Plugin version
6. **Logs**: Relevant log excerpts with debug logging enabled
7. **Context**: What you were trying to accomplish

---

## Creating a GitHub Issue

Issues should be reported to: https://github.com/hk9890/opencode-coder

### Bug Report Template

A structured template is available at [`assets/bug-report-template.md`](../assets/bug-report-template.md) to help you include all necessary information.

### Collecting System Information

**Automated Collection:**

Run the helper script to automatically collect system information:

```bash
./scripts/collect-system-info.sh
```

This script collects:
- Operating system and version
- Node.js and npm versions
- bd CLI version
- Plugin version
- Shell type
- Git repository status (if applicable)
- Beads health check output (if applicable)

Copy the output and paste it into the Environment section of your bug report.

**Manual Collection:**

If you prefer to collect information manually:

```bash
# Operating System
uname -a                           # Linux/macOS
# or: systeminfo                   # Windows

# Node.js version
node --version

# bd CLI version
bd --version

# Plugin version
npm list opencode-coder

# Shell
echo $SHELL

# bd health check (if using beads)
bd doctor
```

### Quick Report Pattern

For simple, easily reproducible issues:

**Manual Issue Creation:**

1. Visit https://github.com/hk9890/opencode-coder/issues/new
2. Use a descriptive title with component in brackets:
   - `[bd ready] Returns empty when issues exist`
   - `[plugin] Knowledge-base fails to load custom commands`
   - `[agent] Task agent doesn't follow closing rules`
3. Fill in the key sections: Problem, Steps to Reproduce, Environment

**Using gh CLI:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[bd ready] Returns empty when issues exist" \
  --body "$(cat <<'EOF'
## Problem
Running `bd ready` returns no results even though open issues exist in .beads/

## Steps to Reproduce
1. Create issues with `bd create --title="Test" --type=task`
2. Verify issues exist with `bd list --status=open`
3. Run `bd ready`
4. No issues shown

## Environment
- OS: Ubuntu 22.04
- Node.js: v20.10.0
- bd version: 1.2.3
- Plugin version: 1.0.0

## Expected
Should show unblocked issues

## Actual
Returns empty list
EOF
)"
```

### Detailed Report Pattern

For complex issues requiring logs, reproduction steps, or additional context:

**Using the Bug Report Template:**

```bash
# Copy the template
cp ai-resources/skills/using-coder-plugin/assets/bug-report-template.md /tmp/bug-report.md

# Collect system info
./scripts/collect-system-info.sh > /tmp/system-info.txt

# Edit the template, fill in all sections, paste system info
# Then create the issue

gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body-file /tmp/bug-report.md
```

**Complete Example:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[agent] Task agent creates duplicate commits" \
  --body "$(cat <<'EOF'
## Problem
The beads-task-agent is creating duplicate git commits when closing tasks, resulting in redundant commit history.

## Expected Behavior
Task agent should create a single commit when closing a task, following the git safety protocol.

## Actual Behavior
Two identical commits are created for each task closure:
- First commit: "Implement feature X"
- Second commit: "Implement feature X" (duplicate)

## Steps to Reproduce
1. Create a task: `bd create --title="Test feature" --type=task`
2. Invoke task agent via Claude Code
3. Agent implements the task and closes it
4. Check git log: `git log --oneline -10`
5. Observe duplicate commits

## Environment
- OS: Ubuntu 22.04 LTS
- Node.js: v20.10.0
- bd CLI: 1.2.3
- Plugin: opencode-coder@1.0.0
- Shell: bash 5.1.16

## Logs

Debug logging enabled with `export DEBUG=opencode-coder:*`

```
[opencode-coder:task-agent] Starting task execution for beads-xxx
[opencode-coder:task-agent] Changes detected, creating commit
[opencode-coder:git] Running: git add src/feature.ts
[opencode-coder:git] Running: git commit -m "Implement feature X"
[opencode-coder:git] Commit successful: a1b2c3d
[opencode-coder:task-agent] Task complete, closing beads-xxx
[opencode-coder:git] Running: git add src/feature.ts
[opencode-coder:git] Running: git commit -m "Implement feature X"
[opencode-coder:git] Commit successful: e4f5g6h
```

## Additional Context

This appears to happen consistently when:
- Task agent makes code changes
- No pre-commit hooks are configured
- Git status is clean before agent starts

Git log output:
```
e4f5g6h Implement feature X
a1b2c3d Implement feature X
```

Workaround: Manually squash duplicate commits with `git rebase -i HEAD~2`

Related: This might be connected to the session close protocol in AGENTS.md
EOF
)"
```

### Tips for Effective Bug Reports

1. **Use descriptive titles**: Include the component and a clear summary
   - Good: `[bd sync] Fails to push when .beads/ has merge conflicts`
   - Bad: `Sync doesn't work`

2. **Enable debug logging BEFORE reproducing**:
   ```bash
   export DEBUG=opencode-coder:*
   # Then reproduce the issue
   ```

3. **Include minimal reproduction steps**: The fewer steps, the easier to diagnose

4. **Attach relevant files**: If the issue involves configuration files, include sanitized versions

5. **Search existing issues**: Your issue might already be reported or resolved

6. **One issue per report**: Don't combine multiple unrelated problems

7. **Follow up**: If maintainers ask for more information, provide it promptly

---

## Issue Classification

Before creating an issue, determine if it's a plugin issue or a project issue:

**Plugin Issues** (create GitHub issue):
| Category | Examples |
|----------|----------|
| bd CLI errors | Command not found, invalid arguments, unexpected failures |
| Plugin errors | Knowledge-base loading failures, command execution failures |
| Agent behavior | Wrong actions, poor responses from beads agents |
| Documentation gaps | Unclear instructions, missing examples in plugin docs |

**Project Issues** (do NOT create GitHub issue):
| Category | Examples |
|----------|----------|
| User code bugs | Errors in your own source files |
| Build/test failures | npm/yarn errors, test failures in your project |
| Configuration issues | Your own config files, environment setup |
| General coding | Syntax errors, logic bugs in your code |

---

## Getting Help

If you're unsure whether something is a plugin issue:
1. Ask in the session: "Is this a plugin issue or a project issue?"
2. Run health checks to verify plugin setup
3. Check the troubleshooting guides
4. Create a GitHub discussion for questions: https://github.com/hk9890/opencode-coder/discussions
