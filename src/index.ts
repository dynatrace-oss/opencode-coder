import { type Plugin } from "@opencode-ai/plugin";
import { createLogger } from "./core";
import { loadConfig } from "./config";
import { KnowledgeBaseService, BeadsService } from "./service";
import { TemplateService } from "./template";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

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
