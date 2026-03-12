# Scion Integration

Brainstorming document for integrating the existing beads-driven workflow with Scion as the runtime substrate for isolated agent execution.

## Summary

The key idea is to separate the system into three distinct planes:

1. **Beads = work state** — the source of truth for tasks, dependencies, readiness, discovered work, and acceptance review.
2. **Scion = execution runtime** — isolated worktrees, containers, agent sessions, background execution, and runtime observability.
3. **Executor = control loop** — the service or long-running agent that reads ready work from beads, launches Scion agents, tracks execution, and triggers verification.

This intentionally splits planning from execution. The orchestrator stops being the component that both creates tasks and executes them. Instead:

- **Orchestrator** plans and updates the beads graph.
- **Executor** dispatches and supervises work.
- **Tasker** implements one task in an isolated Scion agent.
- **Verifier** validates completed work in an isolated Scion agent.

This architecture matches the strengths of both systems:

- **Beads** already gives us the dependency graph, ready-work detection, immutable work history, and discovered-work semantics.
- **Scion** already gives us containerized agents, isolated workspaces, background/detached execution, and lifecycle/status tracking.

## Motivation

## Current tension

Today the orchestrator effectively does two jobs:

1. **Planning / task graph management**
2. **Execution dispatch / workflow control**

That creates several problems:

- The orchestrator becomes bloated.
- Execution logic and work-state logic are mixed together.
- The same component is responsible for both deciding what should happen and ensuring that it happened.
- Parallel execution is possible, but the control loop is still too tightly embedded in the orchestrator's prompt and behavior.

## Why Scion is interesting here

Scion is a good fit for the runtime side of the system because it provides:

- isolated agents in dedicated worktrees
- dedicated home/config per agent
- detached/background execution
- control-plane concepts (Hub, broker, events, status)
- explicit support for OpenCode as a harness

Scion is **not** a replacement for beads. It tracks agent lifecycle and runtime status, not the full work graph or issue semantics we need.

So the integration target is:

> **Beads owns work. Scion owns runtime. A separate executor owns dispatch.**

## Proposed Architecture

## Plane 1: Work State (Beads)

Beads remains the system of record for work.

It owns:

- epics, tasks, bugs, chores, acceptance review tasks
- dependencies between issues
- readiness (`bd ready`)
- discovered work
- scope changes
- acceptance criteria
- decision history via issue descriptions/comments

Beads should answer questions like:

- What work exists?
- What is blocked?
- What is ready now?
- What new work was discovered during review or execution?
- What counts as done?

Scion should **not** replace these concepts.

## Plane 2: Execution Runtime (Scion)

Scion provides the runtime substrate for agents.

It owns:

- agent provisioning
- isolated containers and worktrees
- harness/runtime selection
- background execution
- agent lifecycle state
- transport, messaging, and logs
- agent-level observability

Scion should answer questions like:

- Which agent is running?
- Which agent is waiting for input?
- Which agent failed?
- Which worktree/branch belongs to which run?
- Can we attach to or inspect a running worker?

## Plane 3: Execution Controller (Executor)

The executor is the missing layer between beads and Scion.

It owns:

- polling or subscribing to beads-ready work
- claiming tasks for execution
- launching dedicated Scion workers
- supervising retries / cancellation / timeouts
- deciding when to spawn verification
- recording operational progress back into beads
- correlating a beads issue with a Scion run, branch, and result

This can be implemented as either:

- a long-running service/process
- a special Scion manager agent
- a TUI/CLI application with a persistent control loop

The architecture is stronger if this is treated as a **real controller**, not just another ad hoc prompt.

## Role Definitions

## Orchestrator

The orchestrator becomes a **planner**, not an executor.

Responsibilities:

- discuss and refine work with the user
- create/update beads issues
- maintain issue descriptions and acceptance criteria
- create discovered follow-up work when discussion changes scope
- shape the dependency graph
- define when acceptance review tasks are needed

Non-responsibilities:

- does not run the execution loop
- does not directly spawn tasker/verifier agents for normal planned work
- does not own retries / leases / operational dispatch state

