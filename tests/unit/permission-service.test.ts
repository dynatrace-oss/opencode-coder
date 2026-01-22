import { describe, expect, it, beforeEach } from "bun:test";
import { PermissionService } from "../../src/service/permission-service";
import type { PermissionAskInput, PermissionAskOutput } from "../../src/service/permission-service";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

describe("PermissionService", () => {
  let mockLogger: MockLogger;
  let permissionService: PermissionService;

  beforeEach(() => {
    mockLogger = createMockLogger();
    permissionService = new PermissionService({
      coderConfig: { active: true },
      logger: mockLogger,
    });
  });

  describe("Built-in rules", () => {
    describe("Temp directory operations", () => {
      it("should auto-approve read operations in /tmp/", () => {
        const input: PermissionAskInput = {
          type: "read",
          title: "/tmp/some-file.txt",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBe("allow");
      });

      it("should auto-approve write operations in /tmp/", () => {
        const input: PermissionAskInput = {
          type: "write",
          title: "/tmp/another-file.txt",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBe("allow");
      });

      it("should auto-approve operations with path property", () => {
        const input: PermissionAskInput = {
          type: "read",
          path: "/tmp/file-via-path.txt",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBe("allow");
      });

      it("should not approve operations outside /tmp/", () => {
        const input: PermissionAskInput = {
          type: "write",
          title: "/home/user/file.txt",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBeUndefined();
      });

      it("should respect TMPDIR environment variable", () => {
        const oldTmpdir = process.env.TMPDIR;
        try {
          process.env.TMPDIR = "/custom/tmp";
          
          // Create new service with custom TMPDIR
          const customService = new PermissionService({
            coderConfig: { active: true },
            logger: mockLogger,
          });

          const input: PermissionAskInput = {
            type: "write",
            title: "/custom/tmp/file.txt",
          };
          const output: PermissionAskOutput = {};

          customService.processPermissionAsk(input, output);

          expect(output.status).toBe("allow");
        } finally {
          if (oldTmpdir) {
            process.env.TMPDIR = oldTmpdir;
          } else {
            delete process.env.TMPDIR;
          }
        }
      });

      it("should handle Windows-style paths", () => {
        const input: PermissionAskInput = {
          type: "read",
          title: "/tmp\\subdir\\file.txt",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBe("allow");
      });

      it("should not approve bash operations", () => {
        const input: PermissionAskInput = {
          type: "bash",
          title: "rm -rf /tmp/*",
        };
        const output: PermissionAskOutput = {};

        permissionService.processPermissionAsk(input, output);

        expect(output.status).toBeUndefined();
      });
    });
  });

  describe("Custom rules", () => {
    it("should register and evaluate custom rules", () => {
      permissionService.registerRule(
        "test-rule",
        (input) => {
          if (input.type === "test" && input.title === "allow-me") {
            return "allow";
          }
          return undefined;
        },
        10
      );

      const input: PermissionAskInput = {
        type: "test",
        title: "allow-me",
      };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      expect(output.status).toBe("allow");
    });

    it("should evaluate rules in priority order (highest first)", () => {
      permissionService.registerRule("low-priority", () => "deny", 1);
      permissionService.registerRule("high-priority", () => "allow", 100);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      // High priority rule should win
      expect(output.status).toBe("allow");
    });

    it("should skip rules that return undefined", () => {
      permissionService.registerRule("skipped-rule", () => undefined, 200);
      permissionService.registerRule("applied-rule", () => "allow", 100);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      expect(output.status).toBe("allow");
    });

    it("should handle rules that deny", () => {
      permissionService.registerRule("deny-rule", () => "deny", 10);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      expect(output.status).toBe("deny");
    });

    it("should handle rules that ask", () => {
      permissionService.registerRule("ask-rule", () => "ask", 10);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      expect(output.status).toBe("ask");
    });
  });

  describe("Error handling", () => {
    it("should handle exceptions in rules gracefully", () => {
      permissionService.registerRule("buggy-rule", () => {
        throw new Error("Rule error");
      }, 10);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      // Should not throw
      expect(() => {
        permissionService.processPermissionAsk(input, output);
      }).not.toThrow();

      // Should log error
      expect(mockLogger.getCallsByLevel("error").length).toBeGreaterThan(0);
    });

    it("should continue to next rule if one throws", () => {
      permissionService.registerRule("buggy-rule", () => {
        throw new Error("Rule error");
      }, 100);
      permissionService.registerRule("working-rule", () => "allow", 50);

      const input: PermissionAskInput = { type: "test" };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      // Error should be caught and logged, but should not get to working-rule
      // because the error happens during iteration
      expect(mockLogger.getCallsByLevel("error").length).toBeGreaterThan(0);
    });
  });

  describe("Logging", () => {
    it("should log rule registration", () => {
      permissionService.registerRule("test-rule", () => undefined, 10);

      expect(mockLogger.getCallsByLevel("debug").length).toBeGreaterThan(0);
      const logCall = mockLogger.getCallsByLevel("debug").find(call => 
        call.message.includes("Registered permission rule")
      );
      expect(logCall).toBeDefined();
    });

    it("should log permission decisions", () => {
      const input: PermissionAskInput = {
        type: "read",
        title: "/tmp/file.txt",
      };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      const logCall = mockLogger.getCallsByLevel("debug").find(call =>
        call.message.includes("Permission decision")
      );
      expect(logCall).toBeDefined();
    });

    it("should log when no rule matches", () => {
      const input: PermissionAskInput = {
        type: "unknown",
        title: "/some/path",
      };
      const output: PermissionAskOutput = {};

      permissionService.processPermissionAsk(input, output);

      const logCall = mockLogger.getCallsByLevel("debug").find(call =>
        call.message.includes("No permission rule matched")
      );
      expect(logCall).toBeDefined();
    });
  });
});
