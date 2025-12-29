import { z } from "zod/v4";
import { readFile } from "fs/promises";
import { join } from "path";
import type { Logger } from "./logger";

/**
 * Schema for .coder/coder.json configuration file
 */
export const CoderConfigSchema = z.object({
  active: z.boolean().default(true),
});

export type CoderConfig = z.infer<typeof CoderConfigSchema>;

export const DEFAULT_CONFIG: CoderConfig = {
  active: true,
};

/**
 * File system interface for dependency injection
 */
export interface FileSystem {
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
}

/**
 * Options for loadConfig function
 */
export interface LoadConfigOptions {
  /** File system implementation (defaults to fs/promises) */
  fs?: FileSystem;
  /** Current working directory (defaults to process.cwd()) */
  cwd?: string;
}

/**
 * Default file system implementation using Node's fs/promises
 */
export const defaultFileSystem: FileSystem = {
  readFile: (path: string, encoding: BufferEncoding) => readFile(path, encoding),
};

/**
 * Load configuration from .coder/coder.json in the specified directory
 * 
 * @param log - Logger instance for reporting config status
 * @param options - Optional configuration for DI
 * @returns Parsed and validated configuration, or defaults if file missing/invalid
 */
export async function loadConfig(log: Logger, options: LoadConfigOptions = {}): Promise<CoderConfig> {
  const fs = options.fs ?? defaultFileSystem;
  const cwd = options.cwd ?? process.cwd();
  const configPath = join(cwd, ".coder", "coder.json");

  try {
    const content = await fs.readFile(configPath, "utf-8");
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
