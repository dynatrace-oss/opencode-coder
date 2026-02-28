import { type Plugin } from "@opencode-ai/plugin";
import { createLogger, getVersionInfo } from "./core";
import { BeadsService, AimgrService, SessionExportService } from "./service";
import { createCoderTool } from "./tool";
import { isPluginDisabled } from "./config/env";

export const OpencodeCoder: Plugin = async ({ client }) => {
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

  // 5. Check beads availability and show toast if needed
  // Runs in the background and doesn't block plugin loading
  const beadsCheckStart = Date.now();
  beadsService.checkBeadsAvailability()
    .then(() => {
      log.debug("checkBeadsAvailability completed", { durationMs: Date.now() - beadsCheckStart });
    })
    .catch((err) => {
      log.error("Failed to check beads availability", { error: String(err) });
    });

  // 6. Auto-initialize aimgr if available
  // Runs in the background and doesn't block plugin loading
  const aimgrInitStart = Date.now();
  aimgrService.autoInitialize()
    .then(() => {
      log.debug("aimgr autoInitialize completed", { durationMs: Date.now() - aimgrInitStart });
    })
    .catch((err) => {
      log.error("Failed to auto-initialize aimgr", { error: String(err) });
    });

  // Log plugin load completion with timing
  const loadDurationMs = Date.now() - startTime;
  log.info("OpencodeCoder plugin loaded", { durationMs: loadDurationMs, beadsEnabled: beadsService.isBeadsEnabled() });

  return {
    tool: {
      coder: coderTool,
    },
  };
};
