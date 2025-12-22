# What are Bugs

- Bugs are stored in the `docs/bugs` folder
- Bugs are plain Markdown files
- Bug files use the format `001-the-name-of-the-bug.md`
- Bugs have a frontmatter section with these fields:

```yaml
state: <the current status can be "Created"|"Reproduced"|"Fixed"|"Done"|"Paused">
previous_state: <only set when state is "Paused" - stores the state before pausing>
modification:
  - name: <the-agent-that-modified-the-bug>
    date: <modification-timestamp>
    state: <the-state-of-the-bug-AFTER-the-change>
```

# IMPORTANT: State changes

States follow this workflow:

```
Created -> Reproduced -> Fixed -> Done
    |           |          |
    +-----------+----------+---> Paused
                                    |
    <-----------<----------<--------+
           (returns to previous state)
```

| # | From State        | To State         | Trigger                                                          | Responsible         |
|---|-------------------|------------------|------------------------------------------------------------------|---------------------|
| 1 | (new)             | Created          | Bug is reported                                                  | `bug-creator`       |
| 2 | Created           | Reproduced       | Bug verified with a failing test that reproduces the behavior    | `bug-creator` or Main agent |
| 3 | Reproduced        | Fixed            | Fix implemented and the reproducing test now passes              | Main agent          |
| 4 | Fixed             | Done             | Post-mortem analysis and code review completed (see below)       | `qa-test-validator` |
| 5 | Any (except Done) | Paused           | User requests to pause work                                      | Main agent          |
| 6 | Paused            | (previous state) | User requests to resume work                                     | Main agent          |

## State changes rules

1. The user must ALWAYS sign off the current state. For example: You do not switch from `Created` to
   `Reproduced` without explicit permission from the user that the bug has been successfully reproduced
2. Whenever you complete a state you ensure that everything is committed. This means if the user agrees to enter the next
   state you commit everything using the `@git-committer` subagent to ensure that we have a clean state.
3. After everything is committed present a short overview what was done and what the user can do next

# IMPORTANT: The Reproduced State

Moving to `Reproduced` means:
1. The bug has been verified and can be consistently reproduced
2. A **failing test** has been written that demonstrates the buggy behavior
3. This test MUST fail before the fix is applied (proving the bug exists)
4. This test will pass after the fix is applied (proving the fix works)

The test serves as:
- Proof that we understand the bug
- A regression test to prevent this bug from happening again
- Documentation of the expected behavior

# IMPORTANT: Post-Mortem Analysis (Required for Done)

Before setting a bug to `Done`, the bug document MUST include a **Post-Mortem Analysis** section:

```markdown
## Post-Mortem Analysis

### Why wasn't this caught earlier?
[Analysis of why existing tests/processes didn't catch this bug]

### What could we improve?
[Concrete suggestions for improving testing, code review, or development processes]

### Preventive measures taken
[List any new tests, linting rules, or process changes implemented]
```

This section ensures we learn from every bug and continuously improve our testing and development practices.

# IMPORTANT: Rules

1. You MUST NOT invent new states
2. Whenever you update a bug you MUST add an entry in the modification section
3. State changes MUST follow the workflow above - no skipping states
4. ALWAYS commit when you have done a state change to the document: WHENEVER we complete one state and enter a new one we
   MUST document this using a git commit
5. Bug reports must contain sufficient information to reproduce the issue
6. The `/bug/create` command creates bug reports; fixing can happen immediately or later
7. A test reproducing the bug MUST exist before implementing a fix
8. Post-mortem analysis MUST be completed before marking a bug as Done

