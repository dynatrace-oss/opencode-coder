import { access } from "fs/promises";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

/**
 * Resolve the knowledge-base directory.
 *
 * Handles both layouts:
 * - Dist: knowledge-base/ is sibling to dist/ (dist/../knowledge-base)
 * - Source: knowledge-base/ is sibling to src/ (src/../knowledge-base)
 *
 * Strategy: Find the directory containing this module, walk up to find
 * the package root (where knowledge-base/ exists), and return that path.
 */
export async function resolveKnowledgeBaseDir(): Promise<string> {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // In dist: __dirname is /path/to/dist (after bundling, core/paths.ts is in dist/)
  // In src: __dirname is /path/to/src/core

  // Try dist layout first: knowledge-base is sibling to dist/
  const distPath = join(__dirname, "..", "knowledge-base");
  try {
    await access(distPath);
    return distPath;
  } catch {
    // Fall back to source layout: walk up from src/core/ to package root
    // src/core -> src -> package-root/knowledge-base
    return join(__dirname, "..", "..", "knowledge-base");
  }
}
