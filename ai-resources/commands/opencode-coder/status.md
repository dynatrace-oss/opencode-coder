---
description: Show opencode-coder plugin status and information
---

# Plugin Status

Display comprehensive plugin status and information.

## Instructions

Gather and display the following information:

### 1. Plugin Information

Read the plugin's package.json directly:

```bash
# Get plugin installation path
PLUGIN_PATH="$(npm root -g)/@hk9890/opencode-coder"

# Read version from package.json
cat "$PLUGIN_PATH/package.json"
```

Display:
- Plugin name (from package.json)
- Version (from package.json)
- Description (from package.json)
- Installation path

### 2. Configuration Status

Use the `system_info` tool to get:
- Plugin status: active/disabled
- Working directory
- Beads integration status
- Beads CLI version

### 3. Health Summary

Check key components:
- Plugin installed: `test -d "$(npm root -g)/@hk9890/opencode-coder" && echo "OK" || echo "MISSING"`
- Beads initialized: `test -d .beads && echo "OK" || echo "MISSING"`
- Git hooks installed: `test -f .git/hooks/post-commit && echo "OK" || echo "MISSING"`

### 4. Format Output

Present information in a clean, readable format with sections and status indicators.

## Example Output Format

```
🔌 OpenCode Coder Plugin Status

1. Plugin Information
   Name: @hk9890/opencode-coder
   Version: 0.23.0
   Description: OpenCode plugin for story-driven development
   Location: /path/to/node_modules/@hk9890/opencode-coder

2. Configuration
   Status: ACTIVE
   Working Directory: /home/user/project
   Beads Integration: ENABLED (CLI v0.49.6)
   
3. Health Summary
   ✓ Plugin installed
   ✓ Beads initialized
   ✓ Git hooks configured
```

## Notes

- Read package.json directly instead of relying on system_info for version
- Use system_info for runtime status (active/disabled, integrations)
- Keep output concise and actionable
