# Beads Integration Research: Advanced Workflows & Skills Integration

## Executive Summary

This document details advanced beads workflows, the skill integration ecosystem (particularly superpowers), and advanced features (molecules/chemistry, gastown) that extend beyond basic task tracking.

---

## 1. Superpowers Skills Framework Integration

### What is Superpowers?

**Repository:** https://github.com/obra/superpowers (50.8k stars)
**Description:** "An agentic skills framework & software development methodology that works"

**Core Philosophy:**
- Test-Driven Development (write tests first, always)
- Systematic over ad-hoc (process over guessing)
- Complexity reduction (simplicity as primary goal)
- Evidence over claims (verify before declaring success)

### The Superpowers Workflow

```
1. brainstorming (skill)
   ↓ Refines rough ideas through questions
   ↓ Explores alternatives
   ↓ Presents design in sections for validation
   ↓ Saves design document
   
2. using-git-worktrees (skill)
   ↓ Creates isolated workspace on new branch
   ↓ Runs project setup
   ↓ Verifies clean test baseline
   
3. writing-plans (skill)
   ↓ Breaks work into bite-sized tasks (2-5 min each)
   ↓ Every task has exact file paths, complete code
   ↓ Verification steps
   
4. subagent-driven-development OR executing-plans (skill)
   ↓ Dispatches fresh subagent per task
   ↓ Two-stage review: spec compliance, then code quality
   ↓ OR executes in batches with human checkpoints
   
5. test-driven-development (skill)
   ↓ Enforces RED-GREEN-REFACTOR cycle
   ↓ Write failing test → watch fail → minimal code → watch pass
   
6. requesting-code-review (skill)
   ↓ Reviews against plan
   ↓ Reports issues by severity
   
7. finishing-a-development-branch (skill)
   ↓ Verifies tests
   ↓ Presents options (merge/PR/keep/discard)
   ↓ Cleans up worktree
```

### Superpowers Skills Library

**Testing:**
- test-driven-development - RED-GREEN-REFACTOR cycle

**Debugging:**
- systematic-debugging - 4-phase root cause process
- verification-before-completion - Ensure it's actually fixed

**Collaboration:**
- brainstorming - Socratic design refinement
- writing-plans - Detailed implementation plans
- executing-plans - Batch execution with checkpoints
- dispatching-parallel-agents - Concurrent subagent workflows
- requesting-code-review - Pre-review checklist
- receiving-code-review - Responding to feedback
- using-git-worktrees - Parallel development branches
- finishing-a-development-branch - Merge/PR decision workflow
- subagent-driven-development - Fast iteration with reviews

**Meta:**
- writing-skills - Create new skills
- using-superpowers - Introduction to skills system

---

## 2. The @chidev Integration Pattern

### Source
**From Issue #225:** https://github.com/steveyegge/beads/issues/225#issuecomment-3705054544

### What @chidev Built

```
"I created a skill that uses the Ralph Wiggum plugin and adversarial 
validation - it works wonderfully

Ralph wiggum is an autonomous coding loop plugin from claude official 
that uses the stop hook. It would be a great place to put some beads 
specific instructions 

The skill is called "design to bd" and is inspired by superpowers 
brainstorming and writing a plan, this combo with beads and the ralph 
wiggum plugin makes all my context issues go away"
```

### The Workflow Components

**1. Superpowers Brainstorming Skill**
- Socratic questioning to refine design
- Explores alternatives
- Presents design in digestible sections
- User validates each section
- Produces: Design document

**2. Superpowers Writing Plans Skill**
- Takes approved design
- Breaks into 2-5 minute tasks
- Each task has:
  - Exact file paths
  - Complete code snippets
  - Verification steps
- Produces: Detailed implementation plan

**3. Custom "design to bd" Skill (by @chidev)**
- Takes output from brainstorming + writing-plans
- Converts plan into beads structure:
  - Epic for overall goal
  - Tasks for each plan step
  - Dependencies between tasks
- Integrates with Ralph Wiggum plugin

**4. Ralph Wiggum Plugin**
- Official Claude autonomous coding loop
- Uses stop hook for checkpoints
- Executes tasks autonomously
- @chidev adds beads-specific instructions here