This keeps the orchestrator focused on **work design**, not runtime scheduling.

## Executor

The executor is the operational backbone.

Responsibilities:

- read `bd ready`
- atomically claim or lease work
- start a tasker agent for one issue
- monitor the run
- collect structured output
- decide whether the task reached “implementation complete”
- start verifier when needed
- update operational status back into beads
- create or queue retry / failure handling

The executor should be deterministic and policy-driven.

It should not improvise issue structure. That remains the orchestrator's job.

## Tasker

The tasker is an isolated Scion worker responsible for exactly one implementation task.

Responsibilities:

- execute one beads issue
- modify code/docs/tests in its dedicated worktree
- run relevant quality gates
- self-check against acceptance criteria before returning
- report structured results
- surface newly discovered unrelated work

Non-responsibilities:

- should not own the global work queue
- should not independently go searching for more tasks
- should not be the primary writer of tracker state

## Verifier

The verifier is an isolated Scion worker responsible for validating completed work.

Responsibilities:

- validate that the task meets acceptance criteria
- run verification checks
- inspect the proposed branch/worktree or merged result
- report pass/fail with reasons
- identify follow-up bugs or missing work

The verifier provides independent confidence that “done” is actually done.

## Data Ownership Model

This is the most important design constraint.

## Single-writer principle for beads

If every isolated agent writes directly to beads, the system will become noisy and fragile:

- conflicting tracker edits across branches
- drift between runtime state and work state
- merge noise if beads files live in worktrees
- unclear ownership of issue mutation

Recommended model:

### Orchestrator owns structural mutations

- create issues
- update descriptions
- refine scope
- define dependencies
- create acceptance review tasks
- record planning decisions

### Executor owns operational mutations

- claim task
- mark in progress
- add execution comments/status
- record failure/retry/timeout
- close task when policy says it is complete
- trigger verification comments/state transitions

### Tasker and verifier return structured outputs

Instead of directly mutating beads, workers should usually return a structured report such as:

- success/failure
- summary
- files changed
- branch/worktree/run identifier
- tests run and result
- discovered follow-up work
- verification pass/fail reasons

Then the executor/orchestrator applies the beads updates centrally.

This preserves a clean source of truth.

## Why not let workers update beads directly?

It may still be tempting for convenience, especially since the current agent model often writes issues directly. But with Scion isolation, this becomes much riskier than in a single-session local workflow.

Direct worker writes should be rare and explicit.

## Execution Flow

## 1. Planning flow

```text
User
  ↓
Orchestrator
  ↓
Beads graph created/updated
  ↓
Orchestrator stops
```

Outcome:

- tasks exist
- dependencies are defined
- acceptance review tasks exist where needed
- no execution has happened yet

## 2. Dispatch flow

```text
Executor
  ↓
bd ready
  ↓
claim ready task
  ↓
launch Scion tasker agent
  ↓
watch run / collect result
```

Outcome:

- one ready task is now actively being executed in an isolated environment

## 3. Tasker completion flow

```text
Tasker
  ↓
implements task
  ↓
runs checks + self-review
  ↓
returns structured result
  ↓
Executor evaluates outcome
```

Possible executor actions:

- mark task implementation complete
- request retry
- mark blocked/failed
- create follow-up issues
- queue verifier

## 4. Verification flow

```text
Executor
  ↓
launch Scion verifier agent
  ↓
verifier checks branch/result
  ↓
structured verification result
  ↓
Executor updates beads
```

Possible outcomes:

- verification passed → close task / acceptance review task
- verification failed → create new bug/task and keep parent blocked or not fully complete

## 5. Continuous queue flow

```text
Executor loop
  ↓
check bd ready
  ↓
launch more taskers in parallel when safe
  ↓
launch verifiers when tasks reach verify state
  ↓
repeat
```

This is the point where we get scalable background execution without bloating the orchestrator prompt.

## State Model

The system really has three different state domains:

## 1. Beads work state

Examples:

- open
- blocked
- ready
- in progress
- closed
- acceptance review pending

