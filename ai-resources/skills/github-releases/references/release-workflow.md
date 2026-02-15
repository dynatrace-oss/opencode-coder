# Release Workflow

Complete process for creating a GitHub release.

## Prerequisites

Before starting:

1. **Load project-specific instructions** from `docs/RELEASING.md`
2. Verify environment: `bash scripts/check-release-prereqs.sh`

Project-specific instructions override the generic phases below.

## MANDATORY: Create Release Structure

Before executing ANY release steps, you MUST:

1. Create a parent task for this release (e.g., "Release v1.2.3")
2. Create child tasks for EACH phase below, linked with `--parent`
3. Add sequential dependencies so tasks unlock in order
4. Execute tasks using subagents (beads-task-agent)

**Why**: This prevents context loss, ensures all steps are tracked, and enables verification. Only the first task is "ready" initially—each task unlocks the next.

DO NOT execute release steps directly. Create the structure first, then delegate.

### Creating the Release Structure

```bash
# 1. Create parent release task
bd create --title="Release v1.2.3" --type=task

# 2. Create child tasks with --parent (replace PARENT_ID with actual ID)
bd create --title="Quality Gates for v1.2.3" --type=task --parent=PARENT_ID
bd create --title="Documentation Check for v1.2.3" --type=task --parent=PARENT_ID
bd create --title="Version Bump to v1.2.3" --type=task --parent=PARENT_ID
bd create --title="Create GitHub Release v1.2.3" --type=task --parent=PARENT_ID
bd create --title="Write Release Notes for v1.2.3" --type=task --parent=PARENT_ID
bd create --title="Release Verification v1.2.3" --type=task --parent=PARENT_ID

# 3. Add sequential dependencies (each task depends on the previous)
# Use actual task IDs from the create output
bd dep add DOC_ID QUALITY_ID --type blocks      # Docs blocked by Quality Gates
bd dep add VERSION_ID DOC_ID --type blocks      # Version blocked by Docs
bd dep add RELEASE_ID VERSION_ID --type blocks  # Release blocked by Version
bd dep add NOTES_ID RELEASE_ID --type blocks    # Notes blocked by Release
bd dep add VERIFY_ID NOTES_ID --type blocks     # Verify blocked by Notes
```

### Example Release Structure

```
Task: Release v1.2.3 (parent)
│
├── Task: Quality Gates for v1.2.3        ← READY (no dependencies)
│     ↓ blocks
├── Task: Documentation Check for v1.2.3  ← blocked until Quality Gates done
│     ↓ blocks
├── Task: Version Bump to v1.2.3          ← blocked until Docs done
│     ↓ blocks
├── Task: Create GitHub Release v1.2.3    ← blocked until Version done
│     ↓ blocks
├── Task: Write Release Notes for v1.2.3  ← blocked until Release done
│     ↓ blocks
└── Task: Release Verification v1.2.3     ← blocked until Notes done
```

**Key point**: Only "Quality Gates" shows as ready initially. As you close each task, the next one becomes unblocked and ready.

## Execution: Use Task Agents

Create all tasks first, then execute them sequentially using beads-task-agent.

**DO NOT run release commands directly.** Create a task with the commands, then spawn an agent to execute it.

### For each task:
1. Create the task with detailed instructions
2. Spawn beads-task-agent: "Execute task <task-id>"
3. Wait for completion
4. Verify it succeeded before moving to the next task

### DO NOT do this:
❌ Running test commands directly
❌ Running build commands directly
❌ Running git tag/push commands directly
❌ Running gh release commands directly

### DO this instead:
✅ Create task with commands in instructions
✅ Spawn beads-task-agent to execute
✅ Wait for completion
✅ Move to next task

## REQUIRED: Verification Gate

Every release MUST include a verification gate. Create this gate when you create the release structure:

### Gate Template

