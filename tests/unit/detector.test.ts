import { describe, expect, it, beforeEach } from "bun:test";
import { BeadsDetector, type BeadsFileSystem } from "../../src/beads/detector";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

/**
 * Create a mock file system for testing BeadsDetector
 */
function createMockFileSystem(options: { beadsDirExists: boolean }): BeadsFileSystem {
  return {
    async access(path: string, _mode?: number) {
      if (options.beadsDirExists && path.endsWith(".beads")) {
        return;
      }
      const error = new Error("ENOENT: no such file or directory") as NodeJS.ErrnoException;
      error.code = "ENOENT";
      throw error;
    },
  };
}

describe("BeadsDetector", () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("detectBeadsDirectory", () => {
    it("should return true when .beads directory exists", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: true }),
        cwd: "/test/project",
      });

      const result = await detector.detectBeadsDirectory();

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "Beads directory detected")).toBe(true);
    });

    it("should return false when .beads directory does not exist", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: false }),
        cwd: "/test/project",
      });

      const result = await detector.detectBeadsDirectory();

      expect(result).toBe(false);
      expect(mockLogger.hasLogged("debug", "Beads directory not found")).toBe(true);
    });

    it("should use the correct path based on cwd", async () => {
      let accessedPath: string | undefined;
      const mockFs: BeadsFileSystem = {
        async access(path: string) {
          accessedPath = path;
          throw new Error("ENOENT");
        },
      };

      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: mockFs,
        cwd: "/custom/path",
      });

      await detector.detectBeadsDirectory();

      expect(accessedPath).toBe("/custom/path/.beads");
    });
  });

  describe("isBeadsEnabled", () => {
    it("should return true when config.beads.enabled is explicitly true", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: false }),
        cwd: "/test/project",
      });

      const result = await detector.isBeadsEnabled({
        active: true,
        beads: { enabled: true },
      });

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "Beads enabled from config")).toBe(true);
    });

    it("should return false when config.beads.enabled is explicitly false", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: true }), // Directory exists but config overrides
        cwd: "/test/project",
      });

      const result = await detector.isBeadsEnabled({
        active: true,
        beads: { enabled: false },
      });

      expect(result).toBe(false);
      expect(mockLogger.hasLogged("debug", "Beads enabled from config")).toBe(true);
    });

    it("should auto-detect and return true when .beads directory exists and no explicit config", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: true }),
        cwd: "/test/project",
      });

      const result = await detector.isBeadsEnabled({
        active: true,
      });

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "Beads enabled from auto-detection")).toBe(true);
    });

    it("should auto-detect and return false when .beads directory does not exist and no explicit config", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: false }),
        cwd: "/test/project",
      });

      const result = await detector.isBeadsEnabled({
        active: true,
      });

      expect(result).toBe(false);
      expect(mockLogger.hasLogged("debug", "Beads enabled from auto-detection")).toBe(true);
    });

    it("should auto-detect when beads object exists but enabled is undefined", async () => {
      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: createMockFileSystem({ beadsDirExists: true }),
        cwd: "/test/project",
      });

      const result = await detector.isBeadsEnabled({
        active: true,
        beads: {}, // enabled is undefined
      });

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "auto-detection")).toBe(true);
    });

    it("should use default cwd when not provided", async () => {
      // This test verifies the default behavior uses process.cwd()
      let accessedPath: string | undefined;
      const mockFs: BeadsFileSystem = {
        async access(path: string) {
          accessedPath = path;
          throw new Error("ENOENT");
        },
      };

      const detector = new BeadsDetector({
        logger: mockLogger,
        fs: mockFs,
        // Not providing cwd - should use process.cwd()
      });

      await detector.detectBeadsDirectory();

      // Should end with .beads (path based on process.cwd())
      expect(accessedPath?.endsWith(".beads")).toBe(true);
    });
  });

  describe("constructor defaults", () => {
    it("should use default file system when not provided", async () => {
      // This test just ensures the constructor doesn't throw when using defaults
      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/nonexistent/path",
      });

      // Should not throw, just return false for non-existent path
      const result = await detector.detectBeadsDirectory();
      expect(result).toBe(false);
    });
  });
});
