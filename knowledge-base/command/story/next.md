---
description: Work on next story
---

# Work on story

Your task is to find a story to work on and continue working on it.

## Tasks

1. Read `docs/kb/story.md` to understand what stories are and how to work with them.
2. Determine the story to work on: If the user specifies one, use it. Otherwise, read the frontmatter section in all
   files in `docs/stories`, list those that are not `Done` or `Paused`, and ask the user which story they want to work
   on next. If there are more than 5 stories in the directory, only look at the last 5 and ignore the others.
3. If the user selects a story, check for uncommitted changes. If any exist, ask whether to commit them before starting
   work on the story.
4. Read the full story document and decide what to do based on the story state.
