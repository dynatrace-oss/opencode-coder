import { join } from "path";
import type { Logger } from "../core/logger";
import { defaultFileSystem } from "../core";
import type { FileSystem } from "../core";
import { CoderConfigSchema, DEFAULT_CONFIG, type CoderConfig } from "./schema";
import { resolvePath, resolveEnvInObject } from "./resolver";

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
 * Resolve all knowledge base paths in the config to absolute paths.
 * Also resolves environment variables in the paths.
 *
 * @param config - The parsed config with potentially relative/unresolved paths
 * @param cwd - Current working directory for resolving relative paths
 * @returns Config with all KB paths resolved to absolute paths
 */
function resolveKnowledgeBasePaths(config: CoderConfig, cwd: string): CoderConfig {
  if (!config.knowledgeBases || config.knowledgeBases.length === 0) {
    return config;
  }

  return {
    ...config,
    knowledgeBases: config.knowledgeBases.map((kb) => ({
      ...kb,
      path: resolvePath(kb.path, cwd),
    })),
  };
}

/**
 * Load configuration from .coder/coder.json in the specified directory.
 *
 * Features:
 * - Resolves {env:VAR_NAME} patterns in all string values
 * - Resolves ~ and relative paths in knowledgeBases[].path to absolute paths
 * - Returns DEFAULT_CONFIG if file is missing or invalid
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

    // Resolve environment variables in all string values before validation
    const resolvedJson = resolveEnvInObject(json);

    const result = CoderConfigSchema.safeParse(resolvedJson);

    if (!result.success) {
      log.warn("Invalid coder.json config, using defaults", {
        path: configPath,
        errors: result.error.issues.map((i) => i.message),
      });
      return DEFAULT_CONFIG;
    }

    // Resolve knowledge base paths to absolute paths
    const configWithResolvedPaths = resolveKnowledgeBasePaths(result.data, cwd);

    log.debug("Loaded config from .coder/coder.json", {
      path: configPath,
      config: configWithResolvedPaths,
    });

    return configWithResolvedPaths;
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
