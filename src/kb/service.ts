import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../core/config";
import type { Logger } from "../core/logger";
import { loadCommands } from "./commands";
import { loadAgents } from "./agents";

export interface KnowledgeBaseServiceOptions {
  coderConfig: CoderConfig;
  logger: Logger;
}

export class KnowledgeBaseService {
  private coderConfig: CoderConfig;
  private logger: Logger;

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
  }

  /**
   * Apply the knowledge base to an OpenCode config.
   * If coderConfig.active is false, logs and returns without modification.
   * If active is true, loads commands/agents and mutates the config.
   */
  async apply(config: Config): Promise<void> {
    if (!this.coderConfig.active) {
      this.logger.info("OpencodeCoder plugin disabled via config (active: false)");
      return;
    }

    const commands = await loadCommands(this.logger);
    const agents = await loadAgents(this.logger);

    this.logger.info(`Loaded ${commands.length} commands and ${agents.length} agents`);

    // Register commands
    config.command = config.command ?? {};
    for (const cmd of commands) {
      config.command[cmd.name] = {
        template: cmd.template,
        ...(cmd.description && { description: cmd.description }),
        ...(cmd.agent && { agent: cmd.agent }),
        ...(cmd.model && { model: cmd.model }),
        ...(cmd.subtask && { subtask: cmd.subtask }),
      };
      this.logger.debug(`Registered command: /${cmd.name}`);
    }

    // Register agents
    config.agent = config.agent ?? {};
    for (const agent of agents) {
      config.agent[agent.name] = {
        prompt: agent.prompt,
        ...(agent.description && { description: agent.description }),
        ...(agent.mode && { mode: agent.mode }),
        ...(agent.model && { model: agent.model }),
      };
      this.logger.debug(`Registered agent: @${agent.name}`);
    }
  }
}
