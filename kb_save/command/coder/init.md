---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

Your task is to initialize the current project for use with the opencode-coder plugin. This command is idempotent - it can be run multiple times safely and will only set up what's missing.

## Prerequisites

Before initializing, verify:
1. The project has git initialized (`git status` should work)
2. The `bd` CLI is available (`bd --version`) - if not, suggest running `/coder/install` first

## Tasks

Perform each step, skipping if already done:

### 1. Beads Setup

Check if `.beads/` directory exists.

**If NOT initialized:**
- Run `bd init` to create the `.beads/` directory and configuration
- Run `bd hooks install` to set up git hooks
- Add `.beads/beads.db` to `.gitignore` if not already present

**If already initialized:**
- Report "Beads: already initialized"

### 2. Coder Config Setup

Check if `.coder/coder.json` exists.

**If NOT exists:**
- Create `.coder/` directory
- Create `.coder/coder.json` with content: `{ "active": true }`

**If already exists:**
- Report "Coder config: already present"

### 3. Commit Changes

If any files were created or modified:
- Stage all new files (`.beads/`, `.coder/`, `.gitignore` changes)
- Commit with message: "chore: initialize coder plugin"

If nothing changed:
- Report "Project already fully initialized"

### 4. Report Summary

Display a summary of what was done:

```
Coder Project Initialized

Components:
  Beads:        [initialized/already present]
  Git hooks:    [installed/already present]
  Coder config: [created/already present]

Files created:
  .beads/
    config.yaml
    issues.jsonl
    interactions.jsonl
    metadata.json
  .coder/
    coder.json

Next steps:
  - Create first issue: bd create "Setup project" --type task
  - Check project health: /coder/doctor
  - Find available work: bd ready
```

## File Structure

After initialization, the project will have:

```
.beads/
  config.yaml       # Beads configuration
  issues.jsonl      # Git-versioned issue data
  interactions.jsonl # Session interactions
  metadata.json     # Repository metadata
  beads.db          # Local SQLite cache (gitignored)

.coder/
  coder.json        # Coder plugin configuration
```

## Idempotent Behavior

This command is safe to run multiple times:
- Already initialized components are skipped
- No duplicate entries in `.gitignore`
- No duplicate commits
- Reports what was already present vs newly created
