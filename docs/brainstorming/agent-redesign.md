# Agent Redesign

Redesign of the beads agent architecture. This document captures the current state, problems, decisions, and target architecture.

## Current Architecture

### Agents

| Agent | Lines | Mode | Model | Can Edit Code | Purpose |
|-------|-------|------|-------|---------------|---------|
| orchestrator | 647 | primary | default (opus) | No | Plans work, creates beads, delegates to all others |
| tasker | 94 | subagent | sonnet | Yes | Implements tasks, closes them |
| reviewer | 296 | subagent | default (opus) | No | Reviews plan quality, creates new beads if issues |
| verifier | 470 | subagent | default (opus) | No | Verifies outcomes, owns gates, closes or creates bugs |
| committer | 147 | subagent | sonnet | No (git only) | Commits and pushes to remote |

### Current Handoff Flow

```
User
  │
  ▼
Orchestrator (primary — read-only, plans everything)
  │
  ├──► Reviewer        (when plan has `need:review` label)
  │      returns: review report + new beads (tasks/gates/bugs)
  │
  ├──► Tasker          (when `bd ready` shows unblocked tasks)
  │      │
  │      └──► Committer   (after task closed, to commit+push)
  │             returns: commit summary
  │      returns: task completion report
  │
  └──► Verifier        (when all tasks done, gates need checking)
         returns: verification report, closes gate or creates bugs
  │
  ▼
Orchestrator closes epic when all tasks + gates closed
```

### Problems with Current Architecture

1. **Orchestrator is bloated (647 lines)** — ~300 lines of CLI reference, question tool examples, heredoc syntax, example sessions. Behavioral instructions buried under reference material.

2. **Stale references** — reviewer and verifier say "Beads CLI reference is provided via injected context" (from old `bd prime` injection, now removed).

3. **Orchestrator scope too narrow** — described as a "planning agent." In practice users need it for discussion, exploration, and ad-hoc tasks. Forces beads structure on everything.

4. **Tasker has ambiguous commit responsibility** — mandatory committer handoff after every task, even when task doesn't mention committing.

5. **Reviewer is too narrow and too nice** — only triggered by `need:review` on beads plans. Rubber stamps rather than questioning.

6. **Verifier is massive (470 lines)** — good principles but oversized. Needs to be more compact.

7. **Committer as separate agent is overhead** — spawning an agent to run `git add && git commit && git push` adds latency with no proportional benefit.

---

## Decisions

### Decision 1: Orchestrator handles simple work directly

Not strictly read-only. Can make simple code edits, fix typos, small refactors — anything that doesn't warrant spawning a tasker. Read-only constraint only applies during planning/delegating mode for structured beads work.

### Decision 2: Use the opencode-coder skill for reference material

Don't create a new skill. Restructure the existing `opencode-coder` skill to serve as the orchestrator's reference hub.

**Structure:**
- `SKILL.md` — concise index (~100 lines), lists use cases and points to reference documents
- `references/planning.md` — how to create epics, tasks, gates, dependencies, heredoc syntax, examples
- `references/cli-reference.md` — full bd CLI reference
- Other reference documents as needed (existing troubleshooting/setup docs stay)
- `scripts/` — helper scripts for token-efficient operations

**How it works:**
- Orchestrator agent .md (~100-150 lines) says "load the opencode-coder skill for detailed reference"
- Skill SKILL.md lists available documents by use case
- Orchestrator loads specific documents on demand (e.g., planning.md when creating epics)
- Subagents (tasker, reviewer, verifier) can also load relevant documents from the skill

**Rationale:** Agent .md is always in the system prompt. Skill is loaded on demand. Keeps system prompt lean for discussion/exploration, loads planning detail only when needed. Scripts in the skill can automate multi-step operations for token efficiency.

### Decision 3: Tasker executes ONE task, does NOT commit

- Receives one task ID, executes it, returns results
- No autonomous work-finding loop — orchestrator owns the loop
- Does NOT commit or push by default
- If the task instructions explicitly say "commit and push", tasker does that
- MUST create bugs/tasks for unrelated problems discovered during execution
- MUST ensure nothing is left broken — all tests passing, no regressions

### Decision 4: Remove the committer agent

Removed entirely. Git commit/push is a capability, not an agent.

- Simple git safety rules (~10 lines: no force push, no amend pushed commits) go in the orchestrator agent .md
- Orchestrator or tasker commits when appropriate
- No separate agent spawn for git operations

### Decision 5: Reviewer becomes a critical thinker

Redesigned from narrow plan checker to **general-purpose critical reviewer**.

- Questions everything — default posture is skepticism
- Suggests simplifications, improvements, alternatives
- Usable for ANY review: beads plans, architecture, code, ideas
- Stays as subagent — user tells orchestrator "use the reviewer to look at this"
- When reviewing beads plans: still creates tasks/gates/bugs (philosophy intact)
- When reviewing non-beads: structured critical feedback with specific suggestions

### Decision 6: Verifier is compact and comprehensive

The verifier is redesigned to be more compact (~150-200 lines, down from 470) while covering three verification scopes.

