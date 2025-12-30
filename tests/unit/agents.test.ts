import { describe, expect, it, beforeEach } from "bun:test";
import { loadAgents, type AgentsFileSystem } from "../../src/kb/loaders/agents";
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
      const mockFs: AgentsFileSystem = {
        readdir: async () => [
          { name: "code-reviewer.md", isFile: () => true },
        ],
        readFile: async () => `---
name: code-reviewer
description: Reviews code for best practices
model: claude-3-opus
mode: subagent
---
You are a code reviewer. Analyze code and provide feedback.`,
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
      const mockFs: AgentsFileSystem = {
        readdir: async () => [
          { name: "my-agent.md", isFile: () => true },
        ],
        readFile: async () => `---
description: An agent without name
---
Agent prompt`,
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

      const mockFs: AgentsFileSystem = {
        readdir: async () => [
          { name: "agent1.md", isFile: () => true },
          { name: "agent2.md", isFile: () => true },
        ],
        readFile: async (path: string) => files[path] ?? "",
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(2);
      expect(agents.map((a) => a.name).sort()).toEqual(["agent-one", "agent-two"]);
    });

    it("should handle mode values correctly", async () => {
      const modes = ["subagent", "primary", "all"] as const;
      
      for (const mode of modes) {
        const mockFs: AgentsFileSystem = {
          readdir: async () => [{ name: "agent.md", isFile: () => true }],
          readFile: async () => `---
mode: ${mode}
---
Prompt`,
        };

        const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });
        expect(agents[0]?.mode).toBe(mode);
      }
    });

    it("should ignore invalid mode values", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [{ name: "agent.md", isFile: () => true }],
        readFile: async () => `---
mode: invalid-mode
---
Prompt`,
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });
      expect(agents[0]?.mode).toBeUndefined();
    });

    it("should skip non-markdown files", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [
          { name: "valid-agent.md", isFile: () => true },
          { name: "readme.txt", isFile: () => true },
          { name: ".hidden", isFile: () => true },
          { name: "config.json", isFile: () => true },
        ],
        readFile: async () => "---\nname: valid\n---\nPrompt",
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(1);
      expect(agents[0]?.name).toBe("valid");
    });

    it("should skip non-file entries", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [
          { name: "valid-agent.md", isFile: () => true },
          { name: "subdirectory", isFile: () => false },
        ],
        readFile: async () => "---\nname: valid\n---\nPrompt",
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toHaveLength(1);
    });

    it("should return empty array on read error", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => {
          throw new Error("Permission denied");
        },
        readFile: async () => "",
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toEqual([]);
      expect(mockLogger.hasLogged("error", "Failed to load agents")).toBe(true);
    });

    it("should handle empty agent directory", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [],
        readFile: async () => "",
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents).toEqual([]);
    });

    it("should trim prompt body", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [{ name: "agent.md", isFile: () => true }],
        readFile: async () => `---
name: test
---

  Prompt with whitespace  

`,
      };

      const agents = await loadAgents(mockLogger, { fs: mockFs, basePath: "/kb" });

      expect(agents[0]?.prompt).toBe("Prompt with whitespace");
    });

    it("should handle agent without frontmatter", async () => {
      const mockFs: AgentsFileSystem = {
        readdir: async () => [{ name: "simple-agent.md", isFile: () => true }],
        readFile: async () => "Just a prompt without frontmatter",
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