**5. Adversarial Validation**
- Validates work against plan
- Catches deviations early
- Ensures spec compliance

### The Complete Pipeline

```
User Request
    ↓
[Superpowers: brainstorming skill]
    ↓ Socratic design refinement
    ↓ User approves design document
    ↓
[Superpowers: writing-plans skill]  
    ↓ Breaks design into tasks
    ↓ Adds file paths, code, verification
    ↓
[@chidev: "design to bd" skill]
    ↓ Converts plan to beads epic + tasks
    ↓ Sets up dependencies
    ↓ Creates beads structure
    ↓
[Ralph Wiggum: autonomous execution]
    ↓ Executes tasks with beads tracking
    ↓ Uses stop hook for checkpoints
    ↓ Beads-specific instructions guide execution
    ↓
[Adversarial Validation]
    ↓ Validates against original plan
    ↓ Catches deviations
    ↓
Completed Feature (with full beads history)
```

### Why This Works

**Problem Solved:**
> "this combo with beads and the ralph wiggum plugin makes all my context issues go away"

**Key Insights:**

1. **Design-First Approach**
   - Superpowers forces design before code
   - User validation at design stage (cheap to change)
   - Plan provides guardrails for autonomous execution

2. **Plan → Beads Translation**
   - Structured plan maps naturally to beads hierarchy
   - Each plan step = one bead
   - Dependencies from plan = beads dependencies

3. **Autonomous Execution with Memory**
   - Ralph Wiggum provides autonomous loop
   - Beads provides persistent memory
   - Stop hooks allow human checkpoints
   - Context never gets lost

4. **Validation Against Source**
   - Adversarial validation compares work to plan
   - Catches scope creep early
   - Ensures plan compliance

### Implementation Details

**The "design to bd" skill likely does:**

```bash
# Input: Plan from writing-plans skill
# Example plan structure:
# 1. Create user model (files: models/user.js)
# 2. Add JWT middleware (files: middleware/auth.js)
# 3. Implement login endpoint (files: routes/auth.js)
# Dependencies: 3 depends on 2, 2 depends on 1

# Skill translates to:
bd create "User Authentication" -t epic -p 0

# Create tasks from plan steps
bd create "Create user model" -t task -p 0 --design "
Files: models/user.js
Implementation: [code from plan]
Verification: Run user.test.js
"

bd create "Add JWT middleware" -t task -p 0 --design "
Files: middleware/auth.js
Implementation: [code from plan]
Verification: Run auth.test.js
Depends on: user model complete
"

bd create "Implement login endpoint" -t task -p 0 --design "
Files: routes/auth.js
Implementation: [code from plan]
Verification: curl POST /login test
Depends on: JWT middleware complete
"

# Set dependencies (as specified in plan)
bd dep add jwt-middleware user-model
bd dep add login-endpoint jwt-middleware

# Link all to epic
bd dep add user-model auth-epic --type parent-child
bd dep add jwt-middleware auth-epic --type parent-child
bd dep add login-endpoint auth-epic --type parent-child

# Ready for execution
bd ready  # Shows: user-model (Ready Front 1)
```

**Ralph Wiggum integration:**
- Reads `bd ready` to get next task
- Executes task following beads design notes
- Updates beads status (`in_progress` → `closed`)
- Uses stop hook to pause for validation
- Moves to next ready task

**Adversarial validation:**
- Compares completed code to plan's "Implementation"
- Checks files match plan's "Files"
- Verifies verification steps pass
- Flags deviations for human review

### What Makes This Different from Standard Beads

**Standard Beads Workflow:**
- User describes goal
- Agent creates beads structure
- Agent implements tasks
- Manual status updates
- Context can drift

**@chidev's Enhanced Workflow:**
- Superpowers forces formal design (not ad-hoc)
- Plan is detailed enough for junior engineer
- Beads structure auto-generated from plan
- Ralph Wiggum provides autonomous execution
- Adversarial validation prevents drift
- Stop hooks preserve human control

### Key Takeaway

The integration isn't just "use beads with skills" — it's a **formal pipeline**:

```
Design (Superpowers) → Plan (Superpowers) → Beads Structure (Custom) 
→ Autonomous Execution (Ralph Wiggum) → Validation (Adversarial)
```

