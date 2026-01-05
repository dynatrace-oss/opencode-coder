
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

## Releases

**Use the `release-coder-plugin` skill for all releases.**

Load it with: `skill({ name: "release-coder-plugin" })`

This skill provides the full release workflow documentation.

