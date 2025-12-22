import type { Plugin } from "@opencode-ai/plugin";
import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

// Get the directory where this plugin is located
const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_BASE_DIR = join(__dirname, "..", "knowledge-base");



interface CommandDef {
  name: string;
  template: string;
  description?: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

interface AgentDef {
  name: string;
  description?: string;
  prompt: string;
  mode?: "subagent" | "primary" | "all";
  model?: string;
}

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(content: string): { frontmatter: Record<string, string>; body: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: content };
  }

  const frontmatter: Record<string, string> = {};
  const frontmatterLines = frontmatterMatch[1]!.split("\n");
  for (const line of frontmatterLines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      frontmatter[key] = value;
    }
  }

  return { frontmatter, body: frontmatterMatch[2] ?? "" };
}

/**
 * Load all command files from knowledge-base/command/
 * Structure: command/<category>/<name>.md -> coder/<category>/<name>
 */
async function loadCommands(): Promise<CommandDef[]> {
  const commands: CommandDef[] = [];
  const commandDir = join(KNOWLEDGE_BASE_DIR, "command");

  try {
    const categories = await readdir(commandDir, { withFileTypes: true });

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryPath = join(commandDir, category.name);
      const files = await readdir(categoryPath, { withFileTypes: true });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".md")) continue;

        const filePath = join(categoryPath, file.name);
        const content = await readFile(filePath, "utf-8");
        const { frontmatter, body } = parseFrontmatter(content);

        const commandName = file.name.replace(".md", "");
        const fullName = `${category.name}/${commandName}`;

        const cmd: CommandDef = {
          name: fullName,
          template: body.trim(),
        };

        if (frontmatter["description"]) cmd["description"] = frontmatter["description"];
        if (frontmatter["agent"]) cmd["agent"] = frontmatter["agent"];
        if (frontmatter["model"]) cmd["model"] = frontmatter["model"];
        if (frontmatter["subtask"] === "true") cmd["subtask"] = true;

        commands.push(cmd);
      }
    }
  } catch (error) {
    console.error("Failed to load commands:", error);
  }

  return commands;
}

/**
 * Load all agent files from knowledge-base/agent/
 * Structure: agent/<name>.md -> agent with name from frontmatter or filename
 */
async function loadAgents(): Promise<AgentDef[]> {
  const agents: AgentDef[] = [];
  const agentDir = join(KNOWLEDGE_BASE_DIR, "agent");

  try {
    const files = await readdir(agentDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".md")) continue;

      const filePath = join(agentDir, file.name);
      const content = await readFile(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(content);

      // Use name from frontmatter, or derive from filename
      const name = frontmatter["name"] || file.name.replace(".md", "");

      const agent: AgentDef = {
        name,
        prompt: body.trim(),
      };

      if (frontmatter["description"]) agent["description"] = frontmatter["description"];
      if (frontmatter["model"]) agent["model"] = frontmatter["model"];
      if (frontmatter["mode"]) {
        const mode = frontmatter["mode"] as "subagent" | "primary" | "all";
        if (["subagent", "primary", "all"].includes(mode)) {
          agent["mode"] = mode;
        }
      }

      agents.push(agent);
    }
  } catch (error) {
    console.error("Failed to load agents:", error);
  }

  return agents;
}

export const OpencodeCoder: Plugin = async () => {
  console.log("OpencodeCoder plugin loading...");

  // Load commands and agents at plugin initialization
  const commands = await loadCommands();
  const agents = await loadAgents();

  console.log(`Loaded ${commands.length} commands and ${agents.length} agents`);

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
        console.log(`Registered command: /${cmd.name}`);
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
        console.log(`Registered agent: @${agent.name}`);
      }
    },
  };
};
