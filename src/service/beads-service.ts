import type { PluginInput } from "@opencode-ai/plugin";
import type { Logger } from "../core/logger";
import { BeadsDetector } from "../beads";
import { execSync } from "child_process";

type OpencodeClient = PluginInput["client"];

const COMMAND_CHECK_TIMEOUT_MS = 5_000;

/**
 * Options for BeadsService
 */
export interface BeadsServiceOptions {
  /** Logger for reporting status and errors */
  logger: Logger;
  /** OpenCode client for session operations */
  client: OpencodeClient;
  /** Override beads enabled state (for testing) */
  beadsEnabled?: boolean;
}

/**
 * Service that handles beads-related functionality.
 *
 * Features:
 * - Detects beads availability (.beads/ directory)
 * - Shows toast notifications if beads is not properly set up
 *
 * Guidance and CLI reference are provided by the agent configurations
 * (ai-resources/agents/*.md), not injected by this service.
 */
export class BeadsService {
  private readonly logger: Logger;
  private readonly beadsEnabled: boolean;
  private readonly client: OpencodeClient;

  constructor(options: BeadsServiceOptions) {
    this.logger = options.logger;
    this.client = options.client;

    // Detect beads enabled state (can be overridden for testing)
    if (options.beadsEnabled !== undefined) {
      this.beadsEnabled = options.beadsEnabled;
    } else {
      const detector = new BeadsDetector({ logger: options.logger });
      this.beadsEnabled = detector.isBeadsEnabled();
    }
  }

  /**
   * Check if beads integration is enabled
   */
  isBeadsEnabled(): boolean {
    return this.beadsEnabled;
  }

  /**
   * Check beads availability and show toast notification if something is missing.
   * This helps users understand why beads features aren't working.
   *
   * Shows warning toast if:
   * - bd CLI is not installed
   * - .beads directory is missing
   *
   * Does NOT show toast if both conditions pass (beads is working).
   */
  async checkBeadsAvailability(): Promise<void> {
    const start = Date.now();
    try {
      // Check if bd CLI is installed
      const bdInstalled = this.isBdCliInstalled();

      // Check if .beads directory exists
      const detector = new BeadsDetector({ logger: this.logger });
      const beadsDirExists = detector.detectBeadsDirectory();

      // Only show toast if something is missing
      if (!bdInstalled) {
        await this.showToast({
          title: "Beads Not Available",
          message: "Beads CLI not found. Install with: npm install -g beads",
          variant: "warning",
          duration: 8000,
        });
        this.logger.warn("Beads CLI not installed");
        return;
      }

      if (!beadsDirExists) {
        await this.showToast({
          title: "Beads Not Initialized",
          message: "Beads not initialized for this project. Run: bd init",
          variant: "warning",
          duration: 8000,
        });
        this.logger.warn("Beads directory not found");
        return;
      }

      // Both conditions pass - no toast needed
      this.logger.debug("Beads availability check passed");
    } finally {
      this.logger.debug("checkBeadsAvailability completed", { durationMs: Date.now() - start });
    }
  }

  /**
   * Check if the bd CLI is installed by running 'command -v bd'
   */
  private isBdCliInstalled(): boolean {
    try {
      execSync("command -v bd", {
        stdio: "ignore",
        timeout: COMMAND_CHECK_TIMEOUT_MS,
      });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Show a toast notification via the OpenCode TUI
   */
  private async showToast(options: {
    title: string;
    message: string;
    variant: "info" | "success" | "warning" | "error";
    duration?: number;
  }): Promise<void> {
    try {
      await (this.client as any).tui.showToast({
        title: options.title,
        message: options.message,
        variant: options.variant,
        duration: options.duration,
      });
    } catch (error) {
      this.logger.error("Failed to show toast", { error: String(error) });
    }
  }
}
