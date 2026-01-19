import { promises as fs } from "fs";
import * as path from "path";
import type { Logger } from "../core/logger";
import type { PluginInput } from "@opencode-ai/plugin";

type OpencodeClient = PluginInput["client"];

/**
 * Options for PlaygroundService
 */
export interface PlaygroundServiceOptions {
  /** Logger for reporting status and errors */
  logger: Logger;
  /** OpenCode client for session operations */
  client: OpencodeClient;
}

/**
 * Service that manages session-specific playground folders.
 * 
 * Features:
 * - Creates temporary folders for each session
 * - Caches paths for efficiency
 * - Handles folder lifecycle management
 * - Graceful error handling (logs, doesn't throw)
 */
export class PlaygroundService {
  private readonly logger: Logger;
  private readonly playgroundPaths: Map<string, string> = new Map();

  constructor(options: PlaygroundServiceOptions) {
    this.logger = options.logger;
  }

  /**
   * Get or create a playground folder for a session.
   * Returns the absolute path to the playground folder.
   * 
   * Path format: $TMPDIR/opencode/$SESSION_ID
   * 
   * @param sessionID - The session identifier
   * @returns Absolute path to the playground folder, or undefined if creation fails
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
   * Get cached playground path for a session.
   * 
   * @param sessionID - The session identifier
   * @returns Cached path if exists, undefined otherwise
   */
  getPlaygroundPath(sessionID: string): string | undefined {
    return this.playgroundPaths.get(sessionID);
  }
}
