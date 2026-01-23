import { readdir, readFile, access } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Logger } from "../../core/logger";
import { parseFrontmatter } from "../../core/parser";
import type { CommandDef } from "../types";

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
export interface CommandsFileSystem {
  readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
}

/**
 * Options for loadCommands function
 */
export interface LoadCommandsOptions {
  /** File system implementation (defaults to fs/promises) */
  fs?: CommandsFileSystem;
  /** Base path for knowledge base directory (defaults to plugin's knowledge-base/) */
  basePath?: string;
}

/**
 * Default file system implementation using Node's fs/promises
 */
export const defaultCommandsFileSystem: CommandsFileSystem = {
  readdir: (path: string, options: { withFileTypes: true }) => readdir(path, options),
  readFile: (path: string, encoding: BufferEncoding) => readFile(path, encoding),
};

/**
 * Load all command files from knowledge-base/command/
 * Structure: command/<category>/<name>.md -> coder/<category>/<name>
 *
 * @param log - Logger instance for reporting status
 * @param options - Optional configuration for DI
 * @returns Array of command definitions
 */
export async function loadCommands(log: Logger, options: LoadCommandsOptions = {}): Promise<CommandDef[]> {
  const fs = options.fs ?? defaultCommandsFileSystem;
  const basePath = options.basePath ?? (await resolveKnowledgeBaseDir());
  const commands: CommandDef[] = [];
  const commandDir = join(basePath, "command");

  log.debug("Loading commands", { basePath, commandDir });

  try {
    const categories = await fs.readdir(commandDir, { withFileTypes: true });
    log.debug("Found categories", { count: categories.length, names: categories.map(c => c.name) });

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryPath = join(commandDir, category.name);
      const files = await fs.readdir(categoryPath, { withFileTypes: true });
      log.debug("Found files in category", { category: category.name, count: files.length, names: files.map(f => f.name) });

      for (const file of files) {
        if (!file.isFile() || !file.name.endsWith(".md")) continue;

        const filePath = join(categoryPath, file.name);
        const content = await fs.readFile(filePath, "utf-8");
        const { frontmatter, body } = parseFrontmatter(content);

        const commandName = file.name.replace(".md", "");
        const fullName = `${category.name}/${commandName}`;

        const cmd: CommandDef = {
          name: fullName,
          template: body.trim(),
        };

        if (frontmatter["description"]) cmd["description"] = frontmatter["description"] as string;
        if (frontmatter["agent"]) cmd["agent"] = frontmatter["agent"] as string;
        if (frontmatter["model"]) cmd["model"] = frontmatter["model"] as string;
        if (frontmatter["subtask"] === true || frontmatter["subtask"] === "true") cmd["subtask"] = true;

        commands.push(cmd);
      }
    }
  } catch (error) {
    log.error("Failed to load commands", { error: String(error), basePath, commandDir });
  }

  log.debug("Loaded commands", { count: commands.length, names: commands.map(c => c.name) });
  return commands;
}
