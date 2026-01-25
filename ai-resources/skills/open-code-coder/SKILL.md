---
name: using-coder-plugin
description: Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when the AI assistant needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync
---

# Using the Coder Plugin

This skill provides comprehensive guidance for installing, configuring, and troubleshooting the opencode-coder plugin. Use this when users need help with plugin setup, debugging issues, or understanding how the plugin works.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
3. [Debug Logging & Log Analysis](#debug-logging--log-analysis)
4. [Status & Health Checks](#status--health-checks)
5. [Reporting Issues](#reporting-issues)
6. [Common Problems & Solutions](#common-problems--solutions)

---

## Installation & Setup

Get started with the opencode-coder plugin by installing dependencies and initializing your project.

### Overview

The coder plugin requires:
- **bd CLI**: Issue tracking and workflow management
- **Beads initialization**: Project-level setup (stealth or team mode)
- **Coder configuration**: Plugin activation and settings

### Quick Start

```bash
# 1. Install bd CLI globally
npm install -g beads

# 2. Initialize project (stealth mode - recommended)
bd init --stealth && bd hooks install

# 3. Create coder config
mkdir -p .coder
echo '{ "active": true }' > .coder/coder.json

# 4. Verify
bd ready
```

### Key Topics

- **Installation**: Installing bd CLI, verifying installation, upgrading dependencies
- **Initialization**: Stealth vs team mode, git hooks setup, file structure
- **Configuration**: `.coder/coder.json` format and options

**See [references/installation-setup.md](references/installation-setup.md) for detailed installation and initialization guide.**

---

## Troubleshooting & Diagnostics

Diagnose and resolve issues with the coder plugin.

### Running Health Checks

The plugin includes comprehensive health checks to verify:

1. **Coder Config**: `.coder/coder.json` exists and is valid
2. **Beads**: `.beads/` directory and `bd doctor` status
3. **Git Hooks**: Hooks are installed and executable
4. **Git Sync**: No uncommitted beads changes

### Quick Diagnostics

```bash
# Check bd CLI
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

### Understanding bd doctor Output

Filter `bd doctor` suggestions:

| bd doctor suggestion | Action |
|---------------------|--------|
| Install git hooks | Run `bd hooks install` |
| Set upstream | Optional - not critical for local use |
| Upgrade CLI (curl script) | **Ignore** - Use `npm install -g beads` instead |

**Important**: Never use curl/bash upgrade method. Always use npm for beads updates.

### Advanced Diagnostics

For deep log analysis, the plugin includes a powerful log analyzer tool with:
- Interactive session/process browsing with fzf
- Filtering by session, process, service, and log level
- JSON export for programmatic analysis

**See [references/debugging-logs.md](references/debugging-logs.md) for log analysis guide.**

---

## Debug Logging & Log Analysis

Enable debug logging and analyze OpenCode logs for troubleshooting.

### Enabling Debug Logging

```bash
# General OpenCode debug logging
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"

# Plugin-specific debug logging
export OPENCODE_CODER_DEBUG=1
```

**When to use each:**

| Variable | What it shows | When to use |
|----------|---------------|-------------|
| `OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"` | All OpenCode internals, all plugins | General troubleshooting |
| `OPENCODE_CODER_DEBUG=1` | Only opencode-coder plugin messages | Plugin-specific debugging |
| Both together | Full context with plugin details | Complex issues |

### Log File Locations

- **Linux**: `~/.config/opencode/logs/`
- **macOS**: `~/Library/Logs/opencode/`
- **Windows**: `%APPDATA%\opencode\logs\`

### Quick Log Analysis

```bash
# Find recent log files
ls -lt ~/.config/opencode/logs/ | head -5

# Search for errors
grep -i "error" ~/.config/opencode/logs/*.log

# Search for plugin messages (when OPENCODE_CODER_DEBUG=1)
grep "opencode-coder" ~/.config/opencode/logs/*.log
```

### Advanced Log Analyzer

The plugin includes a CLI tool for powerful log analysis:

```bash
# Interactive mode (requires fzf)
bun run scripts/log-analyzer

# List sessions
bun run scripts/log-analyzer list sessions

# Analyze specific session
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR,WARN

# Filter by service
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder
```

**See [references/debugging-logs.md](references/debugging-logs.md) for complete logging and analysis guide.**

---

## Status & Health Checks

Monitor the health and status of your coder plugin installation.

### Quick Health Check

```bash
# Verify bd CLI is available
bd --version

# Verify project is initialized
ls .beads .coder

# Verify git hooks are installed
ls .git/hooks/post-commit
```

### Complete Health Check

Run a comprehensive check of all components:

```bash
# Check coder config
test -f .coder/coder.json && echo "Coder config: OK" || echo "Coder config: MISSING"

# Check beads
test -d .beads && bd doctor || echo "Beads: NOT INITIALIZED"

# Check git hooks
test -f .git/hooks/post-commit && echo "Git hooks: OK" || echo "Git hooks: MISSING"

# Check sync status
bd sync --status
```

### Component Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| OK | Component working correctly | None |
| MISSING | Component not installed | Run initialization |
| INVALID | Component exists but has errors | Fix configuration |
| WARN | Component has warnings | Review and fix if needed |

### Version Checking

```bash
# Check versions
bd --version
node --version
npm list -g opencode-coder

# Check for updates
npm outdated -g beads opencode-coder
```

### Regular Maintenance

**Daily (when active):**
- Check for uncommitted changes: `bd sync --status`

**Weekly:**
- Verify hooks: `ls .git/hooks/`
- Check for updates: `npm outdated -g beads`

**After Updates:**
- Run full health check
- Test basic commands

**See [references/status-health.md](references/status-health.md) for comprehensive health check guide.**

---

## Reporting Issues

Report bugs and issues with the opencode-coder plugin (not your project code).

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
- Configuration issues with your project

### Before Reporting

1. Enable debug logging (see [Debug Logging](#debug-logging--log-analysis))
2. Run health checks (see [Status & Health Checks](#status--health-checks))
3. Collect information:
   - What command or feature you were using
   - Expected vs actual behavior
   - Error messages or outputs
   - Steps to reproduce

### Information to Include

A good bug report includes:

1. **Component**: What part of the plugin (bd CLI, agent, command)
2. **Expected behavior**: What should have happened
3. **Actual behavior**: What actually happened
4. **Steps to reproduce**: How to trigger the issue
5. **Environment**: OS, Node.js version, bd version, plugin version
6. **Logs**: Relevant log excerpts with debug logging enabled
7. **Context**: What you were trying to accomplish

### Creating a GitHub Issue

Issues should be reported to: https://github.com/hk9890/opencode-coder

**Quick report pattern:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body "Problem: ...\nSteps: ...\nEnvironment: ..."
```

**Use descriptive titles with component in brackets:**
- `[bd ready] Returns empty when issues exist`
- `[plugin] Knowledge-base fails to load custom commands`
- `[agent] Task agent doesn't follow closing rules`

### Issue Classification

**Plugin Issues** (create GitHub issue):
- bd CLI errors
- Plugin loading failures
- Agent behavior issues
- Documentation gaps

**Project Issues** (do NOT create GitHub issue):
- Your own code bugs
- Build/test failures in your project
- Configuration issues with your project

**See [references/bug-reporting.md](references/bug-reporting.md) for detailed bug reporting guide.**

---

## Common Problems & Solutions

Quick solutions to the most frequently encountered issues.

### Most Common Issues

**Problem: bd command not found after installation**

```bash
# Quick fix: Add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Permanent fix: Add to ~/.bashrc or ~/.zshrc
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
```

**Problem: Git hooks not triggering**

```bash
# Reinstall hooks
bd hooks install

# Verify they're executable
chmod +x .git/hooks/post-commit
```

**Problem: bd commands failing with database errors**

```bash
# Rebuild the local cache
rm .beads/beads.db
bd ready  # Will rebuild cache
```

### Issue Categories

For detailed solutions, see **[references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)**:

- **Installation Issues**: PATH problems, npm permissions
- **Initialization Issues**: Git requirements, hook installation, mode switching
- **Runtime Issues**: Database errors, hook failures, sync problems
- **Configuration Issues**: Plugin activation, log file locations
- **Agent and Command Issues**: Command recognition, agent behavior
- **Sync and Git Issues**: File visibility in stealth vs team mode
- **Performance Issues**: Slow commands, large log files

### Getting Additional Help

If your issue isn't covered:

1. **Check detailed patterns**: [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)
2. **Enable debug logging**: `export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"`
3. **Run health checks**: `bd doctor` and `bd sync --status`
4. **Search issues**: https://github.com/hk9890/opencode-coder/issues
5. **Create discussion**: https://github.com/hk9890/opencode-coder/discussions
6. **Report bug**: See [Reporting Issues](#reporting-issues)

---

## Summary

This skill covers the complete lifecycle of using the opencode-coder plugin:

1. **Install** the bd CLI via npm
2. **Initialize** your project (stealth or team mode)
3. **Configure** the plugin with `.coder/coder.json`
4. **Troubleshoot** issues using health checks and diagnostics
5. **Debug** with proper logging and log analysis
6. **Report** plugin issues to GitHub
7. **Monitor** status and health regularly
8. **Resolve** common problems quickly

### Reference Documentation

- [Installation & Setup Guide](references/installation-setup.md) - Complete installation and initialization
- [Debug Logging & Log Analysis](references/debugging-logs.md) - Enable logging and analyze logs
- [Status & Health Checks](references/status-health.md) - Monitor plugin health
- [Bug Reporting Guide](references/bug-reporting.md) - Report issues effectively
- [Troubleshooting Patterns](references/troubleshooting-patterns.md) - Detailed problem solutions

For the latest documentation and updates, visit: https://github.com/hk9890/opencode-coder
