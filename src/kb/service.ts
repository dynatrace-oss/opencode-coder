import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../core/config";
import type { Logger } from "../core/logger";
import { loadCommands, type LoadCommandsOptions } from "./commands";
import { loadAgents, type LoadAgentsOptions } from "./agents";
import type { CommandDef, AgentDef, KbInfo, KbInfoType } from "./types";

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
  /** Whether beads integration is enabled (used to filter bd/* commands) */
  beadsEnabled?: boolean;
}

export class KnowledgeBaseService {
  private coderConfig: CoderConfig;
  private logger: Logger;
  private basePath?: string;
  private commandsLoader: CommandsLoader;
  private agentsLoader: AgentsLoader;
  private beadsEnabled: boolean;
  private loadedCommands: CommandDef[] = [];
  private loadedAgents: AgentDef[] = [];

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    if (options.basePath !== undefined) {
      this.basePath = options.basePath;
    }
    this.commandsLoader = options.loadCommands ?? loadCommands;
    this.agentsLoader = options.loadAgents ?? loadAgents;
    this.beadsEnabled = options.beadsEnabled ?? false;
  }

  /**
   * Get the loaded commands (after apply() has been called)
   */
  getCommands(): CommandDef[] {
    return this.loadedCommands;
  }

  /**
   * Get the loaded agents (after apply() has been called)
   */
  getAgents(): AgentDef[] {
    return this.loadedAgents;
  }

  /**
   * Check if beads integration is enabled
   */
  isBeadsEnabled(): boolean {
    return this.beadsEnabled;
  }

  /**
   * Check if the plugin is active
   */
  isActive(): boolean {
    return this.coderConfig.active;
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

    // Store loaded items for later access
    this.loadedCommands = commands;
    this.loadedAgents = agents;

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

  /**
   * Create a KbInfo object from a command or agent definition.
   * @param type - The type of knowledge base item ("command" or "agent")
   * @param source - The source definition (CommandDef or AgentDef)
   * @returns A unified KbInfo object
   */
  createKbInfo(type: KbInfoType, source: CommandDef | AgentDef): KbInfo {
    return {
      type,
      name: source.name,
      ...(source.description && { description: source.description }),
      source,
    };
  }
}
