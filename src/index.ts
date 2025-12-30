import { type Plugin } from "@opencode-ai/plugin";
import { createLogger, getVersionInfo } from "./core";
import { loadConfig } from "./config";
import { KnowledgeBaseService, BeadsService } from "./service";
import { BeadsDetector } from "./beads";
import { TemplateService } from "./template";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  // 1. Load config
  const coderConfig = await loadConfig(log);

  // 2. Get version info
  const versionInfo = await getVersionInfo();

  // 3. Create template service with base context
  const templateService = new TemplateService({
    config: coderConfig,
    version: versionInfo,
    cwd: process.cwd(),
    logger: log,
  });

  // 4. Initialize beads detector
  const beadsDetector = new BeadsDetector({ logger: log });
  const beadsEnabled = await beadsDetector.isBeadsEnabled(coderConfig);

  // 5. Create beads service
  const beadsService = new BeadsService({
    coderConfig,
    logger: log,
    beadsEnabled,
    client,
  });

  // 6. Register beads with template service
  templateService.registerBeads(beadsService.createDefinition());

  // 7. Create KB service with template service
  const kbService = new KnowledgeBaseService({
    coderConfig,
    logger: log,
    templateService,
  });

  return {
    async config(config) {
      await beadsService.processConfig(config);
      await kbService.processConfig(config);
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
