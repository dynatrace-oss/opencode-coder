import { type Plugin } from "@opencode-ai/plugin";
import { createLogger } from "./core";
import { KnowledgeBaseService, BeadsService, GitHubService } from "./service";
import { systemInfoTool } from "./system-info";
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

  // 3. Create GitHub service
  const githubStart = Date.now();
  const githubService = new GitHubService({
    logger: log,
  });
  log.debug("GitHubService created", { durationMs: Date.now() - githubStart });

  // 4. Create KB service with feature flags
  const kbStart = Date.now();
  const kbService = new KnowledgeBaseService({
    logger: log,
    featureFlags: {
      github: githubService.isGitHubEnabled(),
    },
  });
  log.debug("KnowledgeBaseService created", { durationMs: Date.now() - kbStart });

  // 5. Check beads availability and show toast if needed
  // This runs in the background and doesn't block plugin loading
  const beadsCheckStart = Date.now();
  beadsService.checkBeadsAvailability()
    .then(() => {
      log.debug("checkBeadsAvailability completed", { durationMs: Date.now() - beadsCheckStart });
    })
    .catch((err) => {
      log.error("Failed to check beads availability", { error: String(err) });
    });

  // Log plugin load completion with timing
  const loadDurationMs = Date.now() - startTime;
  log.info("OpencodeCoder plugin loaded", { durationMs: loadDurationMs, beadsEnabled: beadsService.isBeadsEnabled() });

  return {
    async config(config) {
      await beadsService.processConfig(config);
      await kbService.processConfig(config);
      log.debug("Final config after processing", { config: JSON.stringify(config, null, 2) });
    },

    async event({ event }) {
      await beadsService.processEvent(event);
    },

    async "permission.ask"(input, output) {
      beadsService.processPermissionAsk(input, output);
    },

    tool: {
      system_info: systemInfoTool
    },
  };
};
