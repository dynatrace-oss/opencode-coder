---
description: Sync files from upstream beads repository on demand
---

# Sync from Upstream Beads

This command syncs specific files from the upstream `steveyegge/beads` repository into this project's knowledge base.

## What to Sync

Ask the user what they want to sync:

1. **Commands only** - Sync command definitions from upstream `commands/` folder
2. **Agent only** - Sync `beads-task-agent.md` from upstream
3. **Both** - Sync agent and commands

## Sync Process

### For Commands

1. List available commands from:
   `https://api.github.com/repos/steveyegge/beads/contents/commands`

2. For each command:
   - Fetch raw content from: `https://raw.githubusercontent.com/steveyegge/beads/main/commands/{name}.md`
   - Adapt MCP tool references to CLI equivalents (see Adaptation Rules below)
   - Save to: `knowledge-base/command/bd/{name}.md`

3. Delete any local commands that no longer exist upstream (except custom ones)

### For Agent

1. Fetch the upstream agent from:
   `https://raw.githubusercontent.com/steveyegge/beads/main/.claude-plugin/agents/task-agent.md`

2. Adapt the content for OpenCode CLI usage:
   - The upstream version uses MCP tools (`ready`, `show`, `update`, etc.)
   - Replace MCP tool references with CLI equivalents (`bd ready`, `bd show`, etc.)
   - Add a CLI usage section at the top with common bd commands
   - Add a subagent context section explaining the agent's dual purpose (status queries AND task completion)
   - Emphasize that JSON output should be parsed and summarized, not dumped raw
   - Set frontmatter: `mode: subagent`

3. Save the adapted content to:
   `knowledge-base/agent/beads-task-agent.md`

## Adaptation Rules

When adapting upstream files, replace MCP tool references with CLI commands:

| Upstream (MCP) | OpenCode (CLI) |
|----------------|----------------|
| `Use the beads MCP <tool> tool` | `Run bd <tool>` |
| `Use the ready MCP tool` | `Run bd ready` |
| `Use the ready tool` | `Run bd ready` |
| `Use the show tool` | `Run bd show <id>` |
| `Use the update tool` | `Run bd update <id> --status ...` |
| `Use the create tool` | `Run bd create --title="..." ...` |
| `Use the close tool` | `Run bd close <id> --reason="..."` |
| `Use the dep tool` | `Run bd dep add <from> <to>` |
| `Use the stats tool` | `Run bd stats` |
| `Use the blocked tool` | `Run bd blocked` |
| `Use the init tool` | `Run bd init` |
| `/beads:ready` | `/bd-ready` |
| `/beads:create` | `/bd-create` |
| `/beads:show` | `/bd-show` |
| `/beads:update` | `/bd-update` |
| `/beads:close` | `/bd-close` |
| `/beads:workflow` | `/bd-workflow` |

Also update any references from `/beads:*` to `/bd-*` format.

## Checking for Changes

Before syncing, compare the upstream file list with local:
- Use GitHub API to get the list of files and their SHAs
- Compare with local files to identify: new, modified, deleted
- Report the diff to the user before applying changes

## After Sync

- Report what was synced (added/updated/deleted)
- Show which upstream commit/version was synced from (if available)
- Note that the plugin needs to be rebuilt (`bun run build`) for changes to take effect in the published version
- Suggest reviewing the synced files to ensure adaptation is correct
- Remind to commit the changes to git
