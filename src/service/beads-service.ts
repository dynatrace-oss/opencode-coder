import type { Config } from "@opencode-ai/sdk/v2";
import type { PluginInput } from "@opencode-ai/plugin";
import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import { BeadsContext, BeadsDetector } from "../beads";
import { execSync } from "child_process";

type OpencodeClient = PluginInput["client"];

/**
 * Options for BeadsService
 */
export interface BeadsServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for reporting status and errors */
  logger: Logger;
  /** OpenCode client for session operations */
  client: OpencodeClient;
  /** Override BeadsContext (for testing) */
  beadsContext?: BeadsContext;
  /** Override beads enabled state (for testing) */
  beadsEnabled?: boolean;
}

/**
 * Generic event type - processEvent handles filtering for relevant events
 */
export interface GenericEvent {
  type: string;
  properties: {
    [key: string]: unknown;
  };
}

/**
 * Service that handles all beads-related functionality.
 *
 * Features:
 * - Injects beads context on session creation (session.created event)
 * - Re-injects context after session compaction (session.compacted event)
 */
export class BeadsService {
  private readonly coderConfig: CoderConfig;
  private readonly logger: Logger;
  private readonly beadsEnabled: boolean;
  private readonly client: OpencodeClient;
  private readonly beadsContext: BeadsContext;

  constructor(options: BeadsServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.client = options.client;
    this.beadsContext = options.beadsContext ?? new BeadsContext({ logger: options.logger });

    // Detect beads enabled state (can be overridden for testing)
    if (options.beadsEnabled !== undefined) {
      this.beadsEnabled = options.beadsEnabled;
    } else {
      const detector = new BeadsDetector({ logger: options.logger });
      this.beadsEnabled = detector.isBeadsEnabled(options.coderConfig);
    }
  }

  /**
   * Check if beads integration is enabled
   */
  isBeadsEnabled(): boolean {
    return this.beadsEnabled;
  }

  /**
   * Process permission.ask hook for beads CLI commands
   */
  processPermissionAsk(input: { type: string; title?: string; [key: string]: unknown }, output: { status?: "allow" | "deny" | "ask" }): void {
    // Only handle beads CLI commands
    if (!this.beadsEnabled || this.coderConfig.beads?.auto_approve_beads === false) {
      return;
    }
    
    if (input.type === "bash" && input.title?.startsWith("bd ")) {
      output.status = "allow";
      this.logger.debug("Auto-approved beads CLI command", { command: input.title });
    }
  }

  /**
   * Process config hook - inject bd command permission when beads is enabled
   */
  async processConfig(config: Config): Promise<void> {
    const start = Date.now();
    try {
      if (!this.beadsEnabled) return;

      // Set default agent to beads-planner-agent when beads is active
      config.default_agent = "beads-planner-agent";

      // Configure beads-planner-agent permissions
      if (!config.agent) {
        config.agent = {};
      }
      if (!config.agent["beads-planner-agent"]) {
        config.agent["beads-planner-agent"] = {};
      }
      if (!config.agent["beads-planner-agent"].permission) {
        config.agent["beads-planner-agent"].permission = {};
      }

      // Enable question tool (for structured user questions during planning)
      // Note: question permission not in SDK types yet, but supported at runtime
      (config.agent["beads-planner-agent"].permission as any).question = "allow";

      // Enforce read-only mode for code (deny all edit operations)
      // Note: SDK types show edit as string, but it supports object syntax at runtime
      (config.agent["beads-planner-agent"].permission as any).edit = { "*": "deny" };

      // Debug: Log the permission configuration
      this.logger.info("Configured beads-planner-agent permissions", {
        question: (config.agent["beads-planner-agent"].permission as any).question,
        edit: (config.agent["beads-planner-agent"].permission as any).edit,
      });

      if (this.coderConfig.beads?.auto_approve_beads === false) return;

      if (!config.permission) {
        config.permission = {};
      }

      const currentBash = config.permission.bash;

      if (typeof currentBash === "object" && currentBash !== null) {
        // Already an object, add "bd *" if not present
        if (!("bd *" in currentBash)) {
          currentBash["bd *"] = "allow";
        }
      } else if (currentBash === undefined || currentBash === "ask") {
        // Convert to object with "bd *" allowed
        config.permission.bash = { "bd *": "allow" };
      }
      // If it's "allow" or "deny", leave it alone (user explicitly set it)
    } finally {
      this.logger.debug("processConfig completed", { durationMs: Date.now() - start });
    }
  }



