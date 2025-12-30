import { accessSync, constants } from "fs";
import { join } from "path";
import type { Logger } from "../core/logger";
import type { CoderConfig } from "../config/schema";

/**
 * Options for BeadsDetector
 */
export interface BeadsDetectorOptions {
  /** Logger instance for reporting detection status */
  logger: Logger;
  /** Current working directory (defaults to process.cwd()) */
  cwd?: string;
}

/**
 * Detects whether beads issue tracking is available and enabled.
 * Internal to BeadsService - not exported from the module.
 */
export class BeadsDetector {
  private readonly logger: Logger;
  private readonly cwd: string;
  private readonly beadsDir: string;

  constructor(options: BeadsDetectorOptions) {
    this.logger = options.logger;
    this.cwd = options.cwd ?? process.cwd();
    this.beadsDir = join(this.cwd, ".beads");
  }

  /**
   * Detect if .beads directory exists (sync)
   * @returns true if .beads directory exists, false otherwise
   */
  detectBeadsDirectory(): boolean {
    try {
      accessSync(this.beadsDir, constants.F_OK);
      this.logger.debug("Beads directory detected", { path: this.beadsDir });
      return true;
    } catch {
      this.logger.debug("Beads directory not found", { path: this.beadsDir });
      return false;
    }
  }

  /**
   * Determine if beads integration should be enabled (sync)
   * 
   * Logic:
   * - If config.beads.enabled is explicitly set (true/false), use that value
   * - Otherwise, auto-detect by checking if .beads directory exists
   * 
   * @param config - The loaded coder configuration
   * @returns true if beads should be enabled, false otherwise
   */
  isBeadsEnabled(config: CoderConfig): boolean {
    // Check explicit config override first
    if (config.beads?.enabled !== undefined) {
      this.logger.debug("Beads enabled from config", { enabled: config.beads.enabled });
      return config.beads.enabled;
    }

    // Fall back to auto-detection
    const detected = this.detectBeadsDirectory();
    this.logger.debug("Beads enabled from auto-detection", { enabled: detected });
    return detected;
  }
}
