# What are Stories

- Stories are stored in the `docs/stories` folder
- Stories are plain Markdown files
- Story files use the format `001-the-name-of-the-story.md`
- Stories have a frontmatter section with these fields:

```yaml
state: <the current status can be "Draft"|"Ready for Implementation"|"In Progress"|"Implemented"|"Reviewed"|"Paused"|"Done">
previous_state: <only set when state is "Paused" - stores the state before pausing>
modification:
  - name: <the-agent-that-modified-the-story>
    date: <modification-timestamp>
    state: <the-state-of-the-story-AFTER-the-change>
```

# IMPORTANT: State changes

States follow this workflow:

```
Draft -> Ready for Implementation -> In Progress -> Implemented -> Reviewed -> Done
  |              |                       |              |              |
  +--------------+-----------------------+--------------+--------------+---> Paused
                                                                             |
  <--------------<-----------------------<--------------<--------------<-----+
                         (returns to previous state)
```

| # | From State               | To State                 | Trigger                              | Responsible Agent    |
|---|--------------------------|--------------------------|--------------------------------------|----------------------|
| 1 | (new)                    | Draft                    | Story is created                     | `@story-writer`      |
| 2 | Draft                    | Ready for Implementation | Story has been reviewed and approved | `@story-reviewer`    |
| 3 | Ready for Implementation | In Progress              | Implementation work begins           | Main agent           |
| 4 | In Progress              | Implemented              | Implementation work is complete      | Main agent           |
| 5 | Implemented              | Reviewed                 | Code review is complete              | `@code-review`       |
| 6 | Reviewed                 | Done                     | Final QA passes                      | `@qa-test-validator` |
| 7 | Any (except Done)        | Paused                   | User requests to pause work          | Main agent           |
| 8 | Paused                   | (previous state)         | User requests to resume work         | Main agent           |

## State changes rules

1. The user must ALWAYS sign of the current state. For example: You do not switch from `Draft` to
   `Ready for Implementation` without explicit permission from the user that the current `Draft` state is good enough to
   enter the nest state
2. Whenever you complete a state you ensure that everything is committed. This means if the user agree to enter the next
   state you commit everything using the `@git-committer` subagent to ensure that we have a clean state.
3. After everything is commited present a short overview what was done and what the user can do next

# IMPORTANT: Rules

1. You MUST NOT invent new states
2. Whenever you update a story you MUST add an entry in the modification section
3. State changes MUST follow the workflow above - no skipping states
4. ALWAYS commit when you have done a state change the document: WHENEVER we complete one state and enter a new one we
   MUST document this using a git commit    


