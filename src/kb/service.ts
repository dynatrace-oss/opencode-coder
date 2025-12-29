import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../core/config";
import type { Logger } from "../core/logger";
import { loadCommands, type LoadCommandsOptions } from "./commands";
import { loadAgents, type LoadAgentsOptions } from "./agents";
import type { CommandDef, AgentDef } from "./types";

/**
 * Loader function type for commands
 */
export type CommandsLoader = (log: Logger, options?: LoadCommandsOptions) => Promise<CommandDef[]>;

/**
 * Loader function type for agents
 */
export type AgentsLoader = (log: Logger, options?: LoadAgentsOptions) => Promise<AgentDef[]>;

export interface KnowledgeBaseServiceOptions {
  coderConfig: CoderConfig;
  logger: Logger;
  /** Base path for knowledge base directory (optional, for testing) */
  basePath?: string;
  /** Custom commands loader (optional, for testing) */
  loadCommands?: CommandsLoader;
  /** Custom agents loader (optional, for testing) */
  loadAgents?: AgentsLoader;
}

export class KnowledgeBaseService {
  private coderConfig: CoderConfig;
  private logger: Logger;
  private basePath?: string;
  private commandsLoader: CommandsLoader;
  private agentsLoader: AgentsLoader;

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    if (options.basePath !== undefined) {
      this.basePath = options.basePath;
    }
    this.commandsLoader = options.loadCommands ?? loadCommands;
    this.agentsLoader = options.loadAgents ?? loadAgents;
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

    const loaderOptions = this.basePath ? { basePath: this.basePath } : undefined;
    const commands = await this.commandsLoader(this.logger, loaderOptions);
    const agents = await this.agentsLoader(this.logger, loaderOptions);

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
