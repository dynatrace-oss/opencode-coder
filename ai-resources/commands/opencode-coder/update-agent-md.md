---
description: Update the AGENTS.md routing table for the current project
---

# Update AGENTS.md

Regenerate or update the project's AGENTS.md file based on current documentation and installed skills.

This is a lightweight alternative to `/init` — it only touches AGENTS.md, skipping skill discovery and beads initialization.

## Instructions

### Step 0: Detect Mode

Before doing anything else, check for stealth mode:

```bash
grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null && echo "STEALTH_ACTIVE"
```

- If output is `STEALTH_ACTIVE` → **stealth mode is active**. Keep in mind throughout all subsequent steps:
  - Docs directory is `.coder/docs/` — **not** `docs/`
  - AGENTS.md lives at `.coder/AGENTS.md` — **not** at the project root
  - AGENTS.md path references must point to `.coder/docs/CODING.md`, `.coder/docs/TESTING.md`, etc.
  - Do **not** create any files under `docs/`
- If no output → **team mode**. Docs live under `docs/` and AGENTS.md lives at the project root as usual.

Carry this context forward into the template workflow.

### Step 1: Run the Template Workflow

1. **Load the template** — Load the `opencode-coder` skill and read `references/agents-md-template.md`
2. **Follow the workflow** — Execute all steps from the template (it will re-confirm the mode via its own detection, which is consistent with what you detected above):
   - Step 1: Gather Context (spawn explore agent)
   - Step 2: Map existing docs to sections
   - Step 3: Migration decision (ask user if non-standard names found)
   - Step 4: Create missing standard files
   - Step 5: Generate AGENTS.md
   - Step 6: Verify
3. **Report completion** — Show what sections were created/updated and what files were referenced or created

## Key Rules

- **MUST ask the user** before migrating files to standard names — never auto-migrate
- **MUST ask the user** before creating new files (like `docs/CODING.md`) — confirm the content is correct
- If AGENTS.md already exists, follow the "Updating an Existing AGENTS.md" section from the template
- Preserve any custom sections the user added manually
- In stealth mode, all generated doc files go under `.coder/docs/`, never under `docs/`
- In stealth mode, write AGENTS.md to `.coder/AGENTS.md`, never to the project root
