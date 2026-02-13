import { describe, expect, it, beforeEach } from "bun:test";
import { loadAgents } from "../../src/kb/loaders/agents";
import type { FileSystem } from "../../src/core";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import { join } from "path";

// Path to test fixtures
const FIXTURES_DIR = join(import.meta.dir, "..", "fixtures", "markdown");

describe("loadAgents", () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("with mock file system", () => {
    it("should load agents from agent directory", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [
          { name: "code-reviewer.md", isFile: () => true, isDirectory: () => false },
        ],
        readFile: async () => `---
name: code-reviewer
description: Reviews code for best practices
model: claude-3-opus
mode: subagent
---
You are a code reviewer. Analyze code and provide feedback.`,
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(1);
      expect(agents[0]).toEqual({
        name: "code-reviewer",
        description: "Reviews code for best practices",
        model: "claude-3-opus",
        mode: "subagent",
        prompt: "You are a code reviewer. Analyze code and provide feedback.",
      });
    });

    it("should use filename as name when frontmatter name is missing", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [
          { name: "my-agent.md", isFile: () => true, isDirectory: () => false },
        ],
        readFile: async () => `---
description: An agent without name
---
Agent prompt`,
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents[0]?.name).toBe("my-agent");
    });

    it("should load multiple agents", async () => {
      const files: Record<string, string> = {
        "/kb/agent/agent1.md": `---
name: agent-one
---
Prompt one`,
        "/kb/agent/agent2.md": `---
name: agent-two
description: Second agent
---
Prompt two`,
      };

      const mockFs: FileSystem = {
        readdir: async () => [
          { name: "agent1.md", isFile: () => true, isDirectory: () => false },
          { name: "agent2.md", isFile: () => true, isDirectory: () => false },
        ],
        readFile: async (path: string) => files[path] ?? "",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name).sort()).toEqual(["agent-one", "agent-two"]);
    });

    it("should handle mode values correctly", async () => {
      const modes = ["subagent", "primary", "all"] as const;
      
      for (const mode of modes) {
        const mockFs: FileSystem = {
          readdir: async () => [{ name: "agent.md", isFile: () => true, isDirectory: () => false }],
          readFile: async () => `---
mode: ${mode}
---
Prompt`,
          access: async () => {},
        };

        const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });
        expect(agents[0]?.mode).toBe(mode);
      }
    });

    it("should ignore invalid mode values", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [{ name: "agent.md", isFile: () => true, isDirectory: () => false }],
        readFile: async () => `---
mode: invalid-mode
---
Prompt`,
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });
      expect(agents[0]?.mode).toBeUndefined();
    });

    it("should skip non-markdown files", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [
          { name: "valid-agent.md", isFile: () => true, isDirectory: () => false },
          { name: "readme.txt", isFile: () => true, isDirectory: () => false },
          { name: ".hidden", isFile: () => true, isDirectory: () => false },
          { name: "config.json", isFile: () => true, isDirectory: () => false },
        ],
        readFile: async () => "---\nname: valid\n---\nPrompt",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(1);
      expect(agents[0]?.name).toBe("valid");
    });

    it("should skip non-file entries", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [
          { name: "valid-agent.md", isFile: () => true, isDirectory: () => false },
          { name: "subdirectory", isFile: () => false, isDirectory: () => true },
        ],
        readFile: async () => "---\nname: valid\n---\nPrompt",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(1);
    });

    it("should return empty array on read error", async () => {
      const mockFs: FileSystem = {
        readdir: async () => {
          throw new Error("Permission denied");
        },
        readFile: async () => "",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toEqual([]);
      expect(mockLogger.hasLogged("error", "Failed to load agents")).toBe(true);
    });

    it("should handle empty agent directory", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [],
        readFile: async () => "",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toEqual([]);
    });

    it("should trim prompt body", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [{ name: "agent.md", isFile: () => true, isDirectory: () => false }],
        readFile: async () => `---
name: test
---

  Prompt with whitespace  

`,
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents[0]?.prompt).toBe("Prompt with whitespace");
    });

    it("should handle agent without frontmatter", async () => {
      const mockFs: FileSystem = {
        readdir: async () => [{ name: "simple-agent.md", isFile: () => true, isDirectory: () => false }],
        readFile: async () => "Just a prompt without frontmatter",
        access: async () => {},
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents[0]).toEqual({
        name: "simple-agent",
        prompt: "Just a prompt without frontmatter",
      });
    });
  });

  describe("with real fixtures", () => {
    it("should load agents from test fixtures", async () => {
      const agents = await loadAgents(mockLogger, { basePath: FIXTURES_DIR });

      expect(agents.length).toBeGreaterThanOrEqual(1);

      const testAgent = agents.find((a) => a.name === "test-agent");
      expect(testAgent).toBeDefined();
      expect(testAgent?.description).toBe("A test agent for unit testing");
      expect(testAgent?.model).toBe("claude-3-opus");
      expect(testAgent?.mode).toBe("subagent");
      expect(testAgent?.prompt).toContain("You are a test agent");
    });
  });
});
