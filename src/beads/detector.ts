import { access, constants } from "fs/promises";
import { join } from "path";
import type { Logger } from "../core/logger";
import type { CoderConfig } from "../core/config";

/**
 * File system interface for dependency injection
 */
export interface BeadsFileSystem {
  access(path: string, mode?: number): Promise<void>;
}

/**
 * Options for BeadsDetector
 */
export interface BeadsDetectorOptions {
  /** Logger instance for reporting detection status */
  logger: Logger;
  /** File system implementation (defaults to fs/promises) */
  fs?: BeadsFileSystem;
  /** Current working directory (defaults to process.cwd()) */
  cwd?: string;
}

/**
 * Default file system implementation using Node's fs/promises
 */
export const defaultBeadsFileSystem: BeadsFileSystem = {
  access: (path: string, mode?: number) => access(path, mode),
};

/**
 * Detects whether beads issue tracking is available and enabled
 */
export class BeadsDetector {
  private readonly logger: Logger;
  private readonly fs: BeadsFileSystem;
  private readonly cwd: string;
  private readonly beadsDir: string;

  constructor(options: BeadsDetectorOptions) {
    this.logger = options.logger;
    this.fs = options.fs ?? defaultBeadsFileSystem;
    this.cwd = options.cwd ?? process.cwd();
    this.beadsDir = join(this.cwd, ".beads");
  }

  /**
   * Detect if .beads directory exists
   * @returns true if .beads directory exists, false otherwise
   */
  async detectBeadsDirectory(): Promise<boolean> {
    try {
      await this.fs.access(this.beadsDir, constants.F_OK);
      this.logger.debug("Beads directory detected", { path: this.beadsDir });
      return true;
    } catch {
      this.logger.debug("Beads directory not found", { path: this.beadsDir });
      return false;
    }
  }

  /**
   * Determine if beads integration should be enabled
   * 
   * Logic:
   * - If config.beads.enabled is explicitly set (true/false), use that value
   * - Otherwise, auto-detect by checking if .beads directory exists
   * 
   * @param config - The loaded coder configuration
   * @returns true if beads should be enabled, false otherwise
   */
  async isBeadsEnabled(config: CoderConfig): Promise<boolean> {
    // Check explicit config override first
    if (config.beads?.enabled !== undefined) {
      this.logger.debug("Beads enabled from config", { enabled: config.beads.enabled });
      return config.beads.enabled;
    }

    // Fall back to auto-detection
    const detected = await this.detectBeadsDirectory();
    this.logger.debug("Beads enabled from auto-detection", { enabled: detected });
    return detected;
  }
}
