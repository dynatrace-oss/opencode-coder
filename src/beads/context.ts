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
 * Guidance on the beads agent architecture and when to use each agent.
 * This is specific to this plugin - beads itself doesn't provide agents.
 */
const BEADS_AGENT_GUIDANCE = `## Beads Agent Architecture

This plugin provides three specialized agents for beads workflow:

| Agent | Role | Can Edit Code | Use For |
|-------|------|---------------|---------|
| **beads-planner-agent** | Primary planning agent | No (read-only) | Planning sessions, creating issues, orchestrating work |
| **beads-task-agent** | Task execution subagent | Yes | Implementing code, running tests, closing completed issues |
| **beads-verify-agent** | Verification subagent | No (read-only) | Verifying acceptance criteria, checking completed work |

### Agent Delegation

**For planning and orchestration**, use \`beads-planner-agent\` as the primary agent. It will:
- Research the codebase (read-only)
- Create detailed beads issues with instructions
- Spawn \`beads-task-agent\` for execution
- Spawn \`beads-verify-agent\` to verify completion

**For task execution**, use the \`task\` tool with \`subagent_type: "beads-task-agent"\`:
- Finding and completing ready work
- Working through multiple issues in sequence
- Any implementation work that requires code changes

**For verification**, use the \`task\` tool with \`subagent_type: "beads-verify-agent"\`:
- Checking acceptance criteria are met
- Verifying code works as intended
- Running tests and quality checks

**Use CLI directly ONLY for single, atomic operations:**
- Creating exactly one issue: \`bd create --title="..." ...\`
- Closing exactly one issue: \`bd close <id> ...\`
- Updating one specific field: \`bd update <id> --status ...\`
- When user explicitly requests a specific command

**Why delegate?** The agents process multiple commands internally and return only concise summaries. Running bd commands directly dumps JSON into context, wasting tokens and making the conversation harder to follow.`;

/**
 * Additional guidance specific to this plugin (agent delegation).
 * The CLI usage is already provided by bd prime output.
 */
export const BEADS_GUIDANCE = BEADS_AGENT_GUIDANCE;

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
