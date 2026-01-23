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

This plugin provides four specialized agents for beads workflow:

| Agent | Role | Can Edit Code | Trigger |
|-------|------|---------------|---------|
| **beads-planner-agent** | Planning, structure, orchestration | No (read-only) | User requests |
| **beads-review-agent** | Reviews plans, not code | No (read-only) | \`need:review\` label |
| **beads-task-agent** | Implements tasks | Yes | Ready tasks |
| **beads-verify-agent** | Verifies outcomes, owns gates | No (read-only) | Gates, verification requests |

### Workflow

1. **Planner** creates epic + tasks + acceptance gate
2. **Planner** adds \`need:review\` label where appropriate
3. **Reviewer** reviews plans → creates tasks/gates/bugs if needed
4. **Task agent** implements tasks → closes when implementation complete
5. **Verifier** validates gates → closes gates or creates bugs/tasks
6. Epic closes when all tasks and gates are closed

### Agent Delegation

**For planning**, use \`beads-planner-agent\` as primary agent:
- Creates epics, tasks, gates with detailed instructions
- Applies labels (\`need:review\`) for routing
- Spawns other agents as needed

**For plan review**, use \`task\` tool with \`subagent_type: "beads-review-agent"\`:
- Reviews structure, completeness, logic of plans
- Outputs new beads (tasks, gates, bugs) - does NOT modify existing

**For task execution**, use \`task\` tool with \`subagent_type: "beads-task-agent"\`:
- Implements code changes per task instructions
- Closes tasks when implementation complete (not perfect)

**For verification**, use \`task\` tool with \`subagent_type: "beads-verify-agent"\`:
- Owns and verifies gates
- Closes gates when criteria met
- Creates bugs/tasks if issues found

### Core Philosophy

> Review and verification produce new work - they do not rewrite old work.

- Closed work is NOT reopened - create new issues instead
- Gates block, don't approve - they represent conditions to meet
- Labels route work - \`need:review\` triggers review agent
- History is immutable - agents are predictable

**Use CLI directly ONLY for single, atomic operations.**`;

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
    return `<beads-context>\n${primeOutput}\n</beads-context>\n\n${BEADS_GUIDANCE}`;
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
