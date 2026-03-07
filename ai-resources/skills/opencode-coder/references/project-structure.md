# Project Structure & File Rules

Canonical layout for opencode-coder setup, AGENTS generation, and `/init` refreshes.

## 1. Detect Mode First

Use the stealth marker as the source of truth:

```bash
grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null && echo "STEALTH_ACTIVE"
```

- Marker found → **stealth mode**
- Marker missing and `.beads/`, `AGENTS.md`, and `ai.package.yaml` exist → **team mode**
- Neither condition matches → **fresh setup**

**Rule**: If the marker exists, do not re-ask stealth vs team on re-runs.

## 2. Canonical Locations

| Concern | Team mode | Stealth mode | Rule |
|---|---|---|---|
| AGENTS file | `AGENTS.md` | `.coder/AGENTS.md` | Write only to the active path |
| Standard docs | `docs/` | `.coder/docs/` | Use mode-correct paths everywhere |
| Beads data | `.beads/` | `.beads/` | Tracked in team mode, local-only in stealth |
| Plugin runtime | `.coder/` | `.coder/` | Never commit `.coder/` |
| Plugin resources | `.opencode/` | `.opencode/` | Shared in team mode, excluded in stealth |
| AI manifest | `ai.package.yaml` | `ai.package.yaml` | Shared in team mode, excluded in stealth |

## 3. Git Visibility Rules

### Team mode

- Commit: `.beads/` (except `beads.db`), `.opencode/`, `ai.package.yaml`, `AGENTS.md`, and generated docs in `docs/`
- Ignore: `.coder/`
- Ensure `.gitignore` contains:

```bash
grep -qF '.coder/' .gitignore 2>/dev/null || echo '.coder/' >> .gitignore
```

### Stealth mode

- Keep opencode-coder artifacts local via `.git/info/exclude`
- The exclusion block should cover:
  - `.beads/`
  - `.opencode/`
  - `.coder/`
  - `ai.package.yaml`

## 4. Standard Docs Contract

Use these file names under the active docs directory:

| Topic | Standard file | Rule |
|---|---|---|
| Coding | `CODING.md` | Always required |
| Testing | `TESTING.md` | Create only if relevant |
| Releases | `RELEASING.md` | Create only if relevant |
| Monitoring | `MONITORING.md` | Create only if relevant |
| Pull Requests | `PULL-REQUESTS.md` | Create only if relevant |

**Create a standard doc only when it has real content.** If a section is active only because a skill exists, AGENTS.md can reference the skill without creating a hollow doc.

## 5. AGENTS.md Rules

- AGENTS.md is a **routing table**, not a handbook
- Keep it short; point to files and skills instead of inlining guidance
- Inline only:
  - Project Overview
  - Landing the Plane / session completion block
- Always use mode-correct paths
- In stealth mode, write only `.coder/AGENTS.md` — never overwrite the team root `AGENTS.md`

### If a team `AGENTS.md` already exists

In stealth mode:

- Read the root `AGENTS.md` for project context
- Write opencode-coder additions to `.coder/AGENTS.md`
- Supplement the team file; do not duplicate or rewrite it

## 6. Writing Rules

### When writing docs or AGENTS

- Detect mode first
- In stealth mode:
  - write docs only under `.coder/docs/`
  - write AGENTS only to `.coder/AGENTS.md`
  - never create generated files under `docs/` or root `AGENTS.md`
- In team mode:
  - write docs under `docs/`
  - write AGENTS to `AGENTS.md`
  - do not place generated docs under `.coder/docs/`

### When refreshing `/init`

- If stealth marker exists, skip the mode question
- Refresh generated docs in the active docs directory
- Refresh the active AGENTS file
- Preserve any committed team `AGENTS.md`
- Report what changed

## 7. Minimal Mental Model

- **Team mode** = shared project assets live at standard repo paths
- **Stealth mode** = same concepts, but generated artifacts live under `.coder/` and stay local
- **The mode decides the paths**; the document set stays the same
