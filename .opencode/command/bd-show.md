---
description: Show detailed information about a beads issue
---

Display detailed information about a beads issue.

If an issue ID is provided as $ARGUMENTS, use it. Otherwise, ask the user for the issue ID.

Run `bd show <id> --json` to retrieve issue details and present them clearly, including:
- Issue ID, title, and description
- Status, priority, and type
- Creation and update timestamps
- Dependencies (what this issue blocks or is blocked by)
- Related issues
- Notes/comments

If the issue has dependencies, offer to show related issues.
