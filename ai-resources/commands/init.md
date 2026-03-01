---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

Complete project setup: aimgr bootstrapping, skill discovery, beads initialization, and AGENTS.md creation.

## Task

Load the opencode-coder skill for detailed guidance:

```
skill({ name: "opencode-coder" })
```

Follow the **Installation & Setup** section which has four main steps (plus bootstrapping):

---

### Step 0: aimgr Bootstrapping

Before anything else, check whether aimgr is installed and the opencode-coder plugin is set up.

#### Check: Is aimgr installed?

Run:

```bash
aimgr --version
```

**If aimgr is NOT installed:**

Inform the user:

> aimgr is the AI resource manager that enables skill discovery, agent management, and plugin packaging. Without it, we'll do a basic setup (beads + AGENTS.md) but skip skill discovery.

**MANDATORY USER INTERACTION POINT - STOP HERE**

MUST use the `question()` tool to ask:
- "Would you like to install aimgr now?"
- Options: "Yes, install aimgr" and "No, continue without aimgr"
- DO NOT proceed until user responds

If user says **YES**:
1. Direct the user to the install instructions: https://github.com/hk9890/ai-config-manager
2. Wait for the user to confirm they have installed aimgr
3. Verify installation: `aimgr --version`
4. Install the opencode-coder plugin:
   ```bash
   aimgr init && aimgr install package/opencode-coder
   ```
5. Tell the user:
   > New commands and agents will be available in your next OpenCode session. Skills are available immediately — just ask me to load them.
6. Continue to **Step 1** (skill discovery is now available)

If user says **NO**:
- Skip to **Step 2** (beads init) — skill discovery is not available without aimgr

---

**If aimgr IS installed:**

#### Check: Is opencode-coder plugin installed?

Run:

```bash
aimgr list --format json
```

Check the output for `opencode-coder`.

**If opencode-coder is NOT installed:**

Auto-install silently:

```bash
aimgr install package/opencode-coder
```

Report to the user:

> Installed opencode-coder plugin. New commands and agents will be available in your next OpenCode session. Skills are available immediately — just ask me to load them.

Continue to **Step 1**.

**If opencode-coder IS installed:**

Check health:

```bash
aimgr verify --format json
```

- **HEALTHY** (no errors or warnings): Proceed to **Step 1**.
- **ERRORS detected**:

  Report the issues to the user.

  **MANDATORY USER INTERACTION POINT - STOP HERE**

  MUST use the `question()` tool to ask:
  - "Resource issues detected. Want me to attempt repair?"
  - Options: "Yes, attempt repair" and "No, continue anyway"
  - DO NOT proceed until user responds

  If user says **YES**:
  - Try `aimgr repair`
  - If the command is not available, suggest a manual fix:
    > aimgr repair is not yet available. Try:
    > ```bash
    > aimgr uninstall package/opencode-coder && aimgr install package/opencode-coder
    > ```
  
  If user says **NO**:
  - Continue to **Step 1** with a warning that some resources may not work correctly.

---

### Step 1: Skill Discovery

Analyze the project and suggest relevant skills.

> **Note**: Since Step 0 already confirmed aimgr is available and the plugin is installed, skip the aimgr availability check here and proceed directly to discovery.

1. Detect project type (package.json, file structure)
2. Search for relevant skills based on project type

**MANDATORY USER INTERACTION POINT - STOP HERE**

3. MUST use the `question()` tool to present skill options to the user:
   - Present 3-5 most relevant skill suggestions as options
   - Include descriptions for each skill
   - Allow multiple selections
   - DO NOT proceed until user responds

4. Install ONLY user-selected skills - DO NOT auto-install

See skill for keyword search patterns by use case.

> **If aimgr was not installed and user declined installation (from Step 0)**: Skip this step entirely and proceed to Step 2.

---

### Step 2: Beads Initialization

Initialize beads for issue tracking.

#### Smart Detection (run before anything else)

**Detection Step 1 — Check for active stealth mode:**

```bash
grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null && echo "STEALTH_ACTIVE"
```

- If output is `STEALTH_ACTIVE` → **stealth is already configured**. Skip the mode question entirely. Proceed directly to the **Re-run / Update** flow below.

**Detection Step 2 — Check for full team configuration:**

Check whether `.beads/` exists, `AGENTS.md` exists at the project root, and `ai.package.yaml` exists at the project root.

- If **all three exist** and stealth marker was NOT found → already fully configured in team mode. Report status to the user and skip to **Step 3** for a refresh if needed.

**Detection Step 3 — Fresh setup:**

- If neither condition above matched → this is a fresh setup. Continue with the mode question below.

---

#### Fresh Setup: Choose Mode

**MANDATORY USER INTERACTION POINT - STOP HERE (if not initialized)**

MUST use the `question()` tool to ask:
- "Which beads mode would you like to use?"
- Options: "stealth" (local-only, excluded from git) and "team" (shared with team)
- DO NOT proceed until user selects a mode

---

#### Stealth Mode Path

Run beads init with stealth flag and install hooks:

```bash
bd init --stealth && bd hooks install
```

Create the stealth workspace for generated docs:

