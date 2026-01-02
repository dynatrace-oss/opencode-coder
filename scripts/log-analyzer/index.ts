#!/usr/bin/env bun
/**
 * OpenCode Log Analyzer CLI
 * 
 * Usage:
 *   bun run scripts/log-analyzer            # Interactive mode (requires fzf)
 *   bun run scripts/log-analyzer list processes
 *   bun run scripts/log-analyzer list sessions
 *   bun run scripts/log-analyzer --pid=12345
 *   bun run scripts/log-analyzer --session=ses_xxx
 *   bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder
 *   bun run scripts/log-analyzer --session=ses_xxx --level=WARN,ERROR
 *   bun run scripts/log-analyzer --session=ses_xxx --tail=100
 *   bun run scripts/log-analyzer --session=ses_xxx --json
 *   bun run scripts/log-analyzer --session=ses_xxx --no-color
 */

import { spawn } from "child_process";
import type { CliArgs, FilterOptions, FormatOptions, LogLevel } from "./types";
import { findLogDirectory, discoverProcesses, discoverSessions, listLogFiles } from "./discovery";
import { filterLogs } from "./filters";
import {
  formatLines,
  formatProcessList,
  formatSessionList,
  formatSummary,
  formatProcessForFzf,
  formatSessionForFzf,
} from "./formatter";

const HELP = `
OpenCode Log Analyzer

USAGE:
  bun run scripts/log-analyzer [command] [options]

COMMANDS:
  (none)              Interactive mode - select process/session with fzf
  list processes      List all processes found in logs
  list sessions       List all sessions found in logs

FILTER OPTIONS:
  --pid=<pid>         Filter by process ID
  --session=<id>      Filter by session ID
  --service=<name>    Filter by service name (can be comma-separated)
  --level=<levels>    Filter by log level (INFO,WARN,ERROR,DEBUG)
  --tail=<n>          Only show last N lines

OUTPUT OPTIONS:
  --json              Output as JSON
  --no-color          Disable colored output
  --raw               Output raw log lines without formatting
  --full-timestamp    Show full timestamps instead of time only

EXAMPLES:
  # Interactive mode
  bun run scripts/log-analyzer

  # List all sessions
  bun run scripts/log-analyzer list sessions

  # Filter by session
  bun run scripts/log-analyzer --session=ses_48058fe91ffeRYQhrEE0q0u8rm

  # Filter by session and service
  bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder

  # Show only errors and warnings
  bun run scripts/log-analyzer --pid=12345 --level=WARN,ERROR

  # Last 50 lines as JSON
  bun run scripts/log-analyzer --session=ses_xxx --tail=50 --json
`;

/**
 * Check if fzf is available.
 */
async function hasFzf(): Promise<boolean> {
  return new Promise((resolve) => {
    const proc = spawn("fzf", ["--version"]);
    proc.on("error", () => resolve(false));
    proc.on("close", (code) => resolve(code === 0));
  });
}

/**
 * Run fzf with given choices and return selected line.
 */
async function runFzf(choices: string[], prompt: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const proc = spawn("fzf", ["--prompt", prompt, "--height", "40%", "--reverse"], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    let selected = "";

    proc.stdout.on("data", (data) => {
      selected += data.toString();
    });

    proc.stdin.write(choices.join("\n"));
    proc.stdin.end();

    proc.on("close", (code) => {
      if (code === 0 && selected.trim()) {
        resolve(selected.trim());
      } else {
        resolve(null);
      }
    });

    proc.on("error", (err) => {
      reject(new Error(`Failed to run fzf: ${err.message}`));
    });
  });
}

/**
 * Parse command line arguments.
 */
