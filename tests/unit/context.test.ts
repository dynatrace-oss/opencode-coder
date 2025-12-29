import { describe, expect, it, beforeEach } from "bun:test";
import { BeadsContext, type CommandExecutor, BEADS_GUIDANCE } from "../../src/beads/context";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

describe("BeadsContext", () => {
  let mockLogger: MockLogger;
  let mockExecutor: CommandExecutor;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("getPrimeOutput", () => {
    it("should return prime output when bd prime succeeds", async () => {
      const primeOutput = "# Beads Context\n\nIn Progress: 2\nReady: 5";
      
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd prime") {
            return { stdout: primeOutput, stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const output = await context.getPrimeOutput();

      expect(output).toBe(primeOutput);
    });

    it("should return empty string when bd prime fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "error", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const output = await context.getPrimeOutput();

      expect(output).toBe("");
    });

    it("should return empty string when executor throws", async () => {
      mockExecutor = {
        async exec() {
          throw new Error("exec failed");
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const output = await context.getPrimeOutput();

      expect(output).toBe("");
    });

    it("should trim whitespace from prime output", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd prime") {
            return { stdout: "  prime output  \n\n", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const output = await context.getPrimeOutput();

      expect(output).toBe("prime output");
    });
  });

  describe("getContext", () => {
    it("should return full context when bd prime succeeds", async () => {
      const primeOutput = "# Beads Status\n\nIn Progress: oc-001\nReady: oc-002";
      
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd prime") {
            return { stdout: primeOutput, stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(true);
      expect(info.primeOutput).toBe(primeOutput);
      expect(info.contextString).toContain("<beads-context>");
      expect(info.contextString).toContain(primeOutput);
      expect(info.contextString).toContain("</beads-context>");
    });

    it("should return empty context when bd prime fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "command not found", exitCode: 127 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(false);
      expect(info.primeOutput).toBe("");
      expect(info.contextString).toBe("");
    });

    it("should return empty context when bd prime returns empty string", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd prime") {
            return { stdout: "", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(false);
      expect(info.primeOutput).toBe("");
      expect(info.contextString).toBe("");
    });

    it("should include BEADS_GUIDANCE in context string", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd prime") {
            return { stdout: "prime output", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      // Check for CLI usage guidance
      expect(info.contextString).toContain("## CLI Usage");
      expect(info.contextString).toContain("bd ready");
      expect(info.contextString).toContain("bd show <id>");
      expect(info.contextString).toContain("bd create");
      expect(info.contextString).toContain("bd update");
      expect(info.contextString).toContain("bd close");
      expect(info.contextString).toContain("bd sync");

      // Check for agent delegation guidance
      expect(info.contextString).toContain("## Agent Delegation");
    });
  });

  describe("BEADS_GUIDANCE", () => {
    it("should export BEADS_GUIDANCE constant", () => {
      expect(BEADS_GUIDANCE).toBeDefined();
      expect(typeof BEADS_GUIDANCE).toBe("string");
    });

    it("should contain CLI usage section", () => {
      expect(BEADS_GUIDANCE).toContain("## CLI Usage");
      expect(BEADS_GUIDANCE).toContain("bd ready");
      expect(BEADS_GUIDANCE).toContain("bd create");
      expect(BEADS_GUIDANCE).toContain("bd close");
    });

    it("should contain agent delegation section", () => {
      expect(BEADS_GUIDANCE).toContain("## Agent Delegation");
    });
  });
});
