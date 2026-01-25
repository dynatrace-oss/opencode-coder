import { describe, expect, it, beforeEach } from "bun:test";
import { KnowledgeBaseService } from "../../src/service";
import type { Config } from "@opencode-ai/sdk";
import type { CommandDef, AgentDef, KnowledgeBase } from "../../src/kb/types";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

/**
 * Create a mock KnowledgeBase for testing
 */
function createMockKnowledgeBase(commands: CommandDef[], agents: AgentDef[]): KnowledgeBase {
  return {
    load: async () => {},
    getCommands: () => commands,
    getAgents: () => agents,
    createDefinition: () => ({
      commands: () => commands,
      agents: () => agents,
    }),
  };
}

describe("KnowledgeBaseService", () => {
  let mockLogger: MockLogger;
  let mockConfig: Config;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = {} as Config;
  });

  describe("processConfig", () => {
    it("should not modify config when active is false", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: false },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase([], []),
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command).toBeUndefined();
      expect(mockConfig.agent).toBeUndefined();
      expect(mockLogger.hasLogged("info", "disabled via config")).toBe(true);
    });

    it("should load and register commands when active is true", async () => {
      const mockCommands: CommandDef[] = [
        { name: "story/next", template: "Next template", description: "Next steps" },
        { name: "bug/fix", template: "Fix template", agent: "bug-fixer" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
      });

      await service.processConfig(mockConfig);

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

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase([], mockAgents),
      });

      await service.processConfig(mockConfig);

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
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
      });

      await service.processConfig(mockConfig);

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
        knowledgeBase: createMockKnowledgeBase([], mockAgents),
      });

      await service.processConfig(mockConfig);

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
        knowledgeBase: createMockKnowledgeBase(
          [{ name: "new/cmd", template: "New" }],
          [{ name: "new-agent", prompt: "New" }]
        ),
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command?.["existing/cmd"]).toEqual({ template: "Existing" });
      expect(mockConfig.command?.["new/cmd"]).toEqual({ template: "New" });
      expect(mockConfig.agent?.["existing-agent"]).toEqual({ prompt: "Existing" });
      expect(mockConfig.agent?.["new-agent"]).toEqual({ prompt: "New" });
    });

    it("should log loaded counts", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(
          [
            { name: "cmd1", template: "T1" },
            { name: "cmd2", template: "T2" },
          ],
          [{ name: "agent1", prompt: "P1" }]
        ),
      });

      await service.processConfig(mockConfig);

      expect(mockLogger.hasLogged("info", "Loaded 2 commands and 1 agents")).toBe(true);
    });

    it("should log each registered command and agent", async () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(
          [{ name: "story/next", template: "T" }],
          [{ name: "reviewer", prompt: "P" }]
        ),
      });

      await service.processConfig(mockConfig);

      expect(mockLogger.hasLogged("info", "✓ Registered command: /story/next")).toBe(true);
      expect(mockLogger.hasLogged("info", "✓ Registered agent: @reviewer")).toBe(true);
    });
  });

  describe("constructor", () => {
    it("should use default loaders when no knowledgeBase provided", async () => {
      // This tests that the service works with real loaders (integration-like)
      const service = new KnowledgeBaseService({
        coderConfig: { active: false },
        logger: mockLogger,
      });

      // Should not throw
      await service.processConfig(mockConfig);
      expect(mockLogger.hasLogged("info", "disabled")).toBe(true);
    });
  });

  describe("beads commands", () => {
    it("should always include bd/* commands", async () => {
      const mockCommands: CommandDef[] = [
        { name: "story/next", template: "Story template" },
        { name: "bd/init", template: "Init beads" },
        { name: "bd/close", template: "Close issue" },
        { name: "bug/fix", template: "Fix bug" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command?.["story/next"]).toBeDefined();
      expect(mockConfig.command?.["bug/fix"]).toBeDefined();
      expect(mockConfig.command?.["bd/init"]).toBeDefined();
      expect(mockConfig.command?.["bd/close"]).toBeDefined();
    });

    it("should report correct count of all registered commands", async () => {
      const mockCommands: CommandDef[] = [
        { name: "story/next", template: "Story template" },
        { name: "bd/init", template: "Init beads" },
        { name: "bd/close", template: "Close issue" },
        { name: "bd/next", template: "Next issue" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
      });

      await service.processConfig(mockConfig);

      // Should report all 4 commands (no filtering)
      expect(mockLogger.hasLogged("info", "Loaded 4 commands and 0 agents")).toBe(true);
    });
  });

  describe("createKbInfo", () => {
    it("should create KbInfo from a command with description", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      const command: CommandDef = {
        name: "story/next",
        template: "Next story template",
        description: "Work on the next story",
      };

      const info = service.createKbInfo("command", command);

      expect(info.type).toBe("command");
      expect(info.name).toBe("story/next");
      expect(info.description).toBe("Work on the next story");
      expect(info.source).toBe(command);
    });

    it("should create KbInfo from a command without description", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      const command: CommandDef = {
        name: "bug/fix",
        template: "Fix bug template",
      };

      const info = service.createKbInfo("command", command);

      expect(info.type).toBe("command");
      expect(info.name).toBe("bug/fix");
      expect(info.description).toBeUndefined();
      expect(info.source).toBe(command);
    });

    it("should create KbInfo from an agent with description", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      const agent: AgentDef = {
        name: "code-reviewer",
        prompt: "Review code for issues",
        description: "Reviews code quality",
      };

      const info = service.createKbInfo("agent", agent);

      expect(info.type).toBe("agent");
      expect(info.name).toBe("code-reviewer");
      expect(info.description).toBe("Reviews code quality");
      expect(info.source).toBe(agent);
    });

    it("should create KbInfo from an agent without description", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      const agent: AgentDef = {
        name: "doc-writer",
        prompt: "Write documentation",
      };

      const info = service.createKbInfo("agent", agent);

      expect(info.type).toBe("agent");
      expect(info.name).toBe("doc-writer");
      expect(info.description).toBeUndefined();
      expect(info.source).toBe(agent);
    });

    it("should preserve all source fields in the returned KbInfo", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      const command: CommandDef = {
        name: "full/command",
        template: "Template content",
        description: "Full description",
        agent: "my-agent",
        model: "gpt-4",
        subtask: true,
      };

      const info = service.createKbInfo("command", command);

      expect(info.source).toEqual(command);
      expect((info.source as CommandDef).agent).toBe("my-agent");
      expect((info.source as CommandDef).model).toBe("gpt-4");
      expect((info.source as CommandDef).subtask).toBe(true);
    });
  });

  describe("getLoadErrors", () => {
    it("should return empty array when no errors", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase([], []),
      });

      expect(service.getLoadErrors()).toEqual([]);
    });
  });

  describe("getKnowledgeBaseCount", () => {
    it("should return 1 for bundled KB only", () => {
      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
      });

      expect(service.getKnowledgeBaseCount()).toBe(1);
    });

    it("should count enabled user KBs", () => {
      const service = new KnowledgeBaseService({
        coderConfig: {
          active: true,
          knowledgeBases: [
            { path: "/kb1", enabled: true },
            { path: "/kb2", enabled: false },
            { path: "/kb3", enabled: true },
          ],
        },
        logger: mockLogger,
      });

      // 1 bundled + 2 enabled user KBs
      expect(service.getKnowledgeBaseCount()).toBe(3);
    });
  });

  describe("feature flags filtering", () => {
    it("should filter out github/* commands when github feature is disabled", async () => {
      const mockCommands: CommandDef[] = [
        { name: "coder/status", template: "Status template" },
        { name: "github/sync-issues", template: "Sync issues template" },
        { name: "bd/init", template: "Init beads template" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
        featureFlags: { github: false },
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command?.["coder/status"]).toBeDefined();
      expect(mockConfig.command?.["bd/init"]).toBeDefined();
      expect(mockConfig.command?.["github/sync-issues"]).toBeUndefined();
    });

    it("should include github/* commands when github feature is enabled", async () => {
      const mockCommands: CommandDef[] = [
        { name: "coder/status", template: "Status template" },
        { name: "github/sync-issues", template: "Sync issues template" },
        { name: "bd/init", template: "Init beads template" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
        featureFlags: { github: true },
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command?.["coder/status"]).toBeDefined();
      expect(mockConfig.command?.["bd/init"]).toBeDefined();
      expect(mockConfig.command?.["github/sync-issues"]).toBeDefined();
    });

    it("should filter github/* commands by default when featureFlags not provided", async () => {
      const mockCommands: CommandDef[] = [
        { name: "coder/status", template: "Status template" },
        { name: "github/sync-issues", template: "Sync issues template" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
        // No featureFlags provided - defaults to {}
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.command?.["coder/status"]).toBeDefined();
      expect(mockConfig.command?.["github/sync-issues"]).toBeUndefined();
    });

    it("should log debug message when skipping filtered commands", async () => {
      const mockCommands: CommandDef[] = [
        { name: "github/sync-issues", template: "Sync issues template" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
        featureFlags: { github: false },
      });

      await service.processConfig(mockConfig);

      expect(mockLogger.hasLogged("debug", "Skipping command /github/sync-issues (GitHub not available)")).toBe(true);
    });

    it("should report correct count after filtering", async () => {
      const mockCommands: CommandDef[] = [
        { name: "coder/status", template: "Status template" },
        { name: "github/sync-issues", template: "Sync issues template" },
        { name: "github/create-pr", template: "Create PR template" },
        { name: "bd/init", template: "Init beads template" },
      ];

      const service = new KnowledgeBaseService({
        coderConfig: { active: true },
        logger: mockLogger,
        knowledgeBase: createMockKnowledgeBase(mockCommands, []),
        featureFlags: { github: false },
      });

      await service.processConfig(mockConfig);

      // Should report 2 commands (coder/status and bd/init), not 4
      expect(mockLogger.hasLogged("info", "Loaded 2 commands and 0 agents")).toBe(true);
    });
  });
});