function parseArgs(args: string[]): CliArgs {
  const result: CliArgs = {
    filter: {},
    format: {},
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "help" || arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "list") {
      result.command = "list";
      if (args[i + 1] === "processes" || args[i + 1] === "sessions") {
        result.listType = args[i + 1] as "processes" | "sessions";
        i++;
      }
    } else if (arg.startsWith("--pid=")) {
      result.filter.pid = parseInt(arg.slice(6), 10);
    } else if (arg.startsWith("--session=")) {
      result.filter.sessionID = arg.slice(10);
    } else if (arg.startsWith("--service=")) {
      const services = arg.slice(10).split(",");
      result.filter.service = services.length === 1 ? services[0] : services;
    } else if (arg.startsWith("--level=")) {
      result.filter.level = arg.slice(8).split(",") as LogLevel[];
    } else if (arg.startsWith("--tail=")) {
      result.filter.tail = parseInt(arg.slice(7), 10);
    } else if (arg === "--json") {
      result.format.json = true;
    } else if (arg === "--no-color") {
      result.format.noColor = true;
    } else if (arg === "--raw") {
      result.format.raw = true;
    } else if (arg === "--full-timestamp") {
      result.format.fullTimestamp = true;
    }

    i++;
  }

  // If no command and no filters, assume interactive mode
  if (!result.command && !result.filter.pid && !result.filter.sessionID) {
    result.interactive = true;
  }

  return result;
}

/**
 * Interactive mode: let user select process or session with fzf.
 */
async function interactiveMode(logDir: string, format: FormatOptions): Promise<void> {
  // Check fzf availability
  if (!(await hasFzf())) {
    console.error("Error: fzf is required for interactive mode but was not found.");
    console.error("Install fzf: https://github.com/junegunn/fzf#installation");
    console.error("");
    console.error("Alternatively, use CLI arguments:");
    console.error("  bun run scripts/log-analyzer list sessions");
    console.error("  bun run scripts/log-analyzer --session=<sessionID>");
    process.exit(1);
  }

  const processes = await discoverProcesses(logDir);
  const sessions = await discoverSessions(logDir);

  // Build choices for fzf
  const choices: string[] = [];

  // Add process choices
  choices.push("--- PROCESSES ---");
  for (let i = 0; i < processes.length; i++) {
    choices.push(`P:${formatProcessForFzf(processes[i], i)}`);
  }

  choices.push("");
  choices.push("--- SESSIONS ---");
  for (let i = 0; i < sessions.length; i++) {
    choices.push(`S:${formatSessionForFzf(sessions[i], i)}`);
  }

  const selected = await runFzf(choices, "Select process or session > ");

  if (!selected) {
    console.log("No selection made.");
    return;
  }

  // Parse selection
  if (selected.startsWith("P:pid=")) {
    // Process selected
    const pidMatch = selected.match(/pid=(\d+)/);
    if (pidMatch) {
      const pid = parseInt(pidMatch[1], 10);
      const logs = await filterLogs(logDir, { pid });
      console.log(formatLines(logs, format));
    }
  } else if (selected.startsWith("S:ses_")) {
    // Session selected
    const sessionID = selected.slice(2).split(" |")[0];
    const logs = await filterLogs(logDir, { sessionID });
    console.log(formatLines(logs, format));
  }
}

/**
 * Main entry point.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    console.log(HELP);
    return;
  }

  try {
    const logDir = await findLogDirectory();

    if (args.command === "list") {
      if (args.listType === "processes") {
        const processes = await discoverProcesses(logDir);
        console.log(formatProcessList(processes, args.format));
      } else if (args.listType === "sessions") {
        const sessions = await discoverSessions(logDir);
        console.log(formatSessionList(sessions, args.format));
      } else {
        console.error("Usage: list <processes|sessions>");
        process.exit(1);
      }
      return;
    }

    if (args.interactive) {
      await interactiveMode(logDir, args.format);
      return;
    }

    // Filter mode
    if (!args.filter.pid && !args.filter.sessionID && !args.filter.service) {
      console.error("Error: Please specify at least one filter (--pid, --session, or --service)");
      console.error("Or run without arguments for interactive mode.");
      process.exit(1);
    }

    const logs = await filterLogs(logDir, args.filter);

    if (logs.length === 0) {
      console.log("No matching log entries found.");
      return;
    }

    console.log(formatLines(logs, args.format));
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
