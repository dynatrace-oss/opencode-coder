---
description: Check health of opencode-coder plugin setup
---

# Coder Doctor

Load the opencode-coder skill to perform a comprehensive health check on the coder plugin setup.

## Task

Use the skill tool to load comprehensive diagnostic guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Status & Health Checks** and **Troubleshooting & Diagnostics** sections to:
1. Check plugin status (via `OPENCODE_CODER_DISABLED` env var)
2. Check beads status and run `bd doctor`
3. Verify git hooks installation
4. Check git sync status
5. Run aimgr resource health check (see section below)
6. Report component status and any issues found

The skill provides:
- Complete health check procedures
- bd doctor output filtering guidance
- Issue resolution commands
- Component status meanings

## aimgr Resource Health

Run the following diagnostic step to check the health of aimgr-managed AI resources:

```bash
aimgr verify --format json
```

Parse and display the results to the user, then act on them:

- **If the command is not found** (aimgr not installed): report "aimgr not installed — skipping resource health check" and continue.
- **If no issues are found** (empty issues/errors arrays, or `status` is `"ok"` / `"healthy"`): report "aimgr resources: all healthy".
- **If issues are found** (non-empty `issues` or `errors` arrays, or a non-ok `status` field):
  1. Display the issues clearly to the user.
  2. Ask the user via `question()`: **"Resource issues detected. Want me to attempt repair?"**
     - **YES**: Run `aimgr repair --format json` and parse the result:
       - Report `summary.fixed` resources repaired (list items from the `fixed` array — each has `resource`, `tool`, `issue_type`, `description`)
       - If `summary.failed > 0`: show the failed items and suggest `aimgr uninstall <resource>` for resources that could not be repaired automatically
       - If `hints` array is non-empty: show the hints to the user (each has `resource`, `description`)
     - **NO**: Acknowledge and continue with the remaining doctor checks.

