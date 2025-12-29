---
description: Install beads in a project
---

# Install beads

Your task is to install and configure beads (bd) for issue tracking in the current project.

## Tasks

1. Check if beads is already installed by looking for a `.beads/` directory.
2. If already installed, inform the user and offer to run `bd doctor` to check for issues.
3. If not installed, run `bd init` to initialize beads in the project.
4. Verify the installation by running `bd doctor`.
5. Add `.beads/beads.db` to `.gitignore` if not already present (the SQLite database is a local cache).
6. Run `bd sync` to ensure beads is properly synced with git.

## Post-Installation

After installation, inform the user about:
- Use `bd create "Title" --type task` to create issues
- Use `bd ready` to find work
- Use `bd sync` at session end to sync with git
- Read `knowledge-base/documenation/beads.md` for full documentation

## Troubleshooting

If installation fails:
- Ensure git is initialized in the project
- Check that you have write permissions
- Run `bd doctor` for diagnostics
