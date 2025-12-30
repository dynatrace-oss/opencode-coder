import { type Plugin, type PluginInput, tool } from "@opencode-ai/plugin";
import { stringify } from "yaml";
import { createLogger, getVersionInfo } from "./core";
import { loadConfig } from "./config";
import { KnowledgeBaseService } from "./service";
import { BeadsDetector, BeadsContext } from "./beads";

type OpencodeClient = PluginInput["client"];

/**
 * Inject beads context into a session via synthetic message.
 * Silently skips if bd prime fails or returns empty.
 */
async function injectBeadsContext(
  client: OpencodeClient,
  log: ReturnType<typeof createLogger>,
  sessionID: string,
  context?: { model?: { providerID: string; modelID: string }; agent?: string }
): Promise<void> {
  try {
    const beadsContext = new BeadsContext({ logger: log });
    const contextInfo = await beadsContext.getContext();

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

    await client.session.prompt({
      path: { id: sessionID },
      body,
    });

    log.debug("Injected beads context into session", { sessionID });
  } catch (error) {
    log.debug("Failed to inject beads context", { error: String(error) });
  }
}

/**
 * Get session context (model/agent) for re-injection after compaction.
 */
async function getSessionContext(
  client: OpencodeClient,
  sessionID: string
): Promise<{ model?: { providerID: string; modelID: string }; agent?: string } | undefined> {
  try {
    const response = await client.session.messages({
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

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  const coderConfig = await loadConfig(log);
  
  // Initialize beads detector
  const beadsDetector = new BeadsDetector({ logger: log });
  const beadsEnabled = await beadsDetector.isBeadsEnabled(coderConfig);
  
  const kbService = new KnowledgeBaseService({ 
    coderConfig, 
    logger: log,
    beadsEnabled,
  });

  // Track sessions where we've already injected beads context
  const injectedSessions = new Set<string>();

  return {
    async config(config) {
      // Inject bd command permission when beads is enabled and auto-approve is not disabled
      if (beadsEnabled && coderConfig.beads?.auto_approve_beads !== false) {
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

      await kbService.apply(config);
    },

    // Inject beads context on first message in a session
    async "chat.message"(_input, output) {
      if (!beadsEnabled) return;

      const sessionID = output.message.sessionID;

      // Skip if already injected this session
      if (injectedSessions.has(sessionID)) return;

      // Check if beads-context was already injected (handles plugin reload)
      try {
        const existing = await client.session.messages({
          path: { id: sessionID },
        });

        if (existing.data) {
          const hasBeadsContext = existing.data.some(msg => {
            const parts = (msg as any).parts || (msg.info as any).parts;
            if (!parts) return false;
            return parts.some((part: any) =>
              part.type === "text" && part.text?.includes("<beads-context>")
            );
          });

          if (hasBeadsContext) {
            injectedSessions.add(sessionID);
            return;
          }
        }
      } catch {
        // On error, proceed with injection
      }

      injectedSessions.add(sessionID);

      // Inject with current model/agent to prevent mode switching
      await injectBeadsContext(client, log, sessionID, {
        model: output.message.model,
        agent: output.message.agent,
      });
    },

    // Re-inject beads context after session compaction
    async event({ event }) {
      if (!beadsEnabled) return;

      if (event.type === "session.compacted") {
        const sessionID = event.properties.sessionID;
        const context = await getSessionContext(client, sessionID);
        await injectBeadsContext(client, log, sessionID, context);
        log.debug("Re-injected beads context after compaction", { sessionID });
      }
    },

    // Auto-approve bd CLI commands when beads is enabled
    async "permission.ask"(input, output) {
      // Skip if beads is not enabled
      if (!beadsEnabled) return;

      // Skip if user has opted out of auto-approval
      if (coderConfig.beads?.auto_approve_beads === false) return;

      // Auto-approve bd commands (beads CLI)
      if (input.type === "bash" && input.title?.startsWith("bd ")) {
        output.status = "allow";
      }
    },

    tool: {
      coder_status: tool({
        description: "Get the current status of the opencode-coder plugin including version, loaded commands, and agents",
        args: {},
        async execute() {
          const versionInfo = await getVersionInfo();
          const commands = kbService.getCommands();
          const agents = kbService.getAgents();
          
          const status = {
            plugin: `${versionInfo.name} v${versionInfo.version}`,
            active: kbService.isActive(),
            beads_enabled: kbService.isBeadsEnabled(),
            commands: {
              count: commands.length,
              list: commands.map(cmd => ({
                name: `/${cmd.name}`,
                description: cmd.description ?? "(no description)",
              })),
            },
            agents: {
              count: agents.length,
              list: agents.map(agent => ({
                name: `@${agent.name}`,
                description: agent.description ?? "(no description)",
              })),
            },
          };
          
          return stringify(status);
        },
      }),
      coder_info: tool({
        description: "Get detailed information about the opencode-coder plugin including package info, configuration, and features",
        args: {},
        async execute() {
          const versionInfo = await getVersionInfo();
          const commands = kbService.getCommands();
          const agents = kbService.getAgents();
          
          // Group commands by category
          const storyCommands = commands.filter(c => c.name.startsWith("story/"));
          const bugCommands = commands.filter(c => c.name.startsWith("bug/"));
          const bdCommands = commands.filter(c => c.name.startsWith("bd/"));
          const coderCommands = commands.filter(c => c.name.startsWith("coder/"));
          const otherCommands = commands.filter(c => 
            !c.name.startsWith("story/") && 
            !c.name.startsWith("bug/") && 
            !c.name.startsWith("bd/") &&
            !c.name.startsWith("coder/")
          );
          
          const info = {
            package: {
              name: versionInfo.name,
              version: versionInfo.version,
              description: versionInfo.description,
            },
            configuration: {
              active: kbService.isActive(),
              beads_enabled: kbService.isBeadsEnabled(),
            },
            knowledge_base: {
              total_commands: commands.length,
              total_agents: agents.length,
            },
            features: {
              story_commands: {
                count: storyCommands.length,
                commands: storyCommands.map(c => `/${c.name}`),
              },
              bug_commands: {
                count: bugCommands.length,
                commands: bugCommands.map(c => `/${c.name}`),
              },
              beads_commands: {
                count: bdCommands.length,
                commands: bdCommands.map(c => `/${c.name}`),
                note: kbService.isBeadsEnabled() ? "beads initialized" : "run /bd/init to set up beads",
              },
              coder_commands: {
                count: coderCommands.length,
                commands: coderCommands.map(c => `/${c.name}`),
              },
              other_commands: {
                count: otherCommands.length,
                commands: otherCommands.map(c => `/${c.name}`),
              },
              agents: agents.map(a => ({
                name: `@${a.name}`,
                description: a.description,
                mode: a.mode ?? "all",
              })),
            },
            documentation: {
              readme: "docs/kb/README.md",
              story_guide: "docs/kb/story.md",
              bug_guide: "docs/kb/bug.md",
            },
          };
          
          return stringify(info);
        },
      }),
    },
  };
};