```markdown
## Gate: Release Verification for vX.Y.Z

### Checklist
- [ ] All quality gates passed (tests, build, CI - with ZERO failures)
- [ ] Version bumped correctly in all files
- [ ] CHANGELOG updated with correct version and date
- [ ] Git tag created and pushed
- [ ] GitHub release created with notes
- [ ] Package published successfully (if applicable)
- [ ] Post-release verification completed (installation test)

### Critical Questions (MUST answer YES to all)
- Did ALL tests pass with ZERO failures?
- Is the working tree completely clean?
- Does `gh release view` show the correct release?
- Can the package be installed from the registry?

### Verification Commands
```bash
git status                    # Must show clean tree
gh release view vX.Y.Z        # Must show the release
npm view <package>@X.Y.Z      # Must show new version (if npm)
```
```

This gate MUST be verified by beads-verify-agent before the release is considered complete.

**A release without a passing verification gate is NOT complete.**

## ABSOLUTE RULE: No Exceptions for Failing Tests

**Tests MUST pass. ALL of them. ZERO failures. No exceptions.**

### Unacceptable Excuses

The following excuses are NEVER acceptable for proceeding with a release:

❌ "Tests were already failing before my changes"
❌ "These failures are unrelated to the release"
❌ "Only 2 tests failed, the rest passed"
❌ "It's a flaky test"
❌ "The test is outdated"
❌ "We can fix it in the next release"
❌ "It passes locally, just not in CI"

### What To Do When Tests Fail

1. **STOP** the release process immediately
2. **DO NOT** proceed to the next phase
3. **Report** to the user: "Release blocked: X tests failing"
4. **Options**:
   - Fix the failing tests (create a task)
   - Get EXPLICIT user approval to proceed (must be documented)
   - Abort the release

### If User Approves Proceeding Despite Failures

If the user explicitly approves proceeding with failing tests:
1. Document this in the release notes under "Known Issues"
2. Create a follow-up task to fix the tests
3. Add a comment to the release gate explaining the exception

**A release with failing tests is a FAILED release unless explicitly approved by the user.**

## Phase 1: Quality Gates

All quality gates MUST pass before proceeding.

1. **Clean working tree** — no uncommitted or untracked changes
2. **All tests pass** — run the full test suite (unit, integration, E2E)
3. **Build succeeds** — build the project
4. **CI green** — latest commit passes all checks

If unsure how to build or test the project, check `docs/RELEASING.md` or ask
the user.

> Check project-specific release guide for custom quality gates.

**Details**: [quality-gates.md](quality-gates.md)

### Task Template

Create this task for your release:

```markdown
### Task: Quality Gates for vX.Y.Z

## Instructions
1. Verify clean working tree: `git status`
2. Run full test suite: [use command from RELEASING.md]
3. Run build: [use command from RELEASING.md]
4. Check CI status: `gh run list --limit 1`

## Acceptance Criteria
- [ ] Working tree is clean (zero uncommitted changes)
- [ ] ALL tests pass (zero failures - no exceptions)
- [ ] Build succeeds with no errors
- [ ] CI is green on main branch

## STOP Conditions
If ANY criterion fails:
1. STOP immediately
2. Do NOT proceed to next phase
3. Report failure to user
```

Spawn beads-task-agent to execute this task.

## Phase 2: Documentation

Load a documentation skill to validate and fix documentation before release.

Key checks:

1. **Version references** — all match the release version
2. **CHANGELOG** — entry exists for new version
3. **Breaking changes** — migration guide if needed

> Check project-specific release guide for additional documentation
> requirements.

**Details**: [documentation-checklist.md](documentation-checklist.md)

### Task Template

Create this task for your release:

```markdown
### Task: Documentation Check for vX.Y.Z

## Instructions
1. Load fix-documentation skill if available
2. Check version references in README.md, package.json, docs/
3. Verify CHANGELOG.md has entry for vX.Y.Z with today's date
4. If breaking changes, verify migration guide exists

## Acceptance Criteria
- [ ] All version references updated to vX.Y.Z
- [ ] CHANGELOG.md entry exists for vX.Y.Z
- [ ] Breaking changes documented with migration guide (if applicable)
- [ ] No stale documentation referencing old versions

## STOP Conditions
If ANY criterion fails:
1. STOP immediately
2. Do NOT proceed to next phase
3. Report failure to user
```

Spawn beads-task-agent to execute this task.

