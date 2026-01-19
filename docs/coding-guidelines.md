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
├── service/           # Main services (KnowledgeBaseService, BeadsService, PlaygroundService)
├── template/          # Template rendering with Handlebars
└── beads/             # Beads integration (detector, context)
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

## 4. PlaygroundService

### Overview

`PlaygroundService` provides session-specific temporary folders for agent operations. It's designed for scratch work, experimentation, and intermediate files that don't belong in the project.

### Key Features

- **Automatic creation**: Folders created on-demand
- **Session isolation**: Each session gets its own unique folder
- **Path caching**: Subsequent requests return cached path (no I/O)
- **Graceful errors**: Logs errors, returns `undefined` (never throws)
- **OS cleanup**: Leverages system temp directory cleanup

### Integration Points

#### In Plugin Initialization (`src/index.ts`)

PlaygroundService is instantiated during plugin setup and injected into services that need it:

```typescript
import { PlaygroundService } from "./service";

// Create the service
const playgroundService = new PlaygroundService({
  logger,
  client: input.client,
});

// Inject into other services
const beadsService = new BeadsService({
  logger,
  client: input.client,
  playgroundService, // ← Injected here
  // ... other options
});
```

#### In BeadsService (`src/service/beads-service.ts`)

BeadsService uses playground to store session context:

```typescript
export class BeadsService {
  constructor(options: BeadsServiceOptions) {
    this.playgroundService = options.playgroundService;
  }

  async loadBeadsContext(): Promise<BeadsContext | undefined> {
    const sessionID = await this.getSessionID();
    const playgroundPath = await this.playgroundService.getOrCreatePlayground(sessionID);
    
    if (playgroundPath) {
      // Write context file to playground
      const contextPath = path.join(playgroundPath, "beads-context.md");
      await fs.writeFile(contextPath, contextContent);
    }
  }
}
```

#### Adding to New Services

To integrate playground into a new service:

1. Add to service options interface:
```typescript
export interface MyServiceOptions {
  logger: Logger;
  playgroundService: PlaygroundService;
}
```

2. Store reference in constructor:
```typescript
export class MyService {
  private readonly playgroundService: PlaygroundService;
  
  constructor(options: MyServiceOptions) {
    this.playgroundService = options.playgroundService;
  }
}
```

3. Use when needed:
```typescript
async doWork(sessionID: string) {
  const playground = await this.playgroundService.getOrCreatePlayground(sessionID);
  if (!playground) {
    this.logger.warn("Playground unavailable, using fallback");
    return;
  }
  
  // Use playground path
  const tempFile = path.join(playground, "temp-data.json");
  await fs.writeFile(tempFile, data);
}
```

### Service Interface

```typescript
class PlaygroundService {
  /**
   * Get or create playground folder for a session.
   * Creates folder if needed, returns cached path if available.
   * 
   * @param sessionID - Unique session identifier
   * @returns Absolute path to playground, or undefined if creation fails
   */
  async getOrCreatePlayground(sessionID: string): Promise<string | undefined>
  
  /**
   * Get cached playground path without I/O.
   * 
   * @param sessionID - Unique session identifier  
   * @returns Cached path if exists, undefined otherwise
   */
  getPlaygroundPath(sessionID: string): string | undefined
}
```

### Path Structure

```
$TMPDIR/opencode/<session-id>/
```

Example:
```
/tmp/opencode/abc123-def456-ghi789/
├── beads-context.md       # Beads context file
├── scratch.txt            # Agent scratch work
└── intermediate-data.json # Temporary processing files
```

### Best Practices

#### ✅ Do

- Use for temporary, session-specific files
- Check for `undefined` return (creation can fail)
- Log when playground is used (helps debugging)
- Use `path.join()` to build file paths
- Clean up critical resources (but OS will clean temp files)

#### ❌ Don't

- Don't store permanent data (it will be deleted)
- Don't share playground paths between sessions
- Don't throw errors if playground unavailable
- Don't manually create playground folders (use the service)
- Don't assume playground path format (use the service API)

### Error Handling

The service never throws—it logs and returns `undefined`:

```typescript
const playground = await playgroundService.getOrCreatePlayground(sessionID);

if (!playground) {
  // Graceful fallback
  logger.warn("Playground unavailable, skipping temp file creation");
  return;
}

// Safe to use playground path
await fs.writeFile(path.join(playground, "file.txt"), data);
```

### Testing

Mock the service in tests:

```typescript
const mockPlayground = {
  getOrCreatePlayground: async (sessionID: string) => `/tmp/test/${sessionID}`,
  getPlaygroundPath: (sessionID: string) => `/tmp/test/${sessionID}`,
};
```

For integration tests, use a real instance with test logger.

## 5. Running Tests

```bash
bun test                    # All tests
bun test tests/unit         # Unit tests only
bun test tests/integration  # Integration tests
bun test tests/e2e          # E2E tests (requires build + opencode)
```
