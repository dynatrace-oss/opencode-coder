import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import type { KnowledgeBase, CommandDef, AgentDef, KbInfo, KbInfoType } from "../kb/types";
import { LoaderKnowledgeBase } from "../kb/loader-kb";
import { CompositeKnowledgeBase } from "../kb/composite-kb";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { access } from "fs/promises";

// Get the directory where this module is located
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the bundled knowledge-base directory.
 * Handles both source (src/service/) and dist (dist/) layouts.
 */
async function resolveBundledKnowledgeBaseDir(): Promise<string> {
  // Try dist layout first (../knowledge-base from dist/)
  const distPath = join(__dirname, "..", "knowledge-base");
  try {
    await access(distPath);
    return distPath;
  } catch {
    // Fall back to source layout (../../knowledge-base from src/service/)
    return join(__dirname, "..", "..", "knowledge-base");
  }
}

/**
 * Options for KnowledgeBaseService
 */
export interface KnowledgeBaseServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for reporting status and errors */
  logger: Logger;
  /** Whether beads integration is enabled */
  beadsEnabled?: boolean;
  /** Override the knowledge base (for testing) */
  knowledgeBase?: KnowledgeBase;
}

/**
 * Service that orchestrates loading and applying knowledge bases to OpenCode config.
 *
 * Features:
 * - Builds a composite knowledge base from config (bundled KB first, then user KBs)
 * - Applies commands and agents to OpenCode config
 * - Tracks load errors for doctor/status reporting
 * - Supports dependency injection for testing
 */
export class KnowledgeBaseService {
  private coderConfig: CoderConfig;
  private logger: Logger;
  private beadsEnabled: boolean;
  private knowledgeBase: KnowledgeBase | null;
  private loadErrors: string[] = [];

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.beadsEnabled = options.beadsEnabled ?? false;
    this.knowledgeBase = options.knowledgeBase ?? null;
  }

  /**
   * Build the composite knowledge base from config.
   * Called lazily on first apply() if no knowledgeBase was injected.
   */
  private async buildKnowledgeBase(): Promise<KnowledgeBase> {
    const knowledgeBases: KnowledgeBase[] = [];

    // Always include bundled KB first (Option A: bundled first, user overrides)
    const bundledPath = await resolveBundledKnowledgeBaseDir();
    knowledgeBases.push(
      new LoaderKnowledgeBase({
        basePath: bundledPath,
        logger: this.logger,
      })
    );

    // Add user-configured knowledge bases (enabled ones only)
    if (this.coderConfig.knowledgeBases) {
      for (const kbConfig of this.coderConfig.knowledgeBases) {
        if (kbConfig.enabled) {
          knowledgeBases.push(
            new LoaderKnowledgeBase({
              basePath: kbConfig.path,
              logger: this.logger,
            })
          );
        }
      }
    }

    return new CompositeKnowledgeBase({
      knowledgeBases,
      logger: this.logger,
    });
  }

  /**
   * Get the loaded commands (after apply() has been called)
   */
  getCommands(): CommandDef[] {
    return this.knowledgeBase?.getCommands() ?? [];
  }

  /**
   * Get the loaded agents (after apply() has been called)
   */
  getAgents(): AgentDef[] {
    return this.knowledgeBase?.getAgents() ?? [];
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
   * Get any errors that occurred during knowledge base loading.
   * Useful for doctor/status commands.
   */
  getLoadErrors(): string[] {
    if (this.knowledgeBase instanceof CompositeKnowledgeBase) {
      return this.knowledgeBase.getLoadErrors();
    }
    return this.loadErrors;
  }

  /**
   * Get the number of configured knowledge bases.
   */
  getKnowledgeBaseCount(): number {
    // Bundled KB + user-configured enabled KBs
    const userKbCount = this.coderConfig.knowledgeBases?.filter((kb) => kb.enabled).length ?? 0;
    return 1 + userKbCount; // 1 for bundled
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

    // Build knowledge base if not injected
    if (!this.knowledgeBase) {
      this.knowledgeBase = await this.buildKnowledgeBase();
    }

    // Load all knowledge bases
    await this.knowledgeBase.load();

    const commands = this.knowledgeBase.getCommands();
    const agents = this.knowledgeBase.getAgents();

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
