import { z } from "zod/v4";

/**
 * Schema for beads integration configuration
 */
export const BeadsConfigSchema = z.object({
  /** Enable beads integration (auto-detected if not specified) */
  enabled: z.boolean().optional(),
  /** Auto-approve bd CLI commands without prompting (default: true) */
  auto_approve_beads: z.boolean().default(true),
});

export type BeadsConfig = z.infer<typeof BeadsConfigSchema>;

/**
 * Schema for a single knowledge base location
 */
export const KnowledgeBaseLocationSchema = z.object({
  /** Path to the knowledge base directory (supports ~, relative paths, and {env:VAR}) */
  path: z.string(),
  /** Whether this knowledge base is enabled (default: true) */
  enabled: z.boolean().default(true),
});

export type KnowledgeBaseLocation = z.infer<typeof KnowledgeBaseLocationSchema>;

/**
 * Schema for .coder/coder.json configuration file
 */
export const CoderConfigSchema = z.object({
  /** Whether the plugin is active (default: true) */
  active: z.boolean().default(true),
  /** Beads issue tracking integration settings */
  beads: BeadsConfigSchema.optional(),
  /** Array of knowledge base locations to load */
  knowledgeBases: z.array(KnowledgeBaseLocationSchema).optional(),
});

export type CoderConfig = z.infer<typeof CoderConfigSchema>;

/**
 * Default configuration when no config file is found or parsing fails
 */
export const DEFAULT_CONFIG: CoderConfig = {
  active: true,
};
