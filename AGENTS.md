
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

