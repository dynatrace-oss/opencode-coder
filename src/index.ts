import { type Plugin } from "@opencode-ai/plugin";
import { createLogger } from "./core";
import { loadConfig } from "./config";
import { KnowledgeBaseService, BeadsService } from "./service";
import { TemplateService } from "./template";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);
  const startTime = Date.now();

  log.info("OpencodeCoder plugin loading...");

  // 1. Load config
  const coderConfig = await loadConfig(log);

  // 2. Create template service (version info lazy-loaded on first render)
  const templateService = new TemplateService({
    config: coderConfig,
    cwd: process.cwd(),
    logger: log,
  });

  // 3. Create beads service (detection done internally)
  const beadsService = new BeadsService({
    coderConfig,
    logger: log,
    client,
  });

  // 4. Register beads with template service
  templateService.registerBeads(beadsService.createDefinition());

  // 5. Create KB service with template service
  const kbService = new KnowledgeBaseService({
    coderConfig,
    logger: log,
    templateService,
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

    async "chat.message"(input, output) {
      await beadsService.processChatMessage(input, output);
    },

    async event({ event }) {
      await beadsService.processEvent(event);
    },

    async "permission.ask"(input, output) {
      beadsService.processPermissionAsk(input, output);
    },
  };
};
