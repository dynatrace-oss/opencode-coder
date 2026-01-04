# Beads Agent Workflow Summary

This document summarizes a clean, Beads-style multi-agent workflow using:
- one planning (master) agent
- three specialized sub-agents
- minimal states
- labels and gates instead of complex workflows

---

## Agents and Responsibilities

### 1. Planning Agent (Master)
**Role**
- Primary interface with the human user
- Owns planning and structure

**Responsibilities**
- Create and manage `epic`, `feature`, `task`, `bug`, and `chore` beads
- Break epics into tasks (optionally using molecules)
- Apply priority and routing labels
- Decide when review or verification is needed

---

### 2. Task Implementor Agent
**Role**
- Executes work

**Responsibilities**
- Picks up `task` and `bug` beads
- Implements code / changes
- Closes tasks when work is complete *as claimed*
- Does not reopen closed work

**Key Rule**
> Closing a task means “implementation complete,” not “perfect or accepted.”

---

### 3. Task Reviewer Agent
**Role**
- Reviews *plans*, not implementations

**Trigger**
- Any `task` or `epic` labeled: `need:review`

**Responsibilities**
- Review structure, completeness, and logic of plans
- Does NOT approve via state changes
- Produces concrete outputs:
  - `message` (feedback, rationale)
  - `task` (missing or improved work)
  - `gate` (decision or constraint needed)
  - `bug` (rare, for planning inconsistencies)

---

### 4. Task Verifier Agent
**Role**
- Verifies outcomes and acceptance

**Trigger**
- Verification gates (usually at epic level)

**Responsibilities**
- Owns verification `gate` beads
- Performs acceptance / validation
- Closes gates when criteria are met
- Creates new `bug` or `task` beads if issues are found

---

## Labels / Tags

### `need:review`
- Can be applied to **tasks or epics**
- Signals that the **reviewer agent must review**
- Used instead of workflow states
- Cheap, explicit routing signal

Optional future tags (not required):
- `risk:high`
- `area:auth`
- `complexity:l`

---

## Gates (Verification Pattern)

### Epic Acceptance Gate
- Every epic creates **one acceptance gate**
- Example:
  - `gate: epic acceptance`
- Owner: **Verifier agent**
- Epic is considered complete when:
  - all child tasks are closed
  - all gates are closed

### Optional Additional Gates
- `gate: security review`
- `gate: migration rehearsal`
- `gate: performance check`

Gates represent *blocking conditions*, not states.

---

## Review vs Verification (Key Distinction)

### Review
- Happens **before or during implementation**
- Checks *plan quality*
- Triggered by `need:review`
- Outputs new beads

### Verification
- Happens **after implementation**
- Checks *result quality*
- Implemented via gates
- Outputs bugs/tasks if needed

---

## State Model (Intentionally Minimal)

Beads uses only:
- `open`
- `in progress`
- `closed`

No states like:
- “blocked”
- “in review”
- “QA”

Those concepts are modeled using:
- labels
- gates
- messages
- new issues

---

## Core Philosophy

- Closed work is not reopened
- Disagreement creates **new beads**, not state rewrites
- Structure replaces workflow
- History is immutable
- Agents are predictable

---

## Typical Flow

1. Planner creates epic + tasks
2. Planner adds `need:review` where appropriate
3. Reviewer agent reviews → emits tasks/messages/gates
4. Implementor completes tasks → closes them
5. Epic acceptance gate blocks closure
6. Verifier validates → closes gate or creates bugs/tasks
7. Epic closes automatically when everything underneath is closed

---

## One-Sentence Rule

> In Beads, review and verification produce new work — they do not rewrite old work.
