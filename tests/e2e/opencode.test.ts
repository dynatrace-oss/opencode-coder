import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { createOpencodeClient, createOpencodeServer, type OpencodeClient } from "@opencode-ai/sdk";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { access, mkdir, writeFile, rm, symlink } from "fs/promises";
import { $ } from "bun";
import { createServer } from "net";

// Get project root directory
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..", "..");
const PLUGIN_PATH = join(PROJECT_ROOT, "dist", "opencode-coder.js");
const TEST_PROJECT_DIR = join(PROJECT_ROOT, "tests", "e2e", ".test-project");

/**
 * Check if opencode CLI is available (required by SDK's createOpencodeServer)
 */
async function isOpencodeAvailable(): Promise<boolean> {
  try {
    const result = await $`which opencode`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

// Check availability before defining tests - SDK requires opencode binary
const canRunE2E = await isOpencodeAvailable();

/**
 * Find an available port
 */
async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.listen(0, () => {
      const address = server.address();
      if (address && typeof address === "object") {
        const port = address.port;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error("Could not get port")));
      }
    });
    server.on("error", reject);
  });
}

/**
 * Check if the plugin has been built
 */
async function isPluginBuilt(): Promise<boolean> {
  try {
    await access(PLUGIN_PATH);
    return true;
  } catch {
    return false;
  }
}

/**
 * Build the plugin
 */
async function buildPlugin(): Promise<void> {
  const result = await $`bun run build`.cwd(PROJECT_ROOT).quiet();
  if (result.exitCode !== 0) {
    throw new Error(`Failed to build plugin: ${result.stderr}`);
  }
}

/**
 * Set up a test project directory with opencode configuration
 */
async function setupTestProject(): Promise<void> {
  // Create test project directory structure
  await mkdir(TEST_PROJECT_DIR, { recursive: true });

  // Create .opencode directory with plugin
  const opencodeDir = join(TEST_PROJECT_DIR, ".opencode");
  const pluginDir = join(opencodeDir, "plugin");
  await mkdir(pluginDir, { recursive: true });

  // Create package.json for opencode
  await writeFile(
    join(opencodeDir, "package.json"),
    JSON.stringify({
      dependencies: {
        "@opencode-ai/plugin": "^1.0.185",
      },
    })
  );

  // Install dependencies
  await $`bun install`.cwd(opencodeDir).quiet();

  // Create symlink to the plugin
  const pluginSymlink = join(pluginDir, "opencode-coder.js");
  try {
    await rm(pluginSymlink, { force: true });
  } catch {
    // Ignore if doesn't exist
  }
  await symlink(PLUGIN_PATH, pluginSymlink);
}

/**
 * Clean up test project directory
 */
async function cleanupTestProject(): Promise<void> {
  try {
    await rm(TEST_PROJECT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore errors
  }
}

describe.skipIf(!canRunE2E)("OpencodeCoder E2E Tests", () => {
  let server: { url: string; close: () => void } | null = null;
  let client: OpencodeClient | null = null;

  beforeAll(async () => {
    // Build plugin if needed
    if (!(await isPluginBuilt())) {
      console.log("Building plugin...");
      await buildPlugin();
    }

    // Set up test project
    console.log("Setting up test project...");
    await setupTestProject();

    // Find an available port
    const port = await findAvailablePort();
    console.log(`Using port ${port} for opencode server`);

    // Start opencode server in the test project directory
    console.log("Starting opencode server...");
    
    // Save current directory and change to test project
    const originalCwd = process.cwd();
    process.chdir(TEST_PROJECT_DIR);
    
    try {
      server = await createOpencodeServer({
        port,
        timeout: 30000,
      });

      // Create client connected to the server
      client = createOpencodeClient({
        baseUrl: server.url,
      });

      console.log(`OpenCode server started at ${server.url}`);
    } finally {
      // Restore original directory
      process.chdir(originalCwd);
    }
  }, 60000); // 60 second timeout for setup

  afterAll(async () => {
    // Close server
    if (server) {
      console.log("Stopping opencode server...");
      server.close();
    }

    // Clean up test project
    await cleanupTestProject();
  });

  describe("plugin registration", () => {
    it("should have server running", () => {
      expect(server).not.toBeNull();
      expect(server?.url).toBeDefined();
    });

    it("should register plugin agents", async () => {
      const response = await client!.app.agents();
      const agents = response.data;

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);

      // Our expected agents from knowledge-base/agent/
      // After refactoring, plugin only registers agents (not commands).
      // Commands are now provided by skills loaded by OpenCode's skill system.
      const expectedAgentNames = [
        "beads-task-agent",
      ];

      // Check for our plugin agents
      const pluginAgents = agents?.filter((agent) =>
        expectedAgentNames.includes(agent.name ?? "")
      ) ?? [];

      console.log(`Found ${pluginAgents.length} plugin agents out of ${expectedAgentNames.length} expected`);
      console.log("Found agents:", pluginAgents.map((a) => a.name));

      expect(pluginAgents.length).toBeGreaterThan(0);
    });
  });
});
