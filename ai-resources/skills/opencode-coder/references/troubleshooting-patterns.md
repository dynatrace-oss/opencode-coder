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
   - [Stealth files deleted by git clean](#stealth-files-deleted-by-git-clean)
   - [Stealth mode not detected on re-run](#stealth-mode-not-detected-on-re-run)
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
ls -la .git/hooks/pre-commit
cat .git/hooks/pre-commit
```

**Root Cause**: Hooks may not have been installed properly, or were overwritten by another tool.

**Verification**: The pre-commit hook should contain beads-specific code.

---

### Already initialized but want to switch modes (stealth ↔ team)

**Symptoms**: Need to change from stealth mode to team mode or vice versa.

**Solution for stealth to team**:

```bash
# 1. Copy stealth docs to standard locations
cp -r .coder/docs/ ./docs/

# 2. Move .coder/AGENTS.md to the project root
cp .coder/AGENTS.md ./AGENTS.md

# 3. Update AGENTS.md to reference docs/ instead of .coder/docs/
# (manually update paths in AGENTS.md)

# 4. Remove stealth block from .git/info/exclude
# (remove the "# opencode-coder stealth mode" block and the 4 lines following it)

# 5. Clean up stealth workspace
rm -rf .coder/

# 6. Stage and commit
git add .beads/ AGENTS.md ai.package.yaml docs/
git commit -m "chore: switch to team mode"
```

**Solution for team to stealth**:

```bash
# 1. Create stealth workspace
mkdir -p .coder/docs

# 2. Copy docs to stealth workspace
cp docs/CODING.md docs/TESTING.md docs/RELEASING.md docs/MONITORING.md docs/PULL-REQUESTS.md .coder/docs/ 2>/dev/null

# 3. Update AGENTS.md to reference .coder/docs/ paths

# 4. Remove tracked files from git index
git rm -r --cached .beads/ AGENTS.md ai.package.yaml
git rm --cached docs/CODING.md docs/TESTING.md docs/RELEASING.md docs/MONITORING.md docs/PULL-REQUESTS.md 2>/dev/null
git commit -m "chore: switch to stealth mode"

# 5. Add stealth exclusion block
if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
STEALTH
fi
```

**Root Cause**: Mode is determined by whether files are tracked in git AND whether the stealth marker exists in `.git/info/exclude`.

**Warning**: Team-to-stealth creates a visible commit that removes AI-related files. This commit is visible in git history and may reveal that AI tooling was previously used. Coordinate with team members before switching modes.

---

### Stealth files deleted by git clean

**Symptoms**: `.coder/`, `.beads/`, or ai.package.yaml disappeared after running `git clean`.

**Solution**:

```bash
# Re-run /init to restore stealth setup
# Issue data in .beads/issues.jsonl is lost if .beads/ was deleted
```

**Root Cause**: `git clean -fdx` removes files matched by exclude patterns, including stealth-excluded files. Note: `git clean -fd` does NOT remove excluded files — only `-x` or `-X` flags cause that.

**Prevention**: Avoid `git clean -fdx` in stealth mode. Use `git clean -fd` instead (safe for stealth files). If you must use `-x`, exclude stealth directories: `git clean -fdx -e .beads/ -e .coder/ -e .opencode/`.

---

### Stealth mode not detected on re-run

**Symptoms**: `/init` asks stealth vs team even though stealth was previously configured.

**Solution**: Check `.git/info/exclude` for the stealth marker:

```bash
grep "# opencode-coder stealth mode" .git/info/exclude
```

If marker is missing but `.coder/` exists, re-add the exclusion block manually or re-run `/init` and choose stealth.

**Root Cause**: Detection relies on the marker comment in `.git/info/exclude`. If someone manually edited the exclude file and removed the marker, detection fails.

**Robust detection**: Multi-signal — marker present OR (`.beads/` exists AND `.coder/` exists AND neither is tracked).

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
chmod +x .git/hooks/pre-commit
```

**Root Cause**: Hooks may be missing, not executable, or overwritten by another tool.

**Debugging**: Check `.git/hooks/pre-commit` content to verify it's the beads hook.

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
# Check if plugin is disabled
echo $OPENCODE_CODER_DISABLED

# If "true", enable it by unsetting or setting to false
unset OPENCODE_CODER_DISABLED
# or
export OPENCODE_CODER_DISABLED=false
```

**Root Cause**: `OPENCODE_CODER_DISABLED` environment variable is set to "true".

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

**Tip**: Load the internal plugin development skill to parse logs efficiently using its log-analyzer reference.

---

## Agent and Command Issues

### Commands not being recognized

**Symptoms**: Custom commands like `/bd` or `/coder` return "unknown command" errors.

**Solution**:

```bash
# Verify plugin is not disabled
echo $OPENCODE_CODER_DISABLED
# Should be empty or "false"

# Verify ai-resources structure
ls -la ai-resources/commands/
ls -la ai-resources/agents/
```

**Root Cause**: Plugin not loaded, or ai-resources structure is incorrect.

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

**Symptoms**: `.beads/`, `.coder/`, or `ai.package.yaml` appear in `git status` in stealth mode.

**Also applies in team mode**: `.coder/project.yaml` showing as modified in `git status` — this is a known case. The plugin regenerates `.coder/project.yaml` on every startup with changing `detectedAt` timestamps and runtime flags, so it will always appear dirty unless excluded.

**Solution (stealth mode):**

```bash
# Add the full stealth exclusion block if missing
if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
STEALTH
fi

# Verify exclusions
cat .git/info/exclude
```

**Solution (team mode — `.coder/project.yaml` showing as dirty):**

The plugin auto-creates `.coder/.gitignore` (containing `*`) on startup. If your project was initialized before this fix, add `.coder/` to `.gitignore`:

```bash
grep -qF '.coder/' .gitignore 2>/dev/null || echo '.coder/' >> .gitignore
git rm -r --cached .coder/ 2>/dev/null  # Remove from tracking if already committed
git commit -m "chore: exclude .coder/ runtime state from git"
```

**Root Cause**: Files not properly excluded from git. In stealth mode, the full stealth exclusion block may be missing or incomplete. In team mode, `.coder/` is plugin-generated runtime state that should never be committed. Note: `.coder/AGENTS.md` is covered by the `.coder/` exclusion — no separate `AGENTS.md` entry is needed.

**Note**: Use `.git/info/exclude` instead of `.gitignore` to keep exclusions local and invisible to other developers.

---

### Beads files not showing up in git status (team mode)

**Symptoms**: Can't commit `.beads/` changes in team mode.

**Solution**:

```bash
# Ensure files are tracked
git add .beads/

# Check .gitignore doesn't exclude them
cat .gitignore

# Only beads.db should be ignored
grep -v "beads.db" .gitignore | grep -q "beads" && echo "Remove .beads/ from .gitignore"
```

**Root Cause**: Files excluded by .gitignore or not tracked in team mode.

**Best Practice**: In team mode, commit `.beads/` but always exclude `beads.db`.

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

1. **Enable debug logging** and examine logs by loading the internal plugin development skill
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
- **Stealth files missing after git clean** → [Stealth files deleted by git clean](#stealth-files-deleted-by-git-clean)
- **Stealth mode not detected** → [Stealth mode not detected on re-run](#stealth-mode-not-detected-on-re-run)
- **Switch stealth ↔ team** → [Already initialized but want to switch modes](#already-initialized-but-want-to-switch-modes-stealth--team)
