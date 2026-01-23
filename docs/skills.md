# Skills as Commands

## Overview

OpenCode skills are automatically discovered and exposed as slash commands with the `/skills/` prefix. This allows you to create reusable, documented procedures that agents can invoke like any other command.

When you create a `SKILL.md` file in a designated location, it becomes available as a command that agents can call. Skills are loaded at plugin initialization and registered with OpenCode's command system.

## Quick Start

1. **Create a skill directory**:
   ```bash
   mkdir -p .opencode/skills/my-skill
   ```

2. **Create `SKILL.md` with frontmatter**:
   ```markdown
   ---
   name: my-skill
   description: What this skill does
   ---
   
   # My Skill
   
   Detailed instructions for the agent to follow...
   ```

3. **Invoke the skill**:
   ```
   /skills/my-skill
   ```

## Skill Locations

Skills are discovered from four locations (in order of precedence):

1. **`.opencode/skills/<name>/SKILL.md`** - Project-specific skills
2. **`.claude/skills/<name>/SKILL.md`** - Project-specific (Claude-compatible)
3. **`~/.config/opencode/skills/<name>/SKILL.md`** - Global user skills
4. **`~/.claude/skills/<name>/SKILL.md`** - Global user skills (Claude-compatible)

**Important**: The directory name becomes the skill name. A skill at `.opencode/skills/my-skill/SKILL.md` is invoked as `/skills/my-skill`.

## SKILL.md Format

### Required Structure

Every `SKILL.md` file must contain:
- **Frontmatter**: YAML metadata between `---` delimiters
- **Body**: The skill content (instructions for the agent)

### Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Optional | string | Skill identifier (defaults to directory name) |
| `description` | Recommended | string | Brief description shown in command lists |
| `agent` | Optional | string | Default agent to use (e.g., `general`, `explore`) |
| `model` | Optional | string | Default model to use |
| `subtask` | Optional | boolean | Whether this skill is a subtask |

### Example: Basic Skill

```markdown
---
name: code-review
description: Perform a comprehensive code review
---

# Code Review Skill

You are performing a code review. Follow these steps:

1. **Read the code** - Understand what it does
2. **Check for issues**:
   - Logic errors
   - Edge cases
   - Performance problems
   - Security vulnerabilities
3. **Suggest improvements**:
   - Code clarity
   - Best practices
   - Documentation
4. **Provide summary** with actionable feedback

Be constructive and specific in your feedback.
```

### Example: Skill with Agent Configuration

```markdown
---
name: explore-auth
description: Explore authentication implementation
agent: explore
---

# Explore Authentication

Use the explore agent to analyze the authentication system:

1. Find all authentication-related files
2. Identify the auth flow
3. Document security measures
4. Note any potential issues

Provide a thorough report of findings.
```

## Working Examples

### Example 1: Release Skill

The plugin includes a release skill at `.opencode/skills/release-coder-plugin/SKILL.md`:

```markdown
---
name: release-coder-plugin
description: Release the opencode-coder plugin using GitHub Actions workflow
---

# Release Coder Plugin

**MANDATORY: Use the GitHub Actions release workflow for all releases.**

## How to Release

Trigger the release workflow using the `gh` CLI:

```bash
gh workflow run release.yml \
  -f version="0.8.0" \
  -f release_notes="## Features
- Feature description here"
```

...
```

Invoke with: `/skills/release-coder-plugin`

### Example 2: Custom Project Skill

Create `.opencode/skills/setup-test-env/SKILL.md`:

```markdown
---
name: setup-test-env
description: Set up the test environment for this project
---

# Setup Test Environment

Set up a complete test environment:

1. **Install dependencies**: Run `npm install`
2. **Create test database**: Run `npm run db:test:create`
3. **Run migrations**: Run `npm run db:test:migrate`
4. **Seed test data**: Run `npm run db:test:seed`
5. **Verify setup**: Run `npm test -- --listTests`

Report success or any errors encountered.
```

Invoke with: `/skills/setup-test-env`

## Usage Tips

### When to Create a Skill

Create a skill when you have:
- **Repetitive procedures** - Tasks you do regularly
- **Complex workflows** - Multi-step processes that need consistency
- **Domain-specific knowledge** - Specialized procedures for your project
- **Team standards** - Shared practices you want agents to follow

### Skill vs Command

- **Skills** - Reusable procedures loaded from `SKILL.md` files, automatically registered
- **Commands** - Defined in `.opencode/config.json`, more control over registration

Use skills for reusable workflows. Use commands for simpler templates or when you need fine-grained control.

### Project vs Global Skills

- **Project skills** (`.opencode/skills/`) - Project-specific workflows, checked into git
- **Global skills** (`~/.config/opencode/skills/`) - Personal workflows you use across projects

## Troubleshooting

### Skill Not Found

**Problem**: `/skills/my-skill` returns "command not found"

**Solutions**:
1. Check the directory name matches: `.opencode/skills/my-skill/SKILL.md`
2. Verify `SKILL.md` exists (exact case)
3. Check the file has content (not empty)
4. Restart OpenCode: `coder status` to reload skills

### Skill Not Loading

**Problem**: Skill exists but doesn't appear in command list

**Solutions**:
1. **Check frontmatter**: Ensure YAML is valid with `---` delimiters
2. **Check body**: Skill body must not be empty
3. **Check logs**: Run with `--verbose` to see skill loading messages
4. **Verify permissions**: Ensure the file is readable

### Skill Loads with Wrong Content

**Problem**: Skill runs but uses unexpected instructions

**Solutions**:
1. **Check precedence**: Earlier locations override later ones
2. **Search all locations**: Look for duplicate skill names
3. **Clear cache**: Restart OpenCode to reload skills

### Frontmatter Parsing Errors

**Problem**: Invalid YAML in frontmatter

**Solutions**:
1. **Check delimiters**: Must be exactly `---` (three dashes)
2. **Check syntax**: YAML is indentation-sensitive
3. **Check quotes**: Strings with special chars need quotes
4. **Validate YAML**: Use an online YAML validator

## Advanced Usage

### Skill with Arguments

Skills can use command argument placeholders:

```markdown
---
name: test-file
description: Run tests for a specific file
---

# Test File

Run tests for the file: $1

Steps:
1. Verify file exists: `$1`
2. Run tests: `npm test $1`
3. Report results
```

Invoke with: `/skills/test-file src/index.test.ts`

See [OpenCode Commands documentation](https://opencode.ai/docs/commands/) for argument syntax.

### Skill Composition

Skills can call other commands:

```markdown
---
name: full-review
description: Complete review workflow
---

# Full Review

Perform a complete review:

1. Run code review: `/skills/code-review`
2. Run security scan: `/skills/security-check`
3. Run performance check: `/skills/perf-check`
4. Generate report

Provide a consolidated summary.
```

## See Also

- [OpenCode Skills Documentation](https://opencode.ai/docs/skills/) - Official OpenCode skills reference
- [OpenCode Commands](https://opencode.ai/docs/commands/) - Command system and arguments
- [Plugin Development](https://opencode.ai/docs/plugins/) - Creating plugins with skills
