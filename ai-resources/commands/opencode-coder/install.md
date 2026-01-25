---
description: Install global dependencies for opencode-coder plugin
---

# Install Coder Dependencies

Your task is to install the global dependencies required by the opencode-coder plugin.

## Overview

This command performs one-time global setup to install tools that the coder plugin depends on. Run this before using `/coder/init` on any project.

## Tasks

1. **Check for beads CLI**
   - Run `which bd` or `bd --version` to check if beads is installed
   - If installed, show the version and confirm it's ready

2. **Install beads if missing**
   - Install via npm: `npm install -g beads`
   - Verify installation with `bd --version`

3. **Report status**
   - Show what was installed vs already present
   - Confirm all dependencies are ready

## Dependencies Installed

| Tool | Purpose | Install Command |
|------|---------|-----------------|
| beads (bd) | Issue tracking | `npm install -g beads` |

## Upgrading Dependencies

To upgrade installed dependencies:

```bash
npm update -g beads
```

**Note**: Do NOT use the curl/bash install script suggested by `bd doctor`. Always use npm for installation and upgrades.

## Next Steps

After installation, initialize a project with:
```bash
/coder/init
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| npm permission error | Use `sudo npm install -g beads` or fix npm permissions |
| bd command not found after install | Ensure npm global bin is in PATH |
| Wrong version installed | Run `npm update -g beads` |
