import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Logger } from "../core/logger";
import { parseFrontmatter } from "./parser";

// Get the directory where this plugin is located
const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_BASE_DIR = join(__dirname, "..", "..", "knowledge-base");

export interface AgentDef {
  name: string;
  description?: string;
  prompt: string;
  mode?: "subagent" | "primary" | "all";
  model?: string;
}

/**
 * Load all agent files from knowledge-base/agent/
 * Structure: agent/<name>.md -> agent with name from frontmatter or filename
 */
export async function loadAgents(log: Logger): Promise<AgentDef[]> {
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
    log.error("Failed to load agents", { error: String(error) });
  }

  return agents;
}
