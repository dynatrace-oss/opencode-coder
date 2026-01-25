import { type Plugin } from "@opencode-ai/plugin";
import { createLogger } from "./core";
import { loadConfig } from "./config";
import { KnowledgeBaseService, BeadsService, GitHubService, PlaygroundService, SkillService } from "./service";
import { TemplateService } from "./template";
import { systemInfoTool } from "./system-info";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);
  const startTime = Date.now();

  log.info("OpencodeCoder plugin loading...");

  // 1. Load config
  const configStart = Date.now();
  const coderConfig = await loadConfig(log);
  log.debug("Config loaded", { durationMs: Date.now() - configStart });

  // 2. Create template service (version info lazy-loaded on first render)
  const templateStart = Date.now();
  const templateService = new TemplateService({
    config: coderConfig,
    cwd: process.cwd(),
    logger: log,
  });
  log.debug("TemplateService created", { durationMs: Date.now() - templateStart });

  // 3. Create playground service
  const playgroundStart = Date.now();
  const playgroundService = new PlaygroundService({
    logger: log,
    client,
  });
  log.debug("PlaygroundService created", { durationMs: Date.now() - playgroundStart });

  // 4. Create beads service
  const beadsStart = Date.now();
  const beadsService = new BeadsService({
    coderConfig,
    logger: log,
    client,
    playgroundService,
  });
  log.debug("BeadsService created", { durationMs: Date.now() - beadsStart });

  // 5. Register beads with template service
  templateService.registerBeads(beadsService.createDefinition());

  // 6. Create GitHub service and register with template service
  const githubStart = Date.now();
  const githubService = new GitHubService({
    coderConfig,
    logger: log,
  });
  log.debug("GitHubService created", { durationMs: Date.now() - githubStart });
  templateService.registerGitHub(githubService.createDefinition());

  // 7. Create KB service with template service and feature flags
  const kbStart = Date.now();
  const kbService = new KnowledgeBaseService({
    coderConfig,
    logger: log,
    templateService,
    featureFlags: {
      github: githubService.isGitHubEnabled(),
    },
  });
  log.debug("KnowledgeBaseService created", { durationMs: Date.now() - kbStart });

  // 8. Create Skill service
  const skillStart = Date.now();
  const skillService = new SkillService({
    coderConfig,
    logger: log,
  });
  log.debug("SkillService created", { durationMs: Date.now() - skillStart });

  // 9. Check beads availability and show toast if needed
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
      await skillService.processConfig(config);
      log.debug("Final config after processing", { config: JSON.stringify(config, null, 2) });
    },

    async "chat.message"(input, output) {
      await beadsService.processChatMessage(input, output);
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
