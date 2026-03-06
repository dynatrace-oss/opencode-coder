# Agent Guidelines for opencode-coder

OpenCode plugin for story-driven development with agents and commands.

**Tech Stack**: TypeScript, Bun, @opencode-ai/plugin SDK, zod, yaml

## Coding

Read `docs/CODING.md` for architecture patterns, project structure, and code conventions.

Read `CONTRIBUTING.md` for build commands, development setup, and contribution workflow.

## Testing

Read `docs/TESTING.md` for integration tests, e2e setup, and test infrastructure.

## Releases

Load the **github-releases** skill for release workflow. Read `docs/RELEASING.md` for details.

## Monitoring

Load the **observability-triage** skill for analyzing logs, metrics, and triaging issues. Read `docs/MONITORING.md` for data sources.

## Pull Requests

Read `docs/PULL-REQUESTS.md` for branching strategy, PR conventions, and code review guidelines.

## OpenCode Documentation

- [Commands](https://opencode.ai/docs/commands/) - Custom commands with arguments
- [Agents](https://opencode.ai/docs/agents/) - Agent configuration and modes
- [Skills](https://opencode.ai/docs/skills/) - Agent skills (SKILL.md)
- [Plugins](https://opencode.ai/docs/plugins/) - Plugin development
- [SDK](https://opencode.ai/docs/sdk/) - TypeScript SDK reference

## Task Synchronization

Load the **task-sync** skill for syncing beads issues with external systems (GitHub Issues, etc.).

## Landing the Plane (Session Completion)

**When ending a work session**, complete ALL steps:

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** - All changes committed AND pushed

**CRITICAL**: Work is NOT complete until `git push` succeeds.
