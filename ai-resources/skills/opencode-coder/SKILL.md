---
name: opencode-coder
description: "Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when the AI assistant needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync"
---

# Using the Coder Plugin

Guide for installing, configuring, and troubleshooting the opencode-coder plugin.

## Installation & Setup

```bash
npm install -g beads                         # Install bd CLI
bd init --stealth && bd hooks install        # Initialize project
bd ready                                     # Verify
```

**Key Components**: bd CLI (issue tracking), beads initialization (stealth/team mode, git hooks), environment variables (`OPENCODE_CODER_DISABLED`, `BEADS_AUTO_APPROVE`)

**See [references/installation-setup.md](references/installation-setup.md) for detailed guide.**

---

## Troubleshooting & Diagnostics

```bash
bd --version                    # Check bd CLI
bd doctor                       # Check beads health
bd sync --status                # Check sync status
ls -la .git/hooks/              # Verify git hooks
echo $OPENCODE_CODER_DISABLED   # Check plugin status
```

**Understanding bd doctor**: Run `bd hooks install` if it suggests installing hooks. Ignore curl/bash upgrade suggestions - use `npm install -g beads` instead.

**See [references/debugging-logs.md](references/debugging-logs.md) for log analyzer tool.**

---

## Debug Logging

```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"  # All OpenCode internals
export OPENCODE_CODER_DEBUG=1                        # Plugin messages only
```

**Log Locations**: Linux `~/.config/opencode/logs/`, macOS `~/Library/Logs/opencode/`, Windows `%APPDATA%\opencode\logs\`

```bash
ls -lt ~/.config/opencode/logs/ | head -5            # Recent logs
grep -i "error" ~/.config/opencode/logs/*.log        # Find errors
```

**See [references/debugging-logs.md](references/debugging-logs.md) for complete guide.**

---

## Status & Health Checks

```bash
bd --version                     # CLI available
ls .beads                        # Project initialized
ls .git/hooks/pre-commit         # Hooks installed
bd sync --status                 # Sync status
```

**Maintenance**: Daily `bd sync --status`, weekly verify hooks and check updates (`npm outdated -g beads`)

**See [references/status-health.md](references/status-health.md) for comprehensive guide.**

---

## Reporting Issues

**Report plugin issues only** (bd CLI, knowledge-base, agents, docs). Don't report your project code bugs.

1. Enable debug logging
2. Run health checks  
3. Report to: https://github.com/hk9890/opencode-coder

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body "Problem: ...\nSteps: ...\nEnvironment: ..."
```

**See [references/bug-reporting.md](references/bug-reporting.md) for detailed guide.**

---

## Common Problems & Solutions

**bd command not found**
```bash
export PATH="$(npm bin -g):$PATH"                      # Quick fix
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc  # Permanent
```

**Git hooks not triggering**
```bash
bd hooks install && chmod +x .git/hooks/pre-commit
```

**Database errors**
```bash
rm .beads/beads.db && bd ready
```

**See [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)** for more solutions.

---

## Reference Documentation

- [Installation & Setup Guide](references/installation-setup.md)
- [Debug Logging & Log Analysis](references/debugging-logs.md)
- [Status & Health Checks](references/status-health.md)
- [Bug Reporting Guide](references/bug-reporting.md)
- [Troubleshooting Patterns](references/troubleshooting-patterns.md)

https://github.com/hk9890/opencode-coder
