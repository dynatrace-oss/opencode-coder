---
description: Show opencode-coder plugin status and information
---

# Plugin Status

Load the opencode-coder skill to display comprehensive plugin status and information.

## Task

Use the skill tool to load status checking guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Status & Health Checks** section to collect and display:

### 1. Plugin Information
- Plugin name and version (from package.json or system_info)
- Description and purpose

### 2. Configuration Status
- Plugin status: active/disabled (check `OPENCODE_CODER_DISABLED` env var)
- Working directory
- Beads integration: enabled/disabled (check `.beads/` exists)
- GitHub integration: enabled/disabled (check `gh` available)

### 3. Knowledge Base
- Count commands in `ai-resources/commands/` (if accessible)
- Count agents in `ai-resources/agents/` (if accessible)
- List available commands with descriptions
- List available agents with descriptions and modes

### 4. Health Summary
- Run quick health checks
- Report component statuses (OK/MISSING/WARN)

The skill provides comprehensive status checking procedures and formatting guidance.

## Note on Templates

This command previously used template syntax ({{variable}}), which is no longer supported. Instead, gather information programmatically using bash commands, file reads, and the system_info tool.
