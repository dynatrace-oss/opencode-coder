# Bug Report Template

Use this template when reporting issues with the opencode-coder plugin.

## Problem

<!-- Clear, concise description of what went wrong -->

## Expected Behavior

<!-- What should have happened -->

## Actual Behavior

<!-- What actually happened -->

## Steps to Reproduce

1. <!-- First step -->
2. <!-- Second step -->
3. <!-- Issue occurs -->

## Environment

- **Operating System**: <!-- e.g., Ubuntu 22.04, macOS 14.1, Windows 11 -->
- **Node.js Version**: <!-- Run: node --version -->
- **bd CLI Version**: <!-- Run: bd --version -->
- **Plugin Version**: <!-- Check package.json or npm list opencode-coder -->
- **Shell**: <!-- e.g., bash, zsh, fish -->

## Logs

<!-- 
Include relevant log excerpts. Enable debug logging first:
export DEBUG=opencode-coder:*

For bd CLI issues, run with --verbose flag if available.
-->

```
<!-- Paste logs here -->
```

## Additional Context

<!-- 
- What you were trying to accomplish
- Any workarounds you've found
- Related issues or documentation
- Screenshots (if applicable)
-->

## Checklist

Before submitting:
- [ ] Enabled debug logging and included relevant logs
- [ ] Ran `bd doctor` (if bd CLI issue) and included output
- [ ] Verified this is a plugin issue, not a project code issue
- [ ] Searched existing issues to avoid duplicates
- [ ] Included all environment information
- [ ] Provided clear steps to reproduce
