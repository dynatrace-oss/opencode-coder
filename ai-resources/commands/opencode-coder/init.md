---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

Load the opencode-coder skill to initialize the current project for use with the coder plugin.

## Task

Use the skill tool to load comprehensive initialization guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Installation & Setup** section to:
1. Verify prerequisites (git, bd CLI)
2. Prompt user for beads mode (stealth or team)
3. Run appropriate beads initialization
4. Set up coder configuration (`.coder/coder.json`)
5. Handle git exclusions based on mode
6. Report what was created/configured

The skill provides detailed initialization procedures including:
- Stealth vs team mode selection
- File structure explanations
- Idempotent behavior handling
- Next steps guidance
