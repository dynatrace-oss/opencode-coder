---
description: Simplify recently changed files with the opencode-coder workflow
---

# Simplify Recent Changes

Load the `opencode-coder` skill and run its simplify workflow on the most recently changed files.

## Task

Use the skill tool to load the workflow hub:

```
skill({ name: "opencode-coder" })
```

Then follow **`references/simplify.md`** inside that skill.

Treat any command arguments as optional focus guidance for the simplify pass.

The workflow should:

1. Determine scope from recent git changes by default
2. Launch parallel review passes for reuse, code quality, and efficiency
3. Aggregate findings and apply safe fixes directly
4. Ask the user before risky or broad refactors
5. Run the smallest sensible validation for changed files
6. End with a concise simplify summary
