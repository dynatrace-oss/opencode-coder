---
description: Show the beads workflow guide
---

Display the beads workflow for AI agents and developers.

# Beads Workflow

Beads is an issue tracker designed for AI-supervised coding workflows. Here's how to use it:

## 1. Find Ready Work
Use `/bd-ready` to see tasks with no blockers.

## 2. Claim Your Task
Update the issue status to `in_progress`:
```bash
bd update <id> --status in_progress
```

## 3. Work on It
Implement, test, and document the feature or fix.

## 4. Discover New Work
As you work, you'll often find bugs, TODOs, or related work:
- Create issues: `/bd-create`
- Link them with `--deps discovered-from:<id>` to maintain context

## 5. Complete the Task
Close the issue when done:
```bash
bd close <id> --reason "Completed: <summary>"
```

## 6. Check What's Unblocked
After closing, check if other work became ready with `/bd-ready`.

## Tips
- **Priority levels**: 0=critical, 1=high, 2=medium, 3=low, 4=backlog
- **Issue types**: bug, feature, task, epic, chore
- **Dependencies**: Use `blocks` for hard dependencies, `related` for soft links

## Available Commands
- `/bd-ready` - Find unblocked work
- `/bd-create` - Create new issue
- `/bd-show` - Show issue details
- `/bd-close` - Close issue
- `/bd-blocked` - Show blocked issues
- `/bd-sync` - Sync with git
- `/bd-workflow` - Show this guide

## Hybrid Workflow Note
This project uses **Stories** for strategic features and **Beads** for tactical tasks discovered during implementation.
