import type { PluginInput } from "@opencode-ai/plugin";
import type { Project as SDKProject, Config } from "@opencode-ai/sdk";

export interface LogEntry {
  service: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  extra?: Record<string, unknown>;
}

export interface MockClient {
  app: {
    log(options: { body: LogEntry }): void;
    logs: LogEntry[];
  };
  tui: {
    showToast(options: {
      title: string;
      message: string;
      variant?: "info" | "success" | "warning" | "error";
      duration?: number;
    }): Promise<void>;
    toasts: Array<{
      title: string;
      message: string;
      variant?: "info" | "success" | "warning" | "error";
      duration?: number;
    }>;
  };
}

export interface MockPluginInput {
  client: MockClient;
  project: SDKProject;
  directory: string;
  worktree: string;
  config?: Config;
}

/**
 * Create a mock OpenCode client for integration testing
 */
export function createMockClient(): MockClient {
  const logs: LogEntry[] = [];
  const toasts: MockClient["tui"]["toasts"] = [];

  return {
    app: {
      log(options: { body: LogEntry }) {
        logs.push(options.body);
      },
      logs,
    },
    tui: {
      async showToast(options) {
        toasts.push(options);
      },
      toasts,
    },
  };
}

/**
 * Create a mock plugin input for testing the plugin initialization
 */
export function createMockPluginInput(overrides?: Partial<MockPluginInput>): MockPluginInput {
  const client = createMockClient();

  return {
    client,
    project: {
      id: "test-project-id",
      worktree: "/test/project",
      time: {
        created: Date.now(),
      },
    },
    directory: "/test/project",
    worktree: "/test/project",
    ...overrides,
  };
}

/**
 * Type assertion helper to use mock client with real plugin
 * This allows the mock to be used where PluginInput["client"] is expected
 */
export function asMockPluginInput(input: MockPluginInput): PluginInput {
  return input as unknown as PluginInput;
}
