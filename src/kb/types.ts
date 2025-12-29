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
}

/**
 * The complete knowledge base containing all loaded commands and agents
 */
export interface KnowledgeBase {
  commands: CommandDef[];
  agents: AgentDef[];
}

/**
 * Type of knowledge base item
 */
export type KbInfoType = "command" | "agent";

/**
 * Unified info about a knowledge base item (command or agent)
 */
export interface KbInfo {
  type: KbInfoType;
  name: string;
  description?: string;
  source: CommandDef | AgentDef;
}
