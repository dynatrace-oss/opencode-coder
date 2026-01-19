import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { BeadsService } from "../../src/service/beads-service";
import type { PlaygroundService } from "../../src/service/playground-service";
import type { Config } from "@opencode-ai/sdk/v2";
import type { PluginInput } from "@opencode-ai/plugin";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";
import { createMockClient } from "../helpers/mock-client";
import * as childProcess from "child_process";
import * as fs from "fs";

type OpencodeClient = PluginInput["client"];

interface ToastCall {
  title?: string;
  message?: string;
  variant?: string;
  duration?: number;
}

describe("BeadsService", () => {
  let mockLogger: MockLogger;
  let mockClient: OpencodeClient;
  let mockConfig: Config;
  let toastCalls: ToastCall[];
  let mockPlaygroundService: PlaygroundService;

  beforeEach(() => {
    mockLogger = createMockLogger();
    toastCalls = [];
    
    // Create mock client with tui.showToast
    const baseMockClient = createMockClient();
    mockClient = {
      ...baseMockClient,
      tui: {
        showToast: async (params: ToastCall) => {
          toastCalls.push(params);
          return { data: true };
        },
      },
    } as unknown as OpencodeClient;
    
    // Create mock playground service
    mockPlaygroundService = {
      getOrCreatePlayground: async () => "/tmp/opencode/test-session",
    } as unknown as PlaygroundService;
    
    mockConfig = {} as Config;
  });

  describe("processConfig", () => {
    it("should set default_agent to beads-planner-agent when beads is enabled", async () => {
      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.default_agent).toBe("beads-planner-agent");
    });

    it("should not modify default_agent when beads is disabled", async () => {
      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: false,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.default_agent).toBeUndefined();
    });

    it("should inject bd * permission when beads is enabled", async () => {
      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.permission?.bash).toEqual({ "bd *": "allow" });
    });

    it("should not inject bd * permission when auto_approve_beads is false", async () => {
      const service = new BeadsService({
        coderConfig: { active: true, beads: { auto_approve_beads: false } },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      // default_agent should still be set (independent of auto_approve_beads)
      expect(mockConfig.default_agent).toBe("beads-planner-agent");
      // Playground permissions should be added (independent of auto_approve_beads)
      const tmpDir = process.env['TMPDIR'] || process.env['TEMP'] || '/tmp';
      const playgroundGlob = `${tmpDir}/opencode/**/*`;
      expect((mockConfig.permission as any)?.write?.[playgroundGlob]).toBe("allow");
      expect((mockConfig.permission as any)?.read?.[playgroundGlob]).toBe("allow");
      // But bd * permission should not be added
      expect(mockConfig.permission?.bash).toBeUndefined();
    });

    it("should preserve existing bash permissions when adding bd *", async () => {
      mockConfig.permission = { bash: { "git *": "allow" } };

      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      expect(mockConfig.permission?.bash).toEqual({
        "git *": "allow",
        "bd *": "allow",
      });
    });

    it("should not modify bash permissions when already set to allow", async () => {
      mockConfig.permission = { bash: "allow" };

      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.processConfig(mockConfig);

      // Should not modify when user explicitly set bash to allow
      expect(mockConfig.permission?.bash).toBe("allow");
    });
  });

  describe("isBeadsEnabled", () => {
    it("should return true when beads is enabled", () => {
      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      expect(service.isBeadsEnabled()).toBe(true);
    });

    it("should return false when beads is disabled", () => {
      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: false,
        playgroundService: mockPlaygroundService,
      });

      expect(service.isBeadsEnabled()).toBe(false);
    });
  });

  describe("createDefinition", () => {
    it("should return definition with enabled function reflecting beads state", () => {
      const enabledService = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      const disabledService = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: false,
        playgroundService: mockPlaygroundService,
      });

      expect(enabledService.createDefinition().enabled()).toBe(true);
      expect(disabledService.createDefinition().enabled()).toBe(false);
    });
  });

  describe("checkBeadsAvailability", () => {
    it("should show toast when bd CLI is not installed", async () => {
      // Mock execSync to throw (bd not found)
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("command not found");
      });
      
      // Mock fs.accessSync to succeed (.beads exists)
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.checkBeadsAvailability();

      expect(toastCalls.length).toBe(1);
      expect(toastCalls[0].title).toBe("Beads Not Available");
      expect(toastCalls[0].message).toContain("npm install -g beads");
      expect(toastCalls[0].variant).toBe("warning");
      expect(mockLogger.hasLogged("warn", "Beads CLI not installed")).toBe(true);

      execSyncSpy.mockRestore();
      accessSyncSpy.mockRestore();
    });

    it("should show toast when .beads directory is missing", async () => {
      // Mock execSync to succeed (bd is installed)
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(
        () => Buffer.from("/usr/local/bin/bd") as any
      );
      
      // Mock fs.accessSync to throw (.beads not found)
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });

      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.checkBeadsAvailability();

      expect(toastCalls.length).toBe(1);
      expect(toastCalls[0].title).toBe("Beads Not Initialized");
      expect(toastCalls[0].message).toContain("bd init");
      expect(toastCalls[0].variant).toBe("warning");
      expect(mockLogger.hasLogged("warn", "Beads directory not found")).toBe(true);

      execSyncSpy.mockRestore();
      accessSyncSpy.mockRestore();
    });

    it("should not show toast when both bd CLI and .beads directory exist", async () => {
      // Mock execSync to succeed (bd is installed)
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(
        () => Buffer.from("/usr/local/bin/bd") as any
      );
      
      // Mock fs.accessSync to succeed (.beads exists)
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const service = new BeadsService({
        coderConfig: { active: true },
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
        playgroundService: mockPlaygroundService,
      });

      await service.checkBeadsAvailability();

      expect(toastCalls.length).toBe(0);
      expect(mockLogger.hasLogged("debug", "Beads availability check passed")).toBe(true);

      execSyncSpy.mockRestore();
      accessSyncSpy.mockRestore();
    });
  });
});
