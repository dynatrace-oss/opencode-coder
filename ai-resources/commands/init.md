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

Initialize beads for issue tracking:
1. Verify prerequisites (git, bd CLI)
2. Check if beads is already initialized (`bd status`)

**MANDATORY USER INTERACTION POINT - STOP HERE (if not initialized)**

3. If beads is NOT initialized, MUST use the `question()` tool to ask:
   - "Which beads mode would you like to use?"
   - Options: "stealth" (local-only, gitignored) and "team" (shared with team)
   - DO NOT proceed until user selects a mode

4. Run beads initialization with hooks using the selected mode
5. Handle git exclusions based on mode

---

### Step 3: AGENTS.md Creation

Generate or update AGENTS.md using the template:

1. Load the `opencode-coder` skill and read `references/agents-md-template.md`
2. Follow the full workflow from the template (explore → map docs → migration decision → generate)
3. This includes asking the user about migrating to standard file names if non-standard docs are found

**Key principle**: AGENTS.md is a routing table — each section points to the right docs and skills. Content lives in standard files (`docs/CODING.md`, `docs/TESTING.md`, etc.), not in AGENTS.md itself.

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
