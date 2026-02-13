/**
 * Environment variable helpers for plugin control.
 *
 * This module provides type-safe access to environment variables that control
 * plugin behavior, with proper default values and boolean parsing.
 */

/**
 * Parse a string value as a boolean.
 *
 * Converts string representations of booleans to actual boolean values:
 * - "true" (case-insensitive) → true
 * - "false" (case-insensitive) → false
 * - undefined/empty → defaultValue
 *
 * @param value - The string value to parse
 * @param defaultValue - The default value if parsing fails or value is undefined
 * @returns The parsed boolean value
 */
function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") {
    return defaultValue;
  }
  const normalized = value.toLowerCase().trim();
  if (normalized === "true") {
    return true;
  }
  if (normalized === "false") {
    return false;
  }
  return defaultValue;
}

/**
 * Check if the plugin is disabled via environment variable.
 *
 * Environment Variable: `OPENCODE_CODER_DISABLED`
 *
 * When set to "true", the entire plugin will be disabled and not load any features.
 * This acts as a kill switch for the plugin.
 *
 * @example
 * ```bash
 * # Disable the plugin
 * export OPENCODE_CODER_DISABLED=true
 * ```
 *
 * @returns true if the plugin should be disabled, false otherwise (default: false)
 */
export function isPluginDisabled(): boolean {
  return parseBoolean(process.env["OPENCODE_CODER_DISABLED"], false);
}

/**
 * Check if beads commands should be auto-approved without user confirmation.
 *
 * Environment Variable: `BEADS_AUTO_APPROVE`
 *
 * Controls whether `bd` commands require manual approval before execution.
 * - true (default): Commands execute automatically without prompting
 * - false: User must approve each command before execution
 *
 * @example
 * ```bash
 * # Require approval for all bd commands
 * export BEADS_AUTO_APPROVE=false
 * ```
 *
 * @returns true if commands should auto-approve (default: true), false if approval is required
 */
export function shouldAutoApproveBeads(): boolean {
  return parseBoolean(process.env["BEADS_AUTO_APPROVE"], true);
}