This is business/workflow state.

## 2. Executor run state

Examples:

- queued
- claimed
- dispatching
- running
- awaiting verification
- verification running
- succeeded
- failed
- timed out
- cancelled
- retry scheduled

This is operational control state.

## 3. Scion runtime state

Examples:

- provisioning
- starting
- running
- waiting_for_input
- completed
- error

This is infrastructure/agent lifecycle state.

These must not be collapsed into one concept.

### Example mapping

| Work State (Beads) | Executor State | Scion State |
|---|---|---|
| ready | queued | none |
| in progress | running | running / executing |
| open (verify needed) | awaiting verification | completed |
| open (verification active) | verification running | running / executing |
| closed | succeeded | completed / stopped |
| open | failed / retry scheduled | error / completed |

The executor is the translation layer between these states.

## Branch and Workspace Strategy

Scion already provides isolated worktrees. We need policy on top of that.

## Recommended strategy

- one Scion agent run = one worktree
- one implementation task = one tasker branch/worktree
- verifier checks either:
  - the tasker branch directly, or
  - an integration branch created by the executor

### Open question: verification target

There are two main options:

#### Option A: Verify tasker branch directly

Pros:

- simplest
- fastest
- verifier sees exactly what tasker produced

Cons:

- verification happens before integration
- branch-specific quirks may differ from merged state

#### Option B: Verify integration branch

Pros:

- closer to final reality
- better for catching integration conflicts

Cons:

- more moving parts
- executor must manage an extra branch/staging area

Likely v1 answer: **verify tasker branch directly**, then add integration-branch verification later if needed.

## Result Contract for Workers

Tasker and verifier outputs should be machine-friendly, not only prose.

## Tasker output shape (conceptual)

```json
{
  "issue_id": "bd-123",
  "run_id": "run-456",
  "status": "success",
  "summary": "Implemented support for X",
  "branch": "scion/task/bd-123",
  "files_changed": ["src/foo.ts", "test/foo.test.ts"],
  "checks": [
    {"name": "unit-tests", "status": "passed"},
    {"name": "typecheck", "status": "passed"}
  ],
  "discovered_work": [
    {"title": "Follow-up bug in Y", "reason": "Found during bd-123"}
  ]
}
```

## Verifier output shape (conceptual)

```json
{
  "issue_id": "bd-123",
  "run_id": "verify-789",
  "status": "failed",
  "summary": "Acceptance criterion 3 not satisfied",
  "checks": [
    {"name": "acceptance-review", "status": "failed"}
  ],
  "findings": [
    "The user-facing error state is still missing.",
    "Regression test for null input was not added."
  ],
  "recommended_follow_up": [
    {"title": "Add missing null-input regression test", "type": "task"}
  ]
}
```

The exact serialization does not matter yet. The key point is that the executor can reliably interpret it.

## Scion Fit Assessment

## Good fit

Scion looks like a strong fit for:

- dedicated tasker/verifier runtime
- parallel isolated workers
- long-running or background execution
- per-agent specialization via templates
- agent lifecycle monitoring
- detached or remote execution

## Partial fit

Scion partially supports:

- coordination through Hub/events/control channel
- runtime-level status and scheduling primitives
- messaging and supervision

But those are not full workflow semantics.

## Not a native fit

Scion does **not** appear to natively replace:

- beads issue graph
- dependency semantics
- discovered-from task semantics
- acceptance review philosophy
- issue ownership / work-state policy

So the integration should not try to force Scion into becoming the task system.

## UI / Control Panel Concept

The executor becomes much more useful if paired with a dedicated UI or TUI.

The user described this as a “special Scion agent runner executor” with a UI for control. That is a promising direction.

## Core views

### 1. Work queue view

Show beads state:

- ready
- blocked
- in progress
- awaiting verification
- recently completed

### 2. Runtime view

Show Scion state:

- active agents
- current phase/activity
- waiting-for-input
- failed/stalled runs
- branch/worktree mapping

### 3. Correlation view

Show the mapping:

- `bd-123` → tasker run X → branch Y → verifier run Z

