# Release Workflow

Complete process for creating a GitHub release.

## STOP: Prerequisites Check

Before doing ANYTHING else, run this command:

    bash scripts/check-release-prereqs.sh

If this fails, STOP. Fix the issues before proceeding.

If this passes, also:

1. **Load project-specific instructions** from `docs/RELEASING.md`
2. Note any project-specific overrides for the phases below

Only after prerequisites pass, continue to "Create Release Structure".

## ALL Phases Are REQUIRED

You MUST create tasks for ALL 5 phases. No exceptions. No skipping.

1. Quality Gates - REQUIRED
2. Documentation Check - REQUIRED
3. Version Bump - REQUIRED
4. Create GitHub Release - REQUIRED
5. Release Notes - REQUIRED

Plus: Verification Gate - REQUIRED

Skipping any phase is NOT acceptable. Every phase exists for a reason.

## MANDATORY: Create Release Structure

Before executing ANY release steps, you MUST:

1. Create a parent task for this release (e.g., "Release v1.2.3")
2. Create child tasks for EACH phase below, linked with `--parent`
3. Add sequential dependencies so tasks unlock in order
4. Execute tasks using subagents (beads-task-agent)

**Why**: This prevents context loss, ensures all steps are tracked, and enables verification.

DO NOT execute release steps directly. Create the structure first, then delegate.

### Step 1: Create Parent Task

```bash
bd create --title="Release vX.Y.Z" --type=task --priority=1
# Save returned ID as PARENT_ID
```

### Step 2: Create Child Tasks

```bash
# Run each command and save the returned ID
bd create --title="Quality Gates for vX.Y.Z" --type=task --parent=PARENT_ID      # → QUALITY_ID
bd create --title="Documentation Check for vX.Y.Z" --type=task --parent=PARENT_ID # → DOC_ID
bd create --title="Version Bump to vX.Y.Z" --type=task --parent=PARENT_ID         # → VERSION_ID
bd create --title="Create GitHub Release vX.Y.Z" --type=task --parent=PARENT_ID   # → RELEASE_ID
bd create --title="Write Release Notes for vX.Y.Z" --type=task --parent=PARENT_ID # → NOTES_ID
bd create --title="Release Verification vX.Y.Z" --type=task --parent=PARENT_ID    # → VERIFY_ID
```

### Step 3: Set Dependencies

```bash
bd dep add DOC_ID QUALITY_ID --type blocks
bd dep add VERSION_ID DOC_ID --type blocks
bd dep add RELEASE_ID VERSION_ID --type blocks
bd dep add NOTES_ID RELEASE_ID --type blocks
bd dep add VERIFY_ID NOTES_ID --type blocks
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

**Key point**: Only "Quality Gates" shows as ready initially. As you close each task, the next one becomes unblocked.

## Execution: Use Task Agents

Create all tasks first, then execute them sequentially using beads-task-agent.

**DO NOT** run release commands directly — create tasks and spawn agents instead.

- ❌ Running test/build/git/gh commands directly
- ✅ Create task with commands → spawn beads-task-agent → wait for completion → move to next

## REQUIRED: Verification Gate

Every release MUST include a verification gate with this checklist:

```markdown
## Gate: Release Verification for vX.Y.Z
- [ ] All quality gates passed (tests, build, CI - ZERO failures)
- [ ] Version bumped correctly in all files
- [ ] CHANGELOG updated with correct version and date
- [ ] Git tag created and pushed
- [ ] GitHub release created with notes
- [ ] Package published successfully (if applicable)

