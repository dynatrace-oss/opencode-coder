---
description: Create a new beads issue
---

Create a new beads issue. If arguments are provided:
- $1: Issue title
- $2: Issue type (bug, feature, task, epic, chore) - default: task
- $3: Priority (0-4, where 0=critical, 4=backlog) - default: 2

Example: `/bd-create "Fix login bug" bug 1`

If arguments are missing, ask the user for:
1. Issue title (required)
2. Issue type (default: task)
3. Priority (default: 2)
4. Description (optional)

Use `bd create "<title>" --type <type> --priority <priority>` to create the issue.

Show the created issue ID and details. Optionally ask if this issue should be linked to another issue using:
- `--deps discovered-from:<id>` - Found while working on another issue
- `--deps blocks:<id>` - This issue blocks another
- `--parent <id>` - This is a subtask of an epic
