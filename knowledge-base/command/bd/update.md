---
description: Update an issue's status, priority, or other fields
argument-hint: [issue-id] [status]
---

Update a beads issue.

If arguments are provided:
- $1: Issue ID
- $2: New status (open, in_progress, blocked, closed)

If arguments are missing, ask the user for:
1. Issue ID
2. What to update (status, priority, assignee, title, description)
3. New value

Run `bd update <issue-id> --status <status>` (or other flags like `--priority`, `--assignee`, `--title`) to apply the changes. Show the updated issue to confirm the change.

**Note:** Comments are managed separately with `bd comments add`. The `update` command is for singular, versioned properties (title, status, priority, etc.), while comments form a discussion thread that's appended to, not updated.

Common workflows:
- Start work: `bd update <id> --status in_progress`
- Mark blocked: `bd update <id> --status blocked`
- Reprioritize: `bd update <id> --priority 1`
