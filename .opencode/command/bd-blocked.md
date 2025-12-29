---
description: Show blocked beads issues
---

Show all beads issues that are blocked by dependencies.

Run `bd blocked --json` to see which issues have blockers preventing them from being worked on.

This is the inverse of `/bd-ready` - it shows what's NOT ready to work on.

For each blocked issue, show:
- Issue ID and title
- What is blocking it (the blocker issue IDs and titles)
- Priority

This helps understand:
- Why work is stuck
- Identifying critical path items
- Planning dependency resolution

Suggest which blocking issues should be tackled first to unblock the most work.
