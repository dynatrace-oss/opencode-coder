import { promises as fs } from "fs";
import * as path from "path";
import type { Logger } from "../core/logger";
import type { PluginInput } from "@opencode-ai/plugin";

type OpencodeClient = PluginInput["client"];

/**
 * Configuration options for initializing PlaygroundService.
 * 
 * @example
 * ```typescript
 * const service = new PlaygroundService({
 *   logger: createLogger(),
 *   client: input.client,
 * });
 * ```
 */
export interface PlaygroundServiceOptions {
  /** Logger instance for reporting playground operations, errors, and debug info */
  logger: Logger;
  /** OpenCode client for accessing session information and operations */
  client: OpencodeClient;
}

/**
 * Service that manages session-specific playground folders for temporary work.
 * 
 * The playground provides isolated scratch space for each Claude Code session,
 * perfect for experimentation, intermediate files, and temporary outputs.
 * 
 * ## Features
 * - **Automatic creation**: Folders created on-demand, no manual setup
 * - **Session isolation**: Each session gets a unique playground folder
 * - **Path caching**: Subsequent requests return cached paths (no I/O overhead)
 * - **Graceful errors**: Never throws—logs errors and returns undefined
 * - **OS cleanup**: Leverages system temp directory cleanup mechanisms
 * 
 * ## Path Structure
 * Playgrounds are created at: `$TMPDIR/opencode/<session-id>/`
 * 
 * Platform-specific examples:
 * - macOS/Linux: `/tmp/opencode/abc123-def456/`
 * - Windows: `%TEMP%\opencode\abc123-def456\`
 * 
 * ## Usage Example
 * ```typescript
 * // Initialize service
 * const playground = new PlaygroundService({ logger, client });
 * 
 * // Get or create playground for current session
 * const path = await playground.getOrCreatePlayground(sessionID);
 * 
 * if (path) {
 *   // Write temporary files
 *   await fs.writeFile(
 *     join(path, "scratch.json"),
 *     JSON.stringify(data)
 *   );
 * } else {
 *   // Graceful fallback if playground unavailable
 *   logger.warn("Playground unavailable, skipping temp file");
 * }
 * ```
 * 
 * ## Integration
 * Inject into services that need temporary storage:
 * ```typescript
 * const beadsService = new BeadsService({
 *   playgroundService, // ← Pass the service
 *   // ... other options
 * });
 * ```
 * 
 * @see {@link https://github.com/hk9890/opencode-coder/blob/main/docs/playground.md | Playground Documentation}
 */
export class PlaygroundService {
  private readonly logger: Logger;
  private readonly playgroundPaths: Map<string, string> = new Map();

  constructor(options: PlaygroundServiceOptions) {
    this.logger = options.logger;
  }

  /**
   * Get or create a playground folder for the specified session.
   * 
   * This method checks the cache first for performance. If not cached, it creates
   * the playground folder (if needed) and caches the path for future requests.
   * 
   * ## Behavior
   * - Returns cached path immediately if available (no I/O)
   * - Creates folder structure recursively if needed
   * - Caches successful path for subsequent calls
   * - Logs all operations (debug, info, error levels)
   * - Never throws—returns undefined on failure
   * 
   * ## Path Format
   * `$TMPDIR/opencode/<session-id>/`
   * 
   * Where `$TMPDIR` is resolved from environment:
   * - `process.env.TMPDIR` (Unix/macOS)
   * - `process.env.TEMP` (Windows)
   * - `/tmp` (fallback)
   * 
   * @param sessionID - Unique identifier for the Claude Code session
   * @returns Absolute path to the playground folder, or undefined if creation fails
   * 
   * @example
   * ```typescript
   * // First call: creates folder and caches path
   * const path1 = await service.getOrCreatePlayground("abc-123");
   * // => "/tmp/opencode/abc-123"
   * 
   * // Subsequent calls: returns cached path (instant)
   * const path2 = await service.getOrCreatePlayground("abc-123");
   * // => "/tmp/opencode/abc-123" (from cache)
   * 
   * // Handle failure gracefully
   * const path = await service.getOrCreatePlayground(sessionID);
   * if (!path) {
   *   logger.warn("Playground unavailable, using fallback");
   *   return;
   * }
   * ```
   */
  async getOrCreatePlayground(sessionID: string): Promise<string | undefined> {
    const start = Date.now();
    try {
      // Check cache first
      const cached = this.playgroundPaths.get(sessionID);
      if (cached) {
        this.logger.debug("Playground path found in cache", { sessionID, path: cached });
        return cached;
      }

      // Resolve temp directory
      const tmpDir = process.env["TMPDIR"] || process.env["TEMP"] || "/tmp";
      
      // Build playground path: $TMPDIR/opencode/$SESSION_ID
      const playgroundPath = path.join(tmpDir, "opencode", sessionID);

      // Create folder recursively
      await fs.mkdir(playgroundPath, { recursive: true });

      // Cache the path
      this.playgroundPaths.set(sessionID, playgroundPath);

      this.logger.info("Playground folder created", { sessionID, path: playgroundPath });
      return playgroundPath;
    } catch (error) {
      this.logger.error("Failed to create playground folder", {
        sessionID,
        error: String(error),
      });
      return undefined;
    } finally {
      this.logger.debug("getOrCreatePlayground completed", {
        durationMs: Date.now() - start,
        sessionID,
      });
    }
  }

  /**
   * Get the cached playground path for a session without I/O.
   * 
   * This method returns only cached paths—it does NOT create folders.
   * Use this when you need to check if a playground exists without
   * triggering creation.
   * 
   * ## Use Cases
   * - Check if playground was already created
   * - Avoid I/O overhead when creation isn't needed
   * - Conditional logic based on playground existence
   * 
   * @param sessionID - Unique identifier for the Claude Code session
   * @returns Cached absolute path if playground was previously created, undefined otherwise
   * 
   * @example
   * ```typescript
   * // Check if playground exists (no I/O)
   * const existingPath = service.getPlaygroundPath(sessionID);
   * 
   * if (existingPath) {
   *   // Use existing playground
   *   await fs.writeFile(join(existingPath, "data.json"), data);
   * } else {
   *   // Create playground if needed
   *   const newPath = await service.getOrCreatePlayground(sessionID);
   * }
   * ```
   */
  getPlaygroundPath(sessionID: string): string | undefined {
    return this.playgroundPaths.get(sessionID);
  }
}
