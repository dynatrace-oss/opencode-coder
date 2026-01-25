/**
 * Command definition loaded from knowledge-base/command/
 */
export interface CommandDef {
  name: string;
  template: string;
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

/**
 * Agent definition loaded from knowledge-base/agent/
 */
export interface AgentDef {
  name: string;
  description?: string;
  prompt: string;
  mode?: "subagent" | "primary" | "all";
  model?: string;
  permission?: Record<string, any>;
}

/**
 * Interface for knowledge base implementations.
 * All knowledge base sources (single directory, composite, etc.) must implement this.
 */
export interface KnowledgeBase {
  /**
   * Load commands and agents from this knowledge base source.
   * Should be called before accessing getCommands() or getAgents().
   * Safe to call multiple times (should be idempotent).
   */
  load(): Promise<void>;

  /**
   * Get all loaded command definitions.
   * Returns empty array if load() hasn't been called or no commands exist.
   */
  getCommands(): CommandDef[];

  /**
   * Get all loaded agent definitions.
   * Returns empty array if load() hasn't been called or no agents exist.
   */
  getAgents(): AgentDef[];
}

/**
 * Type of knowledge base item
 */
export type KbInfoType = "command" | "agent";

/**
 * Unified representation of a knowledge base item (command or agent).
 * Used by doctor/status commands to report on loaded KBs.
 */
export interface KbInfo {
  type: KbInfoType;
  name: string;
  description?: string;
  source: CommandDef | AgentDef;
}
