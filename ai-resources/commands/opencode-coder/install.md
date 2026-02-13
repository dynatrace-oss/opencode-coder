---
description: Install global dependencies for opencode-coder plugin
---

# Install Coder Dependencies

Load the opencode-coder skill to perform installation of global dependencies required by the coder plugin.

## Task

Use the skill tool to load comprehensive installation guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Installation & Setup** section to:
- Check for beads CLI installation (`bd --version`)
- Install beads via npm if missing (`npm install -g beads`)
- Verify installation and report status

**Optional but recommended**: Install aimgr for discovering AI resources in your project. See: https://github.com/hk9890/ai-config-manager

The skill provides detailed installation procedures, troubleshooting, and next steps.
