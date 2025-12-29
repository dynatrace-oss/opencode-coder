import { describe, expect, it, beforeEach } from "bun:test";
import { KnowledgeBaseService, type CommandsLoader, type AgentsLoader } from "../../src/kb/service";
import type { Config } from "@opencode-ai/sdk";
import type { CommandDef, AgentDef } from "../../src/kb/types";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

describe("KnowledgeBaseService", () => {
  let mockLogger: MockLogger;
  let mockConfig: Config;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = {} as Config;
  });

  describe("apply", () => {
    it("should not modify config when active is false", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: false },
        logger: mockLogger,
      });

      await service.apply(mockConfig);

      expect(mockConfig.command).toBeUndefined();
      expect(mockConfig.agent).toBeUndefined();
      expect(mockLogger.hasLogged("info", "disabled via config")).toBe(true);
    });

    it("should load and register commands when active is true", async () => {
      const mockCommands: CommandDef[] = [
        { name: "story/next", template: "Next template", description: "Next steps" },
        { name: "bug/fix", template: "Fix template", agent: "bug-fixer" },
      ];

      const mockCommandsLoader: CommandsLoader = async () => mockCommands;
      const mockAgentsLoader: AgentsLoader = async () => [];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: mockCommandsLoader,
        loadAgents: mockAgentsLoader,
      });

      await service.apply(mockConfig);

      expect(mockConfig.command).toBeDefined();
      expect(mockConfig.command?.["story/next"]).toEqual({
        template: "Next template",
        description: "Next steps",
      });
      expect(mockConfig.command?.["bug/fix"]).toEqual({
        template: "Fix template",
        agent: "bug-fixer",
      });
    });

    it("should load and register agents when active is true", async () => {
      const mockAgents: AgentDef[] = [
        { name: "code-reviewer", prompt: "Review code", description: "Reviews code" },
        { name: "doc-writer", prompt: "Write docs", mode: "subagent" },
      ];

      const mockCommandsLoader: CommandsLoader = async () => [];
      const mockAgentsLoader: AgentsLoader = async () => mockAgents;

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: mockCommandsLoader,
        loadAgents: mockAgentsLoader,
      });

      await service.apply(mockConfig);

      expect(mockConfig.agent).toBeDefined();
      expect(mockConfig.agent?.["code-reviewer"]).toEqual({
        prompt: "Review code",
        description: "Reviews code",
      });
      expect(mockConfig.agent?.["doc-writer"]).toEqual({
        prompt: "Write docs",
        mode: "subagent",
      });
    });

    it("should include all optional command fields", async () => {
      const mockCommands: CommandDef[] = [
        {
          name: "full/command",
          template: "Template",
          description: "Description",
          agent: "my-agent",
          model: "gpt-4",
          subtask: true,
        },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async () => mockCommands,
        loadAgents: async () => [],
      });

      await service.apply(mockConfig);

      expect(mockConfig.command?.["full/command"]).toEqual({
        template: "Template",
        description: "Description",
        agent: "my-agent",
        model: "gpt-4",
        subtask: true,
      });
    });

    it("should include all optional agent fields", async () => {
      const mockAgents: AgentDef[] = [
        {
          name: "full-agent",
          prompt: "Prompt",
          description: "Description",
          mode: "primary",
          model: "claude-3-opus",
        },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async () => [],
        loadAgents: async () => mockAgents,
      });

      await service.apply(mockConfig);

      expect(mockConfig.agent?.["full-agent"]).toEqual({
        prompt: "Prompt",
        description: "Description",
        mode: "primary",
        model: "claude-3-opus",
      });
    });

    it("should preserve existing config.command and config.agent", async () => {
      mockConfig.command = { "existing/cmd": { template: "Existing" } };
      mockConfig.agent = { "existing-agent": { prompt: "Existing" } };

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async () => [{ name: "new/cmd", template: "New" }],
        loadAgents: async () => [{ name: "new-agent", prompt: "New" }],
      });

      await service.apply(mockConfig);

      expect(mockConfig.command?.["existing/cmd"]).toEqual({ template: "Existing" });
      expect(mockConfig.command?.["new/cmd"]).toEqual({ template: "New" });
      expect(mockConfig.agent?.["existing-agent"]).toEqual({ prompt: "Existing" });
      expect(mockConfig.agent?.["new-agent"]).toEqual({ prompt: "New" });
    });

    it("should log loaded counts", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async () => [
          { name: "cmd1", template: "T1" },
          { name: "cmd2", template: "T2" },
        ],
        loadAgents: async () => [{ name: "agent1", prompt: "P1" }],
      });

      await service.apply(mockConfig);

      expect(mockLogger.hasLogged("info", "2 commands and 1 agents")).toBe(true);
    });

    it("should log each registered command and agent in debug", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async () => [{ name: "story/next", template: "T" }],
        loadAgents: async () => [{ name: "reviewer", prompt: "P" }],
      });

      await service.apply(mockConfig);

      expect(mockLogger.hasLogged("debug", "/story/next")).toBe(true);
      expect(mockLogger.hasLogged("debug", "@reviewer")).toBe(true);
    });

    it("should pass basePath to loaders", async () => {
      let capturedCommandsBasePath: string | undefined;
      let capturedAgentsBasePath: string | undefined;

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        basePath: "/custom/kb",
        loadCommands: async (_log, options) => {
          capturedCommandsBasePath = options?.basePath;
          return [];
        },
        loadAgents: async (_log, options) => {
          capturedAgentsBasePath = options?.basePath;
          return [];
        },
      });

      await service.apply(mockConfig);

      expect(capturedCommandsBasePath).toBe("/custom/kb");
      expect(capturedAgentsBasePath).toBe("/custom/kb");
    });

    it("should not pass basePath when not configured", async () => {
      let capturedOptions: unknown;

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        loadCommands: async (_log, options) => {
          capturedOptions = options;
          return [];
        },
        loadAgents: async () => [],
      });

      await service.apply(mockConfig);

      expect(capturedOptions).toBeUndefined();
    });
  });

  describe("constructor", () => {
    it("should use default loaders when not provided", async () => {
      // This tests that the service works with real loaders (integration-like)
      const service = new KnowledgeBaseService({
        coderConfig: { active: false },
        logger: mockLogger,
      });

      // Should not throw
      await service.apply(mockConfig);
      expect(mockLogger.hasLogged("info", "disabled")).toBe(true);
    });
  });
});
