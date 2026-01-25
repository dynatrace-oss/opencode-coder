import type { Logger } from "../core/logger";
import type { KnowledgeBase, CommandDef, AgentDef } from "./types";

/**
 * Options for CompositeKnowledgeBase
 */
export interface CompositeKnowledgeBaseOptions {
  /** Array of knowledge bases to combine (order matters - last wins on conflict) */
  knowledgeBases: KnowledgeBase[];
  /** Logger for reporting status and errors */
  logger: Logger;
}

/**
 * A composite knowledge base that combines multiple knowledge base sources.
 *
 * Features:
 * - Loads all knowledge bases in sequence
 * - Merges commands and agents from all sources
 * - Last knowledge base wins on name conflicts (later entries override earlier ones)
 * - Continues loading even if individual knowledge bases fail (logs warnings)
 * - Tracks load errors for doctor/status reporting
 */
export class CompositeKnowledgeBase implements KnowledgeBase {
  private knowledgeBases: KnowledgeBase[];
  private logger: Logger;
  private loaded = false;
  private loadErrors: string[] = [];

  constructor(options: CompositeKnowledgeBaseOptions) {
    this.knowledgeBases = options.knowledgeBases;
    this.logger = options.logger;
  }

  /**
   * Load all knowledge bases.
   * Continues even if individual KBs fail, logging warnings for failures.
   * Safe to call multiple times (idempotent).
   */
  async load(): Promise<void> {
    if (this.loaded) {
      return;
    }

    this.loadErrors = [];

    for (const kb of this.knowledgeBases) {
      try {
        await kb.load();
      } catch (error) {
        const errorMsg = `Failed to load knowledge base: ${String(error)}`;
        this.loadErrors.push(errorMsg);
        this.logger.warn(errorMsg, { error: String(error) });
      }
    }

    this.loaded = true;
  }

  /**
   * Get all commands from all knowledge bases, merged.
   * Later knowledge bases override earlier ones on name conflicts.
   */
  getCommands(): CommandDef[] {
    const commandMap = new Map<string, CommandDef>();

    for (const kb of this.knowledgeBases) {
      for (const cmd of kb.getCommands()) {
        commandMap.set(cmd.name, cmd);
      }
    }

    return Array.from(commandMap.values());
  }

  /**
   * Get all agents from all knowledge bases, merged.
   * Later knowledge bases override earlier ones on name conflicts.
   */
  getAgents(): AgentDef[] {
    const agentMap = new Map<string, AgentDef>();

    for (const kb of this.knowledgeBases) {
      for (const agent of kb.getAgents()) {
        agentMap.set(agent.name, agent);
      }
    }

    return Array.from(agentMap.values());
  }

  /**
   * Get any errors that occurred during loading.
   * Useful for doctor/status commands to report KB health.
   */
  getLoadErrors(): string[] {
    return [...this.loadErrors];
  }

  /**
   * Get the number of knowledge bases being combined.
   */
  getKnowledgeBaseCount(): number {
    return this.knowledgeBases.length;
  }
}
