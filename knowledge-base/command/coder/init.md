---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

> **🚨 CRITICAL: DO NOT CREATE AGENTS.md 🚨**
>
> The plugin hooks automatically inject beads context via `bd prime` at session start - AGENTS.md is redundant and wastes tokens.
>
> - **Do NOT create AGENTS.md** - it's automatically handled
> - **Do NOT add beads instructions** to any markdown file
> - If user asks for AGENTS.md content, tell them to run `bd onboard` for a minimal snippet
>
> This is the #1 mistake to avoid during initialization.

Your task is to initialize the current project for use with the opencode-coder plugin. This command is idempotent - it can be run multiple times safely and will only set up what's missing.

## Prerequisites

Before initializing, verify:
1. The project has git initialized (`git status` should work)
2. The `bd` CLI is available (`bd --version`) - if not, suggest running `/coder/install` first

## Tasks

Perform each step, skipping if already done:

### 1. Beads Mode Selection

Check if `.beads/` directory already exists.

**If already initialized:**
- Skip this step and report "Beads: already present"
- Do NOT prompt for mode selection

**If NOT initialized, ask the user:**

```
How would you like to initialize beads?

**1. Stealth Mode (recommended)**
- Beads files stay local to your machine
- Won't affect git history or other team members  
- Perfect for: personal use, OSS contributions, teams not using beads yet

**2. Team Mode**
- Beads files are committed and synced via git
- Enables multi-device sync and team collaboration
- Perfect for: teams adopting beads together

Which mode? (1/2, default: 1)
```

Store the user's choice for the next step. If user enters nothing or "1", use stealth mode. If user enters "2", use team mode.

### 2. Beads Setup

**If already initialized (from step 1):**
- Skip this step

**If NOT initialized:**
- If stealth mode selected: Run `bd init --stealth`
- If team mode selected: Run `bd init`
- Run `bd hooks install` to set up git hooks
- **Note:** For stealth mode, `bd init --stealth` handles exclusions via `.git/info/exclude` - no `.gitignore` changes needed
- For team mode: Add `.beads/beads.db` to `.gitignore` if not already present

### 3. Coder Config Setup

Check if `.coder/coder.json` exists.

**If NOT exists:**
- Create `.coder/` directory
- Create `.coder/coder.json` with content: `{ "active": true }`

**If already exists:**
- Report "Coder config: already present"

### 4. Commit Changes

**If team mode was used:**
- Stage all new files (`.beads/`, `.coder/`, `.gitignore` changes)
- Commit with message: "chore: initialize coder plugin"

**If stealth mode was used:**
- Only stage `.coder/` directory (beads files are excluded from git)
- Commit with message: "chore: initialize coder plugin" (if `.coder/` was created)

**If nothing changed:**
- Report "Project already fully initialized"

### 5. Report Summary

Display a summary of what was done:

```
Coder Project Initialized

Components:
  Beads:        [initialized (stealth)/initialized (team)/already present]
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
