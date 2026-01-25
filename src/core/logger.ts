import type { PluginInput } from "@opencode-ai/plugin";

export const SERVICE_NAME = "opencode-coder";

export type Logger = ReturnType<typeof createLogger>;

export function createLogger(client: PluginInput["client"]) {
  // Check if debug logging is enabled via environment variable
  const isDebugEnabled = !!process.env.OPENCODE_CODER_DEBUG;

  const log = (level: "debug" | "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) => {
    // For debug messages, only log if OPENCODE_CODER_DEBUG is truthy
    if (level === "debug" && !isDebugEnabled) {
      return;
    }

    // Always use "info" level for OpenCode logging
    // (even for our internal debug messages when they are enabled)
    const body: { service: string; level: "info" | "warn" | "error"; message: string; extra?: { [key: string]: unknown } } = {
      service: SERVICE_NAME,
      level: level === "debug" ? "info" : level,
      message,
    };
    if (extra) {
      body.extra = extra;
    }
    client.app.log({ body });
  };

  return {
    debug: (message: string, extra?: Record<string, unknown>) => log("debug", message, extra),
    info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
    error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra),
  };
}
