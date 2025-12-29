import type { Plugin } from "@opencode-ai/plugin";

/**
 * Beads Prime Plugin for OpenCode
 *
 * This plugin injects the output of `bd prime` into OpenCode's system prompt,
 * giving the AI context about your project's beads (issues/tasks). It runs on:
 *
 * - Chat session start: Adds beads context to the system prompt
 * - Session compaction: Re-injects context when the session is compacted
 *
 * Based on the Claude Code plugin from steveyegge/beads
 */

export const BeadsPrimePlugin: Plugin = async ({ $ }) => {
  // Get beads context - will be empty string if bd not initialized or no issues
  const prime = await $`bd prime 2>/dev/null || echo ""`.text();

  // If no beads context, don't add anything
  if (!prime.trim()) {
    return {};
  }

  return {
    // Inject beads context into system prompt at session start
    "experimental.chat.system.transform": async (_, output) => {
      output.system.push(prime);
    },
    // Re-inject context after compaction to maintain memory
    "experimental.session.compacting": async (_, output) => {
      output.context.push(prime);
    },
  };
};

export default BeadsPrimePlugin;
