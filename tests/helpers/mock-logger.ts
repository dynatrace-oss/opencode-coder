import type { Logger } from "../../src/core/logger";

export interface LogCall {
  level: "debug" | "info" | "warn" | "error";
  message: string;
  extra?: Record<string, unknown>;
}

export interface MockLogger extends Logger {
  calls: LogCall[];
  clear(): void;
  getCallsByLevel(level: LogCall["level"]): LogCall[];
  hasLogged(level: LogCall["level"], messagePattern?: string | RegExp): boolean;
}

/**
 * Create a mock logger for testing that captures all log calls
 */
export function createMockLogger(): MockLogger {
  const calls: LogCall[] = [];

  const log = (level: LogCall["level"], message: string, extra?: Record<string, unknown>) => {
    calls.push({ level, message, extra });
  };

  return {
    calls,
    debug: (message: string, extra?: Record<string, unknown>) => log("debug", message, extra),
    info: (message: string, extra?: Record<string, unknown>) => log("info", message, extra),
    warn: (message: string, extra?: Record<string, unknown>) => log("warn", message, extra),
    error: (message: string, extra?: Record<string, unknown>) => log("error", message, extra),
    clear() {
      calls.length = 0;
    },
    getCallsByLevel(level: LogCall["level"]) {
      return calls.filter((call) => call.level === level);
    },
    hasLogged(level: LogCall["level"], messagePattern?: string | RegExp) {
      return calls.some((call) => {
        if (call.level !== level) return false;
        if (messagePattern === undefined) return true;
        if (typeof messagePattern === "string") {
          return call.message.includes(messagePattern);
        }
        return messagePattern.test(call.message);
      });
    },
  };
}
