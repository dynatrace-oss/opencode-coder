import { describe, expect, it } from "bun:test";
import { OpencodeCoder } from "../../src";
import type { PluginInput, Config } from "@opencode-ai/sdk";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Create a mock PluginInput for testing
 */
function createMockPluginInput(): Partial<PluginInput> {
  return {
    client: {
      // Mock client methods as needed
      send: async () => ({ success: true }),
      sendRaw: async (msg: any) => {
        // Return a proper ProtocolMessage response
        return { id: msg.id, type: "ack" as const };
      },
      createToast: async () => ({ success: true }),
      receiveRaw: async () => ({ id: "test", type: "ack" as const }),
      app: {
        log: async () => ({ success: true }),
      },
    } as any,
    cwd: join(__dirname, "..", "fixtures", "test-project"),
  };
}

/**
 * Type assertion helper for PluginInput
 */
function asMockPluginInput(mock: Partial<PluginInput>): PluginInput {
  return mock as PluginInput;
}

describe("OpencodeCoder Plugin Integration", () => {
  describe("plugin loading", () => {
    it("should load without errors", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(hooks).toBeDefined();
      expect(hooks.config).toBeDefined();
    });

    it("should provide config hook", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(typeof hooks.config).toBe("function");
    });

    it("should provide chat.message hook", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(typeof hooks["chat.message"]).toBe("function");
    });

    it("should provide event hook", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(typeof hooks.event).toBe("function");
    });
  });

  describe("real knowledge base loading", () => {
    it("should load bd commands from bundled knowledge base", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check for expected bd commands from knowledge-base/command/bd/
      const bdCommands = Object.keys(config.command ?? {}).filter((k) =>
        k.startsWith("bd/")
      );
      expect(bdCommands.length).toBeGreaterThan(0);
    });

    it("should not load coder commands from plugin (loaded from ai-resources instead)", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Plugin should NOT load coder commands - they're in ai-resources/commands/opencode-coder/
      // which are loaded by OpenCode itself, not by the plugin
      const coderCommands = Object.keys(config.command ?? {}).filter((k) =>
        k.startsWith("coder/") || k.startsWith("opencode-coder/")
      );
      expect(coderCommands.length).toBe(0);
    });

    it("should load agents with proper configuration", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check for expected agents from knowledge-base/agent/
      const agentKeys = Object.keys(config.agent ?? {});
      expect(agentKeys.length).toBeGreaterThan(0);

      // Verify agents have proper structure (mode, system, files)
      for (const key of agentKeys) {
        const agent = config.agent?.[key];
        expect(agent).toBeDefined();
        // Note: mode, system, files may be undefined for some agents
      }
    });

    it("should register beads commands when beads is available", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check for bd commands (beads integration)
      const bdCommands = Object.keys(config.command ?? {}).filter((k) =>
        k.startsWith("bd/")
      );
      expect(bdCommands.length).toBeGreaterThan(0);
    });
  });
});
