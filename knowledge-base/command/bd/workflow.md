---
description: Show the AI-supervised issue workflow guide
---

Display the beads workflow for AI agents and developers.

# Beads Workflow

Beads is an issue tracker designed for AI-supervised coding workflows. Here's how to use it effectively:

## 1. Find Ready Work
Run bd ready to see tasks with no blockers.

## 2. Claim Your Task
Update the issue status to `in_progress`:
- Via command: `/bd-update <id> in_progress`
- Via CLI: `bd update <id> --status=in_progress`

## 3. Work on It
Implement, test, and document the feature or fix.

## 4. Discover New Work
As you work, you'll often find bugs, TODOs, or related work:
- Create issues: `/bd-create` or `bd create`
- Link them: `bd dep add <from> <to> --type discovered-from`
- This maintains context and work history

## 5. Complete the Task
Close the issue when done:
- Via command: `/bd-close <id> "Completed: <summary>"`
- Via CLI: `bd close <id> --reason "Completed: <summary>"`

## 6. Check What's Unblocked
After closing, check if other work became ready:
- Run bd ready to see newly unblocked tasks
- Start the cycle again

## Tips
- **Priority levels**: 0=critical, 1=high, 2=medium, 3=low, 4=backlog
- **Issue types**: bug, feature, task, epic, chore
- **Dependencies**: Use `blocks` for hard dependencies, `related` for soft links
- **Auto-sync**: Changes automatically export to `.beads/issues.jsonl` (5-second debounce)
- **Git workflow**: After `git pull`, JSONL auto-imports if newer than DB

## Available Commands
- `/bd-ready` - Find unblocked work
- `/bd-create` - Create new issue
- `/bd-show` - Show issue details
- `/bd-update` - Update issue
- `/bd-close` - Close issue
- `/bd-workflow` - Show this guide (you are here!)

## CLI Commands Available
Use these via the command line:
- `bd ready`, `bd list`, `bd show`, `bd create`, `bd update`, `bd close`
- `bd dep` (manage dependencies), `bd blocked`, `bd stats`
- `bd init` (initialize bd in a project)

For more details, see the beads README at: https://github.com/steveyegge/beads
