---
description: Find ready-to-work tasks with no blockers
---

Run bd ready to find tasks that are ready to work on (no blocking dependencies).

Call bd ready to get a list of unblocked issues. Then present them to the user in a clear format showing:
- Issue ID
- Title
- Priority
- Issue type

If there are ready tasks, ask the user which one they'd like to work on. If they choose one, run bd update <id> --status=in_progress to set its status to `in_progress`.

If there are no ready tasks, suggest checking blocked issues with bd blocked or creating a new issue with bd create.
