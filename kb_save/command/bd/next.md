---
description: Work on next beads issue
---

# Work on next beads issue

Your task is to find a beads issue to work on and continue working on it.

## Tasks

1. Read `knowledge-base/documenation/beads.md` to understand what beads are and how to work with them.
2. Determine the issue to work on:
   - If the user specifies an issue ID, use it
   - Otherwise, run `bd ready --json` to get unblocked issues
   - Present issues sorted by priority (P0 first, then P1, etc.)
   - Ask the user which issue they want to work on
3. If the user selects an issue, check for uncommitted changes with `git status`. If any exist, ask whether to commit them before starting work.
4. Claim the issue by running `bd update <id> --status in_progress`
5. Run `bd show <id>` to get full issue details
6. Start working on the issue based on its type and description

## Priority Levels

| Priority | Meaning |
|----------|---------|
| P0 | Critical - blocking other work |
| P1 | High - should be done soon |
| P2 | Medium - normal priority |
| P3 | Low - nice to have |
| P4 | Backlog - someday/maybe |

## When Done

After completing the issue:
1. Run tests if applicable
2. Close the issue with `bd close <id>`
3. Run `bd sync` to sync changes with git
