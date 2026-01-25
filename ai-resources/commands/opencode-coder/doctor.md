---
description: Check health of opencode-coder plugin setup
---

# Coder Doctor

Load the opencode-coder skill to perform a comprehensive health check on the coder plugin setup.

## Task

Use the skill tool to load comprehensive diagnostic guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Status & Health Checks** and **Troubleshooting & Diagnostics** sections to:
1. Check coder config (`.coder/coder.json`)
2. Check beads status and run `bd doctor`
3. Verify git hooks installation
4. Check git sync status
5. Report component status and any issues found

The skill provides:
- Complete health check procedures
- bd doctor output filtering guidance
- Issue resolution commands
- Component status meanings
