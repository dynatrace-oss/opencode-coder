import { homedir } from "os";
import { resolve, isAbsolute } from "path";

/**
 * Replace {env:VAR_NAME} patterns with environment variable values.
 * If the environment variable is not set, the pattern is left unchanged.
 *
 * @param value - String that may contain {env:VAR_NAME} patterns
 * @returns String with environment variables resolved
 */
export function resolveEnvVariables(value: string): string {
  return value.replace(/\{env:([^}]+)\}/g, (_match, varName: string) => {
    const envValue = process.env[varName];
    if (envValue === undefined) {
      // Return original pattern if env var not set
      return `{env:${varName}}`;
    }
    return envValue;
  });
}

/**
 * Expand ~ to home directory at the start of a path.
 *
 * @param path - Path that may start with ~
 * @returns Path with ~ expanded to home directory
 */
export function expandHome(path: string): string {
  if (path === "~") {
    return homedir();
  }
  if (path.startsWith("~/")) {
    return homedir() + path.slice(1);
  }
  return path;
}

/**
 * Resolve a path by:
 * 1. Replacing {env:VAR_NAME} patterns with environment variable values
 * 2. Expanding ~ to home directory
 * 3. Resolving relative paths against the provided cwd
 *
 * @param path - Path to resolve (may contain env vars, ~, or be relative)
 * @param cwd - Current working directory for resolving relative paths
 * @returns Fully resolved absolute path
 */
export function resolvePath(path: string, cwd: string): string {
  // Step 1: Resolve environment variables
  let resolved = resolveEnvVariables(path);

  // Step 2: Expand home directory
  resolved = expandHome(resolved);

  // Step 3: Resolve relative paths against cwd
  if (!isAbsolute(resolved)) {
    resolved = resolve(cwd, resolved);
  }

  return resolved;
}

/**
 * Resolve all {env:VAR_NAME} patterns in any string value within an object.
 * This is useful for resolving env vars in the entire config object.
 *
 * @param obj - Object with string values that may contain env patterns
 * @returns New object with all env patterns resolved
 */
export function resolveEnvInObject<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === "string") {
    return resolveEnvVariables(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => resolveEnvInObject(item)) as T;
  }

  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveEnvInObject(value);
    }
    return result as T;
  }

  return obj;
}
