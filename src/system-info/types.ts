/**
 * Complete system info output structure
 */
export interface SystemInfo {
  session: SessionInfo;
  plugin: PluginInfo;
  integrations: IntegrationInfo;
}

export interface SessionInfo {
  id: string;              // From context.sessionID
  pid: number;             // From process.pid
  workingDirectory: string; // From process.cwd()
  command: string;         // From process.argv.join(' ')
  terminal: string | null; // From process.env.TERM or tty detection
}

export interface PluginInfo {
  name: string;              // @hk9890/opencode-coder
  version: string;           // From package.json
  active: boolean;           // From OPENCODE_CODER_DISABLED env var (inverted)
}

export interface IntegrationInfo {
  beads: BeadsInfo;
}

export interface BeadsInfo {
  enabled: boolean;
  cliVersion: string | null;
  projectInitialized: boolean;
  stats: BeadsStats | null;
}

export interface BeadsStats {
  openIssues: number;
  readyToWork: number;
  // Can add more fields later
}
