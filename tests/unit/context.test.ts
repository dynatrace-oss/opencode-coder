import { describe, expect, it, beforeEach } from "bun:test";
import { BeadsContext, type CommandExecutor, type BeadsIssueSummary } from "../../src/beads/context";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

describe("BeadsContext", () => {
  let mockLogger: MockLogger;
  let mockExecutor: CommandExecutor;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("isBdAvailable", () => {
    it("should return true when bd command succeeds", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd --version") {
            return { stdout: "bd 0.1.0", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const available = await context.isBdAvailable();

      expect(available).toBe(true);
    });

    it("should return false when bd command fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "command not found", exitCode: 127 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const available = await context.isBdAvailable();

      expect(available).toBe(false);
    });

    it("should return false when executor throws", async () => {
      mockExecutor = {
        async exec() {
          throw new Error("exec failed");
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const available = await context.isBdAvailable();

      expect(available).toBe(false);
    });
  });

  describe("getReadyIssues", () => {
    it("should return parsed issues from bd ready --json", async () => {
      const mockIssues: BeadsIssueSummary[] = [
        { id: "oc-001", title: "Test Issue", status: "open", priority: 2, issue_type: "task" },
        { id: "oc-002", title: "Another Issue", status: "open", priority: 1, issue_type: "bug" },
      ];

      mockExecutor = {
        async exec(command: string) {
          if (command === "bd ready --json") {
            return { stdout: JSON.stringify(mockIssues), stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const issues = await context.getReadyIssues();

      expect(issues).toEqual(mockIssues);
    });

    it("should return empty array when bd ready fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "error", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const issues = await context.getReadyIssues();

      expect(issues).toEqual([]);
    });

    it("should return empty array when JSON parsing fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "invalid json", stderr: "", exitCode: 0 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const issues = await context.getReadyIssues();

      expect(issues).toEqual([]);
    });
  });

  describe("getInProgressIssues", () => {
    it("should return parsed issues from bd list --status=in_progress --json", async () => {
      const mockIssues: BeadsIssueSummary[] = [
        { id: "oc-003", title: "In Progress Issue", status: "in_progress", priority: 1, issue_type: "feature" },
      ];

      mockExecutor = {
        async exec(command: string) {
          if (command === "bd list --status=in_progress --json") {
            return { stdout: JSON.stringify(mockIssues), stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const issues = await context.getInProgressIssues();

      expect(issues).toEqual(mockIssues);
    });

    it("should return empty array when bd list fails", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "error", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const issues = await context.getInProgressIssues();

      expect(issues).toEqual([]);
    });
  });

  describe("getContext", () => {
    it("should return full context when bd is available", async () => {
      const readyIssues: BeadsIssueSummary[] = [
        { id: "oc-001", title: "Ready Issue", status: "open", priority: 2, issue_type: "task" },
      ];
      const inProgressIssues: BeadsIssueSummary[] = [
        { id: "oc-002", title: "In Progress", status: "in_progress", priority: 1, issue_type: "bug" },
      ];

      mockExecutor = {
        async exec(command: string) {
          if (command === "bd --version") {
            return { stdout: "bd 0.1.0", stderr: "", exitCode: 0 };
          }
          if (command === "bd ready --json") {
            return { stdout: JSON.stringify(readyIssues), stderr: "", exitCode: 0 };
          }
          if (command === "bd list --status=in_progress --json") {
            return { stdout: JSON.stringify(inProgressIssues), stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(true);
      expect(info.readyIssues).toEqual(readyIssues);
      expect(info.inProgressIssues).toEqual(inProgressIssues);
      expect(info.contextString).toContain("## Beads Issue Tracking Context");
      expect(info.contextString).toContain("oc-001");
      expect(info.contextString).toContain("oc-002");
      expect(info.contextString).toContain("P2-medium");
      expect(info.contextString).toContain("P1-high");
    });

    it("should return empty context when bd is not available", async () => {
      mockExecutor = {
        async exec() {
          return { stdout: "", stderr: "command not found", exitCode: 127 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(false);
      expect(info.readyIssues).toEqual([]);
      expect(info.inProgressIssues).toEqual([]);
      expect(info.contextString).toBe("");
    });

    it("should show helpful message when no issues exist", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd --version") {
            return { stdout: "bd 0.1.0", stderr: "", exitCode: 0 };
          }
          if (command === "bd ready --json") {
            return { stdout: "[]", stderr: "", exitCode: 0 };
          }
          if (command === "bd list --status=in_progress --json") {
            return { stdout: "[]", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.available).toBe(true);
      expect(info.contextString).toContain("No issues currently tracked");
      expect(info.contextString).toContain("bd create");
    });

    it("should include quick commands in context string", async () => {
      mockExecutor = {
        async exec(command: string) {
          if (command === "bd --version") {
            return { stdout: "bd 0.1.0", stderr: "", exitCode: 0 };
          }
          return { stdout: "[]", stderr: "", exitCode: 0 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.contextString).toContain("### Quick Commands:");
      expect(info.contextString).toContain("bd ready");
      expect(info.contextString).toContain("bd show <id>");
      expect(info.contextString).toContain("bd update <id> --status in_progress");
      expect(info.contextString).toContain("bd close <id>");
    });
  });

  describe("priority formatting", () => {
    it("should format all priority levels correctly", async () => {
      const issues: BeadsIssueSummary[] = [
        { id: "p0", title: "Critical", status: "open", priority: 0, issue_type: "bug" },
        { id: "p1", title: "High", status: "open", priority: 1, issue_type: "bug" },
        { id: "p2", title: "Medium", status: "open", priority: 2, issue_type: "task" },
        { id: "p3", title: "Low", status: "open", priority: 3, issue_type: "task" },
        { id: "p4", title: "Backlog", status: "open", priority: 4, issue_type: "feature" },
      ];

      mockExecutor = {
        async exec(command: string) {
          if (command === "bd --version") {
            return { stdout: "bd 0.1.0", stderr: "", exitCode: 0 };
          }
          if (command === "bd ready --json") {
            return { stdout: JSON.stringify(issues), stderr: "", exitCode: 0 };
          }
          if (command === "bd list --status=in_progress --json") {
            return { stdout: "[]", stderr: "", exitCode: 0 };
          }
          return { stdout: "", stderr: "", exitCode: 1 };
        },
      };

      const context = new BeadsContext({ logger: mockLogger, executor: mockExecutor });
      const info = await context.getContext();

      expect(info.contextString).toContain("P0-critical");
      expect(info.contextString).toContain("P1-high");
      expect(info.contextString).toContain("P2-medium");
      expect(info.contextString).toContain("P3-low");
      expect(info.contextString).toContain("P4-backlog");
    });
  });
});
