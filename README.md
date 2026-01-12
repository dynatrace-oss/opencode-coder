# @hk9890/opencode-coder

OpenCode plugin for story-driven development with agents and commands.

## Features

- **Beads Integration** - Local-first issue tracking with `bd` CLI
- **Custom Agents** - Four specialized agents for planning, review, task execution, and verification
- **Knowledge Base Commands** - Rich command library for issue management (`bd/*`) and project setup (`coder/*`)
- **Template Support** - Customizable workflows and issue templates

## Prerequisites

- Node.js (v18+)
- Bun or npm
- [OpenCode CLI](https://opencode.ai)

## Installation

### 1. Install the beads CLI

```bash
npm install -g beads
```

### 2. Configure the plugin

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

### 3. Verify installation

Run the install command to verify dependencies:

```
/coder/install
```

### 4. Initialize your project

In your project directory:

```
/coder/init
```

This sets up:
- `.beads/` - Local issue tracking
- `.coder/` - Plugin configuration
- Git hooks for beads sync

## Quick Start

### Create your first issue

```bash
bd create "Setup project structure" --type task --priority 2
```

### Find available work

```bash
bd ready
```

### Start working on a task

```bash
bd update <id> --status in_progress
```

### Close a completed task

```bash
bd close <id>
```

## Available Commands

### bd/* - Beads Issue Management

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

### coder/* - Project Management

| Command | Description |
|---------|-------------|
| `/coder/install` | Install global dependencies |
| `/coder/init` | Initialize project for coder plugin |
| `/coder/doctor` | Check project health |
| `/coder/status` | Show plugin status |
| `/coder/feedback` | Submit feedback |

## Available Agents

| Agent | Role |
|-------|------|
| `beads-planner-agent` | Planning, structure, orchestration - creates epics and tasks |
| `beads-review-agent` | Reviews plans and structure (not code) |
| `beads-task-agent` | Implements tasks and closes them when complete |
| `beads-verify-agent` | Verifies outcomes and owns acceptance gates |

### Workflow

1. **Planner** creates epic + tasks + acceptance gate
2. **Reviewer** reviews plans and creates additional tasks/gates if needed
3. **Task agent** implements tasks and closes when complete
4. **Verifier** validates gates and closes them or creates bugs

## License

MIT
