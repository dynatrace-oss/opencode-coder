
## Directory Structure: What Goes Where

### `knowledge-base/` - RELEASED TO ALL USERS

**CRITICAL**: Everything in `knowledge-base/` is published with the npm package and accessible to ALL systems that use this plugin.

- ✅ Generic commands (bd, coder utilities)
- ✅ Generic documentation (beads workflow, bug structure)
- ✅ Generic agents (beads agents)
- ❌ **NEVER** project-specific content
- ❌ **NEVER** commands specific to developing this plugin
- ❌ **NEVER** internal tooling or workflows

### `.opencode/` - LOCAL TO THIS PROJECT ONLY

Project-specific commands and configuration that are NOT released:

- ✅ Commands for developing this plugin (release, analyze-logs)
- ✅ Internal tooling
- ✅ Project-specific workflows

**Rule**: If it only makes sense for opencode-coder development, it goes in `.opencode/`. If it's useful for any project using this plugin, it goes in `knowledge-base/`.

## Required Reading

**Before modifying or reviewing `src/` code**, read `docs/coding-guidelines.md` for architecture patterns and conventions.

## OpenCode Documentation References

Key documentation for understanding OpenCode features:

- [Commands](https://opencode.ai/docs/commands/) - Custom commands with arguments (`$ARGUMENTS`, `$1`, `$2`)
- [Agents](https://opencode.ai/docs/agents/) - Agent configuration and modes
- [Skills](https://opencode.ai/docs/skills/) - Agent skills (SKILL.md)
- [Plugins](https://opencode.ai/docs/plugins/) - Plugin development
- [SDK](https://opencode.ai/docs/sdk/) - TypeScript SDK reference

## Releases

**Use the `release-coder-plugin` skill for all releases.**

Load it with: `skill({ name: "release-coder-plugin" })`

This skill provides the full release workflow documentation.


## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**
- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds
