---
description: Show opencode-coder plugin status
---

# Plugin Status

Display the current status of the opencode-coder plugin.

## Information to Display

1. **Plugin Version**: Show the current version of opencode-coder
2. **Configuration Status**: Whether the plugin is active or disabled
3. **Loaded Commands**: Count and list of registered commands
4. **Loaded Agents**: Count and list of registered agents
5. **Beads Integration**: Whether beads (bd) commands are enabled

## Output Format

Present the information in a clear, readable format:

```
opencode-coder v{version}
Status: {active/inactive}

Commands ({count}):
  - /{command-name}: {description}
  ...

Agents ({count}):
  - @{agent-name}: {description}
  ...

Beads Integration: {enabled/disabled}
```
