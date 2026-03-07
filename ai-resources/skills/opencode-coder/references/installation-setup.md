# Installation & Setup Guide

Lean entry point for installing and initializing the opencode-coder plugin.

**Canonical references**:
- File locations, AGENTS rules, and stealth vs team behavior: [project-structure.md](project-structure.md)
- Switching between modes: [mode-transition.md](mode-transition.md)
- Common failures and fixes: [troubleshooting-patterns.md](troubleshooting-patterns.md)

## Installation

For most users, just run `/init`. It detects missing prerequisites and guides setup.

### Prerequisites

| Tool | Purpose | Install |
|------|---------|---------|
| `bd` | Beads issue tracking CLI | `npm install -g beads` |
| `aimgr` *(optional)* | AI resource discovery | See: https://github.com/hk9890/ai-config-manager |

### Manual Install

Use this only if you need to install or upgrade outside `/init`:

```bash
# Install or upgrade beads
npm install -g beads
npm update -g beads

# Verify
bd --version
```

**Rule**: Use npm for install and upgrade. Do not use ad-hoc curl/bash installers.

## Initialization

`/init` is the preferred path. It is safe to re-run.

### Before You Start

Verify:

1. `git status` works
2. `bd --version` works

### Choose a Mode

**Stealth mode** *(recommended for solo/local use)*
- Keeps opencode-coder artifacts local
- Uses `.git/info/exclude`

**Team mode**
- Shares beads/docs/AGENTS via git
- Uses standard repo paths

See [project-structure.md](project-structure.md) for the canonical layout.

### Manual Initialization

#### Stealth mode

```bash
bd init --stealth && bd hooks install
mkdir -p .coder/docs

if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
STEALTH
fi
```

#### Team mode

```bash
bd init && bd hooks install
grep -qF '.coder/' .gitignore 2>/dev/null || echo '.coder/' >> .gitignore
```

If you are committing the shared setup in team mode:

```bash
git add .beads/ .opencode/ ai.package.yaml AGENTS.md docs/ .gitignore
git commit -m "chore: initialize coder plugin"
```

### Verify Setup

After initialization:

- `bd ready` runs without errors
- The active AGENTS path exists
- The active docs directory exists
- Git visibility matches the chosen mode

Use [project-structure.md](project-structure.md) to verify the expected paths.

### Re-running `/init`

- Safe to re-run
- In stealth mode, the marker in `.git/info/exclude` should prevent re-asking the mode question
- Re-runs refresh generated docs and the active AGENTS file

### First Steps After Setup

```bash
bd create "Setup project" --type task
bd ready
```

## Configuration

The plugin is controlled by environment variables.

| Variable | Default | Purpose |
|----------|---------|---------|
| `OPENCODE_CODER_DISABLED` | `false` | Disable the plugin entirely |
| `BEADS_AUTO_APPROVE` | `true` | Require approval for `bd` commands when set to `false` |

### Check Current State

```bash
echo $OPENCODE_CODER_DISABLED
```

Empty or `false` means the plugin is active.

### Change Configuration

```bash
# Disable plugin
export OPENCODE_CODER_DISABLED=true

# Re-enable plugin
unset OPENCODE_CODER_DISABLED
# or
export OPENCODE_CODER_DISABLED=false

# Require approval for bd commands
export BEADS_AUTO_APPROVE=false
```

Add permanent settings to your shell profile if needed.
