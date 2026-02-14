# gh CLI Release Commands

## Query

```bash
# List releases
gh release list --limit 10

# View latest
gh release view

# View specific
gh release view v1.2.3

# Compare tags (commits between releases)
gh api repos/:owner/:repo/compare/v1.0.0...v1.2.3 \
  --jq '.commits[].commit.message'

# Changes since last release
LAST=$(gh release view --json tagName --jq '.tagName')
git log "$LAST"..HEAD --oneline
```

## Create (manual)

```bash
# Tag and push
git tag -a v1.2.3 -m "v1.2.3"
git push origin v1.2.3

# Create release from tag
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes "Release notes here"

# From file
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes-file release-notes.md

# With build artifacts
gh release create v1.2.3 \
  --title "v1.2.3" \
  --notes-file release-notes.md \
  dist/build.tar.gz dist/checksums.txt

# Pre-release
gh release create v2.0.0-rc.1 \
  --prerelease \
  --title "v2.0.0-rc.1" \
  --notes "Release candidate"

# Draft (not published)
gh release create v1.2.3 \
  --draft \
  --title "v1.2.3" \
  --notes "Draft release"
```

## Create (via GitHub Actions)

```bash
# Check for release workflow
gh workflow list | grep -i release

# Trigger workflow
gh workflow run release.yml \
  -f version="1.2.3" \
  -f release_notes="Release notes here"

# Monitor
gh run list --workflow=release.yml --limit 1
gh run watch
```

## Manage

```bash
# Edit existing release
gh release edit v1.2.3 --notes "Updated notes"

# Upload additional assets
gh release upload v1.2.3 dist/new-artifact.tar.gz

# Delete release
gh release delete v1.2.3

# Download assets
gh release download v1.2.3 --dir ./downloads
```
