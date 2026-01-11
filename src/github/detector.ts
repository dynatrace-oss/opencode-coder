import { accessSync, constants } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import type { Logger } from "../core/logger";
import type { CoderConfig } from "../config/schema";

/**
 * Options for GitHubDetector
 */
export interface GitHubDetectorOptions {
  /** Logger instance for reporting detection status */
  logger: Logger;
  /** Current working directory (defaults to process.cwd()) */
  cwd?: string;
}

/**
 * Detects whether GitHub integration is available and enabled.
 * Checks for git repository, GitHub remote, and gh CLI availability.
 */
export class GitHubDetector {
  private readonly logger: Logger;
  private readonly cwd: string;
  private readonly gitDir: string;

  constructor(options: GitHubDetectorOptions) {
    this.logger = options.logger;
    this.cwd = options.cwd ?? process.cwd();
    this.gitDir = join(this.cwd, ".git");
  }

  /**
   * Detect if .git directory exists (sync)
   * @returns true if .git directory exists, false otherwise
   */
  detectGitDirectory(): boolean {
    const start = Date.now();
    try {
      accessSync(this.gitDir, constants.F_OK);
      this.logger.debug("Git directory detected", { path: this.gitDir });
      return true;
    } catch {
      this.logger.debug("Git directory not found", { path: this.gitDir });
      return false;
    } finally {
      this.logger.debug("detectGitDirectory completed", { durationMs: Date.now() - start });
    }
  }

  /**
   * Detect if any git remote points to github.com (sync)
   * @returns true if a GitHub remote is configured, false otherwise
   */
  detectGitHubRemote(): boolean {
    const start = Date.now();
    try {
      const output = execSync("git remote -v", {
        cwd: this.cwd,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });

      const hasGitHubRemote = output.includes("github.com");
      this.logger.debug("GitHub remote detection", {
        found: hasGitHubRemote,
        cwd: this.cwd,
      });
      return hasGitHubRemote;
    } catch {
      this.logger.debug("Failed to detect git remotes", { cwd: this.cwd });
      return false;
    } finally {
      this.logger.debug("detectGitHubRemote completed", { durationMs: Date.now() - start });
    }
  }

  /**
   * Check if gh CLI is installed and available (sync)
   * @returns true if gh CLI is available, false otherwise
   */
  isGhCliInstalled(): boolean {
    const start = Date.now();
    try {
      execSync("command -v gh", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      });
      this.logger.debug("gh CLI detected");
      return true;
    } catch {
      this.logger.debug("gh CLI not found");
      return false;
    } finally {
      this.logger.debug("isGhCliInstalled completed", { durationMs: Date.now() - start });
    }
  }

  /**
   * Determine if GitHub integration should be enabled (sync)
   *
   * Logic:
   * - If config.github.enabled is explicitly set (true/false), use that value
   * - Otherwise, auto-detect by checking:
   *   1. .git directory exists
   *   2. A GitHub remote is configured
   *   3. gh CLI is installed
   *
   * @param config - The loaded coder configuration
   * @returns true if GitHub integration should be enabled, false otherwise
   */
  isGitHubEnabled(config: CoderConfig): boolean {
    const start = Date.now();
    try {
      // Check explicit config override first
      if (config.github?.enabled !== undefined) {
        this.logger.debug("GitHub enabled from config", {
          enabled: config.github.enabled,
        });
        return config.github.enabled;
      }

      // Fall back to auto-detection: all three conditions must be true
      const hasGitDir = this.detectGitDirectory();
      if (!hasGitDir) {
        this.logger.debug("GitHub disabled: no git directory");
        return false;
      }

      const hasGitHubRemote = this.detectGitHubRemote();
      if (!hasGitHubRemote) {
        this.logger.debug("GitHub disabled: no GitHub remote");
        return false;
      }

      const hasGhCli = this.isGhCliInstalled();
      if (!hasGhCli) {
        this.logger.debug("GitHub disabled: gh CLI not installed");
        return false;
      }

      this.logger.debug("GitHub enabled from auto-detection");
      return true;
    } finally {
      this.logger.debug("isGitHubEnabled completed", { durationMs: Date.now() - start });
    }
  }
}
