---
description: Beads issue overview
---

# Beads issue overview

Your task is to provide an overview of all beads issues.

## Tasks

1. Read `knowledge-base/documenation/beads.md` to understand what beads are and how to work with them.
2. Run `bd stats` to get project statistics (open/closed/blocked counts).
3. Run `bd list --json` to get all issues, then present them organized by status:
   - **In Progress**: Issues currently being worked on
   - **Blocked**: Issues waiting on dependencies
   - **Ready**: Open issues with no blockers (available to work on)
4. For each section, show issues sorted by priority (P0 first, then P1, etc.)
5. Run `bd blocked` to identify any dependency chains that need attention.

## Output Format

Present a clear summary table for each section:

| ID | Title | Priority | Type |
|---|---|---|---|
| oc-xxx | Issue title | P1 | bug |

## Tips

- Use `bd show <id>` to get details on any specific issue
- Use `bd ready` to see only issues available to work on
- Use `bd dep add <issue> <depends-on>` to add dependencies

IMPORTANT:
Provide a concise overview. Users can ask specific questions for more details.
