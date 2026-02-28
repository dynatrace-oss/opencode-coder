---
description: Update the AGENTS.md routing table for the current project
---

# Update AGENTS.md

Regenerate or update the project's AGENTS.md file based on current documentation and installed skills.

This is a lightweight alternative to `/init` — it only touches AGENTS.md, skipping skill discovery and beads initialization.

## Instructions

1. **Load the template** — Load the `opencode-coder` skill and read `references/agents-md-template.md`
2. **Follow the workflow** — Execute all steps from the template:
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
