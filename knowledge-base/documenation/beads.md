# Beads (bd) - Tactical Issue Tracking

This project uses **Beads** (`bd` CLI) for tactical issue tracking during implementation work.

## Hybrid Workflow

This project uses two systems:
- **Stories** (`docs/stories/`): Strategic features with full lifecycle (Draft → Ready → In Progress → Implemented → Reviewed → Done)
- **Beads** (`bd`): Tactical tasks discovered during implementation (bugs, refactors, TODOs, edge cases)

### When to Use Each

| Use Stories For | Use Beads For |
|----------------|---------------|
| New features | Bugs found during implementation |
| Major refactors | Small refactoring tasks |
| User-facing changes | Technical debt items |
| Planned work | Discovered work ("oh by the way...") |

## Quick Reference

```bash
bd ready              # Find unblocked work
bd create "Title" -p 1 --type bug   # Create issue
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## OpenCode Commands

These slash commands are available in OpenCode:

| Command | Description |
|---------|-------------|
| `/bd-ready` | Find unblocked tasks |
| `/bd-create` | Create new issue |
| `/bd-show` | Show issue details |
| `/bd-update` | Update an issue |
| `/bd-close` | Close completed issue |
| `/bd-blocked` | Show blocked issues |
| `/bd-list` | List issues with filters |
| `/bd-sync` | Sync with git |
| `/bd-workflow` | Show workflow guide |

## Priority Levels

| Priority | Meaning | When to Use |
|----------|---------|-------------|
| P0 (0) | Critical | Blocking other work, security issues |
| P1 (1) | High | Important, should be done soon |
| P2 (2) | Medium | Normal priority (default) |
| P3 (3) | Low | Nice to have |
| P4 (4) | Backlog | Someday/maybe |

## Issue Types

- `bug` - Something broken
- `feature` - New functionality
- `task` - General work item (default)
- `epic` - Large feature broken into subtasks
- `chore` - Maintenance, cleanup

## Linking Issues

When you discover work while implementing something, link it:

```bash
# Found a bug while working on oc-a1b2
bd create "Fix edge case" --type bug -p 1 --deps discovered-from:oc-a1b2

# This issue blocks another
bd dep add oc-new oc-blocked --type blocks

# Create subtask of an epic
bd create "Implement login" --parent oc-epic-id
```

## Session Workflow

1. **Start**: Check `/bd-ready` for available work
2. **Claim**: Update status to `in_progress`
3. **Work**: Implement the change
4. **Discover**: Create beads for any issues found
5. **Complete**: Close with `/bd-close`
6. **Sync**: Run `/bd-sync` at session end

## File Structure

```
.beads/
  beads.db          # SQLite database (local cache)
  issues.jsonl      # Git-versioned issue data
  config.yaml       # Beads configuration
```

## Integration with Stories

When working on a Story, use Beads for tactical work:

```
Story: 001-implement-auth.md (In Progress)
  └── oc-a1b2: Fix race condition in session handler (P0)
  └── oc-c3d4: Add missing input validation (P1)
  └── oc-e5f6: Refactor token refresh logic (P2)
```

When the Story moves to "Implemented", ensure all related beads are closed.
