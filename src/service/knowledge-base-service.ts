import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import type { KnowledgeBase, CommandDef, AgentDef, KbInfo, KbInfoType } from "../kb/types";
import type { TemplateService } from "../template";
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
  /** Override the knowledge base (for testing) */
  knowledgeBase?: KnowledgeBase;
  /** Template service for rendering Mustache templates in commands/agents */
  templateService?: TemplateService;
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
  private knowledgeBase: KnowledgeBase | null;
  private templateService: TemplateService | null;
  private loadErrors: string[] = [];

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.knowledgeBase = options.knowledgeBase ?? null;
    this.templateService = options.templateService ?? null;
  }

  /**
   * Build the composite knowledge base from config.
   * Called lazily on first processConfig() if no knowledgeBase was injected.
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
   * Get the loaded commands (after processConfig() has been called)
   */
  getCommands(): CommandDef[] {
    return this.knowledgeBase?.getCommands() ?? [];
  }

  /**
   * Get the loaded agents (after processConfig() has been called)
   */
  getAgents(): AgentDef[] {
    return this.knowledgeBase?.getAgents() ?? [];
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
   * Process and apply the knowledge base to an OpenCode config.
   * If coderConfig.active is false, logs and returns without modification.
   * If active is true, loads commands/agents and mutates the config.
   */
  async processConfig(config: Config): Promise<void> {
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

    // Register KB with template service so templates can access command/agent data
    if (this.templateService) {
      this.templateService.registerKnowledgeBase(this.knowledgeBase.createDefinition());
    }

    const commands = this.knowledgeBase.getCommands();
    const agents = this.knowledgeBase.getAgents();

    this.logger.info(`Loaded ${commands.length} commands and ${agents.length} agents`);

    // Register commands (with template rendering)
    config.command = config.command ?? {};
    for (const cmd of commands) {
      const renderedTemplate = this.templateService
        ? await this.templateService.render(cmd.template)
        : cmd.template;

      config.command[cmd.name] = {
        template: renderedTemplate,
        ...(cmd.description && { description: cmd.description }),
        ...(cmd.agent && { agent: cmd.agent }),
        ...(cmd.model && { model: cmd.model }),
        ...(cmd.subtask && { subtask: cmd.subtask }),
      };
      this.logger.debug(`Registered command: /${cmd.name}`);
    }

    // Register agents (with template rendering)
    config.agent = config.agent ?? {};
    for (const agent of agents) {
      const renderedPrompt = this.templateService
        ? await this.templateService.render(agent.prompt)
        : agent.prompt;

      config.agent[agent.name] = {
        prompt: renderedPrompt,
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
