# Setup or Modify Release Workflow

Guide for creating or updating a project's `docs/RELEASING.md` file.

## Purpose

The `docs/RELEASING.md` file provides **project-specific release instructions** that override generic workflow steps. This document should answer all questions an AI agent (or human) needs to perform a release without guessing.

## What Goes in RELEASING.md

### 1. Build Commands

Specify exactly how to build the project:

```markdown
## Build

```bash
npm run build
# or
bun run build
# or
cargo build --release
```
```

### 2. Test Commands

List all tests that must pass:

```markdown
## Tests

Run all tests before releasing:

```bash
npm test                    # Unit tests
npm run test:integration    # Integration tests
npm run test:e2e           # E2E tests (if applicable)
```

All tests must pass with no failures.
```

### 3. Version Files

Document which files contain version numbers:

```markdown
## Version Files

Update version in these files:
- `package.json` (npm version bump handles this)
- `Cargo.toml` (for Rust projects)
- `pyproject.toml` (for Python projects)
- `src/version.ts` (if version is exported from code)
- `README.md` (installation instructions)
```

### 4. Version Bump Strategy

Explain how versioning works for this project:

```markdown
## Versioning

This project follows [Semantic Versioning](https://semver.org/):
- **Major (X.0.0)**: Breaking changes
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, backward compatible

Use `npm version [major|minor|patch]` to bump version and create git tag.
```

### 5. Pre-Release Checklist

Project-specific checks beyond generic quality gates:

```markdown
## Pre-Release Checklist

- [ ] All tests pass
- [ ] Build succeeds with no warnings
- [ ] CHANGELOG.md updated with new version
- [ ] Documentation updated (if API changed)
- [ ] Breaking changes documented with migration guide
- [ ] CI/CD pipeline green on main branch
- [ ] Dependencies up to date (run `npm audit` or equivalent)
```

### 6. Release Process

Step-by-step release commands:

```markdown
## Release Process

### Option 1: Automated (Recommended)

```bash
# Trigger GitHub Actions release workflow
gh workflow run release.yml -f version=patch  # or minor, major
gh run watch
```

The workflow handles: version bump, tag creation, changelog update, npm publish, GitHub release.

### Option 2: Manual

```bash
# 1. Bump version and create tag
npm version patch -m "release: v%s"

# 2. Push to GitHub
git push origin main && git push --tags

# 3. Publish to npm
npm publish

# 4. Create GitHub release
gh release create v$(node -p "require('./package.json').version") \
  --title "v$(node -p "require('./package.json').version")" \
  --generate-notes
```
```

### 7. Post-Release Steps

What happens after the release:

```markdown
## Post-Release

After releasing:
1. Verify package published to npm: `npm view <package-name>`
2. Check GitHub release appears: `gh release view`
3. Test installation: `npm install <package-name>@latest` in a clean directory
4. Announce release (if applicable): Discord, Twitter, changelog newsletter
```

### 8. Rollback Procedure

How to undo a bad release:

```markdown
## Rollback

If a release has critical issues:

```bash
# Unpublish from npm (within 72 hours)
npm unpublish <package-name>@<version>

# Delete GitHub release and tag
gh release delete v<version> -y
git tag -d v<version>
git push origin :refs/tags/v<version>
```

Then fix the issue and re-release with a patch version.
```

## Example RELEASING.md (Node.js/TypeScript Project)

Here's a complete example for a TypeScript plugin:

```markdown
# Release Process

## Prerequisites

- Node.js 18+ installed
- npm authentication configured: `npm whoami`
- GitHub CLI authenticated: `gh auth status`

## Build

```bash
bun install
bun run build
```

Output: `dist/` directory with compiled JavaScript and types.

## Tests

```bash
bun test                    # Unit tests
bun run test:integration    # Integration tests
```

All tests must pass.

## Version Files

- `package.json` (npm handles this automatically)
- `package-lock.json` (auto-updated)

## Versioning

This project follows Semantic Versioning:
- **Major**: Breaking changes to plugin API
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes

## Pre-Release Checklist

- [ ] All tests pass (`bun test`)
- [ ] Build succeeds (`bun run build`)
- [ ] CHANGELOG.md updated with new version
- [ ] No uncommitted changes
- [ ] CI green on main branch

## Release Process

### Automated Release (Recommended)

```bash
gh workflow run release.yml -f version=patch  # or minor, major
gh run watch
```

### Manual Release

```bash
# 1. Bump version
npm version patch -m "release: v%s"

# 2. Push changes
git push origin main --follow-tags

# 3. Publish to npm
npm publish

# 4. Create GitHub release
gh release create v$(node -p "require('./package.json').version") \
  --generate-notes
```

## Post-Release

1. Verify: `npm view opencode-coder`
2. Test: `npm install -g opencode-coder@latest`
3. Announce in Discord #releases channel

## Rollback

If needed:

```bash
npm unpublish opencode-coder@<version>
gh release delete v<version> -y
git tag -d v<version>
git push origin :refs/tags/v<version>
```
```

## When to Update RELEASING.md

Update this file when:
- Build process changes
- New test suites added
- Version file locations change
- Release automation changes (CI/CD updates)
- Publishing targets change (new registries, platforms)

## Tips for Writing RELEASING.md

1. **Be explicit** — don't assume knowledge (e.g., "run tests" → specify exact commands)
2. **Include outputs** — mention what success looks like ("Output: dist/ directory")
3. **Handle failures** — document common errors and fixes
4. **Automate where possible** — prefer GitHub Actions over manual steps
5. **Keep it updated** — outdated docs are worse than no docs

## Common Mistakes to Avoid

❌ **Too vague**: "Run tests" (which tests? how?)  
✅ **Specific**: "Run `npm test && npm run test:integration`"

❌ **Missing context**: "Publish to registry"  
✅ **Clear**: "Publish to npm: `npm publish`"

❌ **Assumes local config**: "Just run the release script"  
✅ **Documents prereqs**: "Ensure npm auth configured: `npm whoami`"

❌ **No verification**: "Push and done"  
✅ **Includes checks**: "Verify package live: `npm view <pkg>`"
