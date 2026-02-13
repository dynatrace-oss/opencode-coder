# Status & Health Checks

Complete guide for monitoring the health and status of your coder plugin installation.

## Table of Contents

1. [Overview](#overview)
2. [Health Check Components](#health-check-components)
3. [Quick Health Verification](#quick-health-verification)
4. [Comprehensive Status Check](#comprehensive-status-check)
5. [Version Checking](#version-checking)
6. [Regular Maintenance](#regular-maintenance)

---

## Overview

Monitor the health and status of your coder plugin installation to ensure all components are working correctly.

### Checking Plugin Status

To view comprehensive plugin status information, including configuration, integrations, and available commands/agents:

```bash
# Check if plugin is disabled
echo $OPENCODE_CODER_DISABLED
# If empty or "false", plugin is active; if "true", plugin is disabled

# Verify beads directory structure
ls -la .beads/
```

---

## Health Check Components

A complete health check verifies:

1. **Plugin Status**: `OPENCODE_CODER_DISABLED` is not set to "true"
2. **Beads**: `.beads/` directory exists and `bd doctor` passes
3. **Git Hooks**: Beads git hooks are properly installed
4. **Git Sync**: No uncommitted beads changes

### Running a Complete Health Check

```bash
# Check plugin status
if [ "$OPENCODE_CODER_DISABLED" = "true" ]; then
  echo "Plugin: DISABLED"
else
  echo "Plugin: ACTIVE"
fi

# Check beads
test -d .beads && bd doctor || echo "Beads: NOT INITIALIZED"

# Check git hooks
test -f .git/hooks/post-commit && echo "Git hooks: OK" || echo "Git hooks: MISSING"

# Check sync status (if beads initialized)
bd sync --status
```

### Component Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| OK | Component working correctly | None |
| MISSING | Component not installed | Run initialization |
| INVALID | Component exists but has errors | Fix configuration |
| WARN | Component has warnings | Review and fix if needed |

---

## Quick Health Verification

For a quick check, verify the essential components:

```bash
# Verify bd CLI is available
bd --version

# Verify project is initialized
ls .beads

# Verify git hooks are installed
ls .git/hooks/post-commit
```

---

## Comprehensive Status Check

For a complete system status including versions and configuration, run this comprehensive check sequence:

```bash
#!/bin/bash
# Comprehensive Coder Plugin Status Check

echo "=== System Information ==="
echo "OS: $(uname -s) $(uname -r)"
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "npm: $(npm --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "=== Beads CLI Installation ==="
if command -v bd &> /dev/null; then
    echo "Status: INSTALLED"
    echo "Version: $(bd --version 2>&1)"
    echo "Location: $(which bd)"
else
    echo "Status: NOT INSTALLED"
    echo "Action: Run 'npm install -g beads'"
fi
echo ""

echo "=== Plugin Installation ==="
PLUGIN_PATH="$(npm root -g)/opencode-coder"
if [ -d "$PLUGIN_PATH" ]; then
    echo "Status: INSTALLED"
    if [ -f "$PLUGIN_PATH/package.json" ]; then
        echo "Version: $(node -p "require('$PLUGIN_PATH/package.json').version" 2>/dev/null || echo 'UNKNOWN')"
    fi
    echo "Location: $PLUGIN_PATH"
else
    echo "Status: NOT INSTALLED"
    echo "Action: Run 'npm install -g opencode-coder'"
fi
echo ""

echo "=== Beads Initialization ==="
if [ -d ".beads" ]; then
    echo "Status: INITIALIZED"
    if [ -f ".beads/config.json" ]; then
        echo "Mode: $(node -p "require('./.beads/config.json').mode || 'local'" 2>/dev/null || echo 'local')"
    else
        echo "Mode: local (default)"
    fi
    echo "Directory: .beads/"
else
    echo "Status: NOT INITIALIZED"
    echo "Action: Run 'bd init'"
fi
echo ""

echo "=== Plugin Configuration ==="
if [ "$OPENCODE_CODER_DISABLED" = "true" ]; then
    echo "Status: DISABLED"
    echo "Action: Unset OPENCODE_CODER_DISABLED or set to 'false' to enable"
else
    echo "Status: ACTIVE"
    echo "Plugin is enabled and ready"
fi
echo ""

echo "=== Git Hooks Status ==="
if [ -f ".git/hooks/post-commit" ]; then
    echo "post-commit: INSTALLED"
    [ -x ".git/hooks/post-commit" ] && echo "  Executable: YES" || echo "  Executable: NO (run chmod +x)"
else
    echo "post-commit: MISSING"
fi
if [ -f ".git/hooks/post-merge" ]; then
    echo "post-merge: INSTALLED"
    [ -x ".git/hooks/post-merge" ] && echo "  Executable: YES" || echo "  Executable: NO (run chmod +x)"
else
    echo "post-merge: MISSING"
fi
if [ ! -f ".git/hooks/post-commit" ] || [ ! -f ".git/hooks/post-merge" ]; then
    echo "Action: Run 'bd init' or 'bd doctor' to install hooks"
fi
echo ""

echo "=== Sync Status ==="
if [ -d ".beads" ] && command -v bd &> /dev/null; then
    bd sync --status 2>&1 | head -n 5
else
    echo "Status: N/A (beads not initialized)"
fi
echo ""

echo "=== Overall Status ==="
if [ -d ".beads" ] && [ "$OPENCODE_CODER_DISABLED" != "true" ] && [ -f ".git/hooks/post-commit" ] && command -v bd &> /dev/null; then
    echo "✓ System is fully configured and ready"
else
    echo "⚠ Some components are missing or not configured"
    echo "Review the sections above for required actions"
fi
```

**Save this script** as a shell script and run it to check comprehensive status.

### Example Output

```
=== System Information ===
OS: Linux 5.15.0
Node.js: v20.11.0
npm: 10.2.4

=== Beads CLI Installation ===
Status: INSTALLED
Version: 0.5.2
Location: /usr/local/bin/bd

=== Plugin Installation ===
Status: INSTALLED
Version: 1.2.0
Location: /usr/local/lib/node_modules/opencode-coder

=== Beads Initialization ===
Status: INITIALIZED
Mode: local
Directory: .beads/

=== Plugin Configuration ===
Status: ACTIVE
Plugin is enabled and ready

=== Git Hooks Status ===
post-commit: INSTALLED
  Executable: YES
post-merge: INSTALLED
  Executable: YES

=== Sync Status ===
✓ No uncommitted changes

=== Overall Status ===
✓ System is fully configured and ready
```

---

## Version Checking

Check individual component versions:

```bash
# Beads CLI version
bd --version

# Node.js version
node --version

# npm version
npm --version

# Plugin version
npm list -g opencode-coder

# Or check package.json directly
node -p "require('$(npm root -g)/opencode-coder/package.json').version"

# Check for updates
npm outdated -g beads opencode-coder
```

### Troubleshooting Version Issues

**Problem: Wrong beads version installed**

```bash
# Check current version
bd --version

# Update to latest
npm update -g beads

# Or install specific version
npm install -g beads@0.5.2

# Verify update
bd --version
```

**Problem: Wrong plugin version installed**

```bash
# Check current version
npm list -g opencode-coder

# Update to latest
npm update -g opencode-coder

# Or install specific version
npm install -g opencode-coder@1.2.0

# Verify update
npm list -g opencode-coder
```

**Problem: Version mismatch between beads and plugin**

The plugin may require specific beads versions. Check compatibility:

```bash
# Check plugin's beads dependency
node -p "require('$(npm root -g)/opencode-coder/package.json').peerDependencies"

# If mismatch, update both
npm update -g beads opencode-coder

# Verify versions match requirements
bd --version
npm list -g opencode-coder
```

**Problem: Node.js version too old**

```bash
# Check current version
node --version

# Plugin requires Node.js 18+
# Update using your Node version manager (nvm, n, etc.)

# With nvm:
nvm install 20
nvm use 20

# Verify
node --version
```

---

## Regular Maintenance

Perform these checks regularly:

**Daily (when active):**
- Check for uncommitted changes: `bd sync --status`

**Weekly:**
- Verify hooks are still installed: `ls .git/hooks/`
- Check for beads updates: `npm outdated -g beads`

**After Updates:**
- Run full health check after updating beads
- Verify configuration is still valid
- Test basic commands (`bd ready`, `bd list`)
