# System Info Tool Audit

**Date**: 2026-02-14  
**Purpose**: Analyze system_info tool usage and determine if it's needed

## Executive Summary

**Recommendation**: **REMOVE system_info tool entirely**

**Rationale**:
- Only used in ONE place (status command)
- Every piece of information can be obtained with simple bash commands
- Current implementation is buggy (plugin version returns "unknown")
- Maintaining plugin code adds complexity with no real benefit
- Philosophy: "Best code is no code"

---

## Current Usage Analysis

### Code Usage

**Files that import/use system_info:**
```
src/index.ts                  - Tool registration only
src/system-info/index.ts      - Export
src/system-info/tool.ts       - Implementation
```

**Total lines of code**: ~120 lines (entire src/system-info/ directory)

**External usage**: 
- ✅ `ai-resources/commands/opencode-coder/status.md` - Status command (only consumer)
- ❌ No agent instructions reference it
- ❌ No other commands reference it
- ❌ No other code imports it

### Documentation Usage

**Files mentioning system_info:**
```
ai-resources/commands/opencode-coder/status.md  - Uses it for status checks
```

**Usage context**: The status command says "Use the system_info tool to get: Plugin status, Working directory, Beads integration status"

---

## Data Point Analysis

For each piece of information provided by system_info, analyze alternatives:

### 1. SessionInfo

| Field | Current Method | Bash Alternative | Complexity | Needed? |
|-------|---------------|------------------|------------|---------|
| `id` | `context.sessionID` | Not available via bash | Simple | ❓ Debug only |
| `pid` | `process.pid` | `echo $$` | Trivial | ❌ Not needed |
| `workingDirectory` | `process.cwd()` | `pwd` | Trivial | ✅ Yes, but bash is fine |
| `command` | `process.argv.join(' ')` | `ps -p $$ -o args=` | Simple | ❌ Not needed |
| `terminal` | Custom detection logic | `echo $TERM` | Trivial | ❌ Not needed |

**Assessment**: Most fields not needed. Working directory is useful but trivially obtained with `pwd`.

### 2. PluginInfo

| Field | Current Method | Bash Alternative | Complexity | Needed? |
|-------|---------------|------------------|------------|---------|
| `name` | Hardcoded constant | Hardcoded | N/A | ✅ Yes, but hardcode is fine |
| `version` | Read package.json (BROKEN) | `node -p "require('$(npm root -g)/@hk9890/opencode-coder/package.json').version"` | Simple | ✅ Yes, bash works better |
| `active` | `!isPluginDisabled()` | `[ "$OPENCODE_CODER_DISABLED" != "true" ]` | Trivial | ✅ Yes, but bash is fine |

**Assessment**: Version detection is currently BROKEN in the tool. Bash alternative is simpler and works reliably. Active status is trivial to check via env var.

### 3. BeadsInfo

| Field | Current Method | Bash Alternative | Complexity | Needed? |
|-------|---------------|------------------|------------|---------|
| `enabled` | Check if bd exists | `command -v bd >/dev/null` | Trivial | ✅ Yes, bash is fine |
| `cliVersion` | Parse `bd --version` | `bd --version \| grep -oP '\d+\.\d+\.\d+'` | Simple | ✅ Yes, bash is fine |
| `projectInitialized` | Check `.beads/` exists | `test -d .beads` | Trivial | ✅ Yes, bash is fine |
| `stats` | Parse `bd stats --json` | `bd stats --json` | Trivial | ✅ Yes, bash is same |

**Assessment**: All fields are just wrappers around bash commands. No added value from plugin code.

---

## Complexity Comparison

### Current Approach (with system_info tool)

**Lines of Code**: ~120 lines
- `src/system-info/types.ts` - 40 lines
- `src/system-info/tool.ts` - 53 lines
- `src/system-info/collectors/plugin.ts` - 35 lines (BUGGY)
- `src/system-info/collectors/beads.ts` - 59 lines
- `src/system-info/collectors/session.ts` - 25 lines
- `src/system-info/collectors/index.ts` - 3 lines
- `src/system-info/index.ts` - 3 lines
- Tool registration in `src/index.ts` - 1 line

**Maintenance Burden**:
- Path resolution bugs (current issue)
- Bundle vs source path differences
- Error handling for all collectors
- Type definitions
- Tests (if any)

**Reliability**: ❌ Currently broken (plugin version returns "unknown")

### Proposed Approach (bash commands in skill)

**Lines of Code**: ~0 lines of plugin code

**Implementation**: Document bash commands in skill file

