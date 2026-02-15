---
description: Import GitHub bugs, triage, and fix them
---

# Fix Bugs

Import GitHub bugs into beads, triage by priority, and coordinate fixes.

## Instructions

1. Load the `task-sync` skill
2. **Context**: You want to **import only** (GitHub → beads), NOT bidirectional sync
3. Import bugs: filter for `gh issue list --label "bug" --state open`
4. Follow task-sync import workflow (dedupe, map metadata, add `source:external`)
5. Triage bugs by priority/severity (P0-P3)
6. For P0/P1 bugs with `source:external`: create post-mortem tasks
7. Coordinate fixes: spawn task agents for high-priority bugs

Use `/internal/import-tasks` for non-bug issues.
