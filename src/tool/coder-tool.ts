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
    description:
      "Tool to access coding agent internals like version, session data, used tokens. Call without parameter to get more info. Tool also allows session export.",
    args: {
      command: tool.schema
        .string()
        .optional()
        .describe("Command to execute. Call with no argument for help."),
    },
    async execute(args, context: ToolContext) {
      const { command } = args;
      const { sessionID } = context;

      // Parse the command string
      const parts = (command || "").trim().split(/\s+/);
      const subCommand = parts[0]?.toLowerCase();

      if (!subCommand) {
        return `Coder Plugin Tool - Session & Plugin Utilities

Available commands:
  session              Current session metadata (ID, title, timestamps)
  version              Plugin name and version
  plugin               Plugin status (enabled, debug mode)
  tokens               Token usage summary (input, output, cache, cost)
  list-sessions        List all OpenCode sessions
  beads                Beads status (initialized, mode, hooks)
  logs                 Log directory info (path, file count, latest)
  session-export <path> [session-id]
                       Export session data to folder

Examples:
  coder("version")
  coder("tokens")
  coder("session-export ./exports")`;
      }

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

        case "plugin": {
          const disabled = process.env["OPENCODE_CODER_DISABLED"] === "true";
          const debugEnabled = process.env["OPENCODE_CODER_DEBUG"] === "1";

          return `Plugin: ${versionInfo.name}
Version: ${versionInfo.version}
Status: ${disabled ? "DISABLED" : "ACTIVE"}
Debug: ${debugEnabled ? "enabled" : "disabled"}`;
        }

        case "beads": {
          const fs = await import("node:fs");
          const path = await import("node:path");

          const beadsDir = path.join(context.directory, ".beads");
          const configPath = path.join(beadsDir, "config.json");
          const preCommitPath = path.join(context.directory, ".git", "hooks", "pre-commit");

          const initialized = fs.existsSync(beadsDir);

          let mode = "unknown";
          if (initialized && fs.existsSync(configPath)) {
            try {
              const configContent = fs.readFileSync(configPath, "utf-8");
              const config = JSON.parse(configContent);
              mode = config.mode || "unknown";
            } catch {
              mode = "error reading config";
            }
          }

          let hooksInstalled = false;
          if (fs.existsSync(preCommitPath)) {
            try {
              const hookContent = fs.readFileSync(preCommitPath, "utf-8");
              hooksInstalled = hookContent.includes("bd sync");
            } catch {
              hooksInstalled = false;
            }
          }

          return `Beads Status:
Initialized: ${initialized ? "yes" : "no"}
Mode: ${initialized ? mode : "n/a"}
Git hooks installed: ${hooksInstalled ? "yes" : "no"}
Directory: ${beadsDir}`;
        }

        case "logs": {
          const os = await import("node:os");
          const fs = await import("node:fs");
          const path = await import("node:path");

          // Determine log path based on OS
          let logDir: string;
          const platform = os.platform();
          const homeDir = os.homedir();

          if (platform === "darwin") {
            logDir = path.join(homeDir, "Library", "Logs", "opencode");
          } else if (platform === "win32") {
            logDir = path.join(
              process.env["APPDATA"] || path.join(homeDir, "AppData", "Roaming"),
              "opencode",
              "logs",
            );
          } else {
            logDir = path.join(homeDir, ".config", "opencode", "logs");
          }

          const exists = fs.existsSync(logDir);
          let fileCount = 0;
          let latestFile = "none";

          if (exists) {
            const files = fs.readdirSync(logDir).filter((f) => f.endsWith(".log"));
            fileCount = files.length;
            if (files.length > 0) {
              // Sort by mtime descending
              const sorted = files
                .map((f) => ({ name: f, mtime: fs.statSync(path.join(logDir, f)).mtime }))
                .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
              latestFile = sorted[0]?.name || "none";
            }
          }

          return `OpenCode Logs
Directory: ${logDir}
Exists: ${exists ? "yes" : "no"}
Log files: ${fileCount}
Latest: ${latestFile}`;
        }

        default:
          return `Unknown command: "${subCommand}". Available commands: session, version, session-export <path> [session-id], tokens, list-sessions, plugin, beads, logs`;
      }
    },
  });
}
