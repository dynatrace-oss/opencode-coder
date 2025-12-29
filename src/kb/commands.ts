import { readdir, readFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { Logger } from "../core/logger";
import { parseFrontmatter } from "./parser";
import type { CommandDef } from "./types";

// Get the directory where this plugin is located
const __dirname = dirname(fileURLToPath(import.meta.url));
const KNOWLEDGE_BASE_DIR = join(__dirname, "..", "..", "knowledge-base");

/**
 * Load all command files from knowledge-base/command/
 * Structure: command/<category>/<name>.md -> coder/<category>/<name>
 */
export async function loadCommands(log: Logger): Promise<CommandDef[]> {
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
    log.error("Failed to load commands", { error: String(error) });
  }

  return commands;
}