## Phase 3: Version Bump

1. **Analyze changes** since last release tag
2. **Determine bump** — major (breaking), minor (features), patch (fixes)
3. **Update version files** — detect and update all relevant files
4. **Commit** — `release: vX.Y.Z`

> Check project-specific release guide for custom version file locations.

**Details**: [version-management.md](version-management.md)

### Task Template

Create this task for your release:

```markdown
### Task: Version Bump to vX.Y.Z

## Instructions
1. Identify all version files: package.json, version.go, etc.
2. Update version to X.Y.Z in all identified files
3. Run any version-related scripts from RELEASING.md
4. Commit changes: `git commit -m "release: vX.Y.Z"`

## Acceptance Criteria
- [ ] Version updated in all relevant files
- [ ] Commit created with message "release: vX.Y.Z"
- [ ] No other uncommitted changes
- [ ] Working tree is clean after commit

## STOP Conditions
If ANY criterion fails:
1. STOP immediately
2. Do NOT proceed to next phase
3. Report failure to user
```

Spawn beads-task-agent to execute this task.

## Phase 4: Create Release

**Option A — GitHub Actions workflow exists:**

```bash
gh workflow run release.yml -f version="1.2.3"
gh run watch
```

**Option B — Manual release:**

```bash
git tag -a v1.2.3 -m "v1.2.3"
git push origin main && git push origin v1.2.3
gh release create v1.2.3 --title "v1.2.3" --notes-file release-notes.md
```

> Check project-specific release guide for custom release steps.

**Details**: [gh-release-commands.md](gh-release-commands.md)

### Task Template

Create this task for your release:

```markdown
### Task: Create GitHub Release vX.Y.Z

## Instructions
1. Check if release workflow exists: `ls .github/workflows/release*`
2. If workflow exists:
   - Run: `gh workflow run release.yml -f version="X.Y.Z"`
   - Monitor: `gh run watch`
3. If manual release:
   - Create tag: `git tag -a vX.Y.Z -m "vX.Y.Z"`
   - Push: `git push origin main && git push origin vX.Y.Z`
   - Create release: `gh release create vX.Y.Z --title "vX.Y.Z" --generate-notes`

## Acceptance Criteria
- [ ] Git tag vX.Y.Z exists
- [ ] Tag is pushed to origin
- [ ] GitHub release created and visible
- [ ] `gh release view vX.Y.Z` shows correct release

## STOP Conditions
If ANY criterion fails:
1. STOP immediately
2. Do NOT proceed to next phase
3. Report failure to user
```

Spawn beads-task-agent to execute this task.

## Phase 5: Release Notes

Write clear, structured release notes:

- **Highlights** — 3-5 emoji-prefixed key changes
- **What's Changed** — Added / Changed / Fixed / Removed
- **Breaking Changes** — if applicable, with migration guide

> Check project-specific release guide for release notes format.

**Details**: [release-notes-guide.md](release-notes-guide.md)

### Task Template

Create this task for your release:

```markdown
### Task: Write Release Notes for vX.Y.Z

## Instructions
1. Get changes since last release: `gh api repos/:owner/:repo/compare/vPREVIOUS...vX.Y.Z`
2. Write release notes with sections:
   - Highlights (3-5 key changes with emojis)
   - What's Changed (Added/Changed/Fixed/Removed)
   - Breaking Changes (if any, with migration guide)
3. Update GitHub release: `gh release edit vX.Y.Z --notes-file release-notes.md`

## Acceptance Criteria
- [ ] Release notes include Highlights section
- [ ] Release notes include What's Changed section
- [ ] Breaking changes documented (if applicable)
- [ ] GitHub release updated with notes
- [ ] `gh release view vX.Y.Z` shows complete notes

## STOP Conditions
If ANY criterion fails:
1. STOP immediately
2. Do NOT proceed to next phase
3. Report failure to user
```

Spawn beads-task-agent to execute this task.

## Quick Reference

```bash
gh release list --limit 5           # Recent releases
gh release view                     # Latest release
gh api repos/:owner/:repo/compare/v1.0.0...HEAD  # Changes since tag
```
