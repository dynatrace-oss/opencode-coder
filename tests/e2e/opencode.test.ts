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
 * Check if opencode CLI is available
 */
async function isOpencodeAvailable(): Promise<boolean> {
  try {
    const result = await $`which opencode`.quiet();
    return result.exitCode === 0;
  } catch {
    return false;
  }
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

  // Create .coder/coder.json for the plugin config
  const coderDir = join(TEST_PROJECT_DIR, ".coder");
  await mkdir(coderDir, { recursive: true });
  await writeFile(
    join(coderDir, "coder.json"),
    JSON.stringify({ active: true })
  );
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

describe("OpencodeCoder E2E Tests", () => {
  let opencodeAvailable = false;
  let server: { url: string; close: () => void } | null = null;
  let client: OpencodeClient | null = null;

  beforeAll(async () => {
    // Check if opencode is available
    opencodeAvailable = await isOpencodeAvailable();
    if (!opencodeAvailable) {
      throw new Error("E2E tests require opencode CLI to be installed. Install it or skip this test file.");
    }

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
    it("should have opencode available", () => {
      // Sanity check - beforeAll guarantees this
      expect(opencodeAvailable).toBe(true);
    });

    it("should have server running", () => {
      expect(server).not.toBeNull();
      expect(server?.url).toBeDefined();
    });

    it("should register plugin commands", async () => {
      const response = await client!.command.list();
      const commands = response.data;

      expect(commands).toBeDefined();
      expect(Array.isArray(commands)).toBe(true);

      // Check for our plugin commands (bd/* and coder/*)
      const bdCommands = commands?.filter((cmd) => cmd.name?.startsWith("bd/")) ?? [];
      const coderCommands = commands?.filter((cmd) => cmd.name?.startsWith("coder/")) ?? [];

      console.log(`Found ${bdCommands.length} bd commands and ${coderCommands.length} coder commands`);
      console.log("BD commands:", bdCommands.map((c) => c.name));
      console.log("Coder commands:", coderCommands.map((c) => c.name));

      // Our plugin should register bd and coder commands from knowledge-base/
      expect(bdCommands.length).toBeGreaterThan(0);
      expect(coderCommands.length).toBeGreaterThan(0);
    });

    it("should register plugin agents", async () => {
      const response = await client!.app.agents();
      const agents = response.data;

      expect(agents).toBeDefined();
      expect(Array.isArray(agents)).toBe(true);

      // Our expected agents from knowledge-base/agent/
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

    it("should have commands with valid structure", async () => {
      const response = await client!.command.list();
      const commands = response.data ?? [];

      // Get our bd/next command
      const bdNextCmd = commands.find((cmd) => cmd.name === "bd/next");
      if (bdNextCmd) {
        expect(bdNextCmd.template).toBeDefined();
        expect(bdNextCmd.template?.length).toBeGreaterThan(0);
        console.log("bd/next command found with template length:", bdNextCmd.template?.length);
      } else {
        // If bd/next isn't found, check if any bd commands exist
        const anyBdCmd = commands.find((cmd) => cmd.name?.startsWith("bd/"));
        if (anyBdCmd) {
          console.log("Found bd command:", anyBdCmd.name);
          expect(anyBdCmd.template).toBeDefined();
        }
      }
    });
  });

  describe("plugin configuration", () => {
    it("should load commands when plugin is active", async () => {
      // With active:true (default), commands should be registered
      const response = await client!.command.list();
      const commands = response.data ?? [];
      const pluginCommands = commands.filter(
        (cmd) => cmd.name?.startsWith("bd/") || cmd.name?.startsWith("coder/")
      );

      console.log(`Total plugin commands (bd/* + coder/*): ${pluginCommands.length}`);
      expect(pluginCommands.length).toBeGreaterThan(0);
    });
  });
});