  /**
   * Process event hook - inject beads context on session creation and after compaction
   */
  async processEvent(event: GenericEvent): Promise<void> {
    const start = Date.now();
    try {
      if (!this.beadsEnabled) return;

      if (event.type === "session.created") {
        // Extract session info from event.properties.info
        const sessionInfo = event.properties["info"] as any;
        if (!sessionInfo?.id) {
          this.logger.warn("session.created event missing session ID", { event });
          return;
        }
        
        const sessionID = sessionInfo.id;
        this.logger.info("Session created, injecting beads context", { sessionID });
        // Create playground folder for this session
        const playgroundPath = await this.playgroundService.getOrCreatePlayground(sessionID);
        if (playgroundPath) {
          this.logger.info("Playground ready", { sessionID, path: playgroundPath });
        }
        
        // Get session context and inject to preserve model/agent (prevents mode switching)
        const context = await this.getSessionContext(sessionID);
        await this.injectBeadsContext(sessionID, context);
      } else if (event.type === "session.compacted" && typeof event.properties["sessionID"] === "string") {
        const sessionID = event.properties["sessionID"];
        this.logger.info("Session compacted, re-injecting beads context", { sessionID });
        
        const context = await this.getSessionContext(sessionID);
        await this.injectBeadsContext(sessionID, context);
      }
    } finally {
      this.logger.debug("processEvent completed", { durationMs: Date.now() - start, eventType: event.type });
    }
  }

  /**

  /**
   * Inject beads context into a session via synthetic message.
   * Silently skips if bd prime fails or returns empty.
   */
  private async injectBeadsContext(
    sessionID: string,
    context?: { model?: { providerID: string; modelID: string }; agent?: string }
  ): Promise<void> {
    const start = Date.now();
    try {
      const contextInfo = await this.beadsContext.getContext();

      if (!contextInfo.available || !contextInfo.contextString) {
        this.logger.info("Beads context not available, skipping injection", { sessionID });
        return;
      }

      // Inject via noReply + synthetic to avoid triggering response
      // Pass model/agent to prevent mode switching
      const body: {
        noReply: boolean;
        model?: { providerID: string; modelID: string };
        agent?: string;
        parts: { type: "text"; text: string; synthetic: boolean }[];
      } = {
        noReply: true,
        parts: [{ type: "text", text: contextInfo.contextString, synthetic: true }],
      };

      if (context?.model) {
        body.model = context.model;
      }
      if (context?.agent) {
        body.agent = context.agent;
      }

      await this.client.session.prompt({
        path: { id: sessionID },
        body,
      });

      this.logger.info("Beads context injected successfully", { 
        sessionID,
        contentLength: contextInfo.contextString.length 
      });
      this.logger.debug("Beads context content", { 
        sessionID,
        content: contextInfo.contextString 
      });
    } catch (error) {
      this.logger.error("Failed to inject beads context", { sessionID, error: String(error) });
    } finally {
      this.logger.debug("injectBeadsContext completed", { durationMs: Date.now() - start, sessionID });
    }
  }

  /**
   * Get session context (model/agent) for re-injection after compaction.
   */
  private async getSessionContext(
    sessionID: string
  ): Promise<{ model?: { providerID: string; modelID: string }; agent?: string } | undefined> {
    try {
      const response = await this.client.session.messages({
        path: { id: sessionID },
        query: { limit: 50 },
      });

      if (response.data) {
        for (const msg of response.data) {
          if (msg.info.role === "user" && "model" in msg.info && msg.info.model) {
            return { model: msg.info.model, agent: (msg.info as any).agent };
          }
        }
      }
    } catch {
      // On error, return undefined
    }
    return undefined;
  }

  /**

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
      execSync("command -v bd", { stdio: "ignore" });
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
