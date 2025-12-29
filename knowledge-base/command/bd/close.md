---
description: Close a beads issue
---

# Close beads issue

Your task is to close one or more completed beads issues.

## Tasks

1. If user specifies issue ID(s), use those. Otherwise:
   - Run `bd list --status in_progress --json` to show issues currently being worked on
   - Ask which issue(s) to close
2. For each issue to close:
   - Run `bd show <id>` to display issue details for confirmation
   - Ask user to confirm closure (unless they explicitly requested it)
3. Close the issue(s) with `bd close <id>` or `bd close <id1> <id2> ...` for multiple.
4. Run `bd sync` to sync changes with git.
5. Show remaining open issues with `bd ready` or `bd stats`.

## Closing Multiple Issues

You can close multiple issues at once:
```bash
bd close oc-abc oc-def oc-ghi
```

## Closing with Reason

To add context about why an issue was closed:
```bash
bd close <id> --reason="Completed as part of feature X"
```

## After Closing

- Run tests if the closed issue involved code changes
- Commit any related code changes
- Run `bd sync` to ensure beads state is synced
- Check `bd ready` for next available work
