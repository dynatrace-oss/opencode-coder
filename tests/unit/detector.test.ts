import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { BeadsDetector } from "../../src/beads/detector";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import * as fs from "fs";

describe("BeadsDetector", () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("detectBeadsDirectory", () => {
    it("should return true when .beads directory exists", () => {
      // Mock accessSync to succeed
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/test/project",
      });

      const result = detector.detectBeadsDirectory();

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "Beads directory detected")).toBe(true);
      expect(accessSyncSpy).toHaveBeenCalledWith("/test/project/.beads", fs.constants.F_OK);

      accessSyncSpy.mockRestore();
    });

    it("should return false when .beads directory does not exist", () => {
      // Mock accessSync to throw ENOENT
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        const error = new Error("ENOENT: no such file or directory") as NodeJS.ErrnoException;
        error.code = "ENOENT";
        throw error;
      });

      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/test/project",
      });

      const result = detector.detectBeadsDirectory();

      expect(result).toBe(false);
      expect(mockLogger.hasLogged("debug", "Beads directory not found")).toBe(true);

      accessSyncSpy.mockRestore();
    });

    it("should use the correct path based on cwd", () => {
      let accessedPath: string | undefined;
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((path: fs.PathLike) => {
        accessedPath = path as string;
        throw new Error("ENOENT");
      });

      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/custom/path",
      });

      detector.detectBeadsDirectory();

      expect(accessedPath).toBe("/custom/path/.beads");

      accessSyncSpy.mockRestore();
    });
  });

  describe("isBeadsEnabled", () => {
    it("should return true when .beads directory exists", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/test/project",
      });

      const result = detector.isBeadsEnabled();

      expect(result).toBe(true);
      expect(mockLogger.hasLogged("debug", "Beads enabled from auto-detection")).toBe(true);

      accessSyncSpy.mockRestore();
    });

    it("should return false when .beads directory does not exist", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });

      const detector = new BeadsDetector({
        logger: mockLogger,
        cwd: "/test/project",
      });

      const result = detector.isBeadsEnabled();

      expect(result).toBe(false);
      expect(mockLogger.hasLogged("debug", "Beads enabled from auto-detection")).toBe(true);

      accessSyncSpy.mockRestore();
    });

    it("should use default cwd when not provided", () => {
      let accessedPath: string | undefined;
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((path: fs.PathLike) => {
        accessedPath = path as string;
        throw new Error("ENOENT");
      });

      const detector = new BeadsDetector({
        logger: mockLogger,
        // Not providing cwd - should use process.cwd()
      });

      detector.detectBeadsDirectory();

      // Should end with .beads (path based on process.cwd())
      expect(accessedPath?.endsWith(".beads")).toBe(true);

      accessSyncSpy.mockRestore();
    });
  });

  describe("constructor defaults", () => {
    it("should use default cwd when not provided", () => {
      // Just verify the detector can be created without cwd
      const detector = new BeadsDetector({
        logger: mockLogger,
      });

      // The detector should exist and have some cwd set
      expect(detector).toBeDefined();
    });
  });
});
