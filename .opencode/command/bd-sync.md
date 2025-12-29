---
description: Synchronize beads issues with git remote
---

Synchronize beads issues with git in a single operation.

Run `bd sync` which:
1. Exports pending changes to JSONL
2. Commits changes to git
3. Pulls from remote (with conflict resolution)
4. Imports updated JSONL
5. Pushes local commits to remote

Options:
- `bd sync --dry-run` - Preview without making changes
- `bd sync --flush-only` - Export to JSONL without git operations

Report the sync status to the user. This should be run at the end of work sessions.
