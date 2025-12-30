import type { Logger } from "../core/logger";
import type { KnowledgeBase, CommandDef, AgentDef } from "./types";
import type { KnowledgeBaseDefinition } from "../template/types";
import { loadAgents, type LoadAgentsOptions } from "./loaders/agents";
import { loadCommands, type LoadCommandsOptions } from "./loaders/commands";

/**
 * Loader function type for commands
 */
export type CommandsLoader = (log: Logger, options?: LoadCommandsOptions) => Promise<CommandDef[]>;

/**
 * Loader function type for agents
 */
export type AgentsLoader = (log: Logger, options?: LoadAgentsOptions) => Promise<AgentDef[]>;

/**
 * Options for LoaderKnowledgeBase
 */
export interface LoaderKnowledgeBaseOptions {
  /** Base path for the knowledge base directory */
  basePath: string;
  /** Logger for reporting status and errors */
  logger: Logger;
  /** Custom commands loader (optional, for testing) */
  commandsLoader?: CommandsLoader;
  /** Custom agents loader (optional, for testing) */
  agentsLoader?: AgentsLoader;
}

/**
 * A knowledge base implementation that loads commands and agents from a directory.
 *
 * Uses loader functions to read markdown files from:
 * - {basePath}/command/{category}/{name}.md -> commands
 * - {basePath}/agent/{name}.md -> agents
 *
 * Loader functions can be injected for testing.
 */
export class LoaderKnowledgeBase implements KnowledgeBase {
  private basePath: string;
  private logger: Logger;
  private commandsLoader: CommandsLoader;
  private agentsLoader: AgentsLoader;

  private commands: CommandDef[] = [];
  private agents: AgentDef[] = [];
  private loaded = false;

  constructor(options: LoaderKnowledgeBaseOptions) {
    this.basePath = options.basePath;
    this.logger = options.logger;
    this.commandsLoader = options.commandsLoader ?? loadCommands;
    this.agentsLoader = options.agentsLoader ?? loadAgents;
  }

  /**
   * Load commands and agents from the knowledge base directory.
   * Safe to call multiple times (idempotent).
   */
  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    const loaderOptions = { basePath: this.basePath };

    this.commands = await this.commandsLoader(this.logger, loaderOptions);
    this.agents = await this.agentsLoader(this.logger, loaderOptions);

    this.logger.debug(`LoaderKnowledgeBase loaded from ${this.basePath}`, {
      commands: this.commands.length,
      agents: this.agents.length,
    });

    this.loaded = true;
  }

  /**
   * Get all loaded command definitions.
   */
  getCommands(): CommandDef[] {
    return this.commands;
  }

  /**
   * Get all loaded agent definitions.
   */
  getAgents(): AgentDef[] {
    return this.agents;
  }

  /**
   * Get the base path of this knowledge base.
   */
  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Create a definition object for template service registration.
   */
  createDefinition(): KnowledgeBaseDefinition {
    return {
      commands: () => this.commands,
      agents: () => this.agents,
    };
  }
}