### 4. Intervention view

Allow actions like:

- retry task
- cancel run
- attach to agent
- force verification
- mark task blocked
- escalate to orchestrator / human discussion

### 5. Audit / history view

Show:

- when issue was claimed
- who/what executed it
- what result came back
- what follow-up issues were created
- why something failed or retried

This UI would help make the system understandable and trustworthy.

## Operational Policies

## Claim / lease model

The executor must prevent double-dispatch.

Minimum requirement:

- atomically claim a ready issue before launch
- record that claim in a way visible to the controller
- recover stale claims if a run crashes or times out

This is a crucial implementation detail. Without it, parallelism will cause duplicate execution.

## Retry policy

Suggested policy:

- retry only on operational failure (container crash, transient tool failure, timeout)
- do **not** silently retry semantic failure (tests fail, acceptance criteria missing) more than a small configured number of times
- create or update work items for substantive failures instead of looping forever

## Verification policy

Hard rule:

> A task is not closed only because a tasker said “done.”

Close only when one of the following is true:

- verifier passed, or
- policy says the task type can be auto-accepted by objective checks

Even then, explicit acceptance-review tasks remain useful for larger work.

## Human intervention policy

The system should know when to stop and ask for help.

Examples:

- repeated verifier failure
- repeated execution timeout
- ambiguous requirements
- merge/integration conflicts
- dangerous or destructive actions

The executor should escalate instead of improvising indefinitely.

## Non-Goals

This integration should **not** initially try to:

- replace beads with Scion state
- let every worker freely mutate the issue graph
- make the orchestrator a background scheduler
- build a fully autonomous no-human-needed system on day one
- solve distributed multi-controller consensus immediately

Start with a clean single-controller architecture first.

## Incremental Implementation Path

## Phase 1: Architecture clarification

- formalize orchestrator as planner-only for structured work
- define executor responsibilities
- define worker result contracts
- define branch/worktree policy

## Phase 2: Minimal executor

- poll `bd ready`
- claim one task
- launch one Scion tasker
- collect result
- surface status in a simple terminal UI

## Phase 3: Add verifier loop

- queue verifier after tasker success
- close tasks only after verification
- create follow-up work on failed verification

## Phase 4: Add richer control plane

- retries
- timeouts
- cancellation
- attach/log streaming from UI
- better mapping of issue ↔ run ↔ branch

## Phase 5: Multi-agent throughput

- parallel dispatch of independent ready tasks
- priority-aware scheduling
- smarter queuing rules
- operator intervention tools

## Open Questions

1. **Should the executor be a service, a CLI/TUI loop, or a privileged Scion manager agent?**
2. **What is the exact claim/lease mechanism for beads-backed execution?**
3. **Should verifier inspect tasker branches directly or an executor-managed integration branch?**
4. **What exact schema should worker result contracts use?**
5. **Which task classes can skip explicit verifier review, if any?**
6. **How should discovered work from tasker/verifier be routed — directly to beads, or through the executor/orchestrator?**
7. **How much operational state should be stored in beads comments vs a separate executor state store?**
8. **Should there be one global executor, or one per project/grove?**
9. **How should commit/push responsibility be handled in the executor model?**
10. **What does “done” mean for the full end-to-end session when multiple workers are running concurrently?**

## Working Thesis

The most promising direction is:

> **Beads is the source of truth for work.**
>
> **Scion is the source of truth for agent runtime.**
>
> **A dedicated executor connects the two.**

Under this model:

- the **orchestrator** becomes a planner and issue-graph editor
- the **executor** becomes the scheduler/controller
- **tasker** and **verifier** become dedicated Scion workers
- a UI/TUI provides operational visibility and control

This is a cleaner architecture than asking the orchestrator to both design work and directly execute the full queue.

## Discussion Starters for Next Session

If we continue this later, the best next questions are probably:

1. What should the executor's exact state machine be?
2. Where should operational state live?
3. How should beads claims/leases work?
4. What should the first minimal UI look like?
5. Should the first prototype verify tasker branches directly?
