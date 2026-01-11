import type { Logger } from "../core/logger";
import type { CoderConfig } from "../config/schema";
import type { VersionInfo } from "../core/version";
import type { CommandDef, AgentDef } from "../kb/types";

/**
 * Definition interface for knowledge base data.
 * Used to provide commands/agents data to the template context.
 */
export interface KnowledgeBaseDefinition {
  commands(): CommandDef[];
  agents(): AgentDef[];
}

/**
 * Definition interface for beads data.
 * Used to provide beads status to the template context.
 */
export interface BeadsDefinition {
  enabled(): boolean;
}

/**
 * Definition interface for GitHub data.
 * Used to provide GitHub status to the template context.
 */
export interface GitHubDefinition {
  enabled(): boolean;
}

/**
 * Template context structure for Mustache rendering.
 * This object is available to all templates.
 */
export interface TemplateContext {
  coder: {
    config: CoderConfig;
    version: VersionInfo;
    cwd: string;
  };
  knowledgeBase?: {
    commands: CommandDef[];
    agents: AgentDef[];
    commandCount: number;
    agentCount: number;
  };
  beads?: {
    enabled: boolean;
  };
  github?: {
    enabled: boolean;
  };
}

/**
 * Options for creating TemplateService
 */
export interface TemplateServiceOptions {
  config: CoderConfig;
  cwd: string;
  logger: Logger;
}
