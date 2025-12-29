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
