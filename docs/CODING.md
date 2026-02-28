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
├── system-info/       # System information collection tool
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

## 3. Unit Testing

One test file per source module (e.g., `config.test.ts` → `src/config/`):

- Use mocks via helpers (`createMockLogger`, `createMockPluginInput`)
- Test edge cases and error handling
- Fast, no external dependencies

```bash
bun test                                # All tests
bun test tests/unit                     # Unit tests only
bun test tests/unit/parser.test.ts      # Single test file
bun test --test-name-pattern "pattern"  # Pattern match
```

For integration tests, e2e tests, fixtures, and test helpers, see [TESTING.md](TESTING.md).


## AimgrService

### Purpose

The `AimgrService` provides automatic integration with aimgr (AI Resource Manager) for discovering and installing AI resources when the plugin starts.

### Key Features

- **Auto-detection**: Checks if aimgr CLI is installed on PATH
- **Auto-initialization**: Runs `aimgr init` if no `ai.package.yaml` exists
- **Package installation**: Installs `opencode-coder` package if available
- **User notifications**: Shows toast messages for initialization status
- **Graceful degradation**: All errors are logged but don't prevent plugin loading

### Architecture

```typescript
class AimgrService {
  // Detection methods (synchronous)
  isAimgrAvailable(): boolean
  hasPackageYaml(): boolean
  isPackageAvailable(packageName: string): boolean
  
  // Action methods (synchronous, throw on error)
  initializeAimgr(): void
  installPackage(packageName: string): void
  
  // Main orchestration (async, catches all errors)
  autoInitialize(): Promise<void>
}
```

### Integration Pattern

The service is instantiated in `src/index.ts` and runs in the background:

```typescript
// Create service
const aimgrService = new AimgrService({ logger: log, client });

// Run in background (doesn't block plugin loading)
aimgrService.autoInitialize()
  .then(() => log.debug("aimgr initialized"))
  .catch((err) => log.error("aimgr failed", { error: err }));
```

### Testing

- All methods are unit tested with mocks for `execSync` and `fs.existsSync`
- Tests verify both success and failure scenarios
- `autoInitialize` is tested for all code paths (skip, init, install, error)
- See `src/service/__tests__/aimgr-service.test.ts`

### Error Handling

- Individual methods (`initializeAimgr`, `installPackage`) throw errors
- `autoInitialize` catches all errors and logs them
- Plugin continues loading even if aimgr operations fail
- This ensures aimgr is optional and doesn't break the plugin

