# Coding Guidelines

## 1. Source Architecture Overview

### Minimal Entry Point Pattern

- `src/index.ts` is intentionally minimal (~70 lines)
- Delegates ALL functionality to domain packages
- Only orchestrates initialization order and wires dependencies

### Package Structure

```
src/
├── index.ts           # Plugin entry - minimal, delegates to packages
├── core/              # Foundation utilities (logger, version, parser)
├── config/            # Configuration loading and schema
├── kb/                # Knowledge base loading (commands, agents)
├── service/           # Main services (KnowledgeBaseService, BeadsService)
├── template/          # Template rendering with Mustache
├── beads/             # Beads integration (detector, context)
└── github/            # GitHub integration (detector, remote detection)
```

## 2. Package Index Pattern

Every package has an `index.ts` that exposes its public interface:

```typescript
// Example from src/core/index.ts
export { createLogger, SERVICE_NAME } from "./logger";
export type { Logger } from "./logger";

export { getVersionInfo } from "./version";
export type { VersionInfo } from "./version";

export { parseFrontmatter } from "./parser";
export type { Frontmatter, ParsedDocument } from "./parser";
```

### Rules

- Import from package index, not internal files: `import { Logger } from "./core"` ✅
- Never import from internal files: `import { Logger } from "./core/logger"` ❌
- Export both values AND types explicitly
- Keep implementation details private (not exported)

## 3. Test Structure

### Three Test Levels

```
tests/
├── unit/          # Fast, isolated tests with mocks
├── integration/   # Tests with real dependencies
├── e2e/           # Full plugin tests with opencode
├── helpers/       # Shared test utilities
│   ├── mock-client.ts
│   └── mock-logger.ts
└── fixtures/      # Test data files
    ├── configs/   # JSON config fixtures
    └── markdown/  # Command/agent fixtures
```

### Unit Tests (`tests/unit/`)

- One test file per source module (e.g., `config.test.ts` → `src/config/`)
- Use mocks via helpers (`createMockLogger`, `createMockPluginInput`)
- Test edge cases and error handling
- Fast, no external dependencies

### Integration Tests (`tests/integration/`)

- Test real component interactions
- Uses actual knowledge-base files
- Verifies config merging, command loading

### E2E Tests (`tests/e2e/`)

- Requires built plugin (`dist/opencode-coder.js`)
- Requires opencode CLI installed
- Tests full plugin lifecycle with real opencode server

### Test Helpers (`tests/helpers/`)

- `mock-logger.ts` - Logger with assertion helpers (`hasLogged()`)
- `mock-client.ts` - OpenCode client mock

### Test Fixtures (`tests/fixtures/`)

- Real file fixtures for testing loaders
- Organized by type (configs, markdown)

## 4. Running Tests

```bash
bun test                    # All tests
bun test tests/unit         # Unit tests only
bun test tests/integration  # Integration tests
bun test tests/e2e          # E2E tests (requires build + opencode)
```
