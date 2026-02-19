import { tool } from "@opencode-ai/plugin";
import type { ToolContext, ToolDefinition } from "@opencode-ai/plugin/tool";
import { isAbsolute, join } from "node:path";
import type { SessionExportService } from "../service/session-export-service";
import type { VersionInfo } from "../core/version";

/**
 * Options for creating the coder tool.
 */
export interface CoderToolOptions {
  sessionExportService: SessionExportService;
  versionInfo: VersionInfo;
}

/**
 * Create the `coder` custom tool that AI agents can call.
 *
 * This is a single tool with a string parameter that dispatches to
 * sub-commands: session, version, session-export, tokens.
 */
export function createCoderTool(options: CoderToolOptions): ToolDefinition {
  const { sessionExportService, versionInfo } = options;

  return tool({
    description: `Coder plugin utility tool. Accepts a command string.
Available commands:
- "session" — returns current session metadata (ID, title, timestamps, summary)
- "version" — returns the coder plugin name and version
- "session-export <path> [session-id]" — exports full session data (messages, tool calls, tokens, diffs) to the specified folder path. Creates the folder if it doesn't exist. If session-id omitted, exports current session.
- "tokens" — returns token usage summary (input, output, reasoning, cache, cost) for the current session
- "list-sessions" — lists all OpenCode sessions (id, title, timestamps)`,
    args: {
      command: tool.schema
        .string()
        .describe(
          'The command to execute. One of: "session", "version", "session-export <path> [session-id]", "tokens", "list-sessions"',
        ),
    },
    async execute(args, context: ToolContext) {
      const { command } = args;
      const { sessionID } = context;

      // Parse the command string
      const parts = command.trim().split(/\s+/);
      const subCommand = parts[0]?.toLowerCase();

      switch (subCommand) {
        case "session":
          return await sessionExportService.formatSessionInfo(sessionID);

        case "version":
          return `${versionInfo.name} v${versionInfo.version}`;

        case "session-export": {
          const exportPath = parts[1];
          const targetSessionID = parts[2] || sessionID;
          if (!exportPath) {
            return "Error: session-export requires a path argument. Usage: session-export <path> [session-id]";
          }
          const resolvedPath = isAbsolute(exportPath)
            ? exportPath
            : join(context.directory, exportPath);

          const result = await sessionExportService.exportSession(targetSessionID, resolvedPath);
          return `Session exported successfully.\nPath: ${result.outputPath}\nMessages: ${result.messageCount}\nTotal tokens: ${result.totalTokens}\nTotal cost: $${result.totalCost.toFixed(4)}`;
        }

        case "tokens":
          return await sessionExportService.formatTokenSummary(sessionID);

        case "list-sessions":
          return await sessionExportService.formatSessionList();

        default:
          return `Unknown command: "${subCommand}". Available commands: session, version, session-export <path> [session-id], tokens, list-sessions`;
      }
    },
  });
}
