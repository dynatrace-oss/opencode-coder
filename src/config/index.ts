// Schema and types
export {
  CoderConfigSchema,
  BeadsConfigSchema,
  KnowledgeBaseLocationSchema,
  DEFAULT_CONFIG,
  type CoderConfig,
  type BeadsConfig,
  type KnowledgeBaseLocation,
} from "./schema";

// Loader
export { loadConfig } from "./loader";
export type { LoadConfigOptions } from "./loader";

// Re-export FileSystem from core for backwards compatibility
export type { FileSystem } from "../core";

// Resolver utilities
export { resolveEnvVariables, expandHome, resolvePath, resolveEnvInObject } from "./resolver";