### Commands
git status                    # Must show clean tree
gh release view vX.Y.Z        # Must show the release
npm view <package>@X.Y.Z      # Must show new version (if npm)
```

**A release without a passing verification gate is NOT complete.**

## ABSOLUTE RULE: No Exceptions for Failing Tests

**Tests MUST pass. ALL of them. ZERO failures. No exceptions.**

### Unacceptable Excuses
- "Tests were already failing before my changes"
- "Only 2 tests failed, the rest passed"
- "We can fix it in the next release"

### When Tests Fail

1. **STOP** the release process immediately
2. **DO NOT** proceed to the next phase
3. **Report** to the user: "Release blocked: X tests failing"
4. **Options**: Fix failing tests, get EXPLICIT user approval, or abort

If user explicitly approves proceeding despite failures: document in release notes under "Known Issues" and create follow-up task.

**A release with failing tests is a FAILED release unless explicitly approved by the user.**

## Phase 1: Quality Gates (REQUIRED)

All quality gates MUST pass before proceeding.

1. **Clean working tree** — no uncommitted or untracked changes
2. **All tests pass** — run the full test suite
3. **Build succeeds** — build the project
4. **CI green** — latest commit passes all checks

### Task Template

```markdown
### Task: Quality Gates for vX.Y.Z

**Instructions**: Verify clean tree (`git status`), run tests, run build, check CI (`gh run list --limit 1`)

**Criteria**: Clean tree, ALL tests pass (zero failures), build succeeds, CI green

**STOP if ANY fails** — report to user, do NOT proceed
```

## Phase 2: Documentation (REQUIRED)

Key checks:

1. **Version references** — all match the release version
2. **CHANGELOG** — entry exists for new version
3. **Breaking changes** — migration guide if needed

### Task Template

```markdown
### Task: Documentation Check for vX.Y.Z

**Instructions**: Check version refs in README/package.json/docs, verify CHANGELOG entry for vX.Y.Z, check migration guide if breaking changes

**Criteria**: Version refs updated, CHANGELOG entry exists, breaking changes documented

**STOP if ANY fails** — report to user, do NOT proceed
```

## Phase 3: Version Bump (REQUIRED)

1. **Analyze changes** since last release tag
2. **Determine bump** — major (breaking), minor (features), patch (fixes)
3. **Update version files** — detect and update all relevant files
4. **Commit** — `release: vX.Y.Z`

### Task Template

```markdown
### Task: Version Bump to vX.Y.Z

**Instructions**: Identify version files, update to X.Y.Z, commit with "release: vX.Y.Z"

**Criteria**: Version updated in all files, commit created, clean tree after commit

**STOP if ANY fails** — report to user, do NOT proceed
```

## Phase 4: Create Release (REQUIRED)

**Option A — GitHub Actions workflow exists:**

```bash
gh workflow run release.yml -f version="1.2.3"
gh run watch
```

**Option B — Manual release:**

```bash
git tag -a v1.2.3 -m "v1.2.3"
git push origin main && git push origin v1.2.3
gh release create v1.2.3 --title "v1.2.3" --generate-notes
```

### Task Template

```markdown
### Task: Create GitHub Release vX.Y.Z

**Instructions**: Check for workflow (`ls .github/workflows/release*`), run workflow or manual release

**Criteria**: Tag exists, pushed to origin, GitHub release visible, `gh release view` shows it

**STOP if ANY fails** — report to user, do NOT proceed
```

## Phase 5: Release Notes (REQUIRED)

Write clear, structured release notes:

- **Highlights** — 3-5 emoji-prefixed key changes
- **What's Changed** — Added / Changed / Fixed / Removed
- **Breaking Changes** — if applicable, with migration guide

### Task Template

```markdown
### Task: Write Release Notes for vX.Y.Z

**Instructions**: Get changes (`gh api repos/:owner/:repo/compare/vPREVIOUS...vX.Y.Z`), write notes, update release

**Criteria**: Highlights section, What's Changed section, breaking changes documented, release updated

**STOP if ANY fails** — report to user, do NOT proceed
```

## Quick Reference

```bash
gh release list --limit 5           # Recent releases
gh release view                     # Latest release
gh api repos/:owner/:repo/compare/v1.0.0...HEAD  # Changes since tag
```
