# OpenCode Coder Development Guide

## Quick Commands

### Build & Development
```bash
bun run build          # Build plugin to dist/
bun run dev            # Watch mode for development
bun run clean          # Remove dist/ directory
bun run typecheck      # Type check without emit
bun run opencode:dev   # Build and run with OpenCode debug logging
```

### Testing
```bash
bun test                      # Run all tests
bun run test:unit             # Unit tests only (fast, mocked)
bun run test:integration      # Integration tests (real dependencies)
bun run test:e2e              # E2E tests (requires build + opencode CLI)
bun run test:watch            # Watch mode
bun run test:coverage         # Generate coverage report

# Run a single test file
bun test tests/unit/version.test.ts
bun test tests/unit/service/aimgr-service.test.ts

# Run tests matching a pattern
bun test --test-name-pattern="should return version"
```

### Logs & Debugging
```bash
bun run logs                  # Interactive log analyzer
bun run logs:sessions         # List recent sessions
bun run logs:processes        # List processes

# Log locations:
# Linux:   ~/.config/opencode/logs/
# macOS:   ~/Library/Logs/opencode/
# Windows: %APPDATA%\opencode\logs\
```

---

## Code Style Guidelines

### 1. Imports & Module Structure

**Package Index Pattern** - Always import from package index, never from internal files:

```typescript
// ✅ CORRECT
import { createLogger, getVersionInfo } from "./core";
import type { Logger, VersionInfo } from "./core";

// ❌ WRONG
import { createLogger } from "./core/logger";
import { getVersionInfo } from "./core/version";
```

**Import Order:**
1. External dependencies (`@opencode-ai/plugin`, etc.)
2. Internal absolute imports (`./core`, `./service`, etc.)
3. Types imported separately with `type` keyword

```typescript
import { type Plugin } from "@opencode-ai/plugin";
import { createLogger, getVersionInfo } from "./core";
import { KnowledgeBaseService, BeadsService } from "./service";
import type { Logger } from "./core";
```

### 2. TypeScript Conventions

**Strict Mode** - This project uses maximum strictness:
- `strict: true` + additional checks enabled
- `noUncheckedIndexedAccess: true` - Array access returns `T | undefined`
- `exactOptionalPropertyTypes: true` - Strict optional properties
- `verbatimModuleSyntax: true` - Explicit `type` imports required

**Avoid `any`** - Use proper types or `unknown`:
```typescript
// ❌ WRONG
catch (error: any) { ... }

// ✅ CORRECT
catch (error) {
  logger.error("Failed", { error: String(error) });
}
```

### 3. Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `aimgr-service.ts`, `mock-logger.ts`)
- **Classes**: `PascalCase` (e.g., `AimgrService`, `BeadsDetector`)
- **Functions**: `camelCase` (e.g., `createLogger`, `isPluginDisabled`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `SERVICE_NAME`)
- **Interfaces**: `PascalCase` with no prefix (e.g., `ServiceOptions`, not `IServiceOptions`)
- **Types**: `PascalCase` (e.g., `Logger`, `VersionInfo`)

### 4. Error Handling

**Throw for Failures:**
```typescript
initializeAimgr(): void {
  try {
    execSync("aimgr init", { cwd: this.workdir, stdio: "pipe" });
    this.logger.info("aimgr init completed successfully");
  } catch (error) {
    this.logger.error("Failed to run aimgr init", { error: String(error) });
    throw error;  // Re-throw for caller to handle
  }
}
```

**Catch at Top Level:**
```typescript
// In plugin entry point or service orchestration
aimgrService.autoInitialize()
  .then(() => log.debug("aimgr initialized"))
  .catch((err) => log.error("aimgr failed", { error: String(err) }));
```

### 5. Logging

**Use Structured Logging:**
```typescript
logger.debug("BeadsService created", { durationMs: Date.now() - startTime });
logger.info("Plugin loaded", { version: "1.0.0", beadsEnabled: true });
logger.error("Failed to load config", { error: String(err), path: configPath });
```

**Log Levels:**
- `debug` - Verbose details (only logged when `OPENCODE_CODER_DEBUG=1`)
- `info` - Important state changes and milestones
- `warn` - Issues that don't prevent operation
- `error` - Failures requiring attention

### 6. Testing Patterns

**Test Structure:**
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ServiceName", () => {
  let mockLogger: Logger;
  let service: ServiceName;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;
    
    service = new ServiceName({ logger: mockLogger });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("methodName", () => {
    it("should do expected behavior", () => {
      // Arrange
      const input = "test";
      
      // Act
      const result = service.methodName(input);
      
      // Assert
      expect(result).toBe("expected");
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
```

**Mocking:**
- Use test helpers from `tests/helpers/` (e.g., `createMockLogger()`)
- Mock external dependencies with `vi.spyOn()` in unit tests
- Use real dependencies in integration tests

---

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

### `ai-resources/` - OPTIONAL RESOURCES

AI resources (skills, commands, packages) that are NOT published with the plugin but can be installed separately using the `aimgr` CLI tool.

These resources are available for users who want enhanced functionality:
- Skills for specialized workflows (github-releases, task-sync, etc.)
- Commands for plugin management (install, init, doctor, etc.)
- Resource packages for common use cases

Users can install these via: `aimgr install [resource-name]`

**Rule**: If it only makes sense for opencode-coder development, it goes in `.opencode/`. If it's useful for any project using this plugin, it goes in `knowledge-base/`. If it's an optional enhanced feature, it goes in `ai-resources/`.

---

## Architecture Overview

### Source Structure
```
src/
├── index.ts           # Minimal entry point (~100 lines) - orchestrates only
├── core/              # Foundation (logger, version, parser, filesystem)
├── config/            # Configuration loading and env variables
├── kb/                # Knowledge base (commands, agents, loaders)
├── service/           # Business logic (KnowledgeBaseService, BeadsService, etc.)
├── beads/             # Beads integration (detector, context)
├── github/            # GitHub integration (detector)
└── tool/              # OpenCode tools (coder tool)
```

**Key Principle**: `src/index.ts` is intentionally minimal and delegates ALL functionality to domain packages.

### Test Structure
```
tests/
├── unit/          # Fast, isolated tests with mocks
├── integration/   # Tests with real dependencies
├── e2e/           # Full plugin tests (requires opencode CLI)
├── helpers/       # Shared test utilities (mock-logger, mock-client)
└── fixtures/      # Test data files (configs, markdown)
```

---

## Required Reading

**Before modifying `src/` code**, read `docs/coding-guidelines.md` for detailed architecture patterns and conventions.

## OpenCode Documentation

Key documentation for understanding OpenCode features:

- [Commands](https://opencode.ai/docs/commands/) - Custom commands with arguments (`$ARGUMENTS`, `$1`, `$2`)
- [Agents](https://opencode.ai/docs/agents/) - Agent configuration and modes
- [Skills](https://opencode.ai/docs/skills/) - Agent skills (SKILL.md)
- [Plugins](https://opencode.ai/docs/plugins/) - Plugin development
- [SDK](https://opencode.ai/docs/sdk/) - TypeScript SDK reference

---

## Releases

Use the **github-releases** skill to perform releases. See `docs/RELEASING.md` for details.

---

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
