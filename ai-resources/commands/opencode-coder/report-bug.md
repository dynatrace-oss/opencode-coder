---
description: Report issues with the opencode-coder plugin
---

# Coder Feedback

> **Purpose**: Report issues with the **opencode-coder plugin itself** - NOT general project issues.

Load the opencode-coder skill to analyze the session and report plugin issues.

## Task

Use the skill tool to load comprehensive bug reporting guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Reporting Issues** section to:

### Step 1: Analyze & Classify
- Review session and user arguments
- Identify plugin issues vs project issues
- Extract: component, expected/actual behavior, error messages

### Step 2: Show Report
- Present findings to user
- Clearly distinguish plugin issues from project issues
- Ask for confirmation before creating GitHub issues

### Step 3: Create Issues (if confirmed)
- Use `gh issue create --repo hk9890/opencode-coder`
- One issue per problem
- Include proper formatting and details

The skill provides:
- Issue classification guidelines
- Report templates
- GitHub issue creation patterns
- Proper filtering of bd doctor output
