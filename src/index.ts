import type { Plugin } from "@opencode-ai/plugin";
import { createLogger, loadConfig } from "./core";
import { KnowledgeBaseService } from "./kb";
import { BeadsDetector, BeadsContext } from "./beads";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  const coderConfig = await loadConfig(log);
  
  // Initialize beads detector and context
  const beadsDetector = new BeadsDetector({ logger: log });
  const beadsEnabled = await beadsDetector.isBeadsEnabled(coderConfig);
  
  const kbService = new KnowledgeBaseService({ 
    coderConfig, 
    logger: log,
    beadsEnabled,
  });

  return {
    async config(config) {
      await kbService.apply(config);
    },
    async "experimental.chat.system.transform"(_input, output) {
      // Inject beads context into system prompt if enabled
      if (beadsEnabled) {
        const beadsContext = new BeadsContext({ logger: log });
        const contextInfo = await beadsContext.getContext();
        
        if (contextInfo.available && contextInfo.contextString) {
          output.system.push(contextInfo.contextString);
          log.debug("Injected beads context into system prompt");
        }
      }
    },
  };
};
