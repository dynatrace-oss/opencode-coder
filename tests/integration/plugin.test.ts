import { describe, expect, it } from "bun:test";
import { OpencodeCoder } from "../../src/index";
import { createMockPluginInput, asMockPluginInput } from "../helpers/mock-client";
import type { Config } from "@opencode-ai/sdk";

describe("OpencodeCoder Plugin Integration", () => {
  describe("plugin initialization", () => {
    it("should initialize and return hooks", async () => {
      const mockInput = createMockPluginInput();

      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      expect(hooks).toBeDefined();
      expect(hooks.config).toBeInstanceOf(Function);
    });

    it("should log loading message on initialization", async () => {
      const mockInput = createMockPluginInput();

      await OpencodeCoder(asMockPluginInput(mockInput));

      const loadingLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("loading")
      );
      expect(loadingLog).toBeDefined();
      expect(loadingLog?.service).toBe("opencode-coder");
    });
  });

  describe("config hook", () => {
    it("should register commands and agents from real knowledge base", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      
      const config: Config = {};
      await hooks.config?.(config);

      // Should have loaded commands from knowledge-base/command/
      expect(config.command).toBeDefined();
      expect(Object.keys(config.command ?? {}).length).toBeGreaterThan(0);

      // Should have loaded agents from knowledge-base/agent/
      expect(config.agent).toBeDefined();
      expect(Object.keys(config.agent ?? {}).length).toBeGreaterThan(0);
    });

    it("should preserve existing config entries", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {
        command: { "existing/command": { template: "Existing template" } },
        agent: { "existing-agent": { prompt: "Existing prompt" } },
      };
      await hooks.config?.(config);

      // Original entries should still exist
      expect(config.command?.["existing/command"]).toEqual({ template: "Existing template" });
      expect(config.agent?.["existing-agent"]).toEqual({ prompt: "Existing prompt" });

      // New entries should be added
      expect(Object.keys(config.command ?? {}).length).toBeGreaterThan(1);
      expect(Object.keys(config.agent ?? {}).length).toBeGreaterThan(1);
    });

    it("should log command and agent registration", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Should have info log about loaded counts
      const loadedLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("commands") && log.message.includes("agents")
      );
      expect(loadedLog).toBeDefined();
    });
  });

  describe("real knowledge base loading", () => {
    it("should load story commands", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check for expected story commands from knowledge-base/command/story/
      const storyCommands = Object.keys(config.command ?? {}).filter((k) =>
        k.startsWith("story/")
      );
      expect(storyCommands.length).toBeGreaterThan(0);
    });

    it("should load bug commands", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check for expected bug commands from knowledge-base/command/bug/
      const bugCommands = Object.keys(config.command ?? {}).filter((k) =>
        k.startsWith("bug/")
      );
      expect(bugCommands.length).toBeGreaterThan(0);
    });

    it("should load agents with proper configuration", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      // Check that agents have proper prompt content
      const agentEntries = Object.entries(config.agent ?? {});
      expect(agentEntries.length).toBeGreaterThan(0);

      // Each agent should have a prompt
      for (const [, agent] of agentEntries) {
        if (agent) {
          expect(agent.prompt).toBeDefined();
          expect(agent.prompt?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("command structure validation", () => {
    it("should create commands with valid template", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      for (const [, cmd] of Object.entries(config.command ?? {})) {
        if (cmd) {
          expect(cmd.template).toBeDefined();
          expect(typeof cmd.template).toBe("string");
          expect(cmd.template?.length).toBeGreaterThan(0);
        }
      }
    });
  });

  describe("agent structure validation", () => {
    it("should create agents with valid prompt", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      for (const [, agent] of Object.entries(config.agent ?? {})) {
        if (agent) {
          expect(agent.prompt).toBeDefined();
          expect(typeof agent.prompt).toBe("string");
          expect(agent.prompt?.length).toBeGreaterThan(0);
        }
      }
    });

    it("should validate agent mode values", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      const config: Config = {};
      await hooks.config?.(config);

      const validModes = ["subagent", "primary", "all", undefined];
      for (const [, agent] of Object.entries(config.agent ?? {})) {
        if (agent) {
          expect(validModes).toContain(agent.mode);
        }
      }
    });
  });
});
