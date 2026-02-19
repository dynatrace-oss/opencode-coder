---
description: Export full session data to private/session-dump/ folder
---

Export the current session's complete data (messages, tool calls, tokens, costs, file diffs) to a local folder for archival and review.

Steps:
1. Call `coder session` to get the current session ID
2. Call `coder session-export private/session-dump/<session-id>` to export the full session data

The export will create the directory if needed and write a `session.json` file containing all session data.

After exporting, report the output path and summary to the user.
