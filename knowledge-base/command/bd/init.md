---
description: Initialize beads for a new project
---

# Initialize beads

Your task is to initialize beads (bd) issue tracking for a new project.

## Prerequisites

Before initializing beads, verify:
1. The project has git initialized (`git status` should work)
2. You have write permissions to the project directory

## Tasks

1. Check if beads is already initialized by looking for `.beads/` directory.
2. If already initialized:
   - Inform the user beads is already set up
   - Run `bd doctor` to verify the installation is healthy
   - Offer to show current issues with `bd list`
3. If not initialized:
   - Run `bd init` to create the `.beads/` directory and configuration
   - Run `bd doctor` to verify successful initialization
   - Add `.beads/beads.db` to `.gitignore` (local cache file)
4. Commit the beads configuration files to git.

## File Structure Created

```
.beads/
  config.yaml       # Beads configuration
  issues.jsonl      # Git-versioned issue data
  beads.db          # Local SQLite cache (gitignored)
```

## Next Steps

After initialization, suggest:
- Create first issue: `bd create "Setup project" --type task`
- View documentation: Read `knowledge-base/documenation/beads.md`
- Check status: `bd stats`
