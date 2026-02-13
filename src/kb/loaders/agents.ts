import { join } from "path";
import type { Logger } from "../../core/logger";
import { parseFrontmatter, resolveKnowledgeBaseDir, defaultFileSystem } from "../../core";
import type { FileSystem } from "../../core";
import type { AgentDef } from "../types";

/**
 * Options for loadAgents function
 */
export interface LoadAgentsOptions {
  /** File system implementation (defaults to fs/promises) */
  fs?: FileSystem;
  /** Base path for knowledge base directory (defaults to plugin's knowledge-base/) */
  basePath?: string;
}

/**
 * Load all agent files from knowledge-base/agent/
 * Structure: agent/<name>.md -> agent with name from frontmatter or filename
 *
 * @param log - Logger instance for reporting status
 * @param options - Optional configuration for DI
 * @returns Array of agent definitions
 */
export async function loadAgents(log: Logger, options: LoadAgentsOptions = {}): Promise<AgentDef[]> {
  const fs = options.fs ?? defaultFileSystem;
  const basePath = options.basePath ?? (await resolveKnowledgeBaseDir());
  const agents: AgentDef[] = [];
  const agentDir = join(basePath, "agent");

  try {
    const files = await fs.readdir(agentDir, { withFileTypes: true });

    for (const file of files) {
      if (!file.isFile() || !file.name.endsWith(".md")) continue;

      const filePath = join(agentDir, file.name);
      const content = await fs.readFile(filePath, "utf-8");
      const { frontmatter, body } = parseFrontmatter(content);

      // Use name from frontmatter, or derive from filename
      const name = (frontmatter["name"] as string) || file.name.replace(".md", "");

      const agent: AgentDef = {
        name,
        prompt: body.trim(),
      };

      if (frontmatter["description"]) agent["description"] = frontmatter["description"] as string;
      if (frontmatter["model"]) agent["model"] = frontmatter["model"] as string;
      if (frontmatter["mode"]) {
        const mode = frontmatter["mode"] as "subagent" | "primary" | "all";
        if (["subagent", "primary", "all"].includes(mode)) {
          agent["mode"] = mode;
        }
      }

      // Add permission parsing
      if (frontmatter["permission"]) {
        agent["permission"] = frontmatter["permission"] as Record<string, any>;
      }

      agents.push(agent);
    }
  } catch (error) {
    log.error("Failed to load agents", { error: String(error) });
  }

  return agents;
}
