---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

Complete project setup: skill discovery, beads initialization, and AGENTS.md creation.

## Task

Load the opencode-coder skill for detailed guidance:

```
skill({ name: "opencode-coder" })
```

Follow the **Installation & Setup** section which has three main steps:

### Step 1: Skill Discovery

Analyze the project and suggest relevant skills:
1. Check if aimgr is available (`aimgr --version`)
2. Detect project type (package.json, file structure)
3. Search for relevant skills based on project type

**MANDATORY USER INTERACTION POINT - STOP HERE**

4. MUST use the `question()` tool to present skill options to the user:
   - Present 3-5 most relevant skill suggestions as options
   - Include descriptions for each skill
   - Allow multiple selections
   - DO NOT proceed until user responds

5. Install ONLY user-selected skills - DO NOT auto-install

See skill for keyword search patterns by use case.

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

### Step 3: AGENTS.md Creation

Generate or update AGENTS.md based on installed skills:

1. **Check for helper skills** - Look for AGENTS.md generation skills first (e.g., fix-documentation skill)
   - If a helper skill exists, load it and follow its workflow instead
   
2. **Determine mode** - Create if doesn't exist, update if exists (no prompting)
3. **Analyze codebase** - Gather project info (name, build commands, conventions)
4. **Detect sections** - Only include sections where relevant skill/tool is installed
5. **Generate AGENTS.md** - Use generic skill references, target ~150 lines
6. **Verify** - Ensure all commands valid and paths exist

**Key principle**: AGENTS.md adapts to installed skills - sections like "Releases" only appear if a release skill is installed.

## Optional: Additional Resource Discovery

**MANDATORY USER INTERACTION POINT - STOP HERE**

Before proceeding with additional discovery, MUST use the `question()` tool to ask:
- "Would you like to discover additional AI resources for your project?"
- Options: "Yes, discover more resources" and "No, initialization is complete"
- DO NOT proceed with discovery unless user explicitly selects yes

### Step 1: Check if aimgr is available

```bash
aimgr --version
```

If not installed, inform the user:
> aimgr is not installed. See: https://github.com/hk9890/ai-config-manager for installation.
> 
> aimgr helps discover and install AI resources (commands, skills, agents) relevant to your project type.

If the user wants to proceed without aimgr, skip this section.

### Step 2: Discover relevant resources

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

### Step 3: Present discovered resources

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

### Step 4: Install selected resources

Install ONLY user-selected resources using aimgr:

```bash
aimgr install skill/react-component-builder command/create-component
```

**Installation tips:**
- Multiple resources can be installed in one command
- Resources are installed to the current project directory
- Use `aimgr list` to see installed resources
- Use `aimgr uninstall <resource>` to remove unwanted resources

### Step 5: Report completion

Summarize the full initialization:

> **Initialization Complete!**
> 
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

## Guidelines for Agents

### CRITICAL: User Interaction Requirements

- **NEVER proceed autonomously past a checkpoint** - STOP and WAIT for user response
- **MUST use `question()` tool** at every marked interaction point
- **DO NOT make decisions for the user** - present options and wait
- **DO NOT skip interaction points** even if you think you know the answer

### Workflow Rules

- **Follow the 3-step workflow**: Skill discovery → Beads init → AGENTS.md creation
- **AGENTS.md is skill-aware**: Sections adapt to what's installed
- **Use generic language**: Don't hardcode skill names in AGENTS.md
- **Additional discovery is OPT-IN**: MUST ask before proceeding
- **Don't overwhelm**: Present 3-5 most relevant resources as options
- **Handle missing tools gracefully**: Continue if aimgr not installed
- **Re-running is safe**: /init can be re-run to update AGENTS.md after changes

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
