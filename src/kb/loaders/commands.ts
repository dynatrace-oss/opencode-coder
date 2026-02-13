import { join } from "path";
import type { Logger } from "../../core/logger";
import { parseFrontmatter, resolveKnowledgeBaseDir, defaultFileSystem } from "../../core";
import type { FileSystem } from "../../core";
import type { CommandDef } from "../types";

/**
 * Options for loadCommands function
 */
export interface LoadCommandsOptions {
  /** File system implementation (defaults to fs/promises) */
  fs?: FileSystem;
  /** Base path for knowledge base directory (defaults to plugin's knowledge-base/) */
  basePath?: string;
}

/**
 * Load all command files from knowledge-base/command/
 * Structure: command/<category>/<name>.md -> coder/<category>/<name>
 *
 * @param log - Logger instance for reporting status
 * @param options - Optional configuration for DI
 * @returns Array of command definitions
 */
export async function loadCommands(log: Logger, options: LoadCommandsOptions = {}): Promise<CommandDef[]> {
  const fs = options.fs ?? defaultFileSystem;
  const basePath = options.basePath ?? (await resolveKnowledgeBaseDir());
  const commands: CommandDef[] = [];
  const commandDir = join(basePath, "command");

  try {
    const categories = await fs.readdir(commandDir, { withFileTypes: true });

    for (const category of categories) {
      if (!category.isDirectory()) continue;

      const categoryPath = join(commandDir, category.name);
      const files = await fs.readdir(categoryPath, { withFileTypes: true });

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

  return commands;
}
