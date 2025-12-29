import { type Plugin, tool } from "@opencode-ai/plugin";
import { stringify } from "yaml";
import { createLogger, loadConfig, getVersionInfo } from "./core";
import { KnowledgeBaseService } from "./kb";
import { BeadsDetector, BeadsContext } from "./beads";

export const OpencodeCoder: Plugin = async ({ client }) => {
  const log = createLogger(client);

  log.info("OpencodeCoder plugin loading...");

  const coderConfig = await loadConfig(log);
  
  // Initialize beads detector and context
  const beadsDetector = new BeadsDetector({ logger: log });
  const beadsEnabled = await beadsDetector.isBeadsEnabled(coderConfig);
  
  const kbService = new KnowledgeBaseService({ 
    coderConfig, 
    logger: log,
    beadsEnabled,
  });

  return {
    async config(config) {
      await kbService.apply(config);
    },
    async "experimental.chat.system.transform"(_input, output) {
      // Inject beads context into system prompt if enabled
      if (beadsEnabled) {
        const beadsContext = new BeadsContext({ logger: log });
        const contextInfo = await beadsContext.getContext();
        
        if (contextInfo.available && contextInfo.contextString) {
          output.system.push(contextInfo.contextString);
          log.debug("Injected beads context into system prompt");
        }
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