```bash
mkdir -p .coder/docs
```

Write the exclusion block to `.git/info/exclude` (idempotent — safe to run multiple times):

```bash
if ! grep -q "# opencode-coder stealth mode" .git/info/exclude 2>/dev/null; then
  cat >> .git/info/exclude << 'STEALTH'

# opencode-coder stealth mode
.beads/
.opencode/
.coder/
ai.package.yaml
STEALTH
fi
```

> **Note**: This uses `.git/info/exclude` (never `--skip-worktree`). The marker line `# opencode-coder stealth mode` is used for detection on re-runs.

Proceed to **Step 3**.

---

#### Team Mode Path

Run beads init and install hooks:

```bash
bd init && bd hooks install
```

Handle git tracking as appropriate for team mode (e.g., add `.beads/` to version control).

Proceed to **Step 3**.

---

#### Re-run / Update Flow (stealth mode detected)

When `/init` is re-run and stealth is already active:

1. **Do NOT re-ask stealth vs team** — the marker in `.git/info/exclude` is the source of truth
2. Re-scan the codebase for changes (new docs, updated structure, new skills installed)
3. Refresh generated docs under `.coder/docs/` — regenerate `CODING.md`, `TESTING.md`, `RELEASING.md`, `MONITORING.md` as applicable
4. Check if the repo's committed `AGENTS.md` has changed since last run:
   ```bash
   git show HEAD:AGENTS.md 2>/dev/null
   ```
   If it has changed, incorporate the new content into the locally-managed version
5. Update `.coder/AGENTS.md` if needed (stealth mode always writes here, not to project root)
6. Report what was refreshed

---

### Step 3: AGENTS.md Creation

Generate or update AGENTS.md using the template:

1. Load the `opencode-coder` skill and read `references/agents-md-template.md`
2. Follow the full workflow from the template (explore → map docs → migration decision → generate)
3. This includes asking the user about migrating to standard file names if non-standard docs are found

> In stealth mode, the generated AGENTS.md is written to `.coder/AGENTS.md` — the plugin's config hook ensures OpenCode loads it as additional instructions.

**Key principle**: AGENTS.md is a routing table — each section points to the right docs and skills. Content lives in standard files, not in AGENTS.md itself.

#### Stealth Mode: Path Awareness

When operating in stealth mode, AGENTS.md is written to `.coder/AGENTS.md` (not the project root). The plugin's config hook injects it into OpenCode as additional instructions. Generated docs live under `.coder/docs/` instead of `docs/`. AGENTS.md must reference these paths:

| Standard path | Stealth path |
|---|---|
| `AGENTS.md` (project root) | `.coder/AGENTS.md` |
| `Read docs/CODING.md` | `Read .coder/docs/CODING.md` |
| `Read docs/TESTING.md` | `Read .coder/docs/TESTING.md` |
| `Read docs/RELEASING.md` | `Read .coder/docs/RELEASING.md` |
| `Read docs/MONITORING.md` | `Read .coder/docs/MONITORING.md` |

In stealth mode, AGENTS.md is created at `.coder/AGENTS.md`. The plugin's config hook ensures OpenCode loads it as additional instructions alongside any existing root AGENTS.md.

#### Incorporating a Team AGENTS.md

If the repository has a committed `AGENTS.md` from the team (i.e., it exists in git history):

```bash
git show HEAD:AGENTS.md 2>/dev/null
```

- Read and parse the team's version for context (project conventions, tech stack, etc.)
- Our `.coder/AGENTS.md` does NOT need to duplicate the team's content — focus on adding opencode-coder sections: doc routing (pointing to `.coder/docs/`), skill references, and beads workflow
- The plugin injects `.coder/AGENTS.md` via the config hook → OpenCode loads both the team's root AGENTS.md and our `.coder/AGENTS.md`
- The team's AGENTS.md remains completely untouched

> **AGENTS.md is NOT placed at the project root in stealth mode.** The plugin's config hook adds `.coder/AGENTS.md` to OpenCode's instructions, which are combined with any existing root AGENTS.md.

---

## Stealth-to-Team Transition

To switch from stealth mode to team mode (sharing opencode-coder artifacts with the team), follow these steps:

```bash
# 1. Move AGENTS.md to project root (or merge with team's existing one)
cp .coder/AGENTS.md ./AGENTS.md

# 2. Copy docs to standard locations
cp -r .coder/docs/ ./docs/

# 3. Update all .coder/docs/ paths to docs/ in AGENTS.md
#    (edit AGENTS.md to replace .coder/docs/ with docs/)

# 4. Remove stealth block from .git/info/exclude
#    (delete the block starting with "# opencode-coder stealth mode")

# 5. Clean up stealth workspace
rm -rf .coder/

# 6. Commit all artifacts to version control
git add AGENTS.md ai.package.yaml docs/ .beads/
git commit -m "chore: enable team mode"
```

> After this transition, the `.beads/`, `AGENTS.md`, `ai.package.yaml`, and `docs/` files will be tracked by git and visible to all contributors.

---

## Optional: Additional Resource Discovery

**MANDATORY USER INTERACTION POINT - STOP HERE**

