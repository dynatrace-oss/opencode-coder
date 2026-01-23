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
  
  // Debug logging for CI diagnostics
  console.log("[version.ts] DEBUG: __dirname =", __dirname);
  console.log("[version.ts] DEBUG: process.cwd() =", process.cwd());
  
  // Try different paths to find package.json
  // - From dist/: ../package.json (installed package)
  // - From src/core/: ../../package.json (development)
  // - From process.cwd(): ./package.json (test/CI context)
  const possiblePaths = [
    join(__dirname, "..", "package.json"),      // dist/ -> package.json
    join(__dirname, "..", "..", "package.json"), // src/core/ -> package.json
    join(process.cwd(), "package.json"),        // cwd -> package.json
  ];
  
  console.log("[version.ts] DEBUG: Trying paths:", possiblePaths);
  
  for (const path of possiblePaths) {
    console.log("[version.ts] DEBUG: Attempting path:", path);
    try {
      await access(path);
      console.log("[version.ts] DEBUG: SUCCESS - Found package.json at:", path);
      const file = Bun.file(path);
      const content = await file.json();
      return {
        name: content.name,
        version: content.version,
        description: content.description,
      };
    } catch (error) {
      console.log("[version.ts] DEBUG: FAILED - Path not accessible:", path, "Error:", error);
      // Try next path
    }
  }
  
  // Fallback if package.json not found
  console.log("[version.ts] DEBUG: WARNING - No package.json found, returning 'unknown' version");
  return {
    name: "@hk9890/opencode-coder",
    version: "unknown",
    description: "OpenCode plugin for story-driven development",
  };
}
