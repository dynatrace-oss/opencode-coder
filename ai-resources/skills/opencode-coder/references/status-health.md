# Status & Health Checks

Guide for monitoring the health and status of your coder plugin installation.

## Table of Contents

1. [Health Check Components](#health-check-components)
2. [Quick Health Verification](#quick-health-verification)
3. [Comprehensive Status Check](#comprehensive-status-check)
4. [Version Checking](#version-checking)
5. [Regular Maintenance](#regular-maintenance)

---

## Health Check Components

A complete health check verifies:

1. **Plugin Status**: `OPENCODE_CODER_DISABLED` is not set to "true"
2. **Beads**: `.beads/` directory exists and `bd doctor` passes
3. **Git Hooks**: Beads git hooks are properly installed
4. **Git Sync**: No uncommitted beads changes

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
bd --version                     # CLI available
ls .beads                        # Project initialized
ls .git/hooks/pre-commit         # Hooks installed
bd sync --status                 # Sync status
```

---

## Comprehensive Status Check

Use this checklist to verify your installation:

### 1. Plugin Status
```bash
echo $OPENCODE_CODER_DISABLED    # Should be empty or "false"
```

### 2. Beads CLI
```bash
bd --version                     # Should show version
which bd                         # Shows install location
```

### 3. Beads Initialization
```bash
ls -la .beads/                   # Should exist
bd doctor                        # Should pass
```

### 4. Git Hooks
```bash
ls -la .git/hooks/pre-commit     # Should exist and be executable
ls -la .git/hooks/post-merge     # Should exist and be executable
```
If missing: `bd hooks install`

### 5. Sync Status
```bash
bd sync --status                 # Should show no uncommitted changes
```

### 6. System Requirements
```bash
node --version                   # Node.js 18+ required
npm --version                    # npm available
```

---

## Version Checking

### Check Installed Versions

```bash
# Beads CLI version
bd --version

# Node.js version
node --version

# npm version
npm --version

# Check configured plugins in OpenCode config
cat ~/.config/opencode/opencode.json | grep -A5 '"plugin"'
```

### Update Beads

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

### Troubleshooting Version Issues

**Wrong plugin version**: Update `opencode.json` to specify version:
```json
"plugin": ["@hk9890/opencode-coder@1.2.0"]
```
Then restart OpenCode.

**Node.js too old**: Plugin requires Node.js 18+
```bash
# With nvm:
nvm install 20
nvm use 20
```

---

## Regular Maintenance

**Daily (when active):**
- Check for uncommitted changes: `bd sync --status`

**Weekly:**
- Verify hooks are still installed: `ls .git/hooks/`
- Check for beads updates: `npm outdated -g beads`

**After Updates:**
- Run quick health check
- Verify configuration is still valid
- Test basic commands (`bd ready`, `bd list`)
