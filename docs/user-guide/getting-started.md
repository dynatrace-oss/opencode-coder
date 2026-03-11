# Getting Started

This guide helps you install the `@hk9890/opencode-coder` plugin and get it working in a project.

## Prerequisites

- [OpenCode CLI](https://opencode.ai/)
- Node.js 18+
- Bun or npm
- Optional: `bd` if you want beads issue tracking

## 1. Install the plugin

Add the plugin to your OpenCode config at `~/.config/opencode/config.json`:

```json
{
  "plugins": ["@hk9890/opencode-coder"]
}
```

If needed, configure npm to use GitHub Packages for this scope in `~/.npmrc`:

```text
@hk9890:registry=https://npm.pkg.github.com
```

## 2. Open a project

Start OpenCode in the repository where you want to use the plugin.

## 3. Run `/init`

For most users, this is the main setup step.

`/init` will guide project setup and can:

- discover and install relevant AI resources
- initialize beads if you want issue tracking
- install git hooks
- create or refresh the project's `AGENTS.md`

If beads is not initialized yet, `/init` will ask which mode you want:

- **stealth** — keeps opencode-coder artifacts local
- **team** — stores shared setup in the repository

## 4. Review the generated project guidance

After `/init`, check the active guidance files:

- `AGENTS.md` in team mode
- `.coder/AGENTS.md` in stealth mode

These files should point agents to the right project docs and workflows.

## 5. Start using it

Common next steps:

- ask the agent to help with planning or implementation
- run `bd ready` to see unblocked work if you use beads
- create work with `bd create "Task description" --type task`
- re-run `/init` after installing new resources
- run `/opencode-coder/update-agent-md` when you only need to refresh the routing table

## Optional manual setup

If you want beads without going through `/init`, install the CLI and initialize it yourself:

```bash
npm install -g beads
bd init
```

For local-only usage, use stealth mode instead:

```bash
bd init --stealth
```

## Troubleshooting

- Use `/opencode-coder/status` to check current plugin state
- Use `/opencode-coder/doctor` to diagnose setup problems
- If `bd` is missing, install it before using beads workflows
