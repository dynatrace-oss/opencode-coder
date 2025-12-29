---
description: Find ready-to-work beads issues with no blockers
---

Find beads issues that are ready to work on (no blocking dependencies).

Run `bd ready --json` to get a list of unblocked issues. Present them clearly showing:
- Issue ID
- Title  
- Priority (P0=critical, P1=high, P2=medium, P3=low, P4=backlog)
- Issue type

If there are ready tasks, ask which one to work on. If one is chosen, update its status to `in_progress` using `bd update <id> --status in_progress`.

If there are no ready tasks, suggest:
- Check blocked issues with `/bd-blocked`
- Create a new issue with `/bd-create`
