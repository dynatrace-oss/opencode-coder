#!/usr/bin/env bash
set -euo pipefail

# Script: create-release-tasks.sh
# Purpose: Create beads task structure for GitHub release workflow
# Usage: bash scripts/create-release-tasks.sh <version>
# Example: bash scripts/create-release-tasks.sh 1.2.3

VERSION="${1:-}"

if [ -z "$VERSION" ]; then
    echo "Error: Version argument required"
    echo "Usage: $0 <version>"
    echo "Example: $0 1.2.3"
    exit 1
fi

# Ensure bd is available
if ! command -v bd &> /dev/null; then
    echo "Error: bd command not found. Is beads installed?"
    exit 1
fi

echo "Creating release task structure for v$VERSION..."

# Create parent epic
PARENT=$(bd create \
    --title="Release v$VERSION" \
    --type=epic \
    --priority=1 \
    --description="Complete GitHub release workflow for version $VERSION" \
    --json | jq -r '.id')

if [ -z "$PARENT" ] || [ "$PARENT" = "null" ]; then
    echo "Error: Failed to create parent epic"
    exit 1
fi

echo "✓ Created parent epic: $PARENT"

# Create child tasks with TODO templates

QUALITY=$(bd create \
    --title="Quality Gates for v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Fill in project-specific quality checks

Run all quality gates before proceeding with release.

### Checklist
- [ ] Clean working tree (no uncommitted changes)
- [ ] All tests pass (ZERO failures)
- [ ] Build succeeds
- [ ] CI green (latest commit passes)
- [ ] TODO: Add project-specific checks here (if needed)

### Commands to Fill In
\`\`\`bash
git status
# TODO: Add test command (e.g., npm test, cargo test, pytest, go test)
# TODO: Add build command (e.g., npm run build, cargo build, go build)
gh run list --limit 1
\`\`\`

### STOP if ANY fails
Report to user, do NOT proceed to next phase." \
    --json | jq -r '.id')

DOCS=$(bd create \
    --title="Documentation Check for v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Fill in project-specific documentation files

Verify all documentation is ready for release.

### Checklist
- [ ] CHANGELOG has entry for v$VERSION
- [ ] Version references updated in README
- [ ] Breaking changes documented (if any)
- [ ] Migration guide exists (if needed)
- [ ] TODO: Add project-specific documentation checks here (if needed)

### Files to Check
- CHANGELOG.md
- README.md
- TODO: Add project-specific version files
- TODO: Add project-specific documentation paths

### STOP if ANY fails
Report to user, do NOT proceed to next phase." \
    --json | jq -r '.id')

BUMP=$(bd create \
    --title="Version Bump to v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Fill in version files to update

Update version number across all project files.

### Checklist
- [ ] Identify all files with version numbers
- [ ] Update to v$VERSION
- [ ] Commit with message: \"release: v$VERSION\"
- [ ] Verify clean tree after commit
- [ ] TODO: Add project-specific version update steps (if needed)

### Files to Update (Examples - Replace with Actual)
- TODO: Add version file location (e.g., package.json, Cargo.toml, pyproject.toml, VERSION)
- TODO: Add version update command (if tool exists)
- TODO: Add other files with version references

### STOP if ANY fails
Report to user, do NOT proceed to next phase." \
    --json | jq -r '.id')

RELEASE=$(bd create \
    --title="Create GitHub Release v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Choose release method (workflow or manual)

Create the GitHub release and push tags.

### Option A: GitHub Actions Workflow
\`\`\`bash
# Check if release workflow exists
ls .github/workflows/release*

# TODO: Add workflow trigger command (if workflow exists)
# Example: gh workflow run release.yml -f version=\"$VERSION\"
# gh run watch
\`\`\`

### Option B: Manual Release
\`\`\`bash
# Create and push tag
git tag -a v$VERSION -m \"v$VERSION\"
git push origin main && git push origin v$VERSION

# Create GitHub release
gh release create v$VERSION --title \"v$VERSION\" --generate-notes
\`\`\`

### Verification
\`\`\`bash
gh release view v$VERSION
\`\`\`

### STOP if ANY fails
Report to user, do NOT proceed to next phase." \
    --json | jq -r '.id')

NOTES=$(bd create \
    --title="Write Release Notes for v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Customize release notes format

Write clear, structured release notes for the GitHub release.

### Structure
- **Highlights**: 3-5 key changes (emoji-prefixed)
- **What's Changed**: Added / Changed / Fixed / Removed
- **Breaking Changes**: If applicable, with migration guide
- TODO: Add project-specific sections (if needed)

### Get Changes Since Last Release
\`\`\`bash
# Find previous release
PREV=\$(gh release list --limit 2 --json tagName --jq '.[1].tagName')

# Get comparison
gh api repos/:owner/:repo/compare/\$PREV...v$VERSION

# Or use git log
git log \$PREV..HEAD --oneline
\`\`\`

### Update Release
\`\`\`bash
gh release edit v$VERSION --notes-file release-notes.md
\`\`\`

### STOP if ANY fails
Report to user, do NOT proceed to next phase." \
    --json | jq -r '.id')

VERIFY=$(bd create \
    --title="Release Verification for v$VERSION" \
    --type=task \
    --parent="$PARENT" \
    --description="## TODO: Add package-specific verification commands

Final verification that release is complete and published.

### Checklist
- [ ] Git tag exists and pushed
- [ ] GitHub release visible
- [ ] Package published (if applicable)
- [ ] Installation works from published source
- [ ] TODO: Add project-specific verification checks (if needed)

### Verification Commands
\`\`\`bash
# GitHub release
gh release view v$VERSION

# TODO: Add package registry verification command (if applicable)
# Examples (choose what applies to your project):
#   npm view <package>@$VERSION
#   cargo search <package>
#   pip show <package>
#   docker pull <image>:$VERSION
\`\`\`

### Final Check
\`\`\`bash
# TODO: Add installation test command (if applicable)
# Examples (choose what applies to your project):
#   npm install <package>@$VERSION
#   cargo install <package> --version $VERSION
#   pip install <package>==$VERSION
#   docker run <image>:$VERSION --version
\`\`\`

### STOP if ANY fails
Report to user - release is NOT complete." \
    --json | jq -r '.id')

CLEANUP=$(bd create \
    --title="Cleanup Release Tasks" \
    --type=task \
    --parent="$PARENT" \
    --description="## Cleanup: Mark release tasks for compaction

Close the epic and mark all tasks with label for future compaction.

### Steps
\`\`\`bash
# Close the epic
bd update \$PARENT --status=closed

# Mark epic and all tasks for compaction
bd update \$PARENT --add-label=marked-for-compaction
for task_id in \$QUALITY \$DOCS \$BUMP \$RELEASE \$NOTES \$VERIFY; do
  bd update \$task_id --add-label=marked-for-compaction
done

# Mark cleanup task itself
bd update \$CLEANUP --add-label=marked-for-compaction
\`\`\`

This keeps the release history for analysis. Later, these can be compacted into a single summary task." \
    --json | jq -r '.id')

echo "✓ Created tasks: quality=$QUALITY, docs=$DOCS, bump=$BUMP, release=$RELEASE, notes=$NOTES, verify=$VERIFY, cleanup=$CLEANUP"

# Set up dependencies (sequential workflow)
echo "Setting up task dependencies..."

bd dep add "$DOCS" "$QUALITY" --type blocks
bd dep add "$BUMP" "$DOCS" --type blocks
bd dep add "$RELEASE" "$BUMP" --type blocks
bd dep add "$NOTES" "$RELEASE" --type blocks
bd dep add "$VERIFY" "$NOTES" --type blocks
bd dep add "$CLEANUP" "$VERIFY" --type blocks

echo ""
echo "✅ Release task structure created successfully!"
echo ""
echo "Parent epic: $PARENT"
echo "First ready: $QUALITY (Quality Gates for v$VERSION)"
echo ""
echo "Next steps:"
echo "  1. Fill in TODO sections: Review each task and add project-specific details"
echo "  2. Review the plan: Use beads-review-agent to review the structure"
echo "  3. Execute tasks: Use beads-task-agent to work through each phase"
echo "  4. Verify: Use beads-verify-agent to verify completion"
echo ""
echo "View ready tasks: bd ready"
echo "Show first task: bd show $QUALITY"