Each stage has **structured output** that feeds the next stage. This prevents the informal "agent does whatever" problem that causes context drift.

---

## 3. Advanced Beads Features: Molecules & Chemistry

### The Chemistry Metaphor

Beads v0.34.0+ introduces "molecular chemistry" for reusable templates and ephemeral workflows.

**Three Phases:**

| Phase | Name | Storage | Git Sync | Use Case |
|-------|------|---------|----------|----------|
| **Solid** | Proto | `.beads/` | Yes | Reusable template |
| **Liquid** | Mol | `.beads/` | Yes | Persistent instance |
| **Vapor** | Wisp | `.beads-wisp/` | No | Ephemeral instance |

### Phase Transitions

```
                    PROTO (Solid)
                Reusable template
                .beads/ + template label
                         │
        ┌────────────────┼────────────────┐
        │                                 │
        ▼                                 ▼
  MOL (Liquid)                      WISP (Vapor)
  bd pour                           bd wisp create
  Persistent                        Ephemeral
  .beads/                           .beads-wisp/
  Git synced                        Gitignored
        │                                 │
        │                         ┌───────┴───────┐
        ▼                         │               │
    CLOSE                         ▼               ▼
    normally                  SQUASH           BURN
                           → digest         → gone
                           
                    DISTILL
               Extract proto from
               ad-hoc epic
```

### When to Use Each Phase

**Protos (Templates):**
- Repeatable patterns (releases, reviews, onboarding)
- Team knowledge capture (tribal knowledge as executable templates)
- Cross-session persistence

**Example:**
```bash
# Create release template
bd create "Release Workflow v{{version}}" --type epic --label template
bd create "Run tests for {{component}}" --type task
bd create "Update changelog" --type task
bd create "Tag release v{{version}}" --type task

# Spawn instance
bd mol pour release-template --var version=2.0.0 --var component=api
# Creates real issues: "Release Workflow v2.0.0", "Run tests for api", etc.
```

**Mols (Persistent Instances):**
- Features, bugs, specs needing audit trail
- Work spanning multiple sessions
- Team collaboration

**Wisps (Ephemeral Instances):**
- Operational loops (patrol cycles, health checks)
- One-shot orchestration (temporary coordination)
- Diagnostic runs (debugging with no archival value)
- High-frequency work (would create DB noise)

**Example:**
```bash
# Ephemeral code review checklist
bd wisp create pr-review --var pr=123

# Work through review (findings tracked in wisp)

# End: promote real findings, discard noise
bd mol squash <wisp-id>  # Creates permanent issues for actual bugs
# OR
bd mol burn <wisp-id>    # No value, delete everything
```

### Real-World Chemistry Patterns

**Pattern 1: Grooming Wisp**
```bash
# Periodic backlog maintenance
bd wisp create grooming --var date="2025-01-02"

# Work through: check stale, find duplicates, verify issues
# Track actions in wisp notes

# End: capture summary
bd mol squash <wisp-id>  
# Creates digest: "Closed 3 stale, added 5 relationships, 
#                  archived 2 obsolete"
```

**Why wisp?** Grooming is operational — don't need permanent "reviewed stale items" issues.

**Pattern 2: Research Spike Wisp**
```bash
# Time-boxed exploration (2 hours)
bd wisp create spike --var topic="GraphQL pagination strategies"

# Explore, take notes in wisp child issues
# Track sources, findings, dead ends

# End: decide outcome
bd mol squash <wisp-id>  # Valuable → creates research summary
# OR
bd mol burn <wisp-id>    # Dead end → no trace in history
```

**Why wisp?** Research might lead nowhere. Don't pollute DB with abandoned explorations.

**Pattern 3: Release Proto → Mol**
```bash
# One-time: Create release template
bd formula create release-workflow
bd create "Run {{test_suite}} tests" --type task
bd create "Update version to {{version}}" --type task
bd create "Build artifacts" --type task
bd create "Deploy to {{environment}}" --type task
bd create "Smoke test {{environment}}" --type task

# Reusable: Spawn for each release
bd mol pour release-workflow \
  --var version=2.1.0 \
  --var test_suite=integration \
  --var environment=production

# Creates full release checklist with variables filled in
bd ready  # Shows first task in Ready Front
```

