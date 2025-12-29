import type { Plugin } from "@opencode-ai/plugin";
import { createLogger, loadConfig } from "./core";
import { loadCommands, loadAgents } from "./kb";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  // Load config from user's project (.coder/coder.json)
  const coderConfig = await loadConfig(log);

  // If plugin is disabled, return minimal implementation
  // Logger still works for telemetry, but no commands/agents registered
  if (!coderConfig.active) {
    log.info("OpencodeCoder plugin disabled via config (active: false)");
    return {
      async config() {
        // No-op: don't register any commands or agents
      },
    };
  }

  // Load commands and agents at plugin initialization
  const commands = await loadCommands(log);
  const agents = await loadAgents(log);

  log.info(`Loaded ${commands.length} commands and ${agents.length} agents`);

  return {
    async config(config) {
      // Register commands
      config.command = config.command ?? {};
      for (const cmd of commands) {
        const cmdConfig: { template: string; description?: string; agent?: string; model?: string; subtask?: boolean } =
          {
            template: cmd.template,
          };

        if (cmd.description) cmdConfig.description = cmd.description;
        if (cmd.agent) cmdConfig.agent = cmd.agent;
        if (cmd.model) cmdConfig.model = cmd.model;
        if (cmd.subtask) cmdConfig.subtask = cmd.subtask;

        config.command[cmd.name] = cmdConfig;
        log.debug(`Registered command: /${cmd.name}`);
      }

      // Register agents
      config.agent = config.agent ?? {};
      for (const agent of agents) {
        const agentConfig: {
          prompt?: string;
          description?: string;
          mode?: "subagent" | "primary" | "all";
          model?: string;
        } = {
          prompt: agent.prompt,
        };

        if (agent.description) agentConfig.description = agent.description;
        if (agent.mode) agentConfig.mode = agent.mode;
        if (agent.model) agentConfig.model = agent.model;

        config.agent[agent.name] = agentConfig;
        log.debug(`Registered agent: @${agent.name}`);
      }
    },
  };
};
