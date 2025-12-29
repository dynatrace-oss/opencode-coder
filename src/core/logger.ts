import type { PluginInput } from "@opencode-ai/plugin";

export const SERVICE_NAME = "opencode-coder";

export type Logger = ReturnType<typeof createLogger>;

export function createLogger(client: PluginInput["client"]) {
  const log = (level: "debug" | "info" | "warn" | "error", message: string, extra?: Record<string, unknown>) => {
    const body: { service: string; level: "debug" | "info" | "warn" | "error"; message: string; extra?: { [key: string]: unknown } } = {
      service: SERVICE_NAME,
      level,
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
