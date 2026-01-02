---
description: Show detailed opencode-coder plugin information
---

# Plugin Information

## Package

- **Name**: {{coder.version.name}}
- **Version**: {{coder.version.version}}
- **Description**: {{coder.version.description}}

## Configuration

- **Active**: {{#coder.config.active}}yes{{/coder.config.active}}{{^coder.config.active}}no{{/coder.config.active}}
- **Working Directory**: `{{coder.cwd}}`

## Beads Integration

- **Enabled**: {{#beads.enabled}}yes{{/beads.enabled}}{{^beads.enabled}}no{{/beads.enabled}}

## Knowledge Base

- **Total Commands**: {{knowledgeBase.commandCount}}
- **Total Agents**: {{knowledgeBase.agentCount}}

### Commands

{{#knowledgeBase.commands}}
- `/{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}
{{/knowledgeBase.commands}}

### Agents

{{#knowledgeBase.agents}}
- `@{{name}}`: {{#description}}{{description}}{{/description}}{{^description}}(no description){{/description}}{{#mode}} (mode: {{mode}}){{/mode}}
{{/knowledgeBase.agents}}

## Documentation

- README: `docs/kb/README.md`
- Story Guide: `docs/kb/story.md`
- Bug Guide: `docs/kb/bug.md`
