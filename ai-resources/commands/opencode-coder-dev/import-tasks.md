---
description: Import GitHub issues (non-bugs) into beads for triage and planning
---

# Import Tasks

Import GitHub issues (excluding bugs) into beads for triage.

## Instructions

1. Load the `task-sync` skill
2. **Context**: You want to **import only** (GitHub → beads), NOT bidirectional sync
3. Import issues: filter for `gh issue list --label "!bug" --state open`
4. Follow task-sync import workflow (dedupe, map metadata, add `source:external`)
5. Result: Non-bug issues imported for triage and planning

Use `/internal/fix-bugs` for importing bugs instead.
