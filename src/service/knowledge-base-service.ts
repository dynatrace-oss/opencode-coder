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
+ * Feature flags that control which commands/agents are registered.
+ * Commands in feature-specific folders (e.g., github/*) are only
+ * registered when the corresponding feature is enabled.
+ */
export interface FeatureFlags {
  /** Whether GitHub integration is enabled */
  github?: boolean;
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
  /** Feature flags for filtering commands by feature availability */
  featureFlags?: FeatureFlags;
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
  private featureFlags: FeatureFlags;
  private loadErrors: string[] = [];

  constructor(options: KnowledgeBaseServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.knowledgeBase = options.knowledgeBase ?? null;
    this.templateService = options.templateService ?? null;
    this.featureFlags = options.featureFlags ?? {};
  }

  /**
   * Build the composite knowledge base from config.
   * Called lazily on first processConfig() if no knowledgeBase was injected.
   */
  private async buildKnowledgeBase(): Promise<KnowledgeBase> {
    const start = Date.now();
    try {
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
    } finally {
      this.logger.debug("buildKnowledgeBase completed", { durationMs: Date.now() - start });
    }
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
   * Check if a command should be registered based on feature flags.
   * Commands in feature-specific folders are filtered when the feature is disabled.
   *
   * Convention: commands in `{feature}/` folders require that feature to be enabled.
   * Currently supported features:
   * - `github/*` - requires github feature flag
   *
   * @param cmd - The command to check
   * @returns true if the command should be registered
   */
  private shouldRegisterCommand(cmd: CommandDef): boolean {
    // Extract folder from command name (e.g., "github/sync-issues" -> "github")
    const folder = cmd.name.split("/")[0];

    // Check feature-specific folders
    if (folder === "github" && !this.featureFlags.github) {
      this.logger.debug(`Skipping command /${cmd.name} (GitHub not available)`);
      return false;
    }

    return true;
  }

  /**
   * Process and apply the knowledge base to an OpenCode config.
   * If coderConfig.active is false, logs and returns without modification.
   * If active is true, loads commands/agents and mutates the config.
   */
  async processConfig(config: Config): Promise<void> {
    const start = Date.now();
    try {
      if (!this.coderConfig.active) {
        this.logger.info("OpencodeCoder plugin disabled via config (active: false)");
        return;
      }

      // Build knowledge base if not injected
      if (!this.knowledgeBase) {
        this.knowledgeBase = await this.buildKnowledgeBase();
      }

      // Load all knowledge bases
      const loadStart = Date.now();
      await this.knowledgeBase.load();
      this.logger.debug("Knowledge base loaded", { durationMs: Date.now() - loadStart });

      const allCommands = this.knowledgeBase.getCommands();
      const agents = this.knowledgeBase.getAgents();

      // Filter commands based on feature availability
      const commands = allCommands.filter((cmd) => this.shouldRegisterCommand(cmd));

      // Register filtered KB with template service so templates can access command/agent data
      // This ensures /coder/status shows only the commands that are actually registered
      if (this.templateService) {
        this.templateService.registerKnowledgeBase({
          commands: () => commands,
          agents: () => agents,
        });
      }

      this.logger.info(`Loaded ${commands.length} commands and ${agents.length} agents`);

      // Register commands (with template rendering)
      const cmdStart = Date.now();
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
      this.logger.debug("Commands registered", { durationMs: Date.now() - cmdStart, count: commands.length });

      // Register agents (with template rendering)
      const agentStart = Date.now();
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
          ...(agent.permission && { permission: agent.permission }),
        };
        this.logger.debug(`Registered agent: @${agent.name}`, {
          hasPermission: !!agent.permission,
          permission: agent.permission,
        });
      }
      this.logger.debug("Agents registered", { durationMs: Date.now() - agentStart, count: agents.length });
    } finally {
      this.logger.debug("processConfig completed", { durationMs: Date.now() - start });
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
