import { type Plugin } from "@opencode-ai/plugin";
import { access } from "fs/promises";
import { join } from "path";
import { createLogger, getVersionInfo } from "./core";
import { BeadsService, AimgrService, SessionExportService, ProjectDetectorService } from "./service";
import type { ProjectContext } from "./service/project-detector-service";
import { createCoderTool } from "./tool";
import { isPluginDisabled } from "./config/env";
import { getInstallGuideTemplate } from "./templates";

export const OpencodeCoder: Plugin = async ({ client, worktree }) => {
  const log = createLogger(client);
  const startTime = Date.now();

  log.info("OpencodeCoder plugin loading...");

  // 1. Check if plugin is disabled
  if (isPluginDisabled()) {
    log.info("OpencodeCoder plugin disabled via OPENCODE_CODER_DISABLED env var");
    return {};
  }

  // 2. Create beads service
  const beadsStart = Date.now();
  const beadsService = new BeadsService({
    logger: log,
    client,
  });
  log.debug("BeadsService created", { durationMs: Date.now() - beadsStart });

  // 3. Create aimgr service
  const aimgrStart = Date.now();
  const aimgrService = new AimgrService({
    logger: log,
    client,
  });
  log.debug("AimgrService created", { durationMs: Date.now() - aimgrStart });

  // 4. Create session export service and coder tool
  const versionInfo = await getVersionInfo();
  const sessionExportService = new SessionExportService({ logger: log, client });
  const coderTool = createCoderTool({ sessionExportService, versionInfo });
  log.debug("Coder tool created");

  // 5. Run project detection — result is awaited by the config hook to set default agent
  const projectDetector = new ProjectDetectorService({ logger: log, workdir: worktree });
  const projectContextPromise: Promise<ProjectContext | null> = projectDetector.detectAndWrite(versionInfo)
    .then((ctx) => {
      log.debug("Project context written to .coder/project.yaml", { ecosystemReady: ctx.ecosystemReady });
      return ctx;
    })
    .catch((err) => {
      log.error("Project detection failed", { error: String(err) });
      return null;
    });

  // 6. Check beads availability and show toast if needed
  // Runs in the background and doesn't block plugin loading
  const beadsCheckStart = Date.now();
  beadsService.checkBeadsAvailability()
    .then(() => {
      log.debug("checkBeadsAvailability completed", { durationMs: Date.now() - beadsCheckStart });
    })
    .catch((err) => {
      log.error("Failed to check beads availability", { error: String(err) });
    });

  // 7. Auto-initialize aimgr if available
  // Runs in the background and doesn't block plugin loading
  const aimgrInitStart = Date.now();
  aimgrService.autoInitialize()
    .then(() => {
      log.debug("aimgr autoInitialize completed", { durationMs: Date.now() - aimgrInitStart });
    })
    .catch((err) => {
      log.error("Failed to auto-initialize aimgr", { error: String(err) });
    });

  // 8. Background aimgr resource health check
  // Runs in the background and doesn't block plugin loading
  const aimgrVerifyStart = Date.now();
  Promise.resolve()
    .then(() => {
      const result = aimgrService.verifyResources();
      log.debug("aimgr verifyResources completed", { durationMs: Date.now() - aimgrVerifyStart });
      if (result === null) {
        // aimgr not installed or verify failed — skip silently
        return;
      }
      // Detect issues: non-empty arrays or truthy error fields in the JSON
      const hasIssues =
        (Array.isArray(result.issues) && result.issues.length > 0) ||
        (Array.isArray(result.errors) && result.errors.length > 0) ||
        (result.error && result.error !== "") ||
        (result.status && result.status !== "ok" && result.status !== "healthy");
      if (hasIssues) {
        (client as any).tui.showToast({
          title: "aimgr",
          message: "aimgr: resource issues detected. Run /opencode-coder/doctor for details.",
          variant: "warning",
          duration: 8000,
        }).catch((err: unknown) => {
          log.error("Failed to show aimgr verify toast", { error: String(err) });
        });
      }
    })
    .catch((err) => {
      log.error("Failed to run aimgr verifyResources", { error: String(err) });
    });

  // Log plugin load completion with timing
  const loadDurationMs = Date.now() - startTime;
  log.info("OpencodeCoder plugin loaded", { durationMs: loadDurationMs, beadsEnabled: beadsService.isBeadsEnabled() });

  return {
    tool: {
      coder: coderTool,
    },
    "command.execute.before": async (
      input: { command: string; sessionID: string; arguments: string },
      output: { parts: Array<any> }
    ) => {
      if (!input.arguments || !input.arguments.trim()) return;
      output.parts.push({
        type: "text",
        text: `<command-arguments>\nThe user provided these arguments when running this command:\n${input.arguments}\n</command-arguments>`,
      });
    },
    config: async (input) => {
      // Inject .coder/AGENTS.md into instructions (stealth mode support)
      const agentsPath = join(worktree, ".coder", "AGENTS.md");
      try {
        await access(agentsPath);
        input.instructions = input.instructions ?? [];
        input.instructions.push(".coder/AGENTS.md");
        log.info("Injected .coder/AGENTS.md into instructions");
      } catch {
        // File doesn't exist — no-op
      }

      // Await project context once for both /init gating and default_agent
      const projectContext = await projectContextPromise;

      // Gate /init command based on installation readiness
      if (!projectContext || !projectContext.installReady) {
        input.command = input.command ?? {};
        input.command["init"] = {
          template: getInstallGuideTemplate(),
          description: "Set up prerequisites for the opencode-coder plugin",
        };
        log.info("Registered /init with installation guidance (installReady=false)");
      }

      // Set orchestrator as default agent when ecosystem is fully ready
      // and user hasn't explicitly configured a different default agent.
      // Note: default_agent is supported at runtime (OpenCode ≥1.2.15) but the
      // plugin SDK's v1 Config type definition hasn't been updated yet.
      const cfg = input as Record<string, unknown>;
      if (!cfg["default_agent"]) {
        if (projectContext?.ecosystemReady) {
          cfg["default_agent"] = "orchestrator";
          log.info("Set default_agent to orchestrator (ecosystem ready)");
        }
      }
    },
  };
};