#### Three Verification Scopes

**1. Task verification** — verify a single completed task
- Check acceptance criteria from the task
- Run relevant tests
- Verify no regressions

**2. Epic/gate verification** — verify an epic's acceptance gate
- Check all gate criteria
- Verify all child tasks are closed
- Run integration checks

**3. Project verification** — verify overall project health
- Build passes
- All tests pass
- No lint errors
- No regressions from recent work

#### Critical Rule: No Silent Failures

**The verifier MUST create bugs for ANY issues found, even unrelated ones.**

This is non-negotiable. If the verifier runs `bun test` to verify an epic and 3 tests fail that are unrelated to the epic, the verifier MUST:
1. Create a bug for each unrelated failure: `bd create --type=bug --title="Failing test: ..."`
2. Note in the verification report that unrelated failures were found and tracked
3. The epic verification itself may still pass (if its own criteria are met), but the bugs MUST exist in the system

**Why:** We never want "epic verified, all good" while tests are silently failing. Every failure must be tracked. The verifier is the last line of defense — if it ignores something, nobody else will catch it.

#### Core Principles (kept from current, made compact)

- **Execute, don't infer** — "looks correct from the code" is not verification. Run the command, observe the result.
- **Evidence required** — for each criterion: what command was run, what output was observed, what conclusion was drawn.
- **Close gates explicitly** — run `bd close <gate-id>`, don't just report "CLOSING."
- **If you can't verify, say so** — mark as UNVERIFIED, explain why, leave the gate open.
- **Create bugs, don't reopen** — if verification fails, create new bugs. Don't reopen closed tasks.

#### What's Removed from Current Verifier

- Extensive output format templates (300+ lines of markdown templates → replaced by concise guidance)
- Redundant examples that repeat the same principles
- Post-mortem rules (moved to orchestrator/skill if needed)
- Stale "injected context" reference

---

## Target Architecture

### Agents

| Agent | Mode | Model | Can Edit Code | Purpose |
|-------|------|-------|---------------|---------|
| orchestrator | primary | default (opus) | Yes (simple edits) | Main agent: discussion, planning, execution, simple edits |
| tasker | subagent | sonnet | Yes | Single-task executor — implements exactly what the task says |
| reviewer | subagent | default (opus) | No | Critical thinker — questions everything, reviews anything |
| verifier | subagent | default (opus) | No | Verifies outcomes at task, epic, and project level |

**Removed:** committer (capability, not agent)

### Target Handoff Flow

```
User
  │
  ▼
Orchestrator (main agent — handles everything)
  │
  ├── [simple work] ──► Does it directly (edit, fix, commit)
  │
  ├── [needs critical feedback] ──► Reviewer
  │      returns: critical analysis, suggestions, concerns
  │
  ├── [structured beads work] ──► Tasker (one task at a time, parallel when independent)
  │      returns: task completion report (no commit)
  │
  └── [verification needed] ──► Verifier
  │      returns: verification report + bugs for ANY issues found
  │
  ▼
Orchestrator commits when ready, closes epic when done
```

### Skill Structure

The `opencode-coder` skill serves as the shared reference hub for all agents.

```
ai-resources/skills/opencode-coder/
├── SKILL.md                          # ~100 lines: index of use cases + document list
├── references/
│   ├── planning.md                   # NEW: epic/task/gate creation patterns, heredoc syntax
│   ├── cli-reference.md              # NEW: full bd CLI reference
│   ├── installation-setup.md         # EXISTING: plugin installation guide
│   ├── debugging-logs.md             # EXISTING: log analysis
│   ├── status-health.md              # EXISTING: health checks
│   ├── bug-reporting.md              # EXISTING: bug reporting guide
│   ├── troubleshooting-patterns.md   # EXISTING: common problems
│   └── agents-md-template.md         # EXISTING: AGENTS.md template
├── scripts/
│   └── collect-system-info.sh        # EXISTING: system info script
└── assets/
    └── bug-report-template.md        # EXISTING: bug report template
```

---

## Orchestrator Use Cases

### Use Case 1: Discussion / Exploration

User wants to discuss a feature, explore the codebase, understand tradeoffs, or think through an approach.

- Read code, answer questions, discuss architecture
- Help user think through approaches
- May or may not lead to beads creation
- Should NOT push user toward creating epics/tasks prematurely
- Can make simple edits if the conversation leads there

**Key behavior:** Be a helpful collaborator first. Beads structure comes later, if at all.

### Use Case 2: Beads Planning

User explicitly wants to create a structured plan.

- Research codebase to inform planning
- Load the skill's `planning.md` for reference (epic/task patterns, CLI reference)
- Create epic + tasks + acceptance gate
- Set dependencies
- Optionally spawn reviewer for critical feedback
- Present plan for user approval

**Key behavior:** Load detailed planning reference from skill on demand. Don't carry it in the agent .md.

### Use Case 3: Execution Trigger

User has an existing plan and wants to execute it.

