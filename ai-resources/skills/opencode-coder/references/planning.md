# Beads Planning Reference

Reference guide for creating epics, tasks, gates, and managing beads workflow structure.

## Beads Types

- **epic** — Large feature or initiative (contains tasks)
- **feature** — User-facing functionality
- **task** — Atomic unit of work
- **bug** — Defect to fix
- **chore** — Maintenance, refactoring
- **gate** — Blocking condition that must be resolved

## Task Quality Standards

Each task MUST be executable by agents WITHOUT additional questions.

**Quality Checklist:**
- Clear step-by-step instructions
- Specific files to modify (with actions: create/update/delete)
- Testable acceptance criteria (not "works" or "is good")
- No ambiguities or open questions
- Self-contained (agent doesn't need to ask clarifying questions)

**Good Task:**
```markdown
## Description
Add JWT token verification middleware to protect API routes.

## Instructions
1. Create file `src/middleware/auth.ts`
2. Import `jsonwebtoken` package
3. Implement `verifyToken` middleware function that:
   - Extracts token from Authorization header (Bearer scheme)
   - Verifies token using JWT_SECRET from env
   - Attaches decoded user to `req.user`
   - Returns 401 for missing/invalid tokens
4. Export middleware for use in routes

## Acceptance Criteria
- [ ] Middleware file created at correct path
- [ ] Valid tokens pass through with user attached
- [ ] Invalid/expired tokens return 401
- [ ] Missing Authorization header returns 401
- [ ] Tests pass: `npm test -- auth.test.ts`

## Files to Modify
- src/middleware/auth.ts (create)
- src/middleware/index.ts (add export)
```

**Bad Task:**
```markdown
## Description
Add authentication

## Instructions
Make the API secure
```

## Creating Issues

> **Important**: Use `--body-file -` to read body content from stdin. Heredoc syntax (`<< 'EOF'`) alone does NOT work with `bd create`.

### Epic Structure

```bash
# Create the epic
cat << 'EOF' | bd create --title="User Authentication" --type=epic --priority=1 --body-file -
## Description
Implement user authentication with JWT tokens.

## Goals
- Users can register and login
- Sessions persist across browser refreshes

## Success Criteria
- [ ] All child tasks completed
- [ ] Acceptance gate passed
EOF

# Create acceptance gate (every epic needs one)
cat << 'EOF' | bd create --title="Epic Acceptance: User Authentication" --type=gate --priority=1 --body-file -
## Gate Criteria
- [ ] All tasks closed
- [ ] Integration tested
- [ ] No critical bugs

## Owner
verifier
EOF

# Link gate to epic
bd dep add <epic-id> <gate-id>
```

### Task Structure

```bash
cat << 'EOF' | bd create --title="Add JWT middleware" --type=task --priority=2 --body-file -
## Description
What and why — context for the task.

## Instructions
Step-by-step implementation guide:
1. First do X
2. Then do Y
3. Finally do Z

## Files to Modify
- src/middleware/auth.ts — add JWT verification
- src/types/auth.ts — add token types

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Tests pass
- [ ] No new lint errors
EOF
```

For simple issues, use `--description` directly:

```bash
bd create --title="Fix login bug" --type=bug --priority=1 --description="Users cannot login when email contains + character."
```

### Open Questions

When requirements are unclear, document them explicitly:

```bash
cat << 'EOF' | bd create --title="Design auth token strategy" --type=task --priority=1 --labels=has:open-questions --body-file -
## Description
Implement token refresh strategy.

## Open Questions
- [ ] Should tokens auto-refresh or require explicit refresh call?
- [ ] What's the token expiry time? (suggested: 1 hour)

## Instructions
(blocked until questions resolved)
EOF
```

Issues with `has:open-questions` label cannot proceed until questions are resolved.

### External Bug Handling

Bugs from user/customer reports use `source:external` label and get a linked post-mortem task:

```bash
# Create the bug
cat << 'EOF' | bd create --title="Login fails for + in email" --type=bug --priority=1 --labels=source:external --body-file -
## Description
User reported: login fails when email contains + character.

## Steps to Reproduce
1. Register with email user+tag@example.com
2. Try to login
3. Error: "Invalid email format"
EOF

# Create linked post-mortem
cat << 'EOF' | bd create --title="Post-mortem: Email validation bug" --type=task --priority=3 --body-file -
## Post-mortem Questions
- [ ] Why wasn't this caught in testing?
- [ ] Are there similar validation issues?
- [ ] What process improvement prevents recurrence?
EOF

bd dep add <postmortem-id> <bug-id>
```

Post-mortems are ONLY for external bugs (`source:external`). Internal discovery bugs don't need them.

## Labels and Gates

### Labels
- `need:review` — Signals reviewer agent must review the plan
- `has:open-questions` — Issue has unresolved questions
- `source:external` — Bug reported by user/customer
- `risk:high` — High-risk change (optional)
- `area:<name>` — Area tag (optional)

### Gates
Gates represent **blocking conditions**, not approval states:
- `Epic Acceptance` — Every epic should have one
- `Security Review` — For security-sensitive work
- `Performance Check` — For performance-critical work

## Priority Guide

| Level | Name | When to Use |
|-------|------|-------------|
| 0 (P0) | Critical | Blocks everything |
| 1 (P1) | High | Needed soon |
| 2 (P2) | Medium | Default |
| 3 (P3) | Low | Nice to have |
| 4 (P4) | Backlog | Someday |

**Format**: Always use numeric 0-4 or P0-P4. Do NOT use "high", "medium", "low" — bd does not accept string priorities.

## Workflow Phases

### Discovery
1. Ask clarifying questions if scope is unclear
2. Research codebase (launch explore agents in parallel for complex scope)
3. Identify affected areas, dependencies, risks

### Planning
1. Create epic with clear goals
2. Break into atomic tasks (one focused session each)
3. Create acceptance gate
4. Set dependencies with `bd dep add`
5. Apply `need:review` to complex/risky items
6. Show the plan: `bd stats`, `bd ready`, `bd blocked`

### Review (if needed)
Spawn reviewer for items labeled `need:review`. Reviewer creates new beads if issues found — does NOT modify existing ones.

### User Approval
Before execution: show `bd ready`, show `bd blocked`, confirm user wants to proceed.

### Execution
- Spawn taskers for ready work (parallel when independent)
- Check `bd ready` for newly unblocked work after each completion
- Continue until no ready tasks remain

### Verification
Spawn verifier for gates. Verifier closes gates or creates bugs/tasks.

### Closure
When all tasks closed AND gate closed → close the epic.

## Agent Tips

**Updating issues:**
```bash
bd update <id> --status=in_progress     # Claim work
bd update <id> --assignee=username      # Assign to someone
bd update <id> --title="New title"      # Update title
bd update <id> --description="..."      # Update description
bd update <id> --notes="..."            # Update notes
bd update <id> --priority=1             # Change priority
```

**Filtering issues:**
```bash
bd list --status=open                   # All open issues
bd list --status=in_progress            # Currently active work
bd list --parent <id>                   # Children of an epic
bd list --type=bug                      # All bugs
```

**Close multiple issues at once:**
```bash
bd close oc-abc oc-def oc-ghi --reason="All implemented"
```

**Use `--json` for structured output:**
```bash
bd ready --json
bd show <id> --json
```

**Use `bd <command> --help`** for full flag reference on any command.

**WARNING**: Do NOT use `bd edit` — it opens $EDITOR (vim/nano) which blocks agents. Use `bd update` instead.
