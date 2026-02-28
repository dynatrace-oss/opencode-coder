---
name: opencode-coder
description: "Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when the AI assistant needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync, (8) Plan and create beads issues (epics, tasks, gates), (9) Reference the bd CLI commands"
---

# opencode-coder Skill

Reference hub for the opencode-coder plugin. Load specific documents based on what you need.

## When to Load What

| Need | Load |
|------|------|
| Create epics, tasks, gates, plan work | [references/planning.md](references/planning.md) |
| bd CLI commands and syntax | [references/cli-reference.md](references/cli-reference.md) |
| Install or initialize beads/plugin | [references/installation-setup.md](references/installation-setup.md) |
| Debug plugin or analyze logs | [references/debugging-logs.md](references/debugging-logs.md) |
| Check system/plugin health | [references/status-health.md](references/status-health.md) |
| Report a plugin bug | [references/bug-reporting.md](references/bug-reporting.md) |
| Troubleshoot common problems | [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md) |
| Generate or update AGENTS.md | [references/agents-md-template.md](references/agents-md-template.md) |

## Quick Setup

```bash
npm install -g beads                         # Install bd CLI
bd init --stealth && bd hooks install        # Initialize project
bd ready                                     # Verify
```

## Quick Troubleshooting

```bash
bd --version                    # Check bd CLI
bd doctor                       # Check beads health
bd sync --status                # Check sync status
ls -la .git/hooks/              # Verify git hooks
echo $OPENCODE_CODER_DISABLED   # Check plugin status
```

**bd not found?**
```bash
export PATH="$(npm bin -g):$PATH"
```

**Git hooks not triggering?**
```bash
bd hooks install && chmod +x .git/hooks/pre-commit
```

**Database errors?**
```bash
rm .beads/beads.db && bd ready
```

## Debug Logging

```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"  # All OpenCode internals
export OPENCODE_CODER_DEBUG=1                        # Plugin messages only
```

**Log Locations**: Linux `~/.config/opencode/logs/`, macOS `~/Library/Logs/opencode/`

## Reporting Issues

Report plugin issues (bd CLI, knowledge-base, agents, docs) to: https://github.com/hk9890/opencode-coder

See [references/bug-reporting.md](references/bug-reporting.md) for detailed guide.

## Init Command (/init)

The `/init` command handles complete project setup:
1. **Skill discovery** — analyze project type, suggest relevant skills via `aimgr`
2. **Beads initialization** — `bd init`, hooks setup
3. **AGENTS.md creation** — generate or update based on project and installed skills

See [references/installation-setup.md](references/installation-setup.md) for full guide.
See [references/agents-md-template.md](references/agents-md-template.md) for AGENTS.md template.
