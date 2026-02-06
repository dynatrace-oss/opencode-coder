---
description: Sync files from upstream beads repository on demand
---

# Sync from Upstream Beads

This command syncs files from the upstream `steveyegge/beads` repository into this project's knowledge base.

## What to Sync

**Note**: We no longer sync bd command docs. Agents should rely on `bd prime` output instead.

Sync the agent definition:

1. Fetch the upstream agent from:
   `https://raw.githubusercontent.com/steveyegge/beads/main/claude-plugin/agents/task-agent.md`

2. Adapt the content for OpenCode CLI usage:
   - The upstream version uses MCP tools (`ready`, `show`, `update`, etc.)
   - Replace MCP tool references with CLI equivalents (`bd ready`, `bd show`, etc.)
   - Add a CLI usage section at the top with common bd commands
   - Add a subagent context section explaining the agent's dual purpose
   - Emphasize that JSON output should be parsed and summarized
   - Set frontmatter: `mode: subagent`

3. Save the adapted content to:
   `knowledge-base/agent/beads-task-agent.md`

## Adaptation Rules

Replace MCP tool references with CLI commands:

| Upstream (MCP) | OpenCode (CLI) |
|----------------|----------------|
| `Use the ready tool` | `Run bd ready` |
| `Use the show tool` | `Run bd show <id>` |
| `Use the update tool` | `Run bd update <id>` |
| `Use the create tool` | `Run bd create` |
| `Use the close tool` | `Run bd close <id>` |

## After Sync

- Report what was synced
- Note that the plugin needs rebuilding: `bun run build`
- Remind to commit changes to git
