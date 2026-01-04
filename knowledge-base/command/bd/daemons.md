---
description: Daemon Management
argument-hint: [subcommand]
---

Manage bd daemon processes across all repositories and worktrees.

## Synopsis

```bash
bd daemons <subcommand> [flags]
```

## Description

The `bd daemons` command provides tools for discovering, monitoring, and managing multiple bd daemon processes across your system. This is useful when working with multiple repositories or git worktrees.

## Subcommands

### list

List all running bd daemons with metadata.

```bash
bd daemons list [--search DIRS] [--json] [--no-cleanup]
```

**Flags:**
- `--search` - Directories to search for daemons (default: home, /tmp, cwd)
- `--json` - Output in JSON format
- `--no-cleanup` - Skip auto-cleanup of stale sockets

### health

Check health of all bd daemons and report issues.

```bash
bd daemons health [--search DIRS] [--json]
```

Reports:
- Stale sockets (dead processes)
- Version mismatches between daemon and CLI
- Unresponsive daemons

### stop

Stop a specific daemon gracefully.

```bash
bd daemons stop <workspace-path|pid> [--json]
```

### restart

Restart a specific daemon gracefully.

```bash
bd daemons restart <workspace-path|pid> [--search DIRS] [--json]
```

### logs

View logs for a specific daemon.

```bash
bd daemons logs <workspace-path|pid> [-f] [-n LINES] [--json]
```

**Flags:**
- `-f, --follow` - Follow log output (like tail -f)
- `-n, --lines INT` - Number of lines to show from end (default: 50)

### killall

Stop all running bd daemons.

```bash
bd daemons killall [--search DIRS] [--force] [--json]
```

## Common Use Cases

### Version Upgrade

After upgrading bd, restart all daemons to use the new version:

```bash
bd daemons health  # Check for version mismatches
bd daemons killall # Stop all old daemons
# Daemons will auto-start with new version on next bd command
```

### Debugging

Check daemon status and view logs:

```bash
bd daemons list
bd daemons health
bd daemons logs /path/to/workspace -n 100
```

### Cleanup

Remove stale daemon sockets:

```bash
bd daemons list  # Auto-cleanup happens by default
```
