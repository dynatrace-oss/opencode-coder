import { describe, expect, it, beforeEach, spyOn } from "bun:test";
import { BeadsService } from "../../src/service/beads-service";
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
  let toastCalls: ToastCall[];

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
  });

  describe("isBeadsEnabled", () => {
    it("should return true when beads is enabled", () => {
      const service = new BeadsService({
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
      });

      expect(service.isBeadsEnabled()).toBe(true);
    });

    it("should return false when beads is disabled", () => {
      const service = new BeadsService({
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: false,
      });

      expect(service.isBeadsEnabled()).toBe(false);
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
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
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
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
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
        logger: mockLogger,
        client: mockClient,
        beadsEnabled: true,
      });

      await service.checkBeadsAvailability();

      expect(toastCalls.length).toBe(0);
      expect(mockLogger.hasLogged("debug", "Beads availability check passed")).toBe(true);

      execSyncSpy.mockRestore();
      accessSyncSpy.mockRestore();
    });
  });
});
