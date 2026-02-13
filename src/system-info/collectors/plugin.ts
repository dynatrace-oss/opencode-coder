import type { PluginInfo } from '../types';
import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { isPluginDisabled } from '../../config/env';

// Get the directory where this plugin is located
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function collectPluginInfo(): Promise<PluginInfo> {
  // Read package.json for version (handles both dist and src layouts)
  let packageJsonPath: string;
  try {
    // Try dist layout first (../../package.json from dist/system-info/)
    packageJsonPath = join(__dirname, '..', '..', 'package.json');
    await access(packageJsonPath);
  } catch {
    // Fall back to source layout (../../../package.json from src/system-info/)
    packageJsonPath = join(__dirname, '..', '..', '..', 'package.json');
  }
  
  const packageJson = JSON.parse(
    await readFile(packageJsonPath, 'utf-8')
  );
  
  // Check if plugin is disabled via environment variable
  const active = !isPluginDisabled();
  
  return {
    name: packageJson.name,
    version: packageJson.version,
    active
  };
}
