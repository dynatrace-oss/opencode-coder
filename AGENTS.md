# Agent Guidelines for opencode-coder

This document provides coding conventions, build commands, and workflow guidelines for AI agents working in the opencode-coder repository.

## Build, Test, and Lint Commands

### Building
```bash
bun run build          # Build plugin to dist/
bun run dev            # Watch mode for development
bun run clean          # Remove build artifacts
bun run typecheck      # Run TypeScript type checking (no emit)
```

### Testing
```bash
bun test                         # Run all tests
bun test tests/unit              # Unit tests only (fast, mocked)
bun test tests/integration       # Integration tests (real deps)
bun test tests/e2e               # E2E tests (requires build + opencode CLI)
bun test --watch                 # Watch mode
bun run test:coverage            # Generate coverage report

# Run a single test file
bun test tests/unit/parser.test.ts

# Run tests matching a pattern
bun test --test-name-pattern "parseFrontmatter"
```

### Development
```bash
bun run opencode:dev   # Build and launch opencode with DEBUG logging
bun run logs           # Analyze OpenCode logs
```

## Directory Structure

```
src/
├── index.ts           # Plugin entry - minimal, delegates to packages
├── core/              # Foundation utilities (logger, version, parser)
├── config/            # Configuration loading and schema
├── kb/                # Knowledge base loading (commands, agents)
├── service/           # Main services (KnowledgeBaseService, BeadsService)
├── beads/             # Beads integration (detector, context)
├── github/            # GitHub integration (detector, remote detection)
└── tool/              # OpenCode tools (coder tool)

tests/
├── unit/              # Fast, isolated tests with mocks
├── integration/       # Tests with real dependencies
├── e2e/               # Full plugin tests with opencode
├── helpers/           # Shared test utilities (mock-client, mock-logger)
└── fixtures/          # Test data files
```

### Directory Content Rules

**`knowledge-base/`** - Published with npm package (ALL USERS see this):
- ✅ Generic commands (bd, coder utilities)
- ✅ Generic documentation (beads workflow)
- ✅ Generic agents (beads agents)
- ❌ **NEVER** project-specific content or internal tooling

**`.opencode/`** - Local to this project (NOT published):
- ✅ Commands for developing this plugin (release, analyze-logs)
- ✅ Internal tooling and project-specific workflows

**`ai-resources/`** - Optional resources (installable via aimgr):
- ✅ Skills for specialized workflows (github-releases, task-sync)
- ✅ Commands for plugin management (install, init, doctor)

## Code Style Guidelines

### Required Reading

**Before modifying `src/` code**, read `docs/coding-guidelines.md` for detailed architecture patterns.

### Import Style

```typescript
// 1. External packages first (from node_modules)
import type { Config } from "@opencode-ai/sdk/v2";
import { readFile } from "fs/promises";

// 2. Internal imports second (relative paths)
import type { Logger } from "../core/logger";
import { BeadsContext } from "../beads";
```

**Rules:**
- External before internal, one blank line separates them
- Use `import type` for type-only imports
- Prefer destructured imports: `import { x } from "y"`
- Import from package index: `import { Logger } from "./core"` ✅
- Never from internals: `import { Logger } from "./core/logger"` ❌

### Type Definitions

```typescript
/**
 * Options for BeadsService
 */
export interface BeadsServiceOptions {
  /** Logger for reporting status and errors */
  logger: Logger;
  /** OpenCode client for session operations */
  client: OpencodeClient;
  /** Override BeadsContext (for testing) */
  beadsContext?: BeadsContext;
}
```

**Rules:**
- Define interfaces at file top, before implementation
- Each class has an `{ClassName}Options` interface
- Use JSDoc comments for each property
- Export interfaces for external use
- Use `export type` for type re-exports

### Error Handling

```typescript
// Style A: Silent failure with fallback (detection/probes)
try {
  const parsed = parseYaml(content);
  // ... processing
} catch {
  return { frontmatter: {}, body: content }; // Safe default
}

// Style B: Try-catch with logging (async operations)
try {
  const result = await this.fetchData();
} catch (error) {
  this.logger.error("Failed to fetch", { error: String(error) });
}

// Style C: Finally blocks for timing/cleanup
try {
  // ... work
} finally {
  this.logger.debug("completed", { durationMs: Date.now() - start });
}
```