### Molecule Commands Reference

```bash
# Proto management
bd formula list                      # List all templates
bd mol show mol-release              # Show template structure

# Spawning
bd mol spawn mol-patrol              # Creates wisp (default)
bd mol pour mol-feature              # Creates mol (persistent)
bd mol wisp mol-health-check         # Explicit wisp

# With variables
bd mol spawn mol-release --var version=2.0 --var env=prod

# Bonding (combining molecules)
bd mol bond A B                      # B runs after A
bd mol bond A B --type parallel      # B runs alongside A
bd mol bond A B --type conditional   # B runs if A fails

# Ending work
bd close <mol-id>                    # Mol: close normally
bd mol squash <wisp-id>              # Wisp → digest (preserve findings)
bd mol burn <wisp-id>                # Wisp → gone (no value)

# Extract template from ad-hoc work
bd mol distill bd-abc123 --as "Release Workflow"
```

### Molecule Usage Statistics

**From GitHub issues search:**
- Molecule/chemistry mentions: Rare in general issues
- Primary usage: Internal beads development (self-hosting)
- Some gastown-related issues (advanced multi-agent)

**Key insight:** Molecules are an **advanced feature** used by:
1. Beads maintainers (self-hosting, meta-workflows)
2. Gastown users (multi-agent coordination)
3. Power users with highly repetitive workflows

**For most users:**
- Basic beads (epics, tasks, dependencies) = 95% of use cases
- Molecules = 5% (when you have repeatable templates)

---

## 4. Gastown (Multi-Agent Coordination)

### What is Gastown?

**Gastown** is an advanced beads extension for multi-agent/multi-team coordination.

**From Paddo's article:** [GasTown and the Two Kinds of Multi-Agent](https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/)

### Key Concepts

**Additional Issue Types:**
- `agent` - Represents an AI agent
- `role` - Role definition for agents
- `rig` - Team/group of agents
- `convoy` - Coordinated agent group
- `message` - Inter-agent messaging

**Gastown Features:**
- `gt` CLI (gastown tools, separate from `bd`)
- Multi-repo hydration (shared types across repos)
- Agent hooks (agents can self-assign work)
- Mail system (async agent messaging)
- Routes configuration (agent routing rules)

### Gastown Usage Statistics

**From GitHub search:**
- 20 gastown-related issues
- Most are bugs/integration issues
- Used primarily by beads core development team
- Experimental/cutting-edge territory

**Example issues:**
- "Multi-repo hydration fails validation"
- "gt mail send fails with 'message' type validation"
- "bd dolt push fails in crew worktree with redirect"

### Gastown vs Basic Beads

| Feature | Basic Beads | Gastown |
|---------|-------------|---------|
| Issue types | task, bug, epic, feature | + agent, role, rig, convoy, message |
| CLI | `bd` | `bd` + `gt` |
| Use case | Single developer, team coordination | Multi-agent swarms, agent-to-agent |
| Complexity | Low-medium | High |
| Maturity | Stable (v0.49+) | Experimental |
| Documentation | Comprehensive | Sparse |

### When to Use Gastown

**Use Gastown if:**
- Building multi-agent systems with coordination
- Need agent-to-agent messaging
- Want agents to self-assign work (hooks)
- Building agent swarms/crews

**Don't use Gastown if:**
- Just need persistent task tracking (use basic beads)
- Single developer workflow
- Learning beads for first time

**Reality check:** Gastown is **niche**. Even in beads community, adoption is minimal outside core maintainers.

---

## 5. Community Adoption: What People Actually Use

### Feature Adoption Breakdown

Based on GitHub issues, community discussions, and skill documentation:

| Feature | Adoption | Who Uses It |
|---------|----------|-------------|
| **Basic beads** (task, bug, epic) | **Very High** | Everyone |
| **Dependencies** (bd dep add) | **High** | Most users |
| **Session workflows** (ready/show/close) | **High** | Most users |
| **Compaction survival** (notes field) | **High** | Most users |
| **TodoWrite integration** | **High** | Most users |
| **Molecules** (proto/mol/wisp) | **Low** | Power users, maintainers |
| **Chemistry patterns** (pour/squash/burn) | **Very Low** | Mostly internal use |
| **Gastown** (gt, agents, convoy) | **Very Low** | Core team, experimental |

