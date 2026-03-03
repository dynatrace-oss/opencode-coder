# Installation & Setup Guide

Complete guide for installing and initializing the opencode-coder plugin.

## Table of Contents

1. [Installation](#installation)
2. [Initialization](#initialization)
3. [Configuration](#configuration)

---

## Installation

The opencode-coder plugin requires a few global tools. **Run `/init` to get started** — the plugin automatically detects missing prerequisites and guides you through setup.

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| `bd` (beads) | Issue tracking CLI | `npm install -g beads` |
| `aimgr` (optional) | AI resource discovery | See: https://github.com/hk9890/ai-config-manager |

> **Note**: You do not need to install these manually before running `/init`. The `/init` command detects what is missing and prompts you to install only what is needed.

### Manual Installation (if needed)

If you need to install or upgrade dependencies outside of `/init`:

```bash
# Install beads
npm install -g beads

# Upgrade beads
npm update -g beads

# Verify installation
bd --version
```

**Important**: Always use npm for installation and upgrades. Do NOT use curl/bash install scripts that might be suggested by `bd doctor`.

### Installation Troubleshooting

| Issue | Solution |
|-------|----------|
| npm permission error | Use `sudo npm install -g beads` or fix npm permissions |
| bd command not found after install | Ensure npm global bin is in PATH |
| Wrong version installed | Run `npm update -g beads` |

### Next Steps

Run `/init` — the plugin will automatically detect missing prerequisites and guide you through setup. See the [Initialization](#initialization) section for details.

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
  AGENTS.md          # AI routing table (injected by plugin config hook)
  docs/
    CODING.md        # Generated coding conventions
    TESTING.md       # Generated testing guide
    RELEASING.md     # Generated release guide
    MONITORING.md    # Generated monitoring guide
    PULL-REQUESTS.md # Generated PR & branching guide

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
  PULL-REQUESTS.md

AGENTS.md            # Committed at root
ai.package.yaml      # Committed at root
```

### Note on AGENTS.md

The `bd init` command creates or updates `AGENTS.md` with AI routing instructions. Behavior differs by mode:

**In stealth mode:**
- `AGENTS.md` is created at `.coder/AGENTS.md` and excluded from git via the `.coder/` entry in `.git/info/exclude`
- The plugin's config hook injects `.coder/AGENTS.md` into OpenCode's instructions automatically, so it is loaded alongside any team-committed `AGENTS.md` at the project root
- References `.coder/docs/` paths for generated documentation (e.g., `.coder/docs/CODING.md`)
- If the repo already has a committed `AGENTS.md` at the root, the stealth version at `.coder/AGENTS.md` supplements it without affecting the committed version
- Other team members will not see these changes

**In team mode:**
- `AGENTS.md` is created at the project root, committed and shared with the team
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

# 2. Move .coder/AGENTS.md to the project root
cp .coder/AGENTS.md ./AGENTS.md

# 3. Update AGENTS.md paths from .coder/docs/ to docs/
#    (Edit AGENTS.md to replace .coder/docs/ references with docs/)

# 4. Remove the stealth exclusion block from .git/info/exclude
#    (Delete the "# opencode-coder stealth mode" block and the 4 lines following it)

# 5. Clean up the stealth workspace
rm -rf .coder/

# 6. Commit everything
git add AGENTS.md ai.package.yaml docs/ .beads/
git commit -m "chore: enable team mode"
```

After the transition, all team members run `bd init` (without `--stealth`) to set up their local environment.

### Updating Stealth Docs

Re-running `/init` in stealth mode refreshes generated documentation under `.coder/docs/`:

- **No re-prompting** for mode selection — stealth is detected automatically via the marker comment in `.git/info/exclude`
- Generated files (`CODING.md`, `TESTING.md`, `RELEASING.md`, `MONITORING.md`, `PULL-REQUESTS.md`) are overwritten with fresh content
- `AGENTS.md` is updated at `.coder/AGENTS.md` if the plugin detects it needs changes
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
