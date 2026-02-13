# Contributing to opencode-coder

Thank you for your interest in contributing to the opencode-coder plugin! This guide will help you get started.

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) runtime installed
- [OpenCode CLI](https://opencode.ai/) for testing

### Getting Started

```bash
# Clone the repository
git clone https://github.com/hk9890/opencode-coder.git
cd opencode-coder

# Install dependencies
bun install

# Build the plugin
bun run build

# Run tests
bun test
```

## Project Structure

```
src/
├── index.ts           # Plugin entry point - minimal, delegates to packages
├── core/              # Foundation utilities (logger, version, parser)
├── config/            # Configuration loading and schema
├── kb/                # Knowledge base loading (commands, agents)
├── service/           # Main services (KnowledgeBaseService, BeadsService)
├── system-info/       # System information collection tool
├── beads/             # Beads integration (detector, context)
└── github/            # GitHub integration (detector, remote detection)
```

## Directory Guidelines

### `knowledge-base/` - Published Content

Everything in `knowledge-base/` is published with the npm package and accessible to ALL users who install this plugin.

**Include:**
- Generic commands (bd, coder utilities)
- Generic documentation (beads workflow, bug structure)
- Generic agents (beads agents)

**Never include:**
- Project-specific content
- Commands specific to developing this plugin
- Internal tooling or workflows

### `.opencode/` - Local Project Content

Project-specific commands and configuration that are NOT published:

- Commands for developing this plugin (release, analyze-logs)
- Internal tooling
- Project-specific workflows

**Rule of thumb:** If it only makes sense for opencode-coder development, it goes in `.opencode/`. If it's useful for any project using this plugin, it goes in `knowledge-base/`.

## Coding Guidelines

For detailed architecture patterns and conventions, see [`docs/coding-guidelines.md`](docs/coding-guidelines.md).

### Key Patterns

**Package Index Pattern**
- Import from package index, not internal files: `import { Logger } from "./core"`
- Never import from internal files: `import { Logger } from "./core/logger"`
- Export both values AND types explicitly

**Minimal Entry Point**
- `src/index.ts` is intentionally minimal (~70 lines)
- Delegates ALL functionality to domain packages
- Only orchestrates initialization order and wires dependencies

## Testing

### Test Levels

| Level | Location | Description | Command |
|-------|----------|-------------|---------|
| Unit | `tests/unit/` | Fast, isolated tests with mocks | `bun run test:unit` |
| Integration | `tests/integration/` | Tests with real dependencies | `bun run test:integration` |
| E2E | `tests/e2e/` | Full plugin tests with opencode | `bun run test:e2e` |

### Test Structure

```
tests/
├── unit/          # Fast, isolated tests with mocks
├── integration/   # Tests with real dependencies
├── e2e/           # Full plugin tests (requires build + opencode)
├── helpers/       # Shared test utilities
│   ├── mock-client.ts
│   └── mock-logger.ts
└── fixtures/      # Test data files
    ├── configs/   # JSON config fixtures
    └── markdown/  # Command/agent fixtures
```

### Running Tests

```bash
bun test                    # All tests
bun test tests/unit         # Unit tests only (or: bun run test:unit)
bun test tests/integration  # Integration tests (or: bun run test:integration)
bun test tests/e2e          # E2E tests (or: bun run test:e2e)
```

## Scripts Reference

| Script | Description |
|--------|-------------|
| `bun run build` | Build the plugin to `dist/` |
| `bun run dev` | Watch mode for development |
| `bun test` | Run all tests |
| `bun test tests/unit` | Run unit tests only |
| `bun test tests/integration` | Run integration tests |
| `bun test tests/e2e` | Run E2E tests (requires build) |
| `bun run typecheck` | Run TypeScript type checking |
| `bun run opencode:dev` | Build and test with opencode CLI |
| `bun run test:coverage` | Run tests with coverage |
| `bun run clean` | Remove build artifacts |

## Pull Request Process

1. **Fork** the repository and create a feature branch
2. **Make your changes** following the coding guidelines
3. **Run tests** before submitting: `bun test`
4. **Run type checking**: `bun run typecheck`
5. **Write clear commit messages** that explain the "why"
6. **Reference issues** in your PR if applicable

## Adding Commands and Agents

### Adding Commands

Commands can be added in two locations depending on their purpose:

**Generic commands** (for all users) go in `knowledge-base/agent/` as Markdown files with YAML frontmatter.

**Project-specific commands** (for developing this plugin) go in `.opencode/commands/` or `ai-resources/commands/`.

Example command structure:

```markdown
---
name: my-command
description: What my command does
allowed_modes: [agent, user]
---

# My Command

Instructions for the command...
```

### Adding Agents

Agents go in `knowledge-base/agent/` as Markdown files:

```markdown
---
name: my-agent
description: Agent description
model: claude-sonnet-4-20250514
---

Agent system prompt...
```

## Documentation Resources

- [OpenCode Commands](https://opencode.ai/docs/commands/) - Custom commands with arguments
- [OpenCode Agents](https://opencode.ai/docs/agents/) - Agent configuration and modes
- [OpenCode Skills](https://opencode.ai/docs/skills/) - Agent skills (SKILL.md)
- [OpenCode Plugins](https://opencode.ai/docs/plugins/) - Plugin development
- [OpenCode SDK](https://opencode.ai/docs/sdk/) - TypeScript SDK reference

## Questions?

If you have questions about contributing, feel free to open an issue or discussion on the repository.
