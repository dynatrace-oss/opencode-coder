import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";

/**
 * Input type for permission.ask hook
 */
export interface PermissionAskInput {
  type: string;
  title?: string;
  [key: string]: unknown;
}

/**
 * Output type for permission.ask hook
 */
export interface PermissionAskOutput {
  status?: "allow" | "deny" | "ask";
}

/**
 * Permission decision result
 */
type PermissionDecision = "allow" | "deny" | "ask" | undefined;

/**
 * Permission rule function
 * Returns a decision or undefined if the rule doesn't apply
 */
type PermissionRule = (input: PermissionAskInput) => PermissionDecision;

/**
 * Registered permission rule with metadata
 */
interface RegisteredRule {
  name: string;
  rule: PermissionRule;
  priority: number;
}

/**
 * Options for PermissionService
 */
export interface PermissionServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for debugging permission decisions */
  logger: Logger;
}

/**
 * Service that manages all permission rules for the plugin.
 * 
 * Features:
 * - Centralized permission logic
 * - Composable rule system with priorities
 * - Built-in rules for temp directory operations
 * - Services can register additional rules
 */
export class PermissionService {
  private readonly logger: Logger;
  private readonly rules: RegisteredRule[] = [];

  constructor(options: PermissionServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;

    // Register built-in rules
    this.registerBuiltInRules();
  }

  /**
   * Register a permission rule
   * @param name - Descriptive name for the rule (for debugging)
   * @param rule - Function to evaluate permission
   * @param priority - Higher priority rules evaluated first (default: 0)
   */
  registerRule(name: string, rule: PermissionRule, priority: number = 0): void {
    this.rules.push({ name, rule, priority });
    // Keep rules sorted by priority (highest first)
    this.rules.sort((a, b) => b.priority - a.priority);
    this.logger.debug(`Registered permission rule: ${name}`, { priority });
  }

  /**
   * Process permission.ask hook
   * Evaluates registered rules in priority order
   */
  processPermissionAsk(input: PermissionAskInput, output: PermissionAskOutput): void {
    const start = Date.now();
    
    try {
      for (const { name, rule } of this.rules) {
        const decision = rule(input);
        
        if (decision !== undefined) {
          output.status = decision;
          this.logger.debug(`Permission decision by rule: ${name}`, {
            decision,
            inputType: input.type,
            inputTitle: input.title,
            durationMs: Date.now() - start,
          });
          return;
        }
      }
      
      // No rule matched - let OpenCode handle it (ask user)
      this.logger.debug("No permission rule matched, deferring to OpenCode", {
        inputType: input.type,
        inputTitle: input.title,
        durationMs: Date.now() - start,
      });
    } catch (error) {
      this.logger.error("Error processing permission request", {
        error: String(error),
        inputType: input.type,
        inputTitle: input.title,
      });
    }
  }

  /**
   * Register built-in permission rules
   */
  private registerBuiltInRules(): void {
    // Rule 1: Temp directory read/write operations (Priority: 100)
    // Auto-approve all operations in system temp directory
    this.registerRule(
      "temp-directory-operations",
      (input) => {
        if (input.type !== "read" && input.type !== "write") {
          return undefined;
        }

        const tmpDir = process.env['TMPDIR'] || process.env['TEMP'] || '/tmp';
        const filePath = (input as any).path || input.title || "";
        
        // Allow any read/write operation within the temp directory
        if (filePath.startsWith(tmpDir + '/') || filePath.startsWith(tmpDir + '\\')) {
          return "allow";
        }
        
        return undefined;
      },
      100
    );
  }
}
