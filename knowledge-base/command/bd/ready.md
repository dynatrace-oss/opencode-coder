---
description: Find ready-to-work tasks with no blockers
---

Use the bd CLI to find tasks that are ready to work on (no blocking dependencies).

Call the `bd ready` command to get a list of unblocked issues. Then present them to the user in a clear format showing:
- Issue ID
- Title
- Priority
- Issue type

If there are ready tasks, ask the user which one they'd like to work on. If they choose one, use the `bd update` command to set its status to `in_progress`.

If there are no ready tasks, suggest checking `blocked` issues or creating a new issue with the `bd create` command.
