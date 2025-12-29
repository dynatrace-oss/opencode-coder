import { z } from "zod/v4";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Logger } from "./logger";

/**
 * Schema for .coder/coder.json configuration file
 */
const CoderConfigSchema = z.object({
  active: z.boolean().default(true),
});

export type CoderConfig = z.infer<typeof CoderConfigSchema>;

const DEFAULT_CONFIG: CoderConfig = {
  active: true,
};

/**
 * Load configuration from .coder/coder.json in the current working directory
 * 
 * @param log - Logger instance for reporting config status
 * @returns Parsed and validated configuration, or defaults if file missing/invalid
 */
export async function loadConfig(log: Logger): Promise<CoderConfig> {
  const cwd = process.cwd();
  const configPath = join(cwd, ".coder", "coder.json");

  try {
    const content = await readFile(configPath, "utf-8");
    const json = JSON.parse(content);
    const result = CoderConfigSchema.safeParse(json);

    if (!result.success) {
      log.warn("Invalid coder.json config, using defaults", {
        path: configPath,
        errors: result.error.issues.map((i) => i.message),
      });
      return DEFAULT_CONFIG;
    }

    log.debug("Loaded config from .coder/coder.json", {
      path: configPath,
      config: result.data,
    });
    return result.data;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      log.debug("No .coder/coder.json found, using defaults", { path: configPath });
    } else {
      log.warn("Failed to load coder.json, using defaults", {
        path: configPath,
        error: String(error),
      });
    }
    return DEFAULT_CONFIG;
  }
}
