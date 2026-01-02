---
description: Show opencode-coder plugin status
---

# Plugin Status

**{{coder.version.name}}** v{{coder.version.version}}

## Configuration

- **Status**: {{#coder.config.active}}active{{/coder.config.active}}{{^coder.config.active}}inactive{{/coder.config.active}}
- **Working Directory**: `{{coder.cwd}}`
- **Beads Integration**: {{#beads.enabled}}enabled{{/beads.enabled}}{{^beads.enabled}}disabled{{/beads.enabled}}

## Commands ({{knowledgeBase.commandCount}})

{{#knowledgeBase.commands}}
- `/{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}
{{/knowledgeBase.commands}}

## Agents ({{knowledgeBase.agentCount}})

{{#knowledgeBase.agents}}
- `@{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}
{{/knowledgeBase.agents}}
