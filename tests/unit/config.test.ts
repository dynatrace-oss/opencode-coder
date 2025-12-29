import { describe, expect, it, beforeEach } from "bun:test";
import { loadConfig, DEFAULT_CONFIG, type FileSystem } from "../../src/core/config";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import { readFile } from "fs/promises";
import { join } from "path";

// Path to test fixtures
const FIXTURES_DIR = join(import.meta.dir, "..", "fixtures", "configs");

describe("loadConfig", () => {
  let mockLogger: MockLogger;

  beforeEach(() => {
    mockLogger = createMockLogger();
  });

  describe("with mock file system", () => {
    it("should load valid active config", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ active: true }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true });
      expect(mockLogger.hasLogged("debug", "Loaded config")).toBe(true);
    });

    it("should load valid inactive config", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ active: false }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: false });
    });

    it("should return defaults when config file is missing", async () => {
      const mockFs: FileSystem = {
        readFile: async () => {
          const error = new Error("ENOENT") as NodeJS.ErrnoException;
          error.code = "ENOENT";
          throw error;
        },
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(mockLogger.hasLogged("debug", "No .coder/coder.json found")).toBe(true);
    });

    it("should return defaults when config file is invalid JSON", async () => {
      const mockFs: FileSystem = {
        readFile: async () => "not valid json{",
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(mockLogger.hasLogged("warn", "Failed to load coder.json")).toBe(true);
    });

    it("should return defaults when config fails schema validation", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ active: "not-a-boolean" }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(mockLogger.hasLogged("warn", "Invalid coder.json config")).toBe(true);
    });

    it("should handle read errors gracefully", async () => {
      const mockFs: FileSystem = {
        readFile: async () => {
          throw new Error("Permission denied");
        },
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual(DEFAULT_CONFIG);
      expect(mockLogger.hasLogged("warn", "Failed to load coder.json")).toBe(true);
    });

    it("should use provided cwd path", async () => {
      let capturedPath = "";
      const mockFs: FileSystem = {
        readFile: async (path: string) => {
          capturedPath = path;
          return JSON.stringify({ active: true });
        },
      };

      await loadConfig(mockLogger, { fs: mockFs, cwd: "/custom/project" });

      expect(capturedPath).toBe("/custom/project/.coder/coder.json");
    });

    it("should apply default value for missing active field", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({}),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      // Zod schema has default(true) for active
      expect(config).toEqual({ active: true });
    });

    it("should ignore unknown fields in config", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: false,
          unknownField: "ignored",
          anotherField: 123,
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      // Should only have the known fields
      expect(config).toEqual({ active: false });
    });

    it("should load config with beads.enabled set to true", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: true,
          beads: { enabled: true },
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true, beads: { enabled: true, auto_approve_beads: true } });
    });

    it("should load config with beads.enabled set to false", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: true,
          beads: { enabled: false },
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true, beads: { enabled: false, auto_approve_beads: true } });
    });

    it("should load config with empty beads object", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: true,
          beads: {},
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true, beads: { auto_approve_beads: true } });
    });

    it("should load config with auto_approve_beads set to false", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: true,
          beads: { auto_approve_beads: false },
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true, beads: { auto_approve_beads: false } });
    });

    it("should load config without beads section", async () => {
      const mockFs: FileSystem = {
        readFile: async () => JSON.stringify({ 
          active: true,
        }),
      };

      const config = await loadConfig(mockLogger, { fs: mockFs, cwd: "/test" });

      expect(config).toEqual({ active: true });
      expect(config.beads).toBeUndefined();
    });
  });

  describe("with real fixtures", () => {
    it("should handle fixture files correctly", async () => {
      // Read the fixture directly and verify parsing
      const validActiveContent = await readFile(join(FIXTURES_DIR, "valid-active.json"), "utf-8");
      const parsed = JSON.parse(validActiveContent);
      expect(parsed).toEqual({ active: true });

      const validInactiveContent = await readFile(join(FIXTURES_DIR, "valid-inactive.json"), "utf-8");
      const parsedInactive = JSON.parse(validInactiveContent);
      expect(parsedInactive).toEqual({ active: false });

      const invalidContent = await readFile(join(FIXTURES_DIR, "invalid.json"), "utf-8");
      const parsedInvalid = JSON.parse(invalidContent);
      expect(parsedInvalid.active).toBe("not-a-boolean");
    });
  });

  describe("DEFAULT_CONFIG", () => {
    it("should have active set to true", () => {
      expect(DEFAULT_CONFIG).toEqual({ active: true });
    });
  });
});
