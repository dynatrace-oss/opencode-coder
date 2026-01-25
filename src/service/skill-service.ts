import type { Config } from "@opencode-ai/sdk";
import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import type { CommandDef } from "../kb/types";
import { parseFrontmatter } from "../core/parser";
import { readdir, readFile, access } from "fs/promises";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

// Get the directory where this module is located
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Resolve the bundled knowledge-base directory.
 * Handles both source (src/service/) and dist (dist/) layouts.
 */
async function resolveBundledKnowledgeBaseDir(): Promise<string> {
  // Try dist layout first (../knowledge-base from dist/)
  const distPath = join(__dirname, "..", "knowledge-base");
  try {
    await access(distPath);
    return distPath;
  } catch {
    // Fall back to source layout (../../knowledge-base from src/service/)
    return join(__dirname, "..", "..", "knowledge-base");
  }
}

/**
 * File system interface for dependency injection
 */
export interface SkillFileSystem {
  readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
  access(path: string): Promise<void>;
}

/**
 * Default file system implementation
 */
export const defaultSkillFileSystem: SkillFileSystem = {
  readdir: (path: string, options: { withFileTypes: true }) => readdir(path, options),
  readFile: (path: string, encoding: BufferEncoding) => readFile(path, encoding),
  access: (path: string) => access(path),
};

/**
 * Options for SkillService
 */
export interface SkillServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for reporting status and errors */
  logger: Logger;
  /** Optional file system implementation for testing */
  fileSystem?: SkillFileSystem;
}

/**
 * Service that discovers SKILL.md files and registers them as /skills/* commands.
 *
 * Features:
 * - Discovers skills from 5 locations (first match wins):
 *   - knowledge-base/skills (plugin-bundled, lowest priority)
 *   - .opencode/skills (project-specific)
 *   - .claude/skills (project-specific, legacy)
 *   - ~/.config/opencode/skills (user global)
 *   - ~/.claude/skills (user global, legacy)
 * - Parses SKILL.md frontmatter for command metadata
 * - Registers as commands with name = `skills/{dir-name}`
 * - Handles errors gracefully (logs but continues)
 */
export class SkillService {
  private coderConfig: CoderConfig;
  private logger: Logger;
  private fs: SkillFileSystem;

  constructor(options: SkillServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.fs = options.fileSystem ?? defaultSkillFileSystem;
  }

  /**
   * Discover skills from all configured locations.
   * Each skill is a directory containing a SKILL.md file.
   *
   * Search priority (first location wins for duplicate skill names):
   * 1. knowledge-base/skills/ - Plugin-bundled (lowest priority, can be overridden)
   * 2. .opencode/skills/ - Project-specific (overrides plugin)
   * 3. .claude/skills/ - Legacy project
   * 4. ~/.config/opencode/skills/ - User global (highest priority)
   * 5. ~/.claude/skills/ - Legacy user global
   *
   * @returns Array of CommandDef objects (one per skill)
   */
  private async discoverSkills(): Promise<CommandDef[]> {
    // Resolve bundled skills directory
    const bundledKbDir = await resolveBundledKnowledgeBaseDir();
    const bundledSkillsPath = join(bundledKbDir, "skills");

    const skillPaths = [
      bundledSkillsPath, // Plugin-bundled skills (lowest priority)
      join(process.cwd(), ".opencode/skills"),
      join(process.cwd(), ".claude/skills"),
      join(homedir(), ".config/opencode/skills"),
      join(homedir(), ".claude/skills"),
    ];

    const commands: CommandDef[] = [];
    const seenSkills = new Set<string>();

    for (const skillPath of skillPaths) {
      try {
        // Check if directory exists
        await this.fs.access(skillPath);
        this.logger.info(`Scanning skills directory: ${skillPath}`);

        // Read subdirectories (symlinks to directories are followed automatically)
        const entries = await this.fs.readdir(skillPath, { withFileTypes: true });
        const skillDirs = entries.filter((entry) => entry.isDirectory());

        for (const dir of skillDirs) {
          try {
            const skillDir = join(skillPath, dir.name);
            const skillMdPath = join(skillDir, "SKILL.md");

            // Check if SKILL.md exists
            try {
              await this.fs.access(skillMdPath);
            } catch {
              this.logger.warn(`Skipping ${dir.name}: no SKILL.md found`);
              continue;
            }

            // Read and parse SKILL.md
            const content = await this.fs.readFile(skillMdPath, "utf-8");
            const parsed = parseFrontmatter(content);

            // Validate required fields
            const name = `skills/${dir.name}`;
            
            // Check for duplicates (first location wins)
            if (seenSkills.has(dir.name)) {
              this.logger.warn(`Skipping duplicate skill: ${dir.name}`);
              continue;
            }
            seenSkills.add(dir.name);
            const template = parsed.body.trim();

            if (!template) {
              this.logger.warn(`Skipping skill ${dir.name}: empty template body`);
              continue;
            }

            // Create CommandDef
            const command: CommandDef = {
              name,
              template,
            };

            // Add optional fields from frontmatter
            if (
              parsed.frontmatter["description"] &&
              typeof parsed.frontmatter["description"] === "string"
            ) {
              command.description = parsed.frontmatter["description"];
            }

            if (parsed.frontmatter["agent"] && typeof parsed.frontmatter["agent"] === "string") {
              command.agent = parsed.frontmatter["agent"];
            }

            if (parsed.frontmatter["model"] && typeof parsed.frontmatter["model"] === "string") {
              command.model = parsed.frontmatter["model"];
            }

            if (typeof parsed.frontmatter["subtask"] === "boolean") {
              command.subtask = parsed.frontmatter["subtask"];
            }

            commands.push(command);
            this.logger.info(`Discovered skill: ${name}`, {
              hasDescription: !!command.description,
              hasAgent: !!command.agent,
            });
          } catch (error) {
            this.logger.error(`Failed to load skill ${dir.name}`, {
              error: String(error),
            });
          }
        }
      } catch (error) {
        // Directory doesn't exist or not accessible - this is normal
        this.logger.debug(`Skills directory not accessible: ${skillPath}`);
      }
    }

    return commands;
  }

  /**
   * Process and register skills as commands in the OpenCode config.
   * If coderConfig.active is false, returns without modification.
   */
  async processConfig(config: Config): Promise<void> {
    const start = Date.now();
    try {
      if (!this.coderConfig.active) {
        this.logger.debug("SkillService skipped (plugin not active)");
        return;
      }

      const skills = await this.discoverSkills();

      if (skills.length === 0) {
        this.logger.info("No skills found");
        return;
      }

      // Register skills as commands
      config.command = config.command ?? {};
      for (const skill of skills) {
        const commandConfig = {
          template: skill.template,
          ...(skill.description && { description: skill.description }),
          ...(skill.agent && { agent: skill.agent }),
          ...(skill.model && { model: skill.model }),
          ...(skill.subtask !== undefined && { subtask: skill.subtask }),
        };
        config.command[skill.name] = commandConfig;
        
        // Log each command registration with details
        this.logger.info(`✓ Registered skill command: ${skill.name}`, {
          description: skill.description || "(no description)",
          agent: skill.agent || "(default)",
          templateLength: skill.template.length,
        });
      }

      this.logger.info(`Total skills registered: ${skills.length}`);
    } finally {
      this.logger.debug("SkillService.processConfig completed", {
        durationMs: Date.now() - start,
      });
    }
  }
}
