---
description: Close a completed beads issue
---

Close a beads issue that's been completed.

Arguments:
- $1: Issue ID (required)
- $2+: Completion reason (optional)

Example: `/bd-close oc-a1b2 "Implemented and tested"`

If the issue ID is missing, ask for it. Optionally ask for a reason describing what was done.

Run `bd close <id> --reason "<reason>"` to close the issue.

After closing, check for:
- Dependent issues that might now be unblocked: `bd ready`
- Suggest creating issues for any new work discovered during this task
