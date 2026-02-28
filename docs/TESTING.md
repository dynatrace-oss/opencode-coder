# Testing Guide

## Test Levels

This project uses three test levels. **Unit tests** are covered in [CODING.md](CODING.md) — this document covers integration and e2e testing.

| Level | Location | When to Run | Command |
|-------|----------|-------------|---------|
| Unit | `tests/unit/` | During development | `bun test tests/unit` |
| Integration | `tests/integration/` | Before committing | `bun test tests/integration` |
| E2E | `tests/e2e/` | Before releases | `bun test tests/e2e` |

## Integration Tests

**Location**: `tests/integration/`

Integration tests verify real component interactions without mocks:

- Tests the full plugin loading pipeline
- Uses actual knowledge-base files
- Verifies config merging, command loading
- Uses mock plugin input (not a real OpenCode server)

```bash
bun test tests/integration    # Run integration tests
```

## E2E Tests

**Location**: `tests/e2e/`

E2E tests run the full plugin lifecycle against a real OpenCode server.

### Prerequisites

1. **Built plugin**: `bun run build` (creates `dist/opencode-coder.js`)
2. **OpenCode CLI**: Must be installed and available in PATH
3. **Port availability**: Tests find an available port dynamically

### How It Works

1. Builds the plugin if not already built
2. Creates a temporary test project in `tests/e2e/.test-project/`
3. Sets up `.opencode/` directory with plugin symlink
4. Starts an OpenCode server via `@opencode-ai/sdk`
5. Runs tests against the live server
6. Cleans up the test project directory

### Running

```bash
bun test tests/e2e                     # Run with default timeout
bun test tests/e2e --timeout 60000     # Extended timeout (for CI)
```

### Troubleshooting

If e2e tests skip with "opencode binary not found":

- Ensure OpenCode is installed (`which opencode`)
- If installed via mise, restart your shell/OpenCode to refresh PATH
- Check mise installs: `ls ~/.local/share/mise/installs/opencode/`

## Test Fixtures

**Location**: `tests/fixtures/`

Organized by type:

- `configs/` — JSON config fixtures for testing configuration loading
- `markdown/` — Command/agent markdown fixtures for testing knowledge base loading

## Test Helpers

**Location**: `tests/helpers/`

### mock-logger

Creates a logger that captures all log calls for assertion:

```typescript
import { createMockLogger } from "../helpers/mock-logger";

const logger = createMockLogger();
// ... run code that logs ...

expect(logger.hasLogged("info", "expected message")).toBe(true);
expect(logger.getCallsByLevel("error")).toHaveLength(0);
logger.clear(); // Reset captured logs
```

### mock-client

Creates a mock OpenCode client and plugin input:

```typescript
import { createMockPluginInput, asMockPluginInput } from "../helpers/mock-client";

const mockInput = createMockPluginInput();
const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
```

## Coverage

```bash
bun run test:coverage    # Run tests with coverage report
```
