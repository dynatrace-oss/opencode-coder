import type { Config } from "@opencode-ai/sdk";
import type { PluginInput } from "@opencode-ai/plugin";
import type { CoderConfig } from "../config/schema";
import type { Logger } from "../core/logger";
import type { BeadsDefinition } from "../template/types";
import { BeadsContext } from "../beads";

type OpencodeClient = PluginInput["client"];

/**
 * Options for BeadsService
 */
export interface BeadsServiceOptions {
  /** The coder configuration */
  coderConfig: CoderConfig;
  /** Logger for reporting status and errors */
  logger: Logger;
  /** Whether beads integration is enabled */
  beadsEnabled: boolean;
  /** OpenCode client for session operations */
  client: OpencodeClient;
  /** Override BeadsContext (for testing) */
  beadsContext?: BeadsContext;
}

/**
 * Input type for chat.message hook
 */
export interface ChatMessageInput {
  // Input fields if needed
}

/**
 * Output type for chat.message hook
 */
export interface ChatMessageOutput {
  message: {
    sessionID: string;
    model?: { providerID: string; modelID: string };
    agent?: string;
  };
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
 * Input type for permission.ask hook
 */
export interface PermissionAskInput {
  type: string;
  title?: string;
}

/**
 * Output type for permission.ask hook
 */
export interface PermissionAskOutput {
  status?: "allow" | "deny" | "ask";
}

/**
 * Service that handles all beads-related functionality.
 *
 * Features:
 * - Injects beads context into sessions on first message
 * - Re-injects context after session compaction
 * - Auto-approves bd CLI commands
 * - Manages bash permission for bd commands
 */
export class BeadsService {
  private readonly coderConfig: CoderConfig;
  private readonly logger: Logger;
  private readonly beadsEnabled: boolean;
  private readonly client: OpencodeClient;
  private readonly beadsContext: BeadsContext;
  private readonly injectedSessions: Set<string> = new Set();

  constructor(options: BeadsServiceOptions) {
    this.coderConfig = options.coderConfig;
    this.logger = options.logger;
    this.beadsEnabled = options.beadsEnabled;
    this.client = options.client;
    this.beadsContext = options.beadsContext ?? new BeadsContext({ logger: options.logger });
  }

  /**
   * Check if beads integration is enabled
   */
  isBeadsEnabled(): boolean {
    return this.beadsEnabled;
  }

  /**
   * Process config hook - inject bd command permission when beads is enabled
   */
  async processConfig(config: Config): Promise<void> {
    if (!this.beadsEnabled) return;
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
  }

  /**
   * Process chat.message hook - inject beads context on first message in a session
   */
  async processChatMessage(_input: ChatMessageInput, output: ChatMessageOutput): Promise<void> {
    if (!this.beadsEnabled) return;

    const sessionID = output.message.sessionID;

    // Skip if already injected this session
    if (this.injectedSessions.has(sessionID)) return;

    // Check if beads-context was already injected (handles plugin reload)
    try {
      const existing = await this.client.session.messages({
        path: { id: sessionID },
      });

      if (existing.data) {
        const hasBeadsContext = existing.data.some((msg) => {
          const parts = (msg as any).parts || (msg.info as any).parts;
          if (!parts) return false;
          return parts.some(
            (part: any) => part.type === "text" && part.text?.includes("<beads-context>")
          );
        });

        if (hasBeadsContext) {
          this.injectedSessions.add(sessionID);
          return;
        }
      }
    } catch {
      // On error, proceed with injection
    }

    this.injectedSessions.add(sessionID);

    // Inject with current model/agent to prevent mode switching
    const context: { model?: { providerID: string; modelID: string }; agent?: string } = {};
    if (output.message.model) {
      context.model = output.message.model;
    }
    if (output.message.agent) {
      context.agent = output.message.agent;
    }
    await this.injectBeadsContext(sessionID, context);
  }

  /**
   * Process event hook - re-inject beads context after session compaction
   */
  async processEvent(event: GenericEvent): Promise<void> {
    if (!this.beadsEnabled) return;

    if (event.type === "session.compacted" && typeof event.properties["sessionID"] === "string") {
      const sessionID = event.properties["sessionID"];
      const context = await this.getSessionContext(sessionID);
      await this.injectBeadsContext(sessionID, context);
      this.logger.debug("Re-injected beads context after compaction", { sessionID });
    }
  }

  /**
   * Process permission.ask hook - auto-approve bd CLI commands
   */
  processPermissionAsk(input: PermissionAskInput, output: PermissionAskOutput): void {
    if (!this.beadsEnabled) return;
    if (this.coderConfig.beads?.auto_approve_beads === false) return;

    // Auto-approve bd commands (beads CLI)
    if (input.type === "bash" && input.title?.startsWith("bd ")) {
      output.status = "allow";
    }
  }

  /**
   * Inject beads context into a session via synthetic message.
   * Silently skips if bd prime fails or returns empty.
   */
  private async injectBeadsContext(
    sessionID: string,
    context?: { model?: { providerID: string; modelID: string }; agent?: string }
  ): Promise<void> {
    try {
      const contextInfo = await this.beadsContext.getContext();

      if (!contextInfo.available || !contextInfo.contextString) {
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

      this.logger.debug("Injected beads context into session", { sessionID });
    } catch (error) {
      this.logger.debug("Failed to inject beads context", { error: String(error) });
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
   * Create a definition object for template service registration.
   */
  createDefinition(): BeadsDefinition {
    return {
      enabled: () => this.beadsEnabled,
    };
  }
}
