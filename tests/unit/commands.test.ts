import { describe, expect, it, beforeEach } from "bun:test";
import { loadCommands, type CommandsFileSystem } from "../../src/kb/commands";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import { join } from "path";

// Path to test fixtures
const FIXTURES_DIR = join(import.meta.dir, "..", "fixtures", "markdown");

describe("loadCommands", () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("with mock file system", () => {
    it("should load commands from categories", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [
              { name: "story", isDirectory: () => true, isFile: () => false },
            ];
          }
          if (path.endsWith("/story")) {
            return [
              { name: "next.md", isDirectory: () => false, isFile: () => true },
            ];
          }
          return [];
        },
        readFile: async () => `---
description: Shows next steps
agent: story-reviewer
---
Review the story and suggest next steps.`,
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toHaveLength(1);
      expect(commands[0]).toEqual({
        name: "story/next",
        template: "Review the story and suggest next steps.",
        description: "Shows next steps",
        agent: "story-reviewer",
      });
    });

    it("should load multiple commands from multiple categories", async () => {
      const files: Record<string, string> = {
        "/kb/command/story/next.md": `---
description: Next story steps
---
Next steps template`,
        "/kb/command/story/cleanup.md": `---
description: Cleanup story
---
Cleanup template`,
        "/kb/command/bug/fix.md": `---
description: Fix a bug
model: gpt-4
---
Fix bug template`,
      };

      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [
              { name: "story", isDirectory: () => true, isFile: () => false },
              { name: "bug", isDirectory: () => true, isFile: () => false },
            ];
          }
          if (path.endsWith("/story")) {
            return [
              { name: "next.md", isDirectory: () => false, isFile: () => true },
              { name: "cleanup.md", isDirectory: () => false, isFile: () => true },
            ];
          }
          if (path.endsWith("/bug")) {
            return [
              { name: "fix.md", isDirectory: () => false, isFile: () => true },
            ];
          }
          return [];
        },
        readFile: async (path: string) => files[path] ?? "",
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toHaveLength(3);
      expect(commands.map((c) => c.name).sort()).toEqual([
        "bug/fix",
        "story/cleanup",
        "story/next",
      ]);
    });

    it("should handle subtask flag", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [{ name: "cat", isDirectory: () => true, isFile: () => false }];
          }
          return [{ name: "cmd.md", isDirectory: () => false, isFile: () => true }];
        },
        readFile: async () => `---
subtask: true
---
Template`,
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands[0]?.subtask).toBe(true);
    });

    it("should not set subtask when value is not 'true'", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [{ name: "cat", isDirectory: () => true, isFile: () => false }];
          }
          return [{ name: "cmd.md", isDirectory: () => false, isFile: () => true }];
        },
        readFile: async () => `---
subtask: false
---
Template`,
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands[0]?.subtask).toBeUndefined();
    });

    it("should skip non-markdown files", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [{ name: "cat", isDirectory: () => true, isFile: () => false }];
          }
          return [
            { name: "valid.md", isDirectory: () => false, isFile: () => true },
            { name: "readme.txt", isDirectory: () => false, isFile: () => true },
            { name: ".hidden", isDirectory: () => false, isFile: () => true },
          ];
        },
        readFile: async () => "Template",
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toHaveLength(1);
      expect(commands[0]?.name).toBe("cat/valid");
    });

    it("should skip non-directory entries in command folder", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [
              { name: "valid-category", isDirectory: () => true, isFile: () => false },
              { name: "file.md", isDirectory: () => false, isFile: () => true },
            ];
          }
          return [{ name: "cmd.md", isDirectory: () => false, isFile: () => true }];
        },
        readFile: async () => "Template",
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toHaveLength(1);
      expect(commands[0]?.name).toBe("valid-category/cmd");
    });

    it("should return empty array on read error", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async () => {
          throw new Error("Permission denied");
        },
        readFile: async () => "",
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toEqual([]);
      expect(mockLogger.hasLogged("error", "Failed to load commands")).toBe(true);
    });

    it("should handle empty command directory", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async () => [],
        readFile: async () => "",
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands).toEqual([]);
    });

    it("should trim template body", async () => {
      const mockFs: CommandsFileSystem = {
        readdir: async (path: string) => {
          if (path.endsWith("/command")) {
            return [{ name: "cat", isDirectory: () => true, isFile: () => false }];
          }
          return [{ name: "cmd.md", isDirectory: () => false, isFile: () => true }];
        },
        readFile: async () => `---
description: Test
---

  Template with whitespace  

`,
      };

      const commands = await loadCommands(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(commands[0]?.template).toBe("Template with whitespace");
    });
  });

  describe("with real fixtures", () => {
    it("should load commands from test fixtures", async () => {
      const commands = await loadCommands(mockLogger, { basePath: FIXTURES_DIR });

      expect(commands.length).toBeGreaterThanOrEqual(2);

      const testCommand = commands.find((c) => c.name === "test-category/test-command");
      expect(testCommand).toBeDefined();
      expect(testCommand?.description).toBe("A test command for unit testing");
      expect(testCommand?.agent).toBe("test-agent");
      expect(testCommand?.model).toBe("gpt-4");
      expect(testCommand?.subtask).toBe(true);
      expect(testCommand?.template).toContain("command template for testing");

      const simpleCommand = commands.find((c) => c.name === "test-category/simple-command");
      expect(simpleCommand).toBeDefined();
      expect(simpleCommand?.description).toBe("A simple command without optional fields");
      expect(simpleCommand?.agent).toBeUndefined();
      expect(simpleCommand?.model).toBeUndefined();
      expect(simpleCommand?.subtask).toBeUndefined();
    });
  });
});