### Why Molecules Aren't Widely Adopted

**Reasons:**
1. **Steep learning curve** - Chemistry metaphor adds complexity
2. **Not needed for most workflows** - Basic beads solve 95% of problems
3. **Documentation gap** - Advanced features less documented
4. **Discoverability** - Most users don't know molecules exist

**When molecules shine:**
- Release checklists (same steps every time)
- Code review templates (standardize process)
- Onboarding workflows (repeatable for each new hire)
- Health check patrols (routine operational work)

**Most users just:**
- Create epics for features
- Break into tasks
- Track dependencies
- Update status
- Write good notes for compaction survival

### The Skills Integration Gap

**What we found:**
- Superpowers has sophisticated skills ecosystem (50k stars)
- @chidev built custom "design to bd" integration
- **But: No public, reusable skill for this integration**

**What's missing:**
- Public "superpowers-to-beads" skill
- Documentation of integration patterns
- Templates for plan → beads conversion

**Opportunity:**
- Create skill that bridges superpowers + beads
- Standardize the pipeline @chidev described
- Make it discoverable/reusable

---

## 6. Recommendations for OpenCode Integration

### What to Integrate

**High Priority (High Value, High Adoption):**
1. ✅ Basic beads workflow (already have this)
2. ✅ Dependency tracking (already have this)
3. ✅ Session protocols (already have this)
4. ✅ Compaction survival patterns (already have this)
5. ⚠️ TodoWrite integration guidance (could enhance)

