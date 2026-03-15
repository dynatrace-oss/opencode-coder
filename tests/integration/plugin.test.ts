import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { OpencodeCoder } from "../../src";
import { AimgrService, BeadsService, ProjectDetectorService } from "../../src/service";
import type { ProjectContext } from "../../src/service/project-detector-service";
import { createMockPluginInput, asMockPluginInput } from "../helpers/mock-client";

function createProjectContext(overrides?: Partial<ProjectContext>): ProjectContext {
  return {
    mode: "team",
    installReady: true,
    ecosystemReady: true,
    git: { initialized: true },
    beads: {
      initialized: true,
      stealthMode: false,
      bdCliInstalled: true,
    },
    aimgr: {
      installed: true,
      packageYaml: true,
      resourcesHealthy: true,
      coderPackageInstalled: true,
    },
    detectedAt: "2026-03-12T00:00:00.000Z",
    pluginVersion: "1.0.0",
    ...overrides,
  };
}

describe("OpencodeCoder Plugin Integration", () => {
  beforeEach(() => {
    spyOn(BeadsService.prototype, "checkBeadsAvailability").mockResolvedValue(undefined);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("plugin loading", () => {
    it("should load without errors", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(hooks).toBeDefined();
    });

    it("should provide tool hook with coder tool", async () => {
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      expect(hooks.tool).toBeDefined();
      expect(hooks.tool?.coder).toBeDefined();
    });

    it("sets default_agent to orchestrator when ecosystem is ready and no default exists", async () => {
      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockResolvedValue(undefined);
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockResolvedValue({
        verifyResult: { status: "ok", issues: [] },
        resourcesHealthy: true,
        repairAttempted: false,
        repairSucceeded: false,
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockResolvedValue(
        createProjectContext({ ecosystemReady: true })
      );

      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      const cfg: Record<string, unknown> = {};
      await hooks.config?.(cfg as any);

      expect(cfg.default_agent).toBe("orchestrator");

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });

    it("does not show readiness toast when default_agent assignment is skipped because default already exists", async () => {
      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockResolvedValue(undefined);
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockResolvedValue({
        verifyResult: { status: "ok", issues: [] },
        resourcesHealthy: true,
        repairAttempted: false,
        repairSucceeded: false,
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockResolvedValue(
        createProjectContext({ ecosystemReady: true })
      );

      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      const cfg: Record<string, unknown> = { default_agent: "some-other-agent" };
      await hooks.config?.(cfg as any);

      expect(cfg.default_agent).toBe("some-other-agent");
      expect(
        mockInput.client.app.logs.some((entry) => entry.message === "default_agent already configured, not overriding")
      ).toBe(true);
      expect(mockInput.client.tui.toasts).toHaveLength(0);

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });

    it("does not show readiness toast when default_agent assignment is skipped because project context is unavailable", async () => {
      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockResolvedValue(undefined);
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockResolvedValue({
        verifyResult: { status: "ok", issues: [] },
        resourcesHealthy: true,
        repairAttempted: false,
        repairSucceeded: false,
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockRejectedValue(
        new Error("detector failed")
      );

      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      const cfg: Record<string, unknown> = {};
      await hooks.config?.(cfg as any);

      expect(cfg.default_agent).toBeUndefined();
      expect(
        mockInput.client.app.logs.some((entry) => entry.message === "Project context unavailable, not setting default_agent")
      ).toBe(true);
      expect(mockInput.client.tui.toasts).toHaveLength(0);

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });

    it("shows readiness toast when default_agent assignment is skipped because ecosystem is not ready", async () => {
      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockResolvedValue(undefined);
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockResolvedValue({
        verifyResult: { status: "ok", issues: [] },
        resourcesHealthy: true,
        repairAttempted: false,
        repairSucceeded: false,
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockResolvedValue(
        createProjectContext({ ecosystemReady: false })
      );

      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      const cfg: Record<string, unknown> = {};
      await hooks.config?.(cfg as any);

      expect(cfg.default_agent).toBeUndefined();
      expect(
        mockInput.client.app.logs.some(
          (entry) => entry.message === "ecosystemReady=false, not setting default_agent to orchestrator"
        )
      ).toBe(true);
      expect(mockInput.client.tui.toasts).toHaveLength(1);
      expect(mockInput.client.tui.toasts[0]).toMatchObject({
        title: "Orchestrator not enabled",
        variant: "warning",
      });
      expect(mockInput.client.tui.toasts[0]?.message).toContain("not fully ready yet");

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });

    it("evaluates readiness after autoInitialize so config uses final state", async () => {
      const order: string[] = [];
      let repaired = false;

      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockImplementation(async () => {
        order.push("autoInitialize");
        repaired = true;
      });
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockImplementation(async () => {
        order.push("verifyAndAutoRepairResources");
        return {
          verifyResult: { status: "ok", issues: [] },
          resourcesHealthy: repaired,
          repairAttempted: false,
          repairSucceeded: false,
        };
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockImplementation(async () => {
        order.push("detectAndWrite");
        return createProjectContext({ ecosystemReady: repaired, aimgr: { ...createProjectContext().aimgr, resourcesHealthy: repaired } });
      });

      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
      const cfg: Record<string, unknown> = {};
      await hooks.config?.(cfg as any);

      expect(order).toEqual(["autoInitialize", "verifyAndAutoRepairResources", "detectAndWrite"]);
      expect(cfg.default_agent).toBe("orchestrator");
      expect(mockInput.client.tui.toasts).toHaveLength(0);

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });

    it("degrades safely when project context startup times out", async () => {
      const autoInitializeSpy = spyOn(AimgrService.prototype, "autoInitialize").mockImplementation(
        () => new Promise<void>(() => {})
      );
      const healthSpy = spyOn(AimgrService.prototype, "verifyAndAutoRepairResources").mockResolvedValue({
        verifyResult: { status: "ok", issues: [] },
        resourcesHealthy: true,
        repairAttempted: false,
        repairSucceeded: false,
      });
      const detectSpy = spyOn(ProjectDetectorService.prototype, "detectAndWrite").mockResolvedValue(
        createProjectContext({ ecosystemReady: true })
      );

      const originalSetTimeout = globalThis.setTimeout;
      const originalClearTimeout = globalThis.clearTimeout;
      globalThis.setTimeout = ((cb: (...args: any[]) => void) => {
        cb();
        return 1 as any;
      }) as typeof setTimeout;
      globalThis.clearTimeout = (() => undefined) as typeof clearTimeout;

      try {
        const mockInput = createMockPluginInput();
        const hooks = await OpencodeCoder(asMockPluginInput(mockInput));
        const cfg: Record<string, unknown> = {};
        await hooks.config?.(cfg as any);

        expect(cfg.default_agent).toBeUndefined();
        expect(cfg.command).toBeDefined();
        expect((cfg.command as Record<string, unknown>).init).toBeDefined();
        expect(
          mockInput.client.app.logs.some(
            (entry) => entry.level === "warn" && entry.message === "Project context startup timed out; continuing in degraded mode"
          )
        ).toBe(true);
      } finally {
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
      }

      // Timeout happened before startup flow completed
      expect(healthSpy).not.toHaveBeenCalled();
      expect(detectSpy).not.toHaveBeenCalled();

      autoInitializeSpy.mockRestore();
      healthSpy.mockRestore();
      detectSpy.mockRestore();
    });
  });
});
