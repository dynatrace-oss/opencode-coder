---
description: Update a beads issue
---

Update one or more fields on a beads issue.

Arguments:
- $1: Issue ID (required)
- $2+: Field updates

Examples:
- `/bd-update oc-a1b2 in_progress` - Set status to in_progress
- `/bd-update oc-a1b2 --priority 0` - Set to P0 critical
- `/bd-update oc-a1b2 --notes "Found edge case"` - Add notes

Common updates:
```bash
bd update <id> --status in_progress   # Start working
bd update <id> --status open          # Pause work
bd update <id> --priority <0-4>       # Change priority
bd update <id> --notes "<text>"       # Add notes (appends)
bd update <id> --title "<new title>"  # Change title
```

If only issue ID is provided, ask what to update.
