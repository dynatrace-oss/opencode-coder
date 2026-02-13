import { describe, it, expect, vi, beforeEach, afterEach, mock } from "vitest";
import { AimgrService } from "../aimgr-service";
import type { Logger } from "../../core/logger";

describe("AimgrService", () => {
  let mockLogger: Logger;
  let mockClient: any;
  let aimgrService: AimgrService;

  // We'll mock these at the method level, not module level
  let execSyncMock: any;
  let existsSyncMock: any;

  beforeEach(async () => {
    // Create mock logger
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as unknown as Logger;

    // Create mock client with TUI
    mockClient = {
      tui: {
        showToast: vi.fn().mockResolvedValue(undefined),
      },
    };

    // Import and mock the modules dynamically
    const childProcess = await import("child_process");
    const fs = await import("fs");
    
    execSyncMock = vi.spyOn(childProcess, "execSync");
    existsSyncMock = vi.spyOn(fs, "existsSync");

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("constructor", () => {
    it("should create AimgrService with default workdir", () => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
      });

      expect(aimgrService).toBeDefined();
    });

    it("should create AimgrService with custom workdir", () => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
        workdir: "/custom/path",
      });

      expect(aimgrService).toBeDefined();
    });
  });

  describe("isAimgrAvailable", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
      });
    });

    it("should return true when aimgr is available", () => {
      execSyncMock.mockReturnValue(Buffer.from("/usr/bin/aimgr"));

      const result = aimgrService.isAimgrAvailable();

      expect(result).toBe(true);
      expect(mockLogger.debug).toHaveBeenCalledWith("aimgr CLI is available");
    });

    it("should return false when aimgr is not available", () => {
      execSyncMock.mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = aimgrService.isAimgrAvailable();

      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith("aimgr CLI not found on PATH");
    });
  });

  describe("hasPackageYaml", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
        workdir: "/test/path",
      });
    });

    it("should return true when ai.package.yaml exists", () => {
      existsSyncMock.mockReturnValue(true);

      const result = aimgrService.hasPackageYaml();

      expect(result).toBe(true);
      expect(existsSyncMock).toHaveBeenCalledWith("/test/path/ai.package.yaml");
    });

    it("should return false when ai.package.yaml does not exist", () => {
      existsSyncMock.mockReturnValue(false);

      const result = aimgrService.hasPackageYaml();

      expect(result).toBe(false);
      expect(existsSyncMock).toHaveBeenCalledWith("/test/path/ai.package.yaml");
    });
  });

  describe("initializeAimgr", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
        workdir: "/test/path",
      });
    });

    it("should successfully run aimgr init", () => {
      execSyncMock.mockReturnValue(Buffer.from("Initialized"));

      aimgrService.initializeAimgr();

      expect(execSyncMock).toHaveBeenCalledWith("aimgr init", { cwd: "/test/path", stdio: "pipe" });
      expect(mockLogger.info).toHaveBeenCalledWith("aimgr init completed successfully");
    });

    it("should throw error when aimgr init fails", () => {
      execSyncMock.mockImplementation(() => {
        throw new Error("init failed");
      });

      expect(() => aimgrService.initializeAimgr()).toThrow("init failed");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("isPackageAvailable", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
      });
    });

    it("should return true when package exists", () => {
      const mockOutput = JSON.stringify({
        packages: [
          { name: "opencode-coder" },
          { name: "other-package" },
        ],
      });

      execSyncMock.mockReturnValue(mockOutput);

      const result = aimgrService.isPackageAvailable("opencode-coder");

      expect(result).toBe(true);
    });

    it("should return false when package does not exist", () => {
      const mockOutput = JSON.stringify({
        packages: [
          { name: "other-package" },
        ],
      });

      execSyncMock.mockReturnValue(mockOutput);

      const result = aimgrService.isPackageAvailable("opencode-coder");

      expect(result).toBe(false);
    });

    it("should return false when aimgr repo list fails", () => {
      execSyncMock.mockImplementation(() => {
        throw new Error("command failed");
      });

      const result = aimgrService.isPackageAvailable("opencode-coder");

      expect(result).toBe(false);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("installPackage", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
        workdir: "/test/path",
      });
    });

    it("should successfully install package", () => {
      execSyncMock.mockReturnValue(Buffer.from("Installed"));

      aimgrService.installPackage("opencode-coder");

      expect(execSyncMock).toHaveBeenCalledWith("aimgr install package/opencode-coder", { cwd: "/test/path", stdio: "pipe" });
      expect(mockLogger.info).toHaveBeenCalledWith("Package installed successfully", { packageName: "opencode-coder" });
    });

    it("should throw error when install fails", () => {
      execSyncMock.mockImplementation(() => {
        throw new Error("install failed");
      });

      expect(() => aimgrService.installPackage("opencode-coder")).toThrow("install failed");
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("autoInitialize", () => {
    beforeEach(() => {
      aimgrService = new AimgrService({
        logger: mockLogger,
        client: mockClient,
        workdir: "/test/path",
      });
    });

    it("should skip when ai.package.yaml already exists", async () => {
      existsSyncMock.mockReturnValue(true);

      await aimgrService.autoInitialize();

      expect(mockLogger.debug).toHaveBeenCalledWith("ai.package.yaml already exists, skipping auto-initialization");
      expect(execSyncMock).not.toHaveBeenCalled();
    });

    it("should skip when aimgr is not available", async () => {
      existsSyncMock.mockReturnValue(false);
      execSyncMock.mockImplementation(() => {
        throw new Error("not found");
      });

      await aimgrService.autoInitialize();

      expect(mockLogger.debug).toHaveBeenCalledWith("aimgr not available, skipping auto-initialization");
    });

    it("should initialize and install when package is available", async () => {
      existsSyncMock.mockReturnValue(false);

      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") {
          return Buffer.from("/usr/bin/aimgr");
        } else if (cmd === "aimgr init") {
          return Buffer.from("Initialized");
        } else if (cmd === "aimgr repo list --format=json") {
          return JSON.stringify({ packages: [{ name: "opencode-coder" }] });
        } else if (cmd === "aimgr install package/opencode-coder") {
          return Buffer.from("Installed");
        }
        return Buffer.from("");
      });

      await aimgrService.autoInitialize();

      expect(mockClient.tui.showToast).toHaveBeenCalledWith({
        title: "aimgr Initialized",
        message: "Detected aimgr and installed opencode-coder package",
        variant: "success",
        duration: 6000,
      });
      expect(mockLogger.info).toHaveBeenCalledWith(
        "aimgr auto-initialization completed",
        expect.objectContaining({ durationMs: expect.any(Number) })
      );
    });

    it("should show info toast when package is not available", async () => {
      existsSyncMock.mockReturnValue(false);

      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") {
          return Buffer.from("/usr/bin/aimgr");
        } else if (cmd === "aimgr init") {
          return Buffer.from("Initialized");
        } else if (cmd === "aimgr repo list --format=json") {
          return JSON.stringify({ packages: [] });
        }
        return Buffer.from("");
      });

      await aimgrService.autoInitialize();

      expect(mockClient.tui.showToast).toHaveBeenCalledWith({
        title: "aimgr Initialized",
        message: "Created ai.package.yaml. Run 'aimgr repo search opencode' to discover resources.",
        variant: "info",
        duration: 6000,
      });
    });

    it("should catch and log errors without throwing", async () => {
      existsSyncMock.mockReturnValue(false);

      execSyncMock.mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") {
          return Buffer.from("/usr/bin/aimgr");
        } else if (cmd === "aimgr init") {
          throw new Error("init failed");
        }
        return Buffer.from("");
      });

      // Should not throw
      await expect(aimgrService.autoInitialize()).resolves.toBeUndefined();

      expect(mockLogger.error).toHaveBeenCalledWith(
        "aimgr auto-initialization failed",
        expect.objectContaining({ error: expect.any(String), durationMs: expect.any(Number) })
      );
    });
  });
});
