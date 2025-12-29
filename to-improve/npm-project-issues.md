# NPM Project Issues

A collection of issues and lessons learned when working with npm projects.

## Build Not Running Before Publish

**Date:** 2024-12-29

**Problem:** Published multiple npm versions (v0.3.2, v0.3.3) with stale `dist/` builds. Source code changes were committed but the bundled output wasn't rebuilt before publishing.

**Root Cause:** 
- The `dist/` folder is gitignored (not tracked)
- No `prepublishOnly` hook existed to trigger a build
- The workflow `git commit && npm version && npm publish` skipped the build step entirely

**Symptoms:**
- Published package didn't include code changes
- `coder_info` tool showed old behavior despite version bump
- Grepping `dist/opencode-coder.js` revealed old code still present

**Fix:**
Added `prepublishOnly` hook to `package.json`:
```json
"prepublishOnly": "bun run build"
```

**Lessons Learned:**
1. Always have a `prepublishOnly` hook that builds the project
2. Verify the build contains your changes before publishing (grep the dist file)
3. The `npm version && npm publish` shortcut is dangerous without a build hook
