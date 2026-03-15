/**
 * Template for the /init command when prerequisites are missing.
 *
 * This is a command template — it contains instructions for the AI agent
 * (not the user directly). When the config hook detects that `installReady`
 * is false, it registers /init with this template instead of the normal flow.
 */
export function getInstallGuideTemplate(): string {
  return `
# Project Setup Required

Some prerequisites for the opencode-coder plugin are not yet in place.
Let me check what's missing and help you get set up.

## Task

1. Ensure \`.coder/\` exists. If it does not, create it before proceeding.
2. Read \`.coder/project.yaml\` to check the current project state when it exists.
   - If \`.coder/project.yaml\` does not exist yet, continue with setup using direct detection as needed.
3. For each missing prerequisite listed below, follow the corresponding guidance.
4. After all items are resolved, inform the user to restart OpenCode.

---

### Git Repository

If \`git.initialized\` is \`false\`:
- Use \`question()\` to ask the user:
  > "This project doesn't have a git repository yet. Would you like me to run \`git init\`?"
- If the user confirms, run \`git init\` in the project root.
- If they decline, note that git is required for beads to track tasks.

---

### Beads CLI

If \`beads.bdCliInstalled\` is \`false\`:
- Inform the user:
  > "The beads CLI (\`bd\`) is not installed. Install it with:"
  > \`\`\`
  > npm install -g beads
  > \`\`\`
- Do not run this automatically — provide the command and let the user install it.

---

### aimgr (AI Resource Manager)

If \`aimgr.installed\` is \`false\`:
- Inform the user:
  > "aimgr is not installed. You can install it from:"
  > https://github.com/hk9890/ai-config-manager
- Do not run this automatically — provide the link and let the user install it.

---

### opencode-coder Package

If \`aimgr.coderPackageInstalled\` is \`false\`:
- Use \`question()\` to ask the user:
  > "The opencode-coder package is not installed via aimgr. Should I run \`aimgr init && aimgr install package/opencode-coder\` for you?"
- If the user confirms, run \`aimgr init && aimgr install package/opencode-coder\` in the project root.
- If they decline, provide the commands for them to run manually.

---

## Restart Required

After all prerequisites are addressed, inform the user:

> ✅ Setup steps complete! Please **restart OpenCode** so the plugin can detect
> the changes. Then run \`/init\` again to continue.
`.trim();
}
