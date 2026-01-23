import { describe, expect, it, beforeEach, mock } from "bun:test";

// Create mock fs functions
const mockReaddir = mock(async (..._args: any[]) => []);
const mockReadFile = mock(async (..._args: any[]) => "");
const mockAccess = mock(async (..._args: any[]) => {});

// Mock fs object for DI
const mockFs = {
  readdir: mockReaddir,
  readFile: mockReadFile,
  access: mockAccess,
};

// Mock os.homedir
const mockHomedir = mock(() => "/home/testuser");
mock.module("os", () => ({
  homedir: mockHomedir,
}));

import { SkillService } from "../../src/service/skill-service";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import type { CoderConfig } from "../../src/config/schema";
import type { Config } from "@opencode-ai/sdk";

describe("SkillService", () => {
  let mockLogger: MockLogger;
  let coderConfig: CoderConfig;
  let service: SkillService;
  let config: Config;

  beforeEach(() => {
    mockLogger = createMockLogger();
    coderConfig = { active: true };
    service = new SkillService({
      coderConfig,
      logger: mockLogger,
      fileSystem: mockFs,
    });
    config = {};

    // Reset mocks
    mockReaddir.mockClear();
    mockReadFile.mockClear();
    mockAccess.mockClear();
    mockHomedir.mockClear();

    // Default mock implementations
    mockHomedir.mockReturnValue("/home/testuser");
  });

  describe("processConfig", () => {
    it("should skip if plugin not active", async () => {
      coderConfig.active = false;
      service = new SkillService({ coderConfig, logger: mockLogger, fileSystem: mockFs });

      await service.processConfig(config);

      expect(mockAccess).not.toHaveBeenCalled();
      expect(mockLogger.hasLogged("debug", "SkillService skipped")).toBe(true);
    });

    it("should log info when no skills found", async () => {
      // All directories don't exist
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      await service.processConfig(config);

      expect(mockLogger.hasLogged("info", "No skills found")).toBe(true);
    });

    it("should discover and register a simple skill", async () => {
      // Mock directory structure
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "my-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue(`# My Skill

This is a skill template.`);

      await service.processConfig(config);

      expect(config.command).toBeDefined();
      expect(config.command!["skills/my-skill"]).toBeDefined();
      expect(config.command!["skills/my-skill"].template).toContain("This is a skill template");
      expect(mockLogger.hasLogged("info", "Registered 1 skills as commands")).toBe(true);
    });

    it("should parse frontmatter and set command properties", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "advanced-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue(`---
description: An advanced skill
agent: custom-agent
model: gpt-4
subtask: true
---

# Advanced Skill

Template body here.`);

      await service.processConfig(config);

      const command = config.command!["skills/advanced-skill"];
      expect(command).toBeDefined();
      expect(command.template).toContain("Template body here");
      expect(command.description).toBe("An advanced skill");
      expect(command.agent).toBe("custom-agent");
      expect(command.model).toBe("gpt-4");
      expect(command.subtask).toBe(true);
    });

    it("should discover skills from all 4 locations", async () => {
      let accessCallCount = 0;
      mockAccess.mockImplementation(async (path: string) => {
        accessCallCount++;
        // All 4 skill directories exist
        if (path.includes("/skills") && !path.includes("SKILL.md")) {
          return;
        }
        // SKILL.md exists in all skill dirs
        if (path.includes("SKILL.md")) {
          return;
        }
        throw new Error("ENOENT");
      });

      // Each directory has one skill
      let readdirCallCount = 0;
      mockReaddir.mockImplementation(async () => {
        readdirCallCount++;
        return [
          { name: `skill-${readdirCallCount}`, isDirectory: () => true } as any,
        ];
      });

      mockReadFile.mockResolvedValue(`Skill template`);

      await service.processConfig(config);

      // Should find 4 skills (one from each location)
      expect(config.command!["skills/skill-1"]).toBeDefined();
      expect(config.command!["skills/skill-2"]).toBeDefined();
      expect(config.command!["skills/skill-3"]).toBeDefined();
      expect(config.command!["skills/skill-4"]).toBeDefined();
      expect(mockLogger.hasLogged("info", "Registered 4 skills as commands")).toBe(true);
    });

    it("should skip directories without SKILL.md", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        // .opencode/skills directory exists
        if (path.includes(".opencode/skills") && !path.includes("SKILL.md")) {
          return;
        }
        // Only valid-skill/SKILL.md exists
        if (path.includes("valid-skill/SKILL.md")) {
          return;
        }
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "valid-skill", isDirectory: () => true } as any,
        { name: "no-skill-md", isDirectory: () => true } as any,
      ]);

      let readFileCallCount = 0;
      mockReadFile.mockImplementation(async (path: string) => {
        readFileCallCount++;
        if (path.includes("valid-skill")) {
          return "Valid skill content";
        }
        throw new Error("Should not reach here");
      });

      await service.processConfig(config);

      expect(config.command!["skills/valid-skill"]).toBeDefined();
      expect(config.command!["skills/no-skill-md"]).toBeUndefined();
      expect(readFileCallCount).toBe(1); // Only read valid-skill
      expect(mockLogger.hasLogged("debug", "Skipping no-skill-md: no SKILL.md found")).toBe(true);
    });

    it("should skip skills with empty template body", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "empty-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue(`---
description: Empty skill
---

   
`); // Only whitespace

      await service.processConfig(config);

      expect(config.command?.["skills/empty-skill"]).toBeUndefined();
      expect(mockLogger.hasLogged("warn", "Skipping skill empty-skill: empty template body")).toBe(
        true
      );
    });

    it("should handle skill loading errors gracefully", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "good-skill", isDirectory: () => true } as any,
        { name: "bad-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockImplementation(async (path: string) => {
        if (path.includes("good-skill")) {
          return "Good skill content";
        }
        throw new Error("Permission denied");
      });

      await service.processConfig(config);

      // Good skill should be registered
      expect(config.command!["skills/good-skill"]).toBeDefined();
      // Bad skill should be skipped
      expect(config.command!["skills/bad-skill"]).toBeUndefined();
      // Error should be logged
      expect(mockLogger.hasLogged("error", "Failed to load skill bad-skill")).toBe(true);
    });

    it("should handle non-directory entries", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "skill-dir", isDirectory: () => true } as any,
        { name: "readme.md", isDirectory: () => false } as any, // File, not directory
        { name: ".hidden", isDirectory: () => false } as any,
      ]);

      mockReadFile.mockResolvedValue("Skill content");

      await service.processConfig(config);

      expect(config.command!["skills/skill-dir"]).toBeDefined();
      expect(config.command!["skills/readme.md"]).toBeUndefined();
      expect(config.command!["skills/.hidden"]).toBeUndefined();
    });

    it("should validate frontmatter field types", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "invalid-types", isDirectory: () => true } as any,
      ]);

      // Invalid types in frontmatter (numbers instead of strings)
      mockReadFile.mockResolvedValue(`---
description: 123
agent: 456
model: true
subtask: "not-boolean"
---

Template body`);

      await service.processConfig(config);

      const command = config.command!["skills/invalid-types"];
      expect(command).toBeDefined();
      expect(command.template).toContain("Template body");
      // Invalid types should be ignored
      expect(command.description).toBeUndefined();
      expect(command.agent).toBeUndefined();
      expect(command.model).toBeUndefined();
      expect(command.subtask).toBeUndefined();
    });

    it("should log duration metrics", async () => {
      mockAccess.mockRejectedValue(new Error("ENOENT"));

      await service.processConfig(config);

      expect(mockLogger.hasLogged("debug", "SkillService.processConfig completed")).toBe(true);
      const debugCall = mockLogger.calls.find((call) =>
        call.message.includes("SkillService.processConfig completed")
      );
      expect(debugCall?.extra?.durationMs).toBeDefined();
      expect(typeof debugCall?.extra?.durationMs).toBe("number");
    });

    it("should preserve existing commands in config", async () => {
      config.command = {
        "existing-command": {
          template: "Existing template",
          description: "Existing description",
        },
      };

      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "new-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue("New skill content");

      await service.processConfig(config);

      // Existing command should still be there
      expect(config.command["existing-command"]).toBeDefined();
      expect(config.command["existing-command"].template).toBe("Existing template");
      // New skill should be added
      expect(config.command["skills/new-skill"]).toBeDefined();
    });

    it("should use correct skill paths", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes("/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([]);

      await service.processConfig(config);

      // Check that all 4 paths were checked
      const accessCalls = mockAccess.mock.calls.map((call) => call[0] as string);
      const hasOpencode = accessCalls.some((p) => p.includes(".opencode/skills"));
      const hasClaude = accessCalls.some((p) => p.includes(".claude/skills"));
      const hasConfig = accessCalls.some((p) => p.includes(".config/opencode/skills"));
      expect(hasOpencode).toBe(true);
      expect(hasClaude).toBe(true);
      expect(hasConfig).toBe(true);
    });

    it("should handle malformed YAML frontmatter gracefully", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "malformed-yaml", isDirectory: () => true } as any,
      ]);

      // Invalid YAML syntax
      mockReadFile.mockResolvedValue(`---
description: [unclosed array
agent: {unclosed object
---

Template body`);

      await service.processConfig(config);

      // parseFrontmatter should handle this gracefully
      const command = config.command!["skills/malformed-yaml"];
      expect(command).toBeDefined();
      expect(command.template).toContain("Template body");
    });

    it("should log debug info for each discovered skill", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "test-skill", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue(`---
description: Test skill
agent: test-agent
---

Template`);

      await service.processConfig(config);

      expect(mockLogger.hasLogged("debug", "Discovered skill: skills/test-skill")).toBe(true);
      const debugCall = mockLogger.calls.find((call) =>
        call.message.includes("Discovered skill: skills/test-skill")
      );
      expect(debugCall?.extra?.hasDescription).toBe(true);
      expect(debugCall?.extra?.hasAgent).toBe(true);
    });

    it("should handle multiple skills with same name from different locations", async () => {
      // This tests that later locations override earlier ones (if same name)
      mockAccess.mockImplementation(async (path: string) => {
        // Only first location exists
        if (path.includes(".opencode/skills")) {
          return;
        }
        throw new Error("ENOENT");
      });

      // Has two skills with different names
      mockReaddir.mockResolvedValue([
        { name: "skill-1", isDirectory: () => true } as any,
        { name: "skill-2", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockResolvedValue(`Skill content`);

      await service.processConfig(config);

      // Both skills should be registered
      expect(config.command!["skills/skill-1"]).toBeDefined();
      expect(config.command!["skills/skill-2"]).toBeDefined();
      expect(mockLogger.hasLogged("info", "Registered 2 skills as commands")).toBe(true);
    });

    it("should only set subtask when explicitly boolean", async () => {
      mockAccess.mockImplementation(async (path: string) => {
        if (path.includes(".opencode/skills")) return;
        throw new Error("ENOENT");
      });

      mockReaddir.mockResolvedValue([
        { name: "subtask-true", isDirectory: () => true } as any,
        { name: "subtask-false", isDirectory: () => true } as any,
        { name: "subtask-missing", isDirectory: () => true } as any,
      ]);

      mockReadFile.mockImplementation(async (path: string) => {
        if (path.includes("subtask-true")) {
          return `---
subtask: true
---
Template`;
        }
        if (path.includes("subtask-false")) {
          return `---
subtask: false
---
Template`;
        }
        return "Template";
      });

      await service.processConfig(config);

      expect(config.command!["skills/subtask-true"].subtask).toBe(true);
      expect(config.command!["skills/subtask-false"].subtask).toBe(false);
      expect(config.command!["skills/subtask-missing"].subtask).toBeUndefined();
    });
  });
});
