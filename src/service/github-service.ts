import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import { GitHubDetector } from "../github/detector";

/**
 * Options for GitHubService
 */
export interface GitHubServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for reporting status and errors */
  logger: Logger;
}

/**
 * Service that manages GitHub integration state.
 *
 * Features:
 * - Detects if GitHub integration is enabled (via config or auto-detection)
 */
export class GitHubService {
  private readonly githubEnabled: boolean;

  constructor(options: GitHubServiceOptions) {
    const detector = new GitHubDetector({ logger: options.logger });
    this.githubEnabled = detector.isGitHubEnabled(options.coderConfig);
  }

  /**
   * Check if GitHub integration is enabled
   */
  isGitHubEnabled(): boolean {
    return this.githubEnabled;
  }
}