**Rules:**
- Use `catch {` when error not needed, `catch (error)` when logged
- Convert errors to string: `String(error)`
- No throw statements - catch and handle gracefully
- Prefer silent failures with safe defaults

### Naming Conventions

| Type | Convention | Examples |
|------|-----------|----------|
| Variables/functions | camelCase | `const startTime = Date.now();` |
| Boolean functions | is/has/should prefix | `isPluginDisabled()`, `shouldAutoApprove()` |
| Classes/interfaces | PascalCase | `class BeadsService`, `interface Config` |
| Constants | SCREAMING_SNAKE_CASE | `const BEADS_AGENT_GUIDANCE = "...";` |
| Files | kebab-case | `beads-service.ts`, `session-export.ts` |
| Abbreviations | Uppercase | `sessionID` not `sessionId` |

### Function Style

```typescript
// Exported functions: use function keyword
export function parseFrontmatter(content: string): ParsedDocument {
  // ...
}

// Internal/inline: use arrow functions
const log = (level: string, message: string) => {
  // ...
};

// Class methods: use method syntax
class MyService {
  async processConfig(config: Config): Promise<void> {
    // ...
  }
}
```

### Async Patterns

```typescript
// Primary: async/await for sequential logic
async function exportSession(id: string): Promise<Result> {
  const session = await this.getSession(id);
  const messages = await this.getMessages(id);
  return { session, messages };
}

// Parallel operations: Promise.all
const [session, messages, diffs] = await Promise.all([
  this.getSession(id),
  this.getMessages(id),
  this.getDiffs(id).catch(() => null), // Graceful degradation
]);

// Fire-and-forget: Promise chains
beadsService.checkAvailability()
  .then(() => log.debug("completed"))
  .catch((err) => log.error("failed", { error: String(err) }));
```

**Rules:**
- Prefer `async/await` over raw Promises
- Use `Promise.all()` for parallel operations
- Use `.catch()` inline for graceful degradation
- Promise chains for background tasks only

### Comments and Documentation

```typescript
/**
 * Parse YAML frontmatter from a markdown document.
 *
 * Frontmatter must be:
 * - At the very start of the document
 * - Enclosed in --- delimiters
 * - Valid YAML content
 *
 * @param content - The full document content
 * @returns Parsed frontmatter and body
 */
export function parseFrontmatter(content: string): ParsedDocument {
```

**Rules:**
- JSDoc for all exported functions/classes
- Inline comments explain "why" not "what"
- Comments for SDK type workarounds with `as any`

### Module Exports

```typescript
// Named exports only - NO default exports
export function createLogger() { }
export type { Logger } from "./logger";
export const SERVICE_NAME = "opencode-coder";

// Barrel pattern for package indexes
// core/index.ts
export { createLogger, SERVICE_NAME } from "./logger";
export { getVersionInfo } from "./version";
```

## Testing Patterns

### Test Structure

```typescript
import { describe, expect, it } from "bun:test";
import { parseFrontmatter } from "../../src/core/parser";

describe("parseFrontmatter", () => {
  it("should parse valid frontmatter with body", () => {
    const content = `---
name: test-name
---
Body content`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({ name: "test-name" });
    expect(result.body).toBe("Body content");
  });
});
```

**Rules:**
- One test file per source module (`parser.test.ts` → `src/core/parser.ts`)
- Use helpers from `tests/helpers/` (mock-logger, mock-client)
- Unit tests: fast, mocked dependencies
- Integration tests: real dependencies, actual knowledge-base files
- E2E tests: requires built plugin and opencode CLI

## OpenCode Documentation References

- [Commands](https://opencode.ai/docs/commands/) - Custom commands with arguments
- [Agents](https://opencode.ai/docs/agents/) - Agent configuration and modes
- [Skills](https://opencode.ai/docs/skills/) - Agent skills (SKILL.md)
- [Plugins](https://opencode.ai/docs/plugins/) - Plugin development
- [SDK](https://opencode.ai/docs/sdk/) - TypeScript SDK reference

## Releases

Use the **github-releases** skill to perform releases. See `docs/RELEASING.md` for details.

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