- Check what's ready: `bd ready`
- Spawn taskers for ready work (parallel when independent)
- After taskers return, check for newly unblocked work
- Spawn verifier for gates when tasks are done
- Commit when appropriate (orchestrator decides when)
- Close epic when everything passes

**Key behavior:** Own the execution loop. Taskers execute, orchestrator orchestrates.

### Use Case 4: Simple / Ad-hoc Work

User wants something done that doesn't warrant a full epic.

- Do it directly — no tasker roundtrip
- Commit if appropriate
- Create a beads task after the fact if tracking is desired, or skip beads entirely

**Key behavior:** Be pragmatic. Not everything needs structure.

---

## Tasker Behavior

### Input
- Receives ONE task ID (or task description) from orchestrator
- Reads task details via `bd show <id>`

### Execution
1. Claim the task: `bd update <id> --status=in_progress`
2. Read task instructions carefully
3. Implement exactly what the task says
4. Run tests to verify implementation
5. If tests fail RELATED to the task: fix them
6. If tests fail UNRELATED to the task: create a bug via `bd create --type=bug`
7. Close the task: `bd close <id> --reason="..."`

### What the tasker does NOT do
- Does NOT find its own work — orchestrator assigns it
- Does NOT commit or push (unless the task explicitly says to)
- Does NOT continue to the next task — returns to orchestrator
- Does NOT improvise if instructions are unclear — stops and explains what's missing

### Error Handling
- Task instructions are ambiguous → stop, report what's unclear
- Task depends on something not yet done → stop, report the blocker
- Implementation causes unrelated failures → create bugs, complete own task if possible
- Cannot complete the task → report why, leave task open with status update

---

## Reviewer Behavior

The reviewer is a **critical thinker**. Not a rubber stamp. A genuine adversarial reviewer.

### Core Attitude
- Default posture: skepticism
- Never validate by default — find what's wrong first
- Always suggest at least one simplification or alternative
- Be direct: "this will break because X" not "you might want to consider X"
- It's OK to say "this is solid" — but only after genuinely trying to find problems

### Use Cases

**Beads plan review:**
- Check structure, completeness, clarity
- Question scope — over-engineered? Under-engineered?
- Suggest simplifications — can 5 tasks be 3?
- Creates tasks/gates/bugs as beads outputs (philosophy intact)

**Architecture / approach review:**
- Question design decisions and tradeoffs
- Point out complexity that could be avoided
- "What happens when this fails?"

**Code review:**
- Review a PR or set of changes
- Question design decisions, not just correctness
- "This abstraction adds complexity — is it worth it?"

**General critical review:**
- User has a plan or idea and wants holes poked in it
- Reviewer's job: find the holes

### Output
- For beads reviews: structured report + new beads (tasks, gates, bugs)
- For non-beads reviews: structured critical feedback with specific suggestions
- Always includes: risks, simplification opportunities, things that could go wrong

---

## Verifier Behavior

The verifier checks that work actually meets its criteria. Compact, evidence-based, comprehensive.

### Three Scopes

**Task verification:** Verify a single completed task against its acceptance criteria.

**Epic/gate verification:** Verify an epic's acceptance gate — all criteria met, all child tasks closed.

**Project verification:** Verify overall project health — build, tests, lint all pass.

### Critical Rule: No Silent Failures

If the verifier discovers ANY issue — related or unrelated to the current verification target — it MUST create a bug. No exceptions.

Example: Verifying an epic, `bun test` shows 3 unrelated test failures → create 3 bugs. The epic may still pass its own criteria, but those failures MUST be tracked in the system.

### Core Principles

- **Execute, don't infer** — run the command, observe the result. "Looks correct" is not verification.
- **Evidence required** — what was run, what was observed, what was concluded.
- **Close gates explicitly** — run `bd close`, don't just report intent.
- **If you can't verify, say so** — UNVERIFIED, explain why, gate stays open.
- **Create bugs, don't reopen** — failed verification creates new bugs, never reopens closed tasks.

---

## Critical Analysis

### What's Working (keep)

- **Beads philosophy** — new work, not rewrites
- **Agent separation** — focused executor (tasker) separate from orchestrator
- **Evidence-based verification** — prevents false "verified" claims

### What's Changing

1. **Orchestrator** — main agent, not just planner. Discussion + planning + execution + simple edits.
2. **Reference material** — moves to opencode-coder skill. Agent .md stays lean.
3. **Tasker** — pure executor. One task, no loop, no commits.
4. **Committer** — removed. Capability, not agent.
5. **Reviewer** — critical thinker. General-purpose, adversarial.
6. **Verifier** — compact, three scopes, no silent failures.

### Remaining Tensions

- **Orchestrator scope** — handles everything. Keep agent .md focused despite broad scope. Skill structure helps but the agent still needs a clear decision framework for "beads or just do it."
- **Skill loading reliability** — will the model reliably load skill documents when needed? May need explicit "load planning.md when creating epics" instruction in the agent .md. Small risk, test in practice.
- **Verifier creating bugs for unrelated failures** — right principle, but could create noise. The orchestrator needs to triage verifier-created bugs (some may be known issues, flaky tests, etc.).
