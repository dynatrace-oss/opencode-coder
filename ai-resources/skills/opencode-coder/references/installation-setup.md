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

### Installing aimgr (Optional)

The coder plugin can optionally use `aimgr` to discover AI resources (commands, skills) relevant to your project type.

For installation instructions, see: https://github.com/hk9890/ai-config-manager

**What aimgr does:**
- Discovers AI resources based on project type (React, Python, TypeScript, etc.)
- Suggests relevant packages from the aimgr repository
- Installs commands and skills tailored to your workflow

**Basic usage:**
```bash
# Discover resources for your project
aimgr repo search react

# Install a specific package
aimgr install skill/package-name
```

aimgr integrates with the `bd init` workflow to automatically suggest relevant resources during project initialization. See [Initialization](#initialization) for details.


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

# 3. Add all opencode-coder artifacts to git exclusions
if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
AGENTS.md
STEALTH
fi

# 4. Create stealth workspace
mkdir -p .coder/docs

# 5. Verify beads is working
bd ready

# Done! The plugin is now active.
```

**Verification:**
- ✓ `.beads/` directory exists with config files
- ✓ `.coder/docs/` directory exists
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
All opencode-coder artifacts should be excluded via `.git/info/exclude`. Use the unified idempotent block:

```bash
if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
AGENTS.md
STEALTH
fi

# Create stealth workspace for generated docs
mkdir -p .coder/docs
```

This block is idempotent — running it multiple times will not add duplicate entries.

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

> ⚠️ **Data Loss Warning**: Running `git clean -fdx` (with `-x` flag) will delete excluded files,
> including `.coder/` and `.beads/`. Plain `git clean -fd` is safe — it does not remove excluded files.
> Re-run `/init` to restore configuration. Issue data in `.beads/issues.jsonl` is permanently lost if not backed up.

**Stealth Mode:**
```
.beads/              # Beads issue tracking (excluded in stealth)
  config.yaml
  issues.jsonl
  beads.db           # Local cache (always gitignored)

.opencode/           # OpenCode config, skills, commands (excluded in stealth)

.coder/              # Stealth workspace (excluded in stealth)
  docs/
    CODING.md        # Generated coding conventions
    TESTING.md       # Generated testing guide
    RELEASING.md     # Generated release guide
    MONITORING.md    # Generated monitoring guide

AGENTS.md            # AI routing table (at root, excluded in stealth)
ai.package.yaml      # aimgr manifest (at root, excluded in stealth)
```

**Team Mode:**
```
.beads/
  config.yaml
  issues.jsonl
  beads.db           # gitignored (not committed)

.opencode/           # Committed with the repo

docs/                # Generated docs committed with the repo
  CODING.md
  TESTING.md
  RELEASING.md
  MONITORING.md

AGENTS.md            # Committed at root
ai.package.yaml      # Committed at root
```

### Note on AGENTS.md

The `bd init` command creates or updates `AGENTS.md` at the **project root** with AI routing instructions. Behavior differs by mode:

**In stealth mode:**
- `AGENTS.md` is created at the project root but excluded from git via `.git/info/exclude`
- References `.coder/docs/` paths for generated documentation (e.g., `.coder/docs/CODING.md`)
- If the repo already has a committed `AGENTS.md`, the stealth version replaces it locally without affecting the committed version
- Other team members will not see these changes

**In team mode:**
- `AGENTS.md` is committed and shared with the team
- References `docs/` paths for generated documentation
- Serves as the authoritative AI routing table for the whole team

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

### Stealth → Team Transition

When your team is ready to adopt the plugin together, transition from stealth to team mode:

```bash
# 1. Copy stealth docs to standard committed locations
cp -r .coder/docs/ ./docs/

# 2. Update AGENTS.md paths from .coder/docs/ to docs/
#    (Edit AGENTS.md to replace .coder/docs/ references with docs/)

# 3. Remove the stealth exclusion block from .git/info/exclude
#    (Delete the "# opencode-coder stealth mode" block and the 5 lines following it)

# 4. Clean up the stealth workspace
rm -rf .coder/

# 5. Commit everything
git add AGENTS.md ai.package.yaml docs/ .beads/
git commit -m "chore: enable team mode"
```

After the transition, all team members run `bd init` (without `--stealth`) to set up their local environment.

### Updating Stealth Docs

Re-running `/init` in stealth mode refreshes generated documentation under `.coder/docs/`:

- **No re-prompting** for mode selection — stealth is detected automatically via the marker comment in `.git/info/exclude`
- Generated files (`CODING.md`, `TESTING.md`, etc.) are overwritten with fresh content
- `AGENTS.md` is updated at the root if the plugin detects it needs changes
- The exclusion block is left unchanged (idempotent check prevents duplicates)

This is useful after major project changes (new tech stack, new workflows) where the generated docs may be stale.

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
