/**
 * Complete system info output structure
 */
export interface SystemInfo {
  metadata: SystemMetadata;
  plugin: PluginInfo;
  integrations: IntegrationInfo;
}

export interface SystemMetadata {
  version: string;           // Schema version (1.0.0)
  generatedAt: string;       // ISO timestamp
}

export interface PluginInfo {
  name: string;              // @hk9890/opencode-coder
  version: string;           // From package.json
  active: boolean;           // From .coder/coder.json
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
