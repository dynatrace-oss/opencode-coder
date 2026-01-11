---
description: Show opencode-coder plugin status and information
---

# Plugin Status

**{{coder.version.name}}** v{{coder.version.version}}

{{coder.version.description}}

## Configuration

- **Status**: {{#coder.config.active}}active{{/coder.config.active}}{{^coder.config.active}}inactive{{/coder.config.active}}
- **Working Directory**: `{{coder.cwd}}`
- **Beads Integration**: {{#beads.enabled}}enabled{{/beads.enabled}}{{^beads.enabled}}disabled{{/beads.enabled}}
- **GitHub Integration**: {{#github.enabled}}enabled{{/github.enabled}}{{^github.enabled}}disabled{{/github.enabled}}

## Knowledge Base

- **Commands**: {{knowledgeBase.commandCount}}
- **Agents**: {{knowledgeBase.agentCount}}

### Commands

{{#knowledgeBase.commands}}
- `/{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}
{{/knowledgeBase.commands}}

### Agents

{{#knowledgeBase.agents}}
- `@{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}{{#mode}} (mode: {{mode}}){{/mode}}
{{/knowledgeBase.agents}}
