import { describe, expect, it, beforeEach, mock, afterEach } from "bun:test";

// Mock the fs module before importing PlaygroundService
const mockMkdir = mock(async () => {});
mock.module("fs", () => ({
  promises: {
    mkdir: mockMkdir,
  },
}));

import { PlaygroundService } from "../../src/service/playground-service";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import { createMockClient } from "../helpers/mock-client";

type OpencodeClient = ReturnType<typeof createMockClient>;

describe("PlaygroundService", () => {
  let mockLogger: MockLogger;
  let mockClient: OpencodeClient;
  let service: PlaygroundService;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockClient = createMockClient() as unknown as OpencodeClient;
    service = new PlaygroundService({
      logger: mockLogger,
      client: mockClient as any,
    });

    // Reset and configure the mock
    mockMkdir.mockClear();
    mockMkdir.mockResolvedValue(undefined);

    // Save original environment variables
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore environment variables
    process.env = originalEnv;
  });

  describe("getOrCreatePlayground", () => {
    it("should create folder if not exists", async () => {
      const sessionID = "test-session-123";
      const expectedPath = "/tmp/opencode/test-session-123";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
      expect(mockMkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
      expect(mockLogger.hasLogged("info", "Playground folder created")).toBe(true);
    });

    it("should return cached path on second call", async () => {
      const sessionID = "test-session-456";

      // First call - creates folder
      const result1 = await service.getOrCreatePlayground(sessionID);
      expect(mockMkdir).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getOrCreatePlayground(sessionID);
      expect(mockMkdir).toHaveBeenCalledTimes(1); // Not called again
      expect(result1).toBe(result2);
      expect(mockLogger.hasLogged("debug", "Playground path found in cache")).toBe(true);
    });

    it("should use TMPDIR environment variable if set", async () => {
      process.env.TMPDIR = "/custom/tmp";
      const sessionID = "test-session-tmpdir";
      const expectedPath = "/custom/tmp/opencode/test-session-tmpdir";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
      expect(mockMkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it("should use TEMP environment variable if TMPDIR not set", async () => {
      delete process.env.TMPDIR;
      process.env.TEMP = "/windows/temp";
      const sessionID = "test-session-temp";
      const expectedPath = "/windows/temp/opencode/test-session-temp";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
      expect(mockMkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it("should use /tmp as fallback if neither TMPDIR nor TEMP is set", async () => {
      delete process.env.TMPDIR;
      delete process.env.TEMP;
      const sessionID = "test-session-fallback";
      const expectedPath = "/tmp/opencode/test-session-fallback";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
      expect(mockMkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it("should create nested path structure", async () => {
      const sessionID = "nested/session/path";
      const expectedPath = "/tmp/opencode/nested/session/path";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
      expect(mockMkdir).toHaveBeenCalledWith(expectedPath, { recursive: true });
    });

    it("should handle mkdir errors gracefully and return undefined", async () => {
      mockMkdir.mockRejectedValue(new Error("Permission denied"));
      const sessionID = "test-session-error";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBeUndefined();
      expect(mockLogger.hasLogged("error", "Failed to create playground folder")).toBe(true);
      expect(mockLogger.calls.some((call) => 
        call.level === "error" && 
        call.extra?.error === "Error: Permission denied"
      )).toBe(true);
    });

    it("should not throw on errors", async () => {
      mockMkdir.mockRejectedValue(new Error("Disk full"));
      const sessionID = "test-session-no-throw";

      // Should not throw
      await expect(service.getOrCreatePlayground(sessionID)).resolves.toBeUndefined();
    });

    it("should log debug message with duration on completion", async () => {
      const sessionID = "test-session-duration";

      await service.getOrCreatePlayground(sessionID);

      expect(mockLogger.hasLogged("debug", "getOrCreatePlayground completed")).toBe(true);
      const debugCall = mockLogger.calls.find((call) => 
        call.level === "debug" && 
        call.message.includes("getOrCreatePlayground completed")
      );
      expect(debugCall?.extra?.durationMs).toBeDefined();
      expect(typeof debugCall?.extra?.durationMs).toBe("number");
    });

    it("should handle multiple sessions independently", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      const path1 = await service.getOrCreatePlayground(session1);
      const path2 = await service.getOrCreatePlayground(session2);

      expect(path1).not.toBe(path2);
      expect(path1).toBe("/tmp/opencode/session-1");
      expect(path2).toBe("/tmp/opencode/session-2");
      expect(mockMkdir).toHaveBeenCalledTimes(2);
    });

    it("should handle special characters in session ID", async () => {
      const sessionID = "session-with-special-chars_!@#$%";
      
      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBeDefined();
      expect(result).toContain(sessionID);
    });
  });

  describe("getPlaygroundPath", () => {
    it("should return undefined if session not initialized", () => {
      const sessionID = "uninitializ-session";

      const result = service.getPlaygroundPath(sessionID);

      expect(result).toBeUndefined();
    });

    it("should return path after initialization", async () => {
      const sessionID = "initialized-session";

      await service.getOrCreatePlayground(sessionID);
      const result = service.getPlaygroundPath(sessionID);

      expect(result).toBe("/tmp/opencode/initialized-session");
    });

    it("should return undefined for different session ID", async () => {
      const session1 = "session-1";
      const session2 = "session-2";

      await service.getOrCreatePlayground(session1);
      const result = service.getPlaygroundPath(session2);

      expect(result).toBeUndefined();
    });

    it("should not create folders or log messages", async () => {
      mockLogger.clear();
      const sessionID = "no-side-effects";

      service.getPlaygroundPath(sessionID);

      expect(mockMkdir).not.toHaveBeenCalled();
      expect(mockLogger.calls.length).toBe(0);
    });

    it("should return cached path even if mkdir would fail later", async () => {
      const sessionID = "cached-session";

      // First call succeeds
      await service.getOrCreatePlayground(sessionID);
      
      // Make mkdir fail for subsequent calls
      mockMkdir.mockRejectedValue(new Error("Now it fails"));

      // getPlaygroundPath should still return cached value
      const result = service.getPlaygroundPath(sessionID);

      expect(result).toBe("/tmp/opencode/cached-session");
    });
  });

  describe("error handling edge cases", () => {
    it("should handle EACCES error (permission denied)", async () => {
      const error = new Error("EACCES: permission denied") as NodeJS.ErrnoException;
      error.code = "EACCES";
      mockMkdir.mockRejectedValue(error);

      const result = await service.getOrCreatePlayground("session-eacces");

      expect(result).toBeUndefined();
      expect(mockLogger.hasLogged("error", "Failed to create playground folder")).toBe(true);
    });

    it("should handle ENOSPC error (disk full)", async () => {
      const error = new Error("ENOSPC: no space left") as NodeJS.ErrnoException;
      error.code = "ENOSPC";
      mockMkdir.mockRejectedValue(error);

      const result = await service.getOrCreatePlayground("session-enospc");

      expect(result).toBeUndefined();
      expect(mockLogger.hasLogged("error", "Failed to create playground folder")).toBe(true);
    });

    it("should handle non-Error exceptions", async () => {
      mockMkdir.mockRejectedValue("String error");

      const result = await service.getOrCreatePlayground("session-string-error");

      expect(result).toBeUndefined();
      expect(mockLogger.hasLogged("error", "Failed to create playground folder")).toBe(true);
    });
  });

  describe("path construction", () => {
    it("should use path.join for cross-platform compatibility", async () => {
      // This test verifies that paths are constructed properly
      // regardless of the platform (Windows vs Unix)
      const sessionID = "path-test";
      const result = await service.getOrCreatePlayground(sessionID);

      // Result should be a valid absolute path
      expect(result).toBeDefined();
      expect(result).toContain("opencode");
      expect(result).toContain(sessionID);
    });

    it("should handle empty session ID gracefully", async () => {
      const sessionID = "";
      // path.join normalizes and removes trailing slashes
      const expectedPath = "/tmp/opencode";

      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBe(expectedPath);
    });

    it("should handle session ID with path separators", async () => {
      const sessionID = "2024/01/session";
      
      const result = await service.getOrCreatePlayground(sessionID);

      expect(result).toBeDefined();
      expect(result).toContain("opencode");
      expect(mockMkdir).toHaveBeenCalledWith(
        expect.stringContaining("2024"),
        { recursive: true }
      );
    });
  });

  describe("caching behavior", () => {
    it("should maintain separate caches for different sessions", async () => {
      const sessions = ["session-a", "session-b", "session-c"];

      for (const session of sessions) {
        await service.getOrCreatePlayground(session);
      }

      // All sessions should have cached paths
      for (const session of sessions) {
        const path = service.getPlaygroundPath(session);
        expect(path).toBeDefined();
        expect(path).toContain(session);
      }
    });

    it("should cache path even if returned undefined on error", async () => {
      const sessionID = "error-session";
      mockMkdir.mockRejectedValue(new Error("First call fails"));

      // First call fails
      const result1 = await service.getOrCreatePlayground(sessionID);
      expect(result1).toBeUndefined();

      // Cache should not contain this session
      const cached = service.getPlaygroundPath(sessionID);
      expect(cached).toBeUndefined();

      // Fix the error
      mockMkdir.mockResolvedValue(undefined);

      // Second call should try again (not cached)
      const result2 = await service.getOrCreatePlayground(sessionID);
      expect(result2).toBeDefined();
      expect(mockMkdir).toHaveBeenCalledTimes(2);
    });
  });
});
