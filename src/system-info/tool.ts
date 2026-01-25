import { tool } from '@opencode-ai/plugin';
import type { SystemInfo } from './types';
import { collectPluginInfo, collectBeadsInfo } from './collectors';

export const systemInfoTool = tool({
  description: 'Get runtime information about opencode-coder plugin and integrations',
  
  args: {
    // No args for minimal version
  },
  
  async execute(_args, _context) {
    // Top-level error handling ensures tool never fails completely
    try {
      const info: SystemInfo = {
        metadata: {
          version: '1.0.0',
          generatedAt: new Date().toISOString()
        },
        
        // Each collector has internal error handling (returns safe defaults)
        // AND we add .catch() as defense-in-depth
        plugin: await collectPluginInfo().catch(() => ({
          name: 'unknown',
          version: 'unknown',
          active: false
        })),
        
        integrations: {
          beads: await collectBeadsInfo().catch(() => ({
            enabled: false,
            cliVersion: null,
            projectInitialized: false,
            stats: null
          }))
        }
      };
      
      return JSON.stringify(info, null, 2);
    } catch (error) {
      // Last resort: if something catastrophic happens, return error info
      // This prevents the tool from throwing and breaking agent execution
      return JSON.stringify({ 
        error: String(error),
        message: 'System info collection failed'
      }, null, 2);
    }
  }
});
