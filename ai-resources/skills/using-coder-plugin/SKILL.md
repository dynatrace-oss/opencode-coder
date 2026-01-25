---
name: using-coder-plugin
description: Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin
---

# Using the Coder Plugin

This skill provides comprehensive guidance for installing, configuring, and troubleshooting the opencode-coder plugin. Use this when users need help with plugin setup, debugging issues, or understanding how the plugin works.

## Table of Contents

1. [Installation](#installation)
2. [Initialization](#initialization)
3. [Configuration](#configuration)
4. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
5. [Debug Logging](#debug-logging)
6. [Analyzing OpenCode Logs](#analyzing-opencode-logs)
7. [Reporting Issues](#reporting-issues)
8. [Status & Health Checks](#status--health-checks)
9. [Common Problems & Solutions](#common-problems--solutions)

---

## Installation

Install the global dependencies required by the opencode-coder plugin. This is a one-time setup that should be performed before initializing any project.

### Installing the bd CLI

The coder plugin requires the `bd` CLI (beads) for issue tracking:

```bash
npm install -g beads
```

### Verify Installation

After installation, verify that beads is available:

```bash
bd --version
```

You should see output showing the beads version number.

### Upgrading Dependencies

To upgrade beads to the latest version:

```bash
npm update -g beads
```

**Important**: Always use npm for installation and upgrades. Do NOT use curl/bash install scripts that might be suggested by `bd doctor`.

### Installation Troubleshooting

| Issue | Solution |
|-------|----------|
| npm permission error | Use `sudo npm install -g beads` or fix npm permissions |
| bd command not found after install | Ensure npm global bin is in PATH |
| Wrong version installed | Run `npm update -g beads` |

### Next Steps

After installation, initialize a project with the coder plugin (see [Initialization](#initialization) section).

---

## Initialization

Initialize a project to use the opencode-coder plugin. This command is idempotent and can be run multiple times safely.

### Prerequisites

Before initializing, verify:
1. The project has git initialized (`git status` should work)
2. The `bd` CLI is available (`bd --version`) - if not, see [Installation](#installation)

### Quick Start

**For most users, this is all you need:**

```bash
# 1. Check if already initialized
ls -la .beads .coder

# 2. If not initialized, run stealth mode setup
bd init --stealth && bd hooks install

# 3. Verify beads is working
bd ready

# Done! The plugin is now active.
```

**Verification:**
- ✓ `.beads/` directory exists with config files
- ✓ `bd ready` runs without errors
- ✓ Files stay local (not in git status)

If you need team collaboration or multi-device sync, see the detailed [Initialization Steps](#initialization-steps) below for team mode setup.

### Initialization Steps

#### Step 1: Check Current Status

First, check if the project is already initialized:

```bash
ls -la .beads .coder
```

If directories already exist, the project may already be initialized. The initialization process will skip what's already set up.

#### Step 2: Choose Beads Mode

If the project is not yet initialized, you need to choose a mode:

**Stealth Mode (Recommended)**
- Beads files stay local to your machine
- Won't affect git history or other team members
- Perfect for: personal use, OSS contributions, teams not using beads yet
- Files are excluded via `.git/info/exclude`

**Team Mode**
- Beads files are committed and synced via git
- Enables multi-device sync and team collaboration
- Perfect for: teams adopting beads together
- Uses standard `.gitignore` for database file

#### Step 3: Run Initialization

**For Stealth Mode:**
```bash
bd init --stealth
bd hooks install
```

**For Team Mode:**
```bash
bd init
bd hooks install
```

#### Step 4: Set Up Coder Config

Create the coder configuration directory and file:

```bash
mkdir -p .coder
echo '{ "active": true }' > .coder/coder.json
```

#### Step 5: Handle Git Exclusions

**For Stealth Mode:**
The `.beads/`, `.coder/`, and `.opencode/` directories should be added to `.git/info/exclude`:

```bash
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
echo ".opencode/" >> .git/info/exclude
```

**For Team Mode:**
Add the beads database to `.gitignore`:

```bash
echo ".beads/beads.db" >> .gitignore
```

#### Step 6: Commit (Team Mode Only)

**For Team Mode:**
```bash
git add .beads/ .coder/ .gitignore AGENTS.md
git commit -m "chore: initialize coder plugin"
```

**For Stealth Mode:**
No commit needed - all files are excluded from git.

### File Structure After Initialization

```
.beads/
  config.yaml       # Beads configuration
  issues.jsonl      # Git-versioned issue data
  interactions.jsonl # Session interactions
  metadata.json     # Repository metadata
  beads.db          # Local SQLite cache (gitignored)

.coder/
  coder.json        # Coder plugin configuration

AGENTS.md           # Beads quick reference (optional)
```

### Note on AGENTS.md

The `bd init` command may create or update `AGENTS.md` with a minimal beads quick reference (~12 lines). This is harmless:
- Serves as human-readable documentation that the project uses beads
- Plugin hooks automatically inject full beads context, so AGENTS.md is not read by AI
- Can be safely committed or ignored based on project preference

### Idempotent Behavior

The initialization process is safe to run multiple times:
- Already initialized components are skipped
- No duplicate entries in `.gitignore` or `.git/info/exclude`
- No duplicate commits
- Reports what was already present vs newly created

### First Steps After Initialization

After initialization, try these commands:

```bash
# Create your first issue
bd create "Setup project" --type task

# Check project health
# See the Health Checks section below

# Find available work
bd ready
```

---

## Configuration

The coder plugin uses a simple JSON configuration file located at `.coder/coder.json`.

### Configuration File Format

```json
{
  "active": true
}
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `active` | boolean | true | Enables/disables the coder plugin |

### Checking Current Configuration

To view the current configuration and plugin status, check if the `.coder/coder.json` file exists and contains valid JSON:

```bash
cat .coder/coder.json
```

### Modifying Configuration

Edit `.coder/coder.json` directly to change settings:

```bash
# Disable the plugin
echo '{ "active": false }' > .coder/coder.json

# Re-enable the plugin
echo '{ "active": true }' > .coder/coder.json
```

---

## Troubleshooting & Diagnostics

When experiencing issues with the coder plugin, follow these diagnostic steps.

### Running Health Checks

The coder plugin includes a comprehensive health check system. Run diagnostics to check:

1. **Coder Config Check**: Verifies `.coder/coder.json` exists and is valid
2. **Beads Check**: Verifies `.beads/` directory and runs `bd doctor`
3. **Git Hooks Check**: Verifies beads git hooks are installed
4. **Git Sync Check**: Checks for uncommitted beads changes

### Understanding Health Check Results

**All OK Example:**
```
Coder Health Check

Components:
  Coder config:  OK
  Beads:         OK
  Git hooks:     OK
  Git sync:      OK

No issues found.
```

**Issues Found Example:**
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

### Common Diagnostic Commands

```bash
# Check if bd CLI is installed
bd --version

# Check beads health
bd doctor

# Check sync status
bd sync --status

# Verify git hooks
ls -la .git/hooks/

# Check coder config
cat .coder/coder.json
```

### Interpreting bd doctor Output

When running `bd doctor`, filter the suggestions:

| bd doctor suggestion | Action |
|---------------------|--------|
| Install git hooks | Run `bd hooks install` |
| Set upstream | Optional - not critical for local use |
| Upgrade CLI (curl script) | **Ignore** - Use `npm install -g @beads/bd@latest` instead |

**Important**: Never use the curl/bash upgrade method. Always use npm for beads updates.

---

## Debug Logging

When troubleshooting plugin issues or reporting bugs, debug logging is essential for understanding what's happening.

OpenCode provides two types of debug logging:
1. **General OpenCode debug logging** - Shows all OpenCode internals and plugin activity
2. **Plugin-specific debug logging** - Shows only opencode-coder plugin messages

### Enabling Debug Logging

To enable debug logging, set the `OPENCODE_DEFAULT_OPTIONS` environment variable:

```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"
```

**Important**: The `OPENCODE_LOG` environment variable does NOT work for OpenCode. You must use `OPENCODE_DEFAULT_OPTIONS`.

### Plugin-Specific Debug Logging

The opencode-coder plugin provides its own debug logging that can be enabled independently:

```bash
export OPENCODE_CODER_DEBUG=1
```

**When to use each variable:**

| Variable | What it shows | When to use |
|----------|---------------|-------------|
| `OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"` | All OpenCode internals, all plugins, verbose output | General OpenCode troubleshooting, understanding flow |
| `OPENCODE_CODER_DEBUG=1` | Only opencode-coder plugin messages | Debugging plugin behavior, cleaner logs |
| Both together | Full context with plugin details highlighted | Complex issues, plugin interaction problems |

**Key differences:**
- `OPENCODE_DEFAULT_OPTIONS` affects all of OpenCode and produces verbose output
- `OPENCODE_CODER_DEBUG` only enables opencode-coder plugin messages
- Plugin debug messages log at **info level** and are always visible in OpenCode logs
- Plugin messages are tagged with the `opencode-coder` service name for easy filtering

**Example - Using both together:**

```bash
# Enable all debug logging
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"
export OPENCODE_CODER_DEBUG=1
```

**Filtering plugin messages in logs:**

When plugin debug logging is enabled, messages are tagged with the service name. Use grep to filter:

```bash
# View only opencode-coder plugin messages
grep "opencode-coder" ~/.config/opencode/logs/*.log

# View plugin messages with context (3 lines before/after)
grep -C 3 "opencode-coder" ~/.config/opencode/logs/*.log
```

See [Analyzing Log Files](#analyzing-log-files) for more log analysis techniques.

### Setting Debug Logging Permanently

Add the export command to your shell configuration file:

**For bash (~/.bashrc or ~/.bash_profile):**
```bash
# General OpenCode debug logging
echo 'export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"' >> ~/.bashrc
# Plugin-specific debug logging
echo 'export OPENCODE_CODER_DEBUG=1' >> ~/.bashrc
source ~/.bashrc
```

**For zsh (~/.zshrc):**
```bash
# General OpenCode debug logging
echo 'export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"' >> ~/.zshrc
# Plugin-specific debug logging
echo 'export OPENCODE_CODER_DEBUG=1' >> ~/.zshrc
source ~/.zshrc
```

### Log File Locations

OpenCode log locations vary by operating system:

**Linux:**
```
~/.config/opencode/logs/
```

**macOS:**
```
~/Library/Logs/opencode/
```

**Windows:**
```
%APPDATA%\opencode\logs\
```

### Finding Log Files

To locate your log directory:

```bash
# Linux
ls -la ~/.config/opencode/logs/

# macOS
ls -la ~/Library/Logs/opencode/

# Windows (PowerShell)
dir $env:APPDATA\opencode\logs\
```

### Analyzing Log Files

Log files are named by date and session. Look for:

1. **Recent files**: Sort by modification time to find latest logs
2. **Error messages**: Search for "ERROR" or "WARN" keywords
3. **Stack traces**: Look for multi-line error traces
4. **Plugin loading**: Check for coder plugin initialization messages

### Useful Log Analysis Commands

```bash
# Find most recent log file (Linux/macOS)
ls -lt ~/.config/opencode/logs/ | head -5

# Search for errors in recent logs
grep -i "error" ~/.config/opencode/logs/*.log

# View last 100 lines of most recent log
tail -100 $(ls -t ~/.config/opencode/logs/*.log | head -1)

# Search for opencode-coder plugin messages (when OPENCODE_CODER_DEBUG=1)
grep "opencode-coder" ~/.config/opencode/logs/*.log

# Search for plugin messages with context
grep -C 3 "opencode-coder" ~/.config/opencode/logs/*.log

# Search for any coder-related messages
grep -i "coder" ~/.config/opencode/logs/*.log
```

### What to Look For

When analyzing logs for plugin issues:

| Issue Type | What to Search For |
|------------|-------------------|
| Plugin not loading | "plugin", "knowledge-base", "coder" keywords |
| Plugin debug messages | "opencode-coder" (when `OPENCODE_CODER_DEBUG=1`) |
| Command failures | "command", "error", stack traces |
| bd CLI issues | "bd", "beads", "spawn", "ENOENT" |
| Hook failures | "hook", "git", "post-commit" |

**Tip**: When `OPENCODE_CODER_DEBUG=1` is set, plugin debug messages are tagged with the service name `opencode-coder` and log at info level, making them easy to filter from general OpenCode logs.

### Disabling Debug Logging

To disable debug logging, unset the environment variables:

```bash
# Disable general OpenCode debug logging
unset OPENCODE_DEFAULT_OPTIONS

# Disable plugin-specific debug logging
unset OPENCODE_CODER_DEBUG
```

Or remove them from your shell configuration file.

---

## Reporting Issues

When you encounter problems with the opencode-coder plugin itself (not your project code), you can report them to the plugin maintainers.

### What to Report

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

### Before Reporting

1. **Enable debug logging** (see [Debug Logging](#debug-logging))
2. **Run health checks** (see [Troubleshooting & Diagnostics](#troubleshooting--diagnostics))
3. **Collect information**:
   - What command or feature you were using
   - What you expected to happen
   - What actually happened
   - Error messages or outputs
   - Steps to reproduce (if known)

### Information to Include

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

### Creating a GitHub Issue

Issues should be reported to: https://github.com/hk9890/opencode-coder

**Manual Issue Creation:**

1. Visit https://github.com/hk9890/opencode-coder/issues/new
2. Use a descriptive title with component in brackets:
   - `[bd ready] Returns empty when issues exist`
   - `[plugin] Knowledge-base fails to load custom commands`
   - `[agent] Task agent doesn't follow closing rules`
3. Fill in the issue template with collected information

**Using gh CLI:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body "$(cat <<'EOF'
## Problem
Clear description of what went wrong

## Expected Behavior
What should have happened

## Actual Behavior
What actually happened

## Steps to Reproduce
1. First step
2. Second step
3. Issue occurs

## Environment
- OS: Linux/macOS/Windows
- Node.js: v20.x.x
- bd version: x.x.x
- Plugin version: x.x.x

## Logs
```
Relevant log excerpts here
```

## Additional Context
Any other relevant information
EOF
)"
```

### Issue Classification

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

### Getting Help

If you're unsure whether something is a plugin issue:
1. Ask in the session: "Is this a plugin issue or a project issue?"
2. Run health checks to verify plugin setup
3. Check [Common Problems & Solutions](#common-problems--solutions)
4. Create a GitHub discussion for questions: https://github.com/hk9890/opencode-coder/discussions

---

## Status & Health Checks

Monitor the health and status of your coder plugin installation.

### Checking Plugin Status

To view comprehensive plugin status information, including configuration, integrations, and available commands/agents, examine the coder configuration:

```bash
# Check if plugin is active
cat .coder/coder.json

# Verify plugin directory structure
ls -la .coder/ .beads/
```

### Health Check Components

A complete health check verifies:

1. **Coder Config**: `.coder/coder.json` exists and is valid JSON
2. **Beads**: `.beads/` directory exists and `bd doctor` passes
3. **Git Hooks**: Beads git hooks are properly installed
4. **Git Sync**: No uncommitted beads changes

### Running a Complete Health Check

```bash
# Check coder config
test -f .coder/coder.json && echo "Coder config: OK" || echo "Coder config: MISSING"

# Check beads
test -d .beads && bd doctor || echo "Beads: NOT INITIALIZED"

# Check git hooks
test -f .git/hooks/post-commit && echo "Git hooks: OK" || echo "Git hooks: MISSING"

# Check sync status (if beads initialized)
bd sync --status
```

### Quick Health Verification

For a quick check, verify the essential components:

```bash
# Verify bd CLI is available
bd --version

# Verify project is initialized
ls .beads .coder

# Verify git hooks are installed
ls .git/hooks/post-commit
```

### Component Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| OK | Component working correctly | None |
| MISSING | Component not installed | Run initialization |
| INVALID | Component exists but has errors | Fix configuration |
| WARN | Component has warnings | Review and fix if needed |

### Regular Maintenance

Perform these checks regularly:

**Daily (when active):**
- Check for uncommitted changes: `bd sync --status`

**Weekly:**
- Verify hooks are still installed: `ls .git/hooks/`
- Check for beads updates: `npm outdated -g beads`

**After Updates:**
- Run full health check after updating beads
- Verify configuration is still valid
- Test basic commands (`bd ready`, `bd list`)

---

## Common Problems & Solutions

This section covers frequently encountered issues and their solutions.

### Installation Issues

**Problem: bd command not found after installation**

```bash
# Solution 1: Check npm global bin is in PATH
npm bin -g

# Solution 2: Add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Solution 3: Reinstall beads
npm install -g beads
```

**Problem: npm permission errors during installation**

```bash
# Solution 1: Use sudo (quick but not recommended)
sudo npm install -g beads

# Solution 2: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
npm install -g beads
```

### Initialization Issues

**Problem: bd init fails with "not a git repository"**

```bash
# Solution: Initialize git first
git init
git add .
git commit -m "Initial commit"
bd init --stealth
```

**Problem: Hooks not working after initialization**

```bash
# Solution: Reinstall hooks
bd hooks install

# Verify installation
ls -la .git/hooks/post-commit
cat .git/hooks/post-commit
```

**Problem: Already initialized but want to switch modes (stealth ↔ team)**

```bash
# This requires manual migration - stealth to team:
# 1. Remove exclusions from .git/info/exclude
# 2. Add .beads/ and .coder/ to git
git add .beads/ .coder/
git commit -m "Switch to team mode"

# Team to stealth:
# 1. Remove .beads/ and .coder/ from git
git rm -r --cached .beads/ .coder/
# 2. Add to .git/info/exclude
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
```

### Runtime Issues

**Problem: bd commands failing with database errors**

```bash
# Solution: Rebuild the local cache
rm .beads/beads.db
bd ready  # Will rebuild cache
```

**Problem: Git hooks not triggering**

```bash
# Check if hooks are installed
ls -la .git/hooks/

# Reinstall if missing
bd hooks install

# Check if hooks are executable
chmod +x .git/hooks/post-commit
```

**Problem: Uncommitted beads changes piling up**

```bash
# Solution: Sync with remote
bd sync

# If sync fails, check status first
bd sync --status

# If remote tracking not set, push manually
git push origin main
```

### Configuration Issues

**Problem: Plugin not loading or not active**

```bash
# Check configuration
cat .coder/coder.json

# Ensure it's valid JSON with active: true
echo '{ "active": true }' > .coder/coder.json
```

**Problem: Can't find log files**

```bash
# Enable debug logging first
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"

# Find logs by OS:
# Linux:
ls -la ~/.config/opencode/logs/

# macOS:
ls -la ~/Library/Logs/opencode/

# Windows (PowerShell):
dir $env:APPDATA\opencode\logs\
```

### Agent and Command Issues

**Problem: Commands not being recognized**

```bash
# Verify plugin is loaded
# Check that .coder/coder.json exists and is valid

# Verify knowledge-base structure
ls -la knowledge-base/command/
ls -la knowledge-base/agents/
```

**Problem: Beads agents not following instructions**

```bash
# Check that AGENTS.md is not interfering
# The plugin injects context via hooks, AGENTS.md should be minimal

# Verify hooks are installed
bd hooks install

# Check recent interactions
cat .beads/interactions.jsonl | tail -20
```

### Sync and Git Issues

**Problem: Beads files showing up in git status (stealth mode)**

```bash
# Ensure exclusions are set
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
echo ".opencode/" >> .git/info/exclude

# Verify exclusions
cat .git/info/exclude
```

**Problem: Beads files not showing up in git status (team mode)**

```bash
# Ensure files are tracked
git add .beads/ .coder/

# Check .gitignore doesn't exclude them
cat .gitignore

# Only beads.db should be ignored
grep -v "beads.db" .gitignore | grep -q "beads" && echo "Remove .beads/ from .gitignore"
```

### Performance Issues

**Problem: bd commands are slow**

```bash
# Rebuild cache
rm .beads/beads.db
bd ready

# Check for large issues.jsonl
wc -l .beads/issues.jsonl

# If >10,000 lines, consider archiving closed issues
```

**Problem: Large log files filling disk**

```bash
# Find large logs (Linux/macOS)
du -sh ~/.config/opencode/logs/

# Remove old logs
find ~/.config/opencode/logs/ -name "*.log" -mtime +30 -delete

# Disable debug logging if not needed
unset OPENCODE_DEFAULT_OPTIONS
```

### Getting Additional Help

If your issue isn't covered here:

1. **Enable debug logging** and examine logs
2. **Run health checks** to identify the problem area
3. **Search existing issues**: https://github.com/hk9890/opencode-coder/issues
4. **Create a discussion**: https://github.com/hk9890/opencode-coder/discussions
5. **Report a bug**: See [Reporting Issues](#reporting-issues)

---

## Summary

This skill covers the complete lifecycle of using the opencode-coder plugin:

1. **Install** the bd CLI via npm
2. **Initialize** your project (stealth or team mode)
3. **Configure** the plugin with `.coder/coder.json`
4. **Troubleshoot** issues using health checks and diagnostics
5. **Debug** with proper logging (`OPENCODE_DEFAULT_OPTIONS`)
6. **Report** plugin issues to GitHub
7. **Monitor** status and health regularly
8. **Resolve** common problems quickly

For the latest documentation and updates, visit: https://github.com/hk9890/opencode-coder
