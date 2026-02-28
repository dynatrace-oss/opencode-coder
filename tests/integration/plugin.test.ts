import { describe, expect, it } from "bun:test";
import { OpencodeCoder } from "../../src";
import type { PluginInput } from "@opencode-ai/sdk";
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
    });

    it("should provide tool hook with coder tool", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(hooks.tool).toBeDefined();
      expect(hooks.tool?.coder).toBeDefined();
    });
  });
});
