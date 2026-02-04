# @hk9890/opencode-coder

OpenCode plugin for story-driven development with agents and commands.

## Features

- **Beads Integration (Optional)** - Local-first issue tracking with stealth mode (local-only) or team mode (git-synced)
- **Custom Agents** - Four specialized agents for planning, review, task execution, and verification
- **Knowledge Base Commands** - Rich command library for issue management (`bd/*`)
- **Skills as Commands** - Skills from `.opencode/skills/` and other locations automatically available as `/skills/*` commands ([docs](./docs/skills.md))
- **Template Support** - Customizable workflows and issue templates


## Prerequisites

- Node.js (v18+)
- Bun or npm
- [OpenCode CLI](https://opencode.ai)

## Installation

### 1. Configure the plugin

Add the plugin to your OpenCode configuration (`~/.config/opencode/config.json`):

```json
{
  "plugins": ["@hk9890/opencode-coder"]
}
```

Since this package is published to GitHub Packages, you may need to configure npm to use the GitHub registry for this scope. Create or update `~/.npmrc`:

```
@hk9890:registry=https://npm.pkg.github.com
```

### 2. Initialize your project (optional)

If you want to use beads for issue tracking, you can initialize it in your project directory using the beads CLI (`bd init`). This is optional - the plugin works without beads too.

## Using with Beads

Beads integration is optional. You can use the plugin without beads at all. If you want to use beads, initialize it with `bd init` in your project directory.

### Stealth Mode (Recommended default)

- Beads files stay local to your machine (gitignored)
- Won't affect git history or other team members
- Perfect for: personal use, OSS contributions, teams not using beads yet
- Use `bd init --stealth` to enable this mode

### Team Mode

- Beads files are committed and synced via git
- Enables multi-device sync and team collaboration
- Perfect for: teams adopting beads together
- Use `bd init` (default) to enable this mode

## Quick Start

### With Beads

Initialize beads in your project, then track issues:

```bash
# Create your first issue
bd create "Setup project structure" --type task --priority 2

# Find available work
bd ready

# Start working on a task
bd update <id> --status in_progress

# Close a completed task
bd close <id>
```

## Available Commands

### bd/* - Beads Issue Management (requires beads)

These commands require beads to be initialized in your project.

| Command | Description |
|---------|-------------|
| `/bd/create` | Create a new issue |
| `/bd/list` | List issues with filters |
| `/bd/ready` | Show issues ready to work |
| `/bd/show` | Display issue details |
| `/bd/update` | Update issue properties |
| `/bd/close` | Close an issue |
| `/bd/blocked` | Show blocked issues |
| `/bd/stats` | Project statistics |
| `/bd/sync` | Sync with remote |
| `/bd/dep` | Manage dependencies |
| `/bd/epic` | Create an epic with tasks |
| `/bd/template` | Manage issue templates |

## Available Agents

| Agent | Role |
|-------|------|
| `beads-planner-agent` | Planning, structure, orchestration - creates epics and tasks, delegates implementation |
| `beads-build-agent` | Hybrid agent - plans AND implements directly (alternative to planner + task agents) |
| `beads-review-agent` | Reviews plans and structure (not code) |
| `beads-task-agent` | Implements tasks and closes them when complete |
| `beads-verify-agent` | Verifies outcomes and owns acceptance gates |

### Workflow

**Two Workflows Available:**

**Option A: Planner + Task Agents** (planning and implementation separated)
1. **Planner** creates epic + tasks + acceptance gate
2. **Reviewer** reviews plans and creates additional tasks/gates if needed
3. **Task agent** implements tasks and closes when complete
4. **Verifier** validates gates and closes them or creates bugs

**Option B: Build Agent** (planning and implementation together)
1. **Build agent** directly implements simple/medium work
2. For complex work: **Build agent** creates epic + tasks, then implements them itself
3. **Reviewer** reviews plans if needed (high-risk)
4. **Verifier** validates gates and closes them or creates bugs

## License

MIT
