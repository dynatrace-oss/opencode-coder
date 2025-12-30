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
export { loadConfig, defaultFileSystem } from "./loader";
export type { FileSystem, LoadConfigOptions } from "./loader";

// Resolver utilities
export { resolveEnvVariables, expandHome, resolvePath, resolveEnvInObject } from "./resolver";
