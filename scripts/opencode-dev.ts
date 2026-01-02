#!/usr/bin/env bun
/**
 * Development script to run OpenCode with the local plugin version.
 *
 * This script temporarily removes @hk9890/opencode-coder from the global config
 * to avoid loading both the npm version and the local development version.
 *
 * Usage:
 *   bun scripts/opencode-dev.ts              # Use installed opencode
 *   bun scripts/opencode-dev.ts --local      # Use local opencode build
 *   bun scripts/opencode-dev.ts run "hello"  # Pass args to opencode
 */

import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

const PLUGIN_NAME = "@hk9890/opencode-coder";
const GLOBAL_CONFIG_PATH = path.join(
  os.homedir(),
  ".config/opencode/opencode.json"
);
const LOCAL_OPENCODE_PATH =
  "/home/hans/dev/github/opencode/packages/opencode/dist/opencode-linux-x64/bin/opencode";

interface OpenCodeConfig {
  plugin?: string[];
  [key: string]: unknown;
}

let originalConfig: OpenCodeConfig | null = null;

async function readConfig(): Promise<OpenCodeConfig | null> {
  try {
    const content = await fs.readFile(GLOBAL_CONFIG_PATH, "utf-8");
    return JSON.parse(content);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }
    throw err;
  }
}

async function writeConfig(config: OpenCodeConfig): Promise<void> {
  await fs.writeFile(GLOBAL_CONFIG_PATH, JSON.stringify(config, null, 2));
}

async function restoreConfig(): Promise<void> {
  if (originalConfig) {
    console.log("\nRestoring global config...");
    await writeConfig(originalConfig);
    originalConfig = null;
  }
}

async function main() {
  // Parse arguments
  const args = process.argv.slice(2);
  const useLocal = args.includes("--local");
  const opencodeArgs = args.filter((arg) => arg !== "--local");

  // Determine which opencode binary to use
  const opencodeBinary = useLocal ? LOCAL_OPENCODE_PATH : "opencode";

  // Verify local binary exists if requested
  if (useLocal) {
    try {
      await fs.access(LOCAL_OPENCODE_PATH, fs.constants.X_OK);
    } catch {
      console.error(`Error: Local opencode binary not found or not executable`);
      console.error(`Expected at: ${LOCAL_OPENCODE_PATH}`);
      process.exit(1);
    }
    console.log(`Using local opencode build: ${LOCAL_OPENCODE_PATH}`);
  }

  // Read original config
  originalConfig = await readConfig();

  let exitCode = 0;

  if (!originalConfig) {
    console.log("No global config found, running opencode directly...");
    exitCode = await runOpenCode(opencodeBinary, opencodeArgs);
    process.exit(exitCode);
  }

  // Check if our plugin is in the config
  const hasPlugin = originalConfig.plugin?.includes(PLUGIN_NAME);

  if (!hasPlugin) {
    console.log(
      `Plugin ${PLUGIN_NAME} not in global config, running opencode directly...`
    );
    exitCode = await runOpenCode(opencodeBinary, opencodeArgs);
    process.exit(exitCode);
  }

  // Create modified config without our plugin
  const modifiedConfig: OpenCodeConfig = {
    ...originalConfig,
    plugin: originalConfig.plugin?.filter((p) => p !== PLUGIN_NAME) ?? [],
  };

  console.log(`Temporarily removing ${PLUGIN_NAME} from global config...`);

  try {
    // Write modified config
    await writeConfig(modifiedConfig);

    // Run opencode
    exitCode = await runOpenCode(opencodeBinary, opencodeArgs);
  } finally {
    // Restore original config
    await restoreConfig();
  }

  process.exit(exitCode);
}

async function runOpenCode(binary: string, args: string[]): Promise<number> {
  const defaultArgs = ["--print-logs", "--log-level", "DEBUG"];
  const finalArgs = args.length > 0 ? args : defaultArgs;

  console.log(`Running: ${binary} ${finalArgs.join(" ")}\n`);

  // Use spawn to properly handle signals and interactive mode
  const proc = Bun.spawn([binary, ...finalArgs], {
    stdio: ["inherit", "inherit", "inherit"],
    env: {
      ...process.env,
      OPENCODE_DISABLE_DEFAULT_PLUGINS: "true",
    },
  });

  // Wait for process to complete and return exit code
  await proc.exited;
  return proc.exitCode ?? 0;
}

// Handle signals to ensure config is restored
process.on("SIGINT", async () => {
  await restoreConfig();
  process.exit(130);
});

process.on("SIGTERM", async () => {
  await restoreConfig();
  process.exit(143);
});

// Handle uncaught errors
process.on("uncaughtException", async (err) => {
  console.error("Uncaught exception:", err);
  await restoreConfig();
  process.exit(1);
});

main().catch(async (err) => {
  console.error("Error:", err);
  await restoreConfig();
  process.exit(1);
});
