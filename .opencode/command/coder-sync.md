---
description: Sync files from upstream beads repository on demand
---

# Sync from Upstream Beads

This command syncs specific files from the upstream `steveyegge/beads` repository into this project.

## What to Sync

Ask the user what they want to sync:

1. **Agent only** (default) - Sync `beads-task-agent.md` from upstream
2. **Commands** - Sync command definitions from upstream `commands/` folder
3. **Both** - Sync agent and commands

## Sync Process

### For Agent

1. Fetch the upstream agent from:
   `https://raw.githubusercontent.com/steveyegge/beads/main/.claude-plugin/agents/task-agent.md`

2. Adapt the content for OpenCode CLI usage:
   - The upstream version uses MCP tools (`ready`, `show`, `update`, etc.)
   - Replace MCP tool references with CLI equivalents (`bd ready`, `bd show`, etc.)
   - Add a CLI usage section at the top with common bd commands
   - Add a subagent context section explaining the agent's dual purpose (status queries AND task completion)
   - Emphasize that JSON output should be parsed and summarized, not dumped raw

3. Save the adapted content to:
   `knowledge-base/agent/beads-task-agent.md`

### For Commands

1. List available commands from:
   `https://api.github.com/repos/steveyegge/beads/contents/commands`

2. Ask user which commands to sync (or all)

3. For each selected command:
   - Fetch from: `https://raw.githubusercontent.com/steveyegge/beads/main/commands/{name}.md`
   - Adapt MCP tool references to CLI equivalents
   - Save to: `knowledge-base/command/bd/{name}.md`

## Adaptation Rules

When adapting upstream files:

| Upstream (MCP) | OpenCode (CLI) |
|----------------|----------------|
| `Use the ready MCP tool` | `Run bd ready --json` |
| `Use the show tool` | `Run bd show <id>` |
| `Use the update tool` | `Run bd update <id> --status ...` |
| `Use the create tool` | `Run bd create --title="..." ...` |
| `Use the close tool` | `Run bd close <id> --reason="..."` |
| `Use the dep tool` | `Run bd dep add <from> <to>` |

## After Sync

- Report what was synced and from which upstream version/commit
- Note that the plugin needs to be rebuilt (`bun run build`) for changes to take effect in the published version
- Suggest reviewing the synced files to ensure adaptation is correct
