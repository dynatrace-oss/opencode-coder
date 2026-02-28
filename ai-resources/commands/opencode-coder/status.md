---
description: Show opencode-coder plugin status and information
---

# Plugin Status

Display comprehensive plugin status and information using bash commands.

## Instructions

Gather and display the following information using direct bash commands:

### 1. Plugin Information

Read the plugin's package.json directly:

```bash
# Get plugin installation path
PLUGIN_PATH="$HOME/.cache/opencode/node_modules/@hk9890/opencode-coder"

# Read and parse package.json
if [ -f "$PLUGIN_PATH/package.json" ]; then
  PLUGIN_NAME=$(node -p "require('$PLUGIN_PATH/package.json').name" 2>/dev/null)
  PLUGIN_VERSION=$(node -p "require('$PLUGIN_PATH/package.json').version" 2>/dev/null)
  PLUGIN_DESC=$(node -p "require('$PLUGIN_PATH/package.json').description" 2>/dev/null)
fi
```

Display:
- Plugin name (from package.json)
- Version (from package.json)
- Description (from package.json)
- Installation path

### 2. Configuration Status

Check configuration using bash commands:

```bash
# Plugin active status
if [ "$OPENCODE_CODER_DISABLED" = "true" ]; then
  echo "Status: DISABLED"
else
  echo "Status: ACTIVE"
fi

# Working directory
pwd

# Beads CLI version
if command -v bd &> /dev/null; then
  bd --version | grep -oP 'bd version \K[\d.]+'
fi

# Beads initialized
test -d .beads && echo "INITIALIZED" || echo "NOT INITIALIZED"
```

### 3. Health Summary

Check key components:

```bash
# Plugin installed
test -d "$HOME/.cache/opencode/node_modules/@hk9890/opencode-coder" && echo "✓ Plugin installed" || echo "✗ Plugin NOT installed"

# Plugin active
[ "$OPENCODE_CODER_DISABLED" != "true" ] && echo "✓ Plugin active" || echo "✗ Plugin DISABLED"

# Beads CLI
command -v bd &> /dev/null && echo "✓ Beads CLI available" || echo "✗ Beads CLI NOT installed"

# Beads initialized
test -d .beads && echo "✓ Beads initialized" || echo "✗ Beads NOT initialized"

# Git hooks
test -f .git/hooks/pre-commit && echo "✓ Git hooks installed" || echo "✗ Git hooks MISSING"
```

### 4. Format Output

Present information in a clean, readable format with sections and status indicators.

## Detailed Reference

For complete bash command examples, troubleshooting, and a ready-to-use status script, see:

**Skill Reference**: Load the `opencode-coder` skill and refer to `references/status-health.md`

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
   ✓ Plugin active
   ✓ Beads CLI available
   ✓ Beads initialized
   ✓ Git hooks installed
```

## Notes

- All information obtained via direct bash commands (no plugin tools needed)
- More reliable than previous system_info approach
- Commands can be tested manually for debugging
- See skill reference for complete documentation
