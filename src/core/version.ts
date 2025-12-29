import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { access } from "fs/promises";

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
  
  // Try different paths to find package.json
  // - From dist/: ../package.json (installed package)
  // - From src/core/: ../../package.json (development)
  const possiblePaths = [
    join(__dirname, "..", "package.json"),      // dist/ -> package.json
    join(__dirname, "..", "..", "package.json"), // src/core/ -> package.json
  ];
  
  for (const path of possiblePaths) {
    try {
      await access(path);
      const file = Bun.file(path);
      const content = await file.json();
      return {
        name: content.name,
        version: content.version,
        description: content.description,
      };
    } catch {
      // Try next path
    }
  }
  
  // Fallback if package.json not found
  return {
    name: "@hk9890/opencode-coder",
    version: "unknown",
    description: "OpenCode plugin for story-driven development",
  };
}
