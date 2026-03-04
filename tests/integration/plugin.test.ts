import { describe, expect, it } from "bun:test";
import { OpencodeCoder } from "../../src";
import { createMockPluginInput, asMockPluginInput } from "../helpers/mock-client";

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
