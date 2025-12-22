---
description: Work on next bug
---

# Work on bug

Your task is to find a bug to work on and continue working on it.

## Tasks

1. Read `docs/kb/bug.md` to understand what bugs are and how to work with them.
2. Determine the bug to work on: If the user specifies one, use it. Otherwise, read the frontmatter section in all
   files in `docs/bugs`, list those that are not `Done` or `Paused`, and ask the user which bug they want to work
   on next. If there are more than 5 bugs in the directory, only look at the last 5 and ignore the others.
3. If the user selects a bug, check for uncommitted changes. If any exist, ask whether to commit them before starting
   work on the bug.
4. Read the full bug document and decide what to do based on the bug state.
