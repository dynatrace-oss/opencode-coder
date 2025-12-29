import type { Plugin } from "@opencode-ai/plugin";
import { createLogger, loadConfig } from "./core";
import { KnowledgeBaseService } from "./kb";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  const coderConfig = await loadConfig(log);
  const kbService = new KnowledgeBaseService({ coderConfig, logger: log });

  return {
    async config(config) {
      await kbService.apply(config);
    },
  };
};
