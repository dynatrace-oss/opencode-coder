# Installation & Setup Guide

Complete guide for installing and initializing the opencode-coder plugin.

## Table of Contents

1. [Installation](#installation)
2. [Initialization](#initialization)
3. [Configuration](#configuration)

---

## Installation

Install the global dependencies required by the opencode-coder plugin. This is a one-time setup that should be performed before initializing any project.

### Installing the bd CLI

The coder plugin requires the `bd` CLI (beads) for issue tracking:

```bash
npm install -g beads
```

### Verify Installation

After installation, verify that beads is available:

```bash
bd --version
```

You should see output showing the beads version number.

### Upgrading Dependencies

To upgrade beads to the latest version:

```bash
npm update -g beads
```

**Important**: Always use npm for installation and upgrades. Do NOT use curl/bash install scripts that might be suggested by `bd doctor`.

### Installation Troubleshooting

| Issue | Solution |
|-------|----------|
| npm permission error | Use `sudo npm install -g beads` or fix npm permissions |
| bd command not found after install | Ensure npm global bin is in PATH |
| Wrong version installed | Run `npm update -g beads` |

### Next Steps

After installation, initialize a project with the coder plugin (see [Initialization](#initialization) section).

---

## Initialization

Initialize a project to use the opencode-coder plugin. This command is idempotent and can be run multiple times safely.

### Prerequisites

Before initializing, verify:
1. The project has git initialized (`git status` should work)
2. The `bd` CLI is available (`bd --version`) - if not, see [Installation](#installation)

### Quick Start

**For most users, this is all you need:**

```bash
# 1. Check if already initialized
ls -la .beads

# 2. If not initialized, run stealth mode setup
bd init --stealth && bd hooks install

# 3. Verify beads is working
bd ready

# Done! The plugin is now active.
```

**Verification:**
- ✓ `.beads/` directory exists with config files
- ✓ `bd ready` runs without errors
- ✓ Files stay local (not in git status)

If you need team collaboration or multi-device sync, see the detailed [Initialization Steps](#initialization-steps) below for team mode setup.

### Initialization Steps

#### Step 1: Check Current Status

First, check if the project is already initialized:

```bash
ls -la .beads
```

If the directory already exists, the project may already be initialized. The initialization process will skip what's already set up.

#### Step 2: Choose Beads Mode

If the project is not yet initialized, you need to choose a mode:

**Stealth Mode (Recommended)**
- Beads files stay local to your machine
- Won't affect git history or other team members
- Perfect for: personal use, OSS contributions, teams not using beads yet
- Files are excluded via `.git/info/exclude`

**Team Mode**
- Beads files are committed and synced via git
- Enables multi-device sync and team collaboration
- Perfect for: teams adopting beads together
- Uses standard `.gitignore` for database file

#### Step 3: Run Initialization

**For Stealth Mode:**
```bash
bd init --stealth
bd hooks install
```

**For Team Mode:**
```bash
bd init
bd hooks install
```

#### Step 4: Handle Git Exclusions

**For Stealth Mode:**
The `.beads/` and `.opencode/` directories should be added to `.git/info/exclude`:

```bash
echo ".beads/" >> .git/info/exclude
echo ".opencode/" >> .git/info/exclude
```

**For Team Mode:**
Add the beads database to `.gitignore`:

```bash
echo ".beads/beads.db" >> .gitignore
```

#### Step 5: Commit (Team Mode Only)

**For Team Mode:**
```bash
git add .beads/ .gitignore AGENTS.md
git commit -m "chore: initialize coder plugin"
```

**For Stealth Mode:**
No commit needed - all files are excluded from git.

### File Structure After Initialization

```
.beads/
  config.yaml       # Beads configuration
  issues.jsonl      # Git-versioned issue data
  interactions.jsonl # Session interactions
  metadata.json     # Repository metadata
  beads.db          # Local SQLite cache (gitignored)

AGENTS.md           # Beads quick reference (optional)
```

### Note on AGENTS.md

The `bd init` command may create or update `AGENTS.md` with a minimal beads quick reference (~12 lines). This is harmless:
- Serves as human-readable documentation that the project uses beads
- Plugin hooks automatically inject full beads context, so AGENTS.md is not read by AI
- Can be safely committed or ignored based on project preference

### Idempotent Behavior

The initialization process is safe to run multiple times:
- Already initialized components are skipped
- No duplicate entries in `.gitignore` or `.git/info/exclude`
- No duplicate commits
- Reports what was already present vs newly created

### First Steps After Initialization

After initialization, try these commands:

```bash
# Create your first issue
bd create "Setup project" --type task

# Check project health
# See the Status & Health Checks guide

# Find available work
bd ready
```

---

## Configuration

The coder plugin is controlled via environment variables. No configuration files are required.

### Plugin Control

| Environment Variable | Type | Default | Description |
|---------------------|------|---------|-------------|
| `OPENCODE_CODER_DISABLED` | boolean | false | When set to "true", disables the entire plugin |
| `BEADS_AUTO_APPROVE` | boolean | true | When set to "false", requires approval for bd commands |

### Checking Current Configuration

To check if the plugin is active:

```bash
# Check if plugin is disabled
echo $OPENCODE_CODER_DISABLED

# If empty or "false", plugin is active
# If "true", plugin is disabled
```

### Modifying Configuration

Control the plugin via environment variables:

```bash
# Disable the plugin
export OPENCODE_CODER_DISABLED=true

# Re-enable the plugin (unset or set to false)
unset OPENCODE_CODER_DISABLED
# or
export OPENCODE_CODER_DISABLED=false

# Require approval for bd commands
export BEADS_AUTO_APPROVE=false
```

To make these changes permanent, add them to your shell profile (`~/.bashrc`, `~/.zshrc`, etc.).
