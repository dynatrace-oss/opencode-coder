# Documentation Checklist

> **Preferred**: Load a documentation skill (e.g., `fix-documentation`) to
> automate these checks. Fall back to manual validation if no skill is
> available.

Validate before every release.

## Version Consistency

Check all files that reference the version number:

```bash
# Find version references
grep -r "version" package.json setup.py pyproject.toml Cargo.toml 2>/dev/null
grep -rn "v[0-9]\+\.[0-9]\+\.[0-9]\+" README.md docs/ 2>/dev/null
```

All version references must match the release version.

## CHANGELOG

- [ ] Entry exists for the new version
- [ ] Release date is set (not "Unreleased" or "TBD")
- [ ] All notable changes listed under correct category
- [ ] Format follows [Keep a Changelog](https://keepachangelog.com) or project convention

## README

- [ ] Installation instructions reference current version
- [ ] Code examples still work
- [ ] Links resolve (no 404s)
- [ ] Badges show correct version
- [ ] Feature list matches current state

## Breaking Changes

If any breaking changes:

- [ ] Documented in CHANGELOG with `### Breaking Changes`
- [ ] Migration guide provided (inline or linked)
- [ ] Deprecation warnings added in previous release (if applicable)
