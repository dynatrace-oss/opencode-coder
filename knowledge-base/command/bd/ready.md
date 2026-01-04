---
description: Find ready-to-work tasks with no blockers
---

Find tasks that are ready to work on (no blocking dependencies).

Run `bd ready` to get a list of unblocked issues. Present them to the user in a clear format showing:
- Issue ID
- Title
- Priority
- Issue type

If there are ready tasks, ask the user which one they'd like to work on. If they choose one, run `bd update <id> --status in_progress` to claim it.

If there are no ready tasks, suggest checking `bd blocked` to see blocked issues or `bd create` to create a new issue.