**Medium Priority (Medium Value, Lower Adoption):**
6. ⚠️ Molecules/chemistry (document, but don't emphasize)
   - Explain it exists
   - Provide examples
   - Don't make it core workflow

**Low Priority (Niche, Experimental):**
7. ❌ Gastown (skip for now)
   - Too experimental
   - Minimal adoption
   - High complexity

### Skills Integration Strategy

**Option A: Reference Superpowers (Recommended)**
- Document the integration pattern
- Point users to superpowers
- Don't duplicate their skills
- Show how to bridge superpowers → beads

**Option B: Create Lightweight Adapter Skill**
- Build "superpowers-bridge" skill
- Takes writing-plans output → generates beads structure
- Lightweight, focused on translation
- Users still use superpowers for design/planning

**Option C: Full Integration (High Effort)**
- Embed superpowers-like skills in opencode-coder
- Maintain our own versions
- ❌ Not recommended (maintenance burden)

### Recommended Approach

**For opencode-coder:**

1. **Document the integration patterns** (this doc)
   - Show superpowers workflow
   - Explain @chidev's approach
   - Provide bridge template

2. **Enhance TodoWrite integration guidance**
   - Clarify temporal layering (TodoWrite = hour, beads = month)
   - Show handoff pattern
   - Emphasize when to transition

3. **Add molecules documentation** (optional section)
   - "Advanced: Reusable Templates"
   - Explain proto/mol/wisp
   - Show 2-3 patterns (release, review, spike)
   - Make clear it's optional/advanced

4. **Skip gastown** (for now)
   - Too niche, too experimental
   - Revisit if adoption grows

5. **Create example skill** (low priority)
   - "superpowers-beads-bridge" skill
   - Takes structured plan
   - Generates beads epic + tasks
   - Optional for users who want automation

---

## 7. The Missing Piece: Public Skills

### What @chidev Built (But Hasn't Shared)

From Issue #225:
> "The skill is called "design to bd" and is inspired by superpowers 
> brainstorming and writing a plan"

**Status:** 
- Mentioned in December 2025
- Not publicly released
- Source not available
- Others asking for it (Issue #225 comments)

### What Would Make This Valuable

**A public "superpowers-beads-bridge" skill would:**

1. **Take structured input** (from superpowers writing-plans)
2. **Generate beads structure:**
   ```bash
   # Epic for overall goal
   bd create "Auth System" -t epic -p 0
   
   # Tasks from plan sections
   for each plan_task in plan:
     bd create plan_task.title -t task -p plan_task.priority \
       --design "Files: {plan_task.files}\n{plan_task.implementation}" \
       --acceptance "{plan_task.verification}"
   
   # Dependencies from plan
   for each dependency in plan.dependencies:
     bd dep add dependency.child dependency.parent
   ```

3. **Preserve plan fidelity:**
   - File paths from plan → beads design field
   - Code snippets → design field
   - Verification steps → acceptance criteria

4. **Enable autonomous execution:**
   - Ralph Wiggum (or any executor) reads beads
   - Structured enough for autonomous work
   - Checkpoints via `bd ready`

### Why No One Has Built This (Yet)

**Barriers:**
1. **Superpowers is new** (launched late 2025)
2. **Beads molecules are advanced** (learning curve)
3. **Integration complexity** (need to understand both ecosystems)
4. **No formal spec** (no API contract between them)

**Opportunity:**
- Be first to create public integration
- Document the pattern
- Make it reusable
- Lower barrier for others

---

## 8. Action Items for OpenCode

### Short Term (This Week)

1. ✅ **Document integration patterns** (this doc)
2. ⚠️ **Add molecules section to docs** (optional advanced feature)
   - Location: `docs/advanced/molecules.md`
   - Content: Proto/mol/wisp explained, 3 example patterns
3. ⚠️ **Enhance TodoWrite integration guidance**
   - Location: Update existing beads workflow docs
   - Content: Temporal layering pattern, handoff workflow

### Medium Term (Next Sprint)

4. ⚠️ **Create example "plan-to-beads" script**
   - Simple Python/bash script
   - Takes JSON plan → generates `bd create` commands
   - Not a full skill, just an example
   - Shows how @chidev's pattern works

5. ⚠️ **Document superpowers integration**
   - Location: `docs/integrations/superpowers.md`
   - Content: Full pipeline, bridging strategy

### Long Term (Future)

6. ⚠️ **Consider building public skill** (if demand exists)
   - "superpowers-beads-bridge" skill
   - Formal plan → beads translation
   - Submit to superpowers marketplace

7. ❌ **Skip gastown integration** (unless user requests)
   - Too experimental
   - Too niche
   - Revisit in 6 months

---

## 9. Conclusion

### Key Findings

1. **Superpowers integration is real** - @chidev's approach works
2. **Not publicly available** - Custom skill, not shared
3. **Molecules are advanced** - Useful but not widely adopted
4. **Gastown is experimental** - Skip for now
5. **Basic beads = 95% of value** - Most users don't need advanced features

### What Makes Beads Powerful (Even Without Advanced Features)

**The core workflow:**
- Multi-session persistence
- Dependency tracking
- Compaction survival
- TodoWrite integration
- Session handoff

**This solves:**
- Context loss across sessions
- Complex dependencies
- Long-horizon projects
- Team collaboration

**You don't need molecules or gastown for this.**

### For OpenCode Users

**Recommend:**
- Master basic beads first
- Integrate with TodoWrite effectively
- Use superpowers for design (if desired)
- Consider molecules only if you have repeatable templates
- Skip gastown unless building multi-agent systems

**The @chidev pattern is valuable because:**
- It's a **formal pipeline** (not ad-hoc)
- Each stage has **structured output**
- Prevents **context drift**
- Enables **autonomous execution** with **human control**

**But you can achieve similar results with:**
- Good design documents
- Detailed beads notes
- Clear acceptance criteria
- Regular status updates

The skill automation just makes it more systematic and less error-prone.

---

## References

- **Beads Repository:** https://github.com/steveyegge/beads
- **Beads Skill:** https://github.com/steveyegge/beads/tree/main/claude-plugin/skills/beads
- **Superpowers:** https://github.com/obra/superpowers
- **Issue #225 (chidev):** https://github.com/steveyegge/beads/issues/225#issuecomment-3705054544
- **Issue #429 (adoption):** https://github.com/steveyegge/beads/issues/429
- **Paddo's Gastown Article:** https://paddo.dev/blog/gastown-two-kinds-of-multi-agent/
- **Molecules Resource:** `.claude-plugin/skills/beads/resources/MOLECULES.md`
- **Chemistry Patterns:** `.claude-plugin/skills/beads/resources/CHEMISTRY_PATTERNS.md`
