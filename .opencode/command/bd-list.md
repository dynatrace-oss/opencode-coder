---
description: List beads issues with filters
---

List beads issues with optional filters.

Run `bd list` with filters based on $ARGUMENTS:
- No args: `bd list --status open --limit 20` (default: open issues, limited)
- `all`: `bd list --limit 50`
- `closed`: `bd list --status closed --limit 20`
- `p0` or `critical`: `bd list --priority 0`
- `bugs`: `bd list --type bug`

Examples:
- `/bd-list` - Show open issues
- `/bd-list all` - Show all issues
- `/bd-list p0` - Show critical priority issues
- `/bd-list bugs` - Show bug issues

Present results in a clear table format with:
- ID, Title, Status, Priority, Type

Note: Always use `--limit` to avoid context blowout. Default to 20 items max.