Before proceeding with additional discovery, MUST use the `question()` tool to ask:
- "Would you like to discover additional AI resources for your project?"
- Options: "Yes, discover more resources" and "No, initialization is complete"
- DO NOT proceed with discovery unless user explicitly selects yes

> **Note**: This section requires aimgr to be installed. If aimgr is not available (user declined in Step 0), skip this section entirely.

### Step 1: Discover relevant resources

Based on the project type (detected from package.json, file structure, or user input), run aimgr discovery with relevant keywords.

**Common discovery patterns:**

| Project Type | Search Keywords | Example Command |
|-------------|-----------------|-----------------|
| React/Frontend | react, frontend, ui, component | `aimgr repo list *react* *frontend* *ui*` |
| Node.js/Backend | node, api, backend, express | `aimgr repo list *node* *api* *backend*` |
| TypeScript | typescript, ts, type | `aimgr repo list *typescript* *ts*` |
| Python | python, py | `aimgr repo list *python* *py*` |
| Testing | test, testing, qa | `aimgr repo list *test* *qa*` |
| DevOps | docker, ci, deploy | `aimgr repo list *docker* *ci* *deploy*` |
| Documentation | docs, readme, markdown | `aimgr repo list *docs* *readme* *md*` |
| Data Science | data, ml, analytics | `aimgr repo list *data* *ml* *analytics*` |

**How to detect project type:**

1. Check for `package.json` and look for dependencies:
   - React: `react`, `next`, `gatsby`
   - Node.js: `express`, `fastify`, `koa`
   - TypeScript: `typescript` in devDependencies
2. Check for language-specific files:
   - Python: `requirements.txt`, `pyproject.toml`, `*.py`
   - Go: `go.mod`, `*.go`
   - Rust: `Cargo.toml`, `*.rs`
3. Ask the user if unclear

**Example workflow:**

```bash
# For a React project
aimgr repo list *react* *component* *ui* *frontend*
```

### Step 2: Present discovered resources

**MANDATORY USER INTERACTION POINT - STOP HERE**

MUST use the `question()` tool to present discovered resources:
- List each discovered resource as a selectable option with description
- Allow multiple selections
- Include a "Skip - don't install any" option
- DO NOT proceed until user responds

Example format for question options:
- `skill/react-component-builder` - "Build React components with best practices"
- `skill/frontend-testing` - "Testing toolkit for React apps"
- `command/create-component` - "Scaffold new React components"

### Step 3: Install selected resources

Install ONLY user-selected resources using aimgr:

```bash
aimgr install skill/react-component-builder command/create-component
```

**Installation tips:**
- Multiple resources can be installed in one command
- Resources are installed to the current project directory
- Use `aimgr list` to see installed resources
- Use `aimgr uninstall <resource>` to remove unwanted resources

### Step 4: Report completion

Summarize the full initialization:

> **Initialization Complete!**
> 
> ✓ aimgr bootstrapped (opencode-coder plugin verified)
> ✓ Skills discovered and installed: 2 (release, task-sync)
> ✓ Beads initialized in stealth mode
> ✓ Git hooks installed
> ✓ AGENTS.md created with 5 sections (adapted to installed skills)
> ✓ Additional AI resources installed: 1 (react-component-builder)
> 
> **Next steps:**
> - Run `bd ready` to find available work
> - Run `bd create "Task description" --type task` to create new issues
> - Review AGENTS.md for project conventions
> - Re-run `/init` after installing new skills to update AGENTS.md

---

## Guidelines for Agents

### CRITICAL: User Interaction Requirements

- **NEVER proceed autonomously past a checkpoint** - STOP and WAIT for user response
- **MUST use `question()` tool** at every marked interaction point
- **DO NOT make decisions for the user** - present options and wait
- **DO NOT skip interaction points** even if you think you know the answer

### Workflow Rules

- **Follow the bootstrapping + 3-step workflow**: aimgr bootstrap → Skill discovery → Beads init → AGENTS.md creation
- **AGENTS.md is skill-aware**: Sections adapt to what's installed
- **Use generic language**: Don't hardcode skill names in AGENTS.md
- **Additional discovery is OPT-IN**: MUST ask before proceeding
- **Don't overwhelm**: Present 3-5 most relevant resources as options
- **Handle missing tools gracefully**: Continue if aimgr not installed (user declined)
- **Re-running is safe**: /init can be re-run to update AGENTS.md after changes
- **Stealth detection takes priority**: Always check for the stealth marker before asking mode questions
- **Restart messaging**:
  - After installing **skills only**: "The new skills are available immediately — just ask me to load them."
  - After installing **commands or agents**: "New commands and agents will be available in your next OpenCode session. To use them now, restart OpenCode."

### Using the question() Tool

At each **MANDATORY USER INTERACTION POINT**, structure your question call like:

```
question({
  questions: [{
    header: "Brief header",
    question: "Full question text",
    options: [
      { label: "Option 1", description: "What this does" },
      { label: "Option 2", description: "What this does" }
    ],
    multiple: true/false  // as appropriate
  }]
})
```

WAIT for the response before taking any further action.
