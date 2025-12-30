import { readdir, readFile, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Logger } from "../../core/logger";
import { parseFrontmatter } from "../../core/parser";
import type { AgentDef } from "../types";

// Get the directory where this plugin is located
const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve knowledge-base directory - handles both source (src/kb/loaders/) and dist (dist/) layouts
async function resolveKnowledgeBaseDir(): Promise<string> {
  // Try dist layout first (../knowledge-base from dist/)
  const distPath = join(__dirname, "..", "knowledge-base");
  try {
    await access(distPath);
    return distPath;
  } catch {
    // Fall back to source layout (../../../knowledge-base from src/kb/loaders/)
    return join(__dirname, "..", "..", "..", "knowledge-base");
  }
}

/**
 * File system interface for dependency injection
 */
export interface AgentsFileSystem {
  readdir(path: string, options: { withFileTypes: true }): Promise<{ name: string; isFile(): boolean }[]>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
}

/**
 * Options for loadAgents function
 */
export interface LoadAgentsOptions {
  /** File system implementation (defaults to fs/promises) */
  fs?: AgentsFileSystem;
  /** Base path for knowledge base directory (defaults to plugin's knowledge-base/) */
  basePath?: string;
}

/**
 * Default file system implementation using Node's fs/promises
 */
export const defaultAgentsFileSystem: AgentsFileSystem = {
  readdir: (path: string, options: { withFileTypes: true }) => readdir(path, options),
  readFile: (path: string, encoding: BufferEncoding) => readFile(path, encoding),
};

/**
 * Load all agent files from knowledge-base/agent/
 * Structure: agent/<name>.md -> agent with name from frontmatter or filename
 *
 * @param log - Logger instance for reporting status
 * @param options - Optional configuration for DI
 * @returns Array of agent definitions
 */
export async function loadAgents(log: Logger, options: LoadAgentsOptions = {}): Promise<AgentDef[]> {
  const fs = options.fs ?? defaultAgentsFileSystem;
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

      agents.push(agent);
    }
  } catch (error) {
    log.error("Failed to load agents", { error: String(error) });
  }

  return agents;
}
