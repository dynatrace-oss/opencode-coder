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
 * Beads context information for session injection
 */
export interface BeadsContextInfo {
  /** Whether beads context is available */
  available: boolean;
  /** The prime output from bd prime */
  primeOutput: string;
  /** Full context string including guidance */
  contextString: string;
}

/**
 * CLI usage guidance for the model
 */
const BEADS_CLI_USAGE = `## CLI Usage

Use the \`bd\` CLI via bash for beads operations:

- \`bd ready\` - List ready tasks (no blockers)
- \`bd show <id>\` - Show task details
- \`bd create --title="title" --type=bug|feature|task --priority=0-4\` - Create issue
- \`bd update <id> --status in_progress\` - Update status
- \`bd close <id> --reason="message"\` - Close issue
- \`bd close <id1> <id2> ...\` - Close multiple issues at once
- \`bd list --status=open\` - List issues by status
- \`bd blocked\` - Show blocked issues
- \`bd stats\` - Show statistics
- \`bd sync\` - Sync with git
- \`bd dep add <issue> <depends-on>\` - Add dependency

Use \`--json\` flag for structured output when parsing programmatically.`;

/**
 * Guidance on when to create beads issues
 */
const BEADS_TASK_CREATION = `## When to Create Beads Issues

**IMPORTANT: Always create beads issues for discovered work.**

Create a beads issue (\`bd create\`) when you encounter:
- Bugs or errors that need fixing
- TODO comments or incomplete implementations
- Technical debt or refactoring opportunities
- Missing tests or documentation
- Follow-up work from the current task
- Any work that might span multiple sessions

**Do NOT rely on TodoWrite for work tracking.** TodoWrite is only for breaking down your immediate execution steps within the current task. Beads issues persist across sessions and track dependencies.

**At session start:** Check \`bd ready\` to see if there's existing work to continue.`;

/**
 * Guidance on when to use agents vs CLI directly
 */
const BEADS_AGENT_GUIDANCE = `## Agent Delegation

**Default to the agent.** For ANY beads work involving multiple commands or context gathering, use the \`task\` tool with \`subagent_type: "beads-task-agent"\`:
- Status overviews ("what's next", "what's blocked", "show me progress")
- Exploring the issue graph (ready + in-progress + blocked queries)
- Finding and completing ready work
- Working through multiple issues in sequence
- Any request that would require 2+ bd commands

**Use CLI directly ONLY for single, atomic operations:**
- Creating exactly one issue: \`bd create --title="..." ...\`
- Closing exactly one issue: \`bd close <id> ...\`
- Updating one specific field: \`bd update <id> --status ...\`
- When user explicitly requests a specific command

**Why delegate?** The agent processes multiple commands internally and returns only a concise summary. Running bd commands directly dumps JSON into context, wasting tokens and making the conversation harder to follow.`;

/**
 * Full beads guidance content
 */
export const BEADS_GUIDANCE = `${BEADS_TASK_CREATION}

${BEADS_CLI_USAGE}

${BEADS_AGENT_GUIDANCE}`;

/**
 * Provides beads context information for session injection
 */
export class BeadsContext {
  private readonly logger: Logger;
  private readonly executor: CommandExecutor;

  constructor(options: BeadsContextOptions) {
    this.logger = options.logger;
    this.executor = options.executor ?? defaultCommandExecutor;
  }

  /**
   * Get prime output from bd prime command
   * Returns empty string if bd is not available or not initialized
   */
  async getPrimeOutput(): Promise<string> {
    try {
      const result = await this.executor.exec("bd prime");
      if (result.exitCode !== 0) {
        this.logger.debug("bd prime failed", { stderr: result.stderr });
        return "";
      }
      return result.stdout.trim();
    } catch (error) {
      this.logger.debug("Failed to get prime output", { error: String(error) });
      return "";
    }
  }

  /**
   * Build the full context string for injection
   */
  private buildContextString(primeOutput: string): string {
    if (!primeOutput) {
      return "";
    }

    return `<beads-context>
${primeOutput}
</beads-context>

${BEADS_GUIDANCE}`;
  }

  /**
   * Get beads context for session injection
   */
  async getContext(): Promise<BeadsContextInfo> {
    const primeOutput = await this.getPrimeOutput();

    if (!primeOutput) {
      this.logger.debug("Beads context not available - bd prime returned empty");
      return {
        available: false,
        primeOutput: "",
        contextString: "",
      };
    }

    const contextString = this.buildContextString(primeOutput);

    this.logger.debug("Beads context loaded via bd prime");

    return {
      available: true,
      primeOutput,
      contextString,
    };
  }
}
