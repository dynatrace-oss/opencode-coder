import type { BeadsInfo, BeadsStats } from '../types';
import { access } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';

export async function collectBeadsInfo(): Promise<BeadsInfo> {
  try {
    // Check if bd command exists and get version
    const versionOutput = execSync('bd --version', { 
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore']
    });
    const versionMatch = versionOutput.match(/bd\s+version\s+([\d.]+)/);
    const cliVersion: string | null = versionMatch?.[1] ?? null;
    
    // Check if .beads/ directory exists (async)
    let projectInitialized = false;
    try {
      await access(join(process.cwd(), '.beads'));
      projectInitialized = true;
    } catch {
      projectInitialized = false;
    }
    
    // Get stats if initialized
    let stats: BeadsStats | null = null;
    if (projectInitialized && cliVersion) {
      try {
        const statsOutput = execSync('bd stats --json', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore']
        });
        const statsData = JSON.parse(statsOutput);
        stats = {
          openIssues: statsData.summary?.open ?? 0,
          readyToWork: statsData.summary?.ready ?? 0
        };
      } catch {
        // Stats command failed, keep null
      }
    }
    
    return {
      enabled: true,
      cliVersion,
      projectInitialized,
      stats
    };
  } catch {
    // bd command not found or failed
    return {
      enabled: false,
      cliVersion: null,
      projectInitialized: false,
      stats: null
    };
  }
}
