import type { Logger } from "../core/logger";

/**
 * Interface for executing shell commands
 */
export interface CommandExecutor {
  exec(command: string): Promise<{ stdout: string; stderr: string; exitCode: number }>;
}

/**
 * Default command executor using Bun shell
 */
export const defaultCommandExecutor: CommandExecutor = {
  async exec(command: string) {
    const proc = Bun.spawn(["sh", "-c", command], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;
    return { stdout, stderr, exitCode };
  },
};

/**
 * Options for BeadsContext
 */
export interface BeadsContextOptions {
  /** Logger instance for reporting status */
  logger: Logger;
  /** Command executor implementation (defaults to Bun shell) */
  executor?: CommandExecutor;
}

/**
 * Beads issue summary for context injection
 */
export interface BeadsIssueSummary {
  id: string;
  title: string;
  status: string;
  priority: number;
  issue_type: string;
}

/**
 * Beads context information for system prompt injection
 */
export interface BeadsContextInfo {
  /** Whether beads is available and working */
  available: boolean;
  /** List of ready issues (no blocking dependencies) */
  readyIssues: BeadsIssueSummary[];
  /** List of in-progress issues */
  inProgressIssues: BeadsIssueSummary[];
  /** Formatted context string for system prompt */
  contextString: string;
}

/**
 * Provides beads context information for system prompt injection
 */
export class BeadsContext {
  private readonly logger: Logger;
  private readonly executor: CommandExecutor;

  constructor(options: BeadsContextOptions) {
    this.logger = options.logger;
    this.executor = options.executor ?? defaultCommandExecutor;
  }

  /**
   * Check if bd command is available
   */
  async isBdAvailable(): Promise<boolean> {
    try {
      const result = await this.executor.exec("bd --version");
      return result.exitCode === 0;
    } catch {
      this.logger.debug("bd command not available");
      return false;
    }
  }

  /**
   * Get ready issues (no blocking dependencies)
   */
  async getReadyIssues(): Promise<BeadsIssueSummary[]> {
    try {
      const result = await this.executor.exec("bd ready --json");
      if (result.exitCode !== 0) {
        this.logger.debug("bd ready failed", { stderr: result.stderr });
        return [];
      }
      const issues = JSON.parse(result.stdout) as BeadsIssueSummary[];
      return issues;
    } catch (error) {
      this.logger.debug("Failed to get ready issues", { error: String(error) });
      return [];
    }
  }

  /**
   * Get in-progress issues
   */
  async getInProgressIssues(): Promise<BeadsIssueSummary[]> {
    try {
      const result = await this.executor.exec("bd list --status=in_progress --json");
      if (result.exitCode !== 0) {
        this.logger.debug("bd list failed", { stderr: result.stderr });
        return [];
      }
      const issues = JSON.parse(result.stdout) as BeadsIssueSummary[];
      return issues;
    } catch (error) {
      this.logger.debug("Failed to get in-progress issues", { error: String(error) });
      return [];
    }
  }

  /**
   * Format priority number to string (P0=critical, P1=high, etc.)
   */
  private formatPriority(priority: number): string {
    const labels: Record<number, string> = {
      0: "P0-critical",
      1: "P1-high",
      2: "P2-medium",
      3: "P3-low",
      4: "P4-backlog",
    };
    return labels[priority] ?? `P${priority}`;
  }

  /**
   * Format issues into a readable string
   */
  private formatIssues(issues: BeadsIssueSummary[], header: string): string {
    if (issues.length === 0) return "";

    const lines = [header];
    for (const issue of issues) {
      lines.push(`  - [${issue.id}] ${issue.title} (${this.formatPriority(issue.priority)}, ${issue.issue_type})`);
    }
    return lines.join("\n");
  }

  /**
   * Build the full context string for system prompt injection
   */
  private buildContextString(
    available: boolean,
    readyIssues: BeadsIssueSummary[],
    inProgressIssues: BeadsIssueSummary[]
  ): string {
    if (!available) {
      return "";
    }

    const parts: string[] = ["## Beads Issue Tracking Context"];

    if (inProgressIssues.length > 0) {
      parts.push(this.formatIssues(inProgressIssues, "\n### Currently In Progress:"));
    }

    if (readyIssues.length > 0) {
      parts.push(this.formatIssues(readyIssues, "\n### Ready to Work On:"));
    }

    if (inProgressIssues.length === 0 && readyIssues.length === 0) {
      parts.push("\nNo issues currently tracked. Use `bd create` to create new issues.");
    }

    parts.push("\n### Quick Commands:");
    parts.push("  - `bd ready` - Show issues ready to work on");
    parts.push("  - `bd show <id>` - View issue details");
    parts.push("  - `bd update <id> --status in_progress` - Start working on an issue");
    parts.push("  - `bd close <id>` - Complete an issue");

    return parts.join("\n");
  }

  /**
   * Get full beads context information
   */
  async getContext(): Promise<BeadsContextInfo> {
    const available = await this.isBdAvailable();

    if (!available) {
      this.logger.debug("Beads context not available - bd command not found");
      return {
        available: false,
        readyIssues: [],
        inProgressIssues: [],
        contextString: "",
      };
    }

    const [readyIssues, inProgressIssues] = await Promise.all([
      this.getReadyIssues(),
      this.getInProgressIssues(),
    ]);

    const contextString = this.buildContextString(available, readyIssues, inProgressIssues);

    this.logger.debug("Beads context loaded", {
      readyCount: readyIssues.length,
      inProgressCount: inProgressIssues.length,
    });

    return {
      available,
      readyIssues,
      inProgressIssues,
      contextString,
    };
  }
}
