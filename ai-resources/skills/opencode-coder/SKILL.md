---
name: opencode-coder
description: "Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when the AI assistant needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync"
---

# Using the Coder Plugin

Guide for installing, configuring, and troubleshooting the opencode-coder plugin.

## Table of Contents

1. [Installation & Setup](#installation--setup)
2. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
3. [Debug Logging & Log Analysis](#debug-logging--log-analysis)
4. [Status & Health Checks](#status--health-checks)
5. [Reporting Issues](#reporting-issues)
6. [Common Problems & Solutions](#common-problems--solutions)

---

## Installation & Setup

### Quick Start

```bash
# Install bd CLI globally
npm install -g beads

# Initialize project (stealth mode - recommended)
bd init --stealth && bd hooks install

# Verify
bd ready
```

### Key Components

- **bd CLI**: Issue tracking and workflow management
- **Beads initialization**: Stealth vs team mode, git hooks
- **Configuration**: `OPENCODE_CODER_DISABLED`, `BEADS_AUTO_APPROVE` environment variables

**See [references/installation-setup.md](references/installation-setup.md) for detailed guide.**

---

## Troubleshooting & Diagnostics

### Quick Diagnostics

```bash
bd --version                    # Check bd CLI
bd doctor                       # Check beads health
bd sync --status                # Check sync status
ls -la .git/hooks/              # Verify git hooks
echo $OPENCODE_CODER_DISABLED   # Check plugin status
```

**Understanding bd doctor**: Run `bd hooks install` if it suggests installing hooks. Ignore curl/bash upgrade suggestions - use `npm install -g beads` instead. Setting upstream is optional.

**Advanced Analysis**: See [references/debugging-logs.md](references/debugging-logs.md) for log analyzer tool.

---

## Debug Logging & Log Analysis

### Enable Debug Logging

```bash
# All OpenCode internals - General troubleshooting
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"

# Plugin messages only - Plugin-specific debugging
export OPENCODE_CODER_DEBUG=1
```

### Log Locations

- **Linux**: `~/.config/opencode/logs/`
- **macOS**: `~/Library/Logs/opencode/`
- **Windows**: `%APPDATA%\opencode\logs\`

### Quick Analysis

```bash
ls -lt ~/.config/opencode/logs/ | head -5                 # Recent logs
grep -i "error" ~/.config/opencode/logs/*.log             # Find errors
grep "opencode-coder" ~/.config/opencode/logs/*.log       # Plugin messages
```

### Log Analyzer Tool

```bash
bun run scripts/log-analyzer                                    # Interactive mode
bun run scripts/log-analyzer list sessions                      # List sessions
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR   # Filter by level
```

**See [references/debugging-logs.md](references/debugging-logs.md) for complete guide.**

---

## Status & Health Checks

### Quick Check

```bash
bd --version                     # CLI available
ls .beads                        # Project initialized
ls .git/hooks/pre-commit         # Hooks installed
bd sync --status                 # Sync status
```

### Complete Check

```bash
[ "$OPENCODE_CODER_DISABLED" = "true" ] && echo "DISABLED" || echo "ACTIVE"
test -d .beads && bd doctor || echo "NOT INITIALIZED"
test -f .git/hooks/pre-commit && echo "OK" || echo "MISSING"
bd sync --status
```

### Maintenance

- **Daily**: `bd sync --status`
- **Weekly**: Verify hooks, check updates (`npm outdated -g beads`)
- **After updates**: Run health check

**See [references/status-health.md](references/status-health.md) for comprehensive guide.**

---

## Reporting Issues

**Report plugin issues only** (bd CLI, knowledge-base, agents, docs). Don't report your project code bugs.

### Process

1. Enable debug logging
2. Run health checks
3. Report to: https://github.com/hk9890/opencode-coder

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body "Problem: ...\nSteps: ...\nEnvironment: ..."
```

**Include**: Component, expected vs actual behavior, reproduction steps, environment (OS, Node.js, bd version), log excerpts, context.

**See [references/bug-reporting.md](references/bug-reporting.md) for detailed guide.**

---

## Common Problems & Solutions

### Quick Fixes

**bd command not found**
```bash
export PATH="$(npm bin -g):$PATH"                           # Quick
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc      # Permanent
```

**Git hooks not triggering**
```bash
bd hooks install && chmod +x .git/hooks/pre-commit
```

**Database errors**
```bash
rm .beads/beads.db && bd ready
```

### More Solutions

**See [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)** for installation, initialization, runtime, configuration, agent, sync, and performance issues.

### Help

1. Check [troubleshooting-patterns.md](references/troubleshooting-patterns.md)
2. Enable debug: `export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"`
3. Run `bd doctor` and `bd sync --status`
4. Search or report: https://github.com/hk9890/opencode-coder

---

## Reference Documentation

- [Installation & Setup Guide](references/installation-setup.md)
- [Debug Logging & Log Analysis](references/debugging-logs.md)
- [Status & Health Checks](references/status-health.md)
- [Bug Reporting Guide](references/bug-reporting.md)
- [Troubleshooting Patterns](references/troubleshooting-patterns.md)

https://github.com/hk9890/opencode-coder
