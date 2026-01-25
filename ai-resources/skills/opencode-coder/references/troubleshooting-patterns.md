# Troubleshooting Patterns

This reference contains detailed solutions for common issues when using the opencode-coder plugin. Issues are organized by category for quick reference.

## Table of Contents

1. [Quick Search Patterns](#quick-search-patterns)
2. [Installation Issues](#installation-issues)
   - [bd command not found after installation](#bd-command-not-found-after-installation)
   - [npm permission errors during installation](#npm-permission-errors-during-installation)
3. [Initialization Issues](#initialization-issues)
   - [bd init fails with "not a git repository"](#bd-init-fails-with-not-a-git-repository)
   - [Hooks not working after initialization](#hooks-not-working-after-initialization)
   - [Already initialized but want to switch modes (stealth ↔ team)](#already-initialized-but-want-to-switch-modes-stealth--team)
4. [Runtime Issues](#runtime-issues)
   - [bd commands failing with database errors](#bd-commands-failing-with-database-errors)
   - [Git hooks not triggering](#git-hooks-not-triggering)
   - [Uncommitted beads changes piling up](#uncommitted-beads-changes-piling-up)
5. [Configuration Issues](#configuration-issues)
   - [Plugin not loading or not active](#plugin-not-loading-or-not-active)
   - [Can't find log files](#cant-find-log-files)
6. [Agent and Command Issues](#agent-and-command-issues)
   - [Commands not being recognized](#commands-not-being-recognized)
   - [Beads agents not following instructions](#beads-agents-not-following-instructions)
7. [Sync and Git Issues](#sync-and-git-issues)
   - [Beads files showing up in git status (stealth mode)](#beads-files-showing-up-in-git-status-stealth-mode)
   - [Beads files not showing up in git status (team mode)](#beads-files-not-showing-up-in-git-status-team-mode)
8. [Performance Issues](#performance-issues)
   - [bd commands are slow](#bd-commands-are-slow)
   - [Large log files filling disk](#large-log-files-filling-disk)
9. [Getting Additional Help](#getting-additional-help)
10. [Pattern Index](#pattern-index)

---

## Quick Search Patterns

Use these grep patterns to quickly find solutions:

```bash
# Search for specific error types
grep -n "not found" references/troubleshooting-patterns.md
grep -n "permission" references/troubleshooting-patterns.md
grep -n "hooks" references/troubleshooting-patterns.md

# Search by category
grep -n "## Installation" references/troubleshooting-patterns.md
grep -n "## Runtime" references/troubleshooting-patterns.md
grep -n "## Configuration" references/troubleshooting-patterns.md
```

---

## Installation Issues

### bd command not found after installation

**Symptoms**: Running `bd` returns "command not found" error after installing beads.

**Solutions**:

```bash
# Solution 1: Check npm global bin is in PATH
npm bin -g

# Solution 2: Add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Solution 3: Reinstall beads
npm install -g beads
```

**Root Cause**: The npm global bin directory is not in your system's PATH.

**Permanent Fix**: Add the export command to your shell profile (~/.bashrc, ~/.zshrc, etc.).

---

### npm permission errors during installation

**Symptoms**: EACCES or permission denied errors when running `npm install -g beads`.

**Solutions**:

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

**Root Cause**: npm's default global directory requires root permissions on some systems.

**Recommendation**: Always prefer Solution 2 to avoid security issues with sudo.

---

## Initialization Issues

### bd init fails with "not a git repository"

**Symptoms**: Running `bd init` returns an error about not being in a git repository.

**Solution**:

```bash
# Initialize git first
git init
git add .
git commit -m "Initial commit"
bd init --stealth
```

**Root Cause**: Beads requires an existing git repository to function.

**Note**: Use `--stealth` for solo work or `--team` for shared repositories.

---

### Hooks not working after initialization

**Symptoms**: Git commits don't trigger beads sync; hooks appear to be inactive.

**Solution**:

```bash
# Reinstall hooks
bd hooks install

# Verify installation
ls -la .git/hooks/post-commit
cat .git/hooks/post-commit
```

**Root Cause**: Hooks may not have been installed properly, or were overwritten by another tool.

**Verification**: The post-commit hook should contain beads-specific code.

---

### Already initialized but want to switch modes (stealth ↔ team)

**Symptoms**: Need to change from stealth mode to team mode or vice versa.

**Solution for stealth to team**:

```bash
# 1. Remove exclusions from .git/info/exclude
# 2. Add .beads/ and .coder/ to git
git add .beads/ .coder/
git commit -m "Switch to team mode"
```

**Solution for team to stealth**:

```bash
# 1. Remove .beads/ and .coder/ from git
git rm -r --cached .beads/ .coder/
# 2. Add to .git/info/exclude
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
```

**Root Cause**: Mode is determined by whether beads files are tracked in git.

**Warning**: This operation affects repository history. Coordinate with team members in team mode.

---

## Runtime Issues

### bd commands failing with database errors

**Symptoms**: Commands like `bd ready` or `bd list` fail with database-related errors.

**Solution**:

```bash
# Rebuild the local cache
rm .beads/beads.db
bd ready  # Will rebuild cache
```

**Root Cause**: Local SQLite cache became corrupted or out of sync.

**Note**: This only affects the local cache; your issues.jsonl data is safe.

---

### Git hooks not triggering

**Symptoms**: Making commits doesn't trigger beads sync; hooks seem inactive.

**Solution**:

```bash
# Check if hooks are installed
ls -la .git/hooks/

# Reinstall if missing
bd hooks install

# Check if hooks are executable
chmod +x .git/hooks/post-commit
```

**Root Cause**: Hooks may be missing, not executable, or overwritten by another tool.

**Debugging**: Check `.git/hooks/post-commit` content to verify it's the beads hook.

---

### Uncommitted beads changes piling up

**Symptoms**: Multiple beads changes accumulate without being committed to git.

**Solution**:

```bash
# Sync with remote
bd sync

# If sync fails, check status first
bd sync --status

# If remote tracking not set, push manually
git push origin main
```

**Root Cause**: Hooks may not be installed, or git push is not happening automatically.

**Prevention**: Ensure hooks are installed and remote tracking is configured.

---

## Configuration Issues

### Plugin not loading or not active

**Symptoms**: Plugin commands/agents not available; plugin appears inactive in OpenCode.

**Solution**:

```bash
# Check configuration
cat .coder/coder.json

# Ensure it's valid JSON with active: true
echo '{ "active": true }' > .coder/coder.json
```

**Root Cause**: Missing or invalid `.coder/coder.json` file.

**Verification**: Check OpenCode logs for plugin loading errors.

---

### Can't find log files

**Symptoms**: Need to view logs for debugging but can't locate them.

**Solution**:

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

**Root Cause**: Log location varies by operating system.

**Tip**: Use `analyze-opencode-logs` skill to parse logs efficiently.

---

## Agent and Command Issues

### Commands not being recognized

**Symptoms**: Custom commands like `/bd` or `/coder` return "unknown command" errors.

**Solution**:

```bash
# Verify plugin is loaded
# Check that .coder/coder.json exists and is valid

# Verify knowledge-base structure
ls -la knowledge-base/command/
ls -la knowledge-base/agents/
```

**Root Cause**: Plugin not loaded, or knowledge-base structure is incorrect.

**Debugging**: Check OpenCode logs for plugin loading errors.

---

### Beads agents not following instructions

**Symptoms**: Agents don't behave according to their defined roles or instructions.

**Solution**:

```bash
# Check that AGENTS.md is not interfering
# The plugin injects context via hooks, AGENTS.md should be minimal

# Verify hooks are installed
bd hooks install

# Check recent interactions
cat .beads/interactions.jsonl | tail -20
```

**Root Cause**: Conflicting instructions in AGENTS.md or hooks not injecting context.

**Best Practice**: Let the plugin manage agent context; keep AGENTS.md minimal.

---

## Sync and Git Issues

### Beads files showing up in git status (stealth mode)

**Symptoms**: `.beads/` or `.coder/` directories appear in `git status` in stealth mode.

**Solution**:

```bash
# Ensure exclusions are set
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
echo ".opencode/" >> .git/info/exclude

# Verify exclusions
cat .git/info/exclude
```

**Root Cause**: Files not properly excluded from git in stealth mode.

**Note**: Use `.git/info/exclude` instead of `.gitignore` to keep exclusions local.

---

### Beads files not showing up in git status (team mode)

**Symptoms**: Can't commit `.beads/` or `.coder/` changes in team mode.

**Solution**:

```bash
# Ensure files are tracked
git add .beads/ .coder/

# Check .gitignore doesn't exclude them
cat .gitignore

# Only beads.db should be ignored
grep -v "beads.db" .gitignore | grep -q "beads" && echo "Remove .beads/ from .gitignore"
```

**Root Cause**: Files excluded by .gitignore or not tracked in team mode.

**Best Practice**: In team mode, commit `.beads/` and `.coder/` but always exclude `beads.db`.

---

## Performance Issues

### bd commands are slow

**Symptoms**: Commands like `bd ready` or `bd list` take several seconds to complete.

**Solution**:

```bash
# Rebuild cache
rm .beads/beads.db
bd ready

# Check for large issues.jsonl
wc -l .beads/issues.jsonl

# If >10,000 lines, consider archiving closed issues
```

**Root Cause**: Large issues.jsonl file or corrupted cache.

**Prevention**: Periodically archive completed issues in long-running projects.

---

### Large log files filling disk

**Symptoms**: OpenCode logs consuming significant disk space.

**Solution**:

```bash
# Find large logs (Linux/macOS)
du -sh ~/.config/opencode/logs/

# Remove old logs
find ~/.config/opencode/logs/ -name "*.log" -mtime +30 -delete

# Disable debug logging if not needed
unset OPENCODE_DEFAULT_OPTIONS
```

**Root Cause**: Debug logging enabled produces verbose logs that accumulate over time.

**Prevention**: Only enable debug logging when actively troubleshooting.

---

## Getting Additional Help

If your issue isn't covered here:

1. **Enable debug logging** and examine logs using the `analyze-opencode-logs` skill
2. **Run health checks**: `bd doctor` and `bd sync --status`
3. **Search existing issues**: https://github.com/hk9890/opencode-coder/issues
4. **Create a discussion**: https://github.com/hk9890/opencode-coder/discussions
5. **Report a bug**: Use the [Reporting Issues](#reporting-issues) section in SKILL.md

## Pattern Index

For quick reference, common error patterns:

- **"command not found"** → [Installation Issues](#installation-issues)
- **"permission denied"** → [npm permission errors](#npm-permission-errors-during-installation)
- **"not a git repository"** → [Initialization Issues](#initialization-issues)
- **"database error"** → [Runtime Issues](#runtime-issues)
- **Hook problems** → [Git hooks not triggering](#git-hooks-not-triggering)
- **Slow performance** → [Performance Issues](#performance-issues)
- **File visibility** → [Sync and Git Issues](#sync-and-git-issues)
