import { join, dirname } from "path";
import { fileURLToPath } from "url";

/**
 * Version information from package.json
 */
export interface VersionInfo {
  name: string;
  version: string;
  description?: string;
}

/**
 * Get the version info from the package.json file.
 * Reads the package.json at runtime to get accurate version information.
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  // Get the directory of this module
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // Navigate up to the package root (from src/core/ or dist/)
  const packageJsonPath = join(__dirname, "..", "..", "package.json");
  
  const file = Bun.file(packageJsonPath);
  const content = await file.json();
  
  return {
    name: content.name,
    version: content.version,
    description: content.description,
  };
}