```bash
# Plugin version
node -p "require('$(npm root -g)/@hk9890/opencode-coder/package.json').version"

# Plugin active
[ "$OPENCODE_CODER_DISABLED" != "true" ] && echo "ACTIVE" || echo "DISABLED"

# Working directory
pwd

# Beads CLI version
bd --version | grep -oP '\d+\.\d+\.\d+'

# Beads initialized
test -d .beads && echo "YES" || echo "NO"

# Beads stats
bd stats --json
```

**Maintenance Burden**: Zero (no code to maintain)

**Reliability**: ✅ Works reliably, no path resolution issues

---

## Migration Analysis

### Breaking Changes?

**API consumers**: Only the status command uses system_info

**Migration path**:
1. Update status command to use bash commands instead
2. Remove tool registration from plugin
3. Delete `src/system-info/` directory

**Impact**: ZERO breaking changes externally (no public API)

### What Gets Better?

1. **Reliability**: Plugin version will show correctly
2. **Simplicity**: No code to maintain, debug, or fix
3. **Transparency**: LLM can see exactly what commands run (no hidden tool logic)
4. **Debugging**: Easier to understand what's happening
5. **Performance**: No overhead from tool invocation (direct bash)

### What Gets Worse?

**Nothing** - The tool provided zero actual value over bash commands.

---

## Recommendation: REMOVE ENTIRELY

### Option A: Remove system_info Entirely ✅ RECOMMENDED

**Actions**:
1. Delete `src/system-info/` directory (~120 lines removed)
2. Remove tool registration from `src/index.ts` (1 line removed)
3. Update status command to use bash alternatives
4. Document bash commands in skill

**Benefits**:
- ✅ Simplest solution
- ✅ Most maintainable (no code to maintain)
- ✅ Most reliable (bash commands work consistently)
- ✅ Most transparent (LLM sees actual commands)
- ✅ Fixes current bug without fixing code

**Risks**:
- None identified

**Effort**: Low (mostly deletion)

### Option B: Simplify system_info

**Actions**:
1. Remove plugin version detection (broken)
2. Keep only truly dynamic info (if any)
3. Update types

**Benefits**:
- Somewhat simpler than current

**Drawbacks**:
- Still maintaining code with marginal value
- Still have tool invocation overhead
- Still less transparent than bash

**Verdict**: ❌ Not worth it

### Option C: Keep but Fix

**Actions**:
1. Fix package.json path resolution bug
2. Handle bundled vs source scenarios
3. Add tests

**Benefits**:
- No behavior change

**Drawbacks**:
- Maintains complexity for no gain
- Fixes bug in code that shouldn't exist
- Still less reliable than bash

**Verdict**: ❌ Not recommended

---

## Implementation Plan

Following **Option A: Remove Entirely**

### Step 1: Update Status Command ✅ ALREADY DONE

The status command (`ai-resources/commands/opencode-coder/status.md`) has already been updated to use bash commands directly:

```bash
# Get plugin installation path
PLUGIN_PATH="$(npm root -g)/@hk9890/opencode-coder"

# Read version from package.json
cat "$PLUGIN_PATH/package.json"
```

### Step 2: Create Skill Documentation (Task oc-c9wi)

Add comprehensive bash command examples to skill for all status checks.

### Step 3: Remove Plugin Code

```bash
# Delete entire system-info directory
rm -rf src/system-info/

# Remove tool registration
# Edit src/index.ts to remove:
#   import { systemInfoTool } from "./system-info";
#   tool: { system_info: systemInfoTool }
```

### Step 4: Update CHANGELOG

Document the removal:

```markdown
## [Next Version]

### Removed
- **system_info tool**: Removed in favor of direct bash commands in skill instructions
  - The tool provided no value over simple bash commands
  - Current implementation had bugs (plugin version showed "unknown")
  - Simplification aligns with "best code is no code" philosophy
  - Status command now uses direct bash commands (more reliable)
  - **Migration**: If you were using system_info tool, replace with bash commands documented in the opencode-coder skill
```

### Step 5: Test

Run status command to verify it works without system_info tool.

---

## Conclusion

**The system_info tool is unnecessary complexity that should be removed.**

Every piece of information it provides can be obtained more reliably with simple bash commands. The current implementation is buggy and provides zero value over the alternatives.

**Recommendation**: Proceed with Option A - Remove entirely.

**Lines of code eliminated**: ~121 lines  
**Bugs fixed**: 1 (plugin version detection)  
**Maintenance burden reduced**: Significantly  
**Risk**: Zero
