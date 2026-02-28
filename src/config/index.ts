/**
 * Configuration module - Environment variable helpers
 *
 * This module provides environment variable based configuration for the plugin.
 * The plugin works with zero configuration by default, using sensible defaults.
 *
 * Available environment variables:
 * - OPENCODE_CODER_DISABLED: Disable the plugin entirely (default: false)
 */

// Environment variable helpers
export { isPluginDisabled } from "./env";
