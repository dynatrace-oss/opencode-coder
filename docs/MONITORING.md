# Monitoring Configuration

This document describes how to analyze monitoring data for the
opencode-coder plugin.

## How to Get Monitoring Data

### OpenCode Logs

OpenCode stores logs in `~/.local/state/opencode/log/`. The log-analyzer
script parses these structured logs.

#### List Recent Sessions

```bash
bun run scripts/log-analyzer list sessions
```

This shows all recent OpenCode sessions with timestamps and session IDs.

#### Get Errors and Warnings

```bash
bun run scripts/log-analyzer --session=<session-id> --level=ERROR,WARN --json
```

Replace `<session-id>` with the actual session ID from the list. Use
`--json` for structured output that's easier to parse programmatically.

#### Filter by Service

```bash
# Plugin loading issues
bun run scripts/log-analyzer --session=<session-id> \
  --service=opencode-coder --level=ERROR,WARN

# Beads-related issues
bun run scripts/log-analyzer --session=<session-id> \
  --service=beads --level=ERROR,WARN

# Agent execution issues
bun run scripts/log-analyzer --session=<session-id> \
  --service=agent --level=ERROR,WARN
```

#### Recent Errors Across All Sessions

```bash
# Get the 3 most recent sessions and check each for errors
bun run scripts/log-analyzer list sessions | head -5
```

Then query each session for errors.

## What to Look For

### Critical (needs immediate attention)

- **Plugin loading failures** — Errors from `service=opencode-coder`
  during startup
  - "Failed to load plugin" or "Plugin initialization error"
  - These prevent the plugin from functioning at all

- **Beads sync failures** — Errors from `service=beads` or services
  containing "beads"
  - "Sync failed" or "Failed to sync"
  - Git operation failures during sync
  - These can cause data loss or inconsistent state

- **Agent execution crashes** — Errors from `service=agent`
  - Unhandled exceptions during agent execution
  - Tool execution failures

### Important (should be tracked)

- **Warnings that recur frequently** — Any WARN level message appearing
  multiple times
  - May indicate a pattern or systematic issue

- **Tool execution warnings** — Problems running tools like `bd` commands
  - May indicate misconfiguration or missing dependencies

- **File system errors** — Permission issues, missing directories
  - Can affect beads storage or plugin functionality

### Can Usually Ignore

- **Single INFO messages** — Normal operational logging
- **Transient network errors** — One-off connection issues that don't
  repeat
- **Debug-level output** — Only relevant when actively debugging

## Analysis Tips

### Grouping Issues

Multiple log entries about the same underlying problem should be grouped:

- Same error message repeated = one issue with occurrence count
- Related errors in sequence = likely one root cause

### Severity Assessment

- Errors during plugin load or beads sync = high priority
- Warnings that repeat across sessions = medium priority
- One-off errors that don't recur = low priority (may be transient)

### Context to Capture

When creating bugs from log analysis, include:

- Session ID and timestamp
- Full error message
- Service/component affected
- Frequency (how many occurrences)
- Any preceding warnings that might indicate root cause
