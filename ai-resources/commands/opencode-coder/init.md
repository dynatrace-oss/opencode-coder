---
description: Initialize project for opencode-coder plugin
---

# Initialize Coder Project

Load the opencode-coder skill to initialize the current project for use with the coder plugin.

## Task

Use the skill tool to load comprehensive initialization guidance:

```
skill({ name: "opencode-coder" })
```

Then follow the **Installation & Setup** section to:
1. Verify prerequisites (git, bd CLI)
2. Prompt user for beads mode (stealth or team)
3. Run appropriate beads initialization
4. Handle git exclusions based on mode
5. Report what was created/configured

The skill provides detailed initialization procedures including:
- Stealth vs team mode selection
- File structure explanations
- Idempotent behavior handling
- Next steps guidance

## AI Resource Discovery (Optional but Recommended)

After beads initialization is complete, offer to discover and install relevant AI resources using aimgr.

### Step 1: Check if aimgr is available

```bash
aimgr --version
```

If not installed, inform the user:
> aimgr is not installed. You can install it with: `npm install -g @euricom/aimgr`
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

Display the discovered resources in a user-friendly format:

> **Discovered AI Resources for your React project:**
> 
> **Skills:**
> - `skill/react-component-builder` - Build React components with best practices
> - `skill/frontend-testing` - Testing toolkit for React apps
> 
> **Commands:**
> - `command/create-component` - Scaffold new React components
> - `command/optimize-bundle` - Analyze and optimize bundle size
> 
> Would you like to install any of these resources?

### Step 4: Offer installation

If the user selects resources to install, use aimgr install:

```bash
aimgr install skill/react-component-builder command/create-component
```

**Installation tips:**
- Multiple resources can be installed in one command
- Resources are installed to the current project directory
- Use `aimgr list` to see installed resources
- Use `aimgr uninstall <resource>` to remove unwanted resources

### Step 5: Report completion

After installation (or if skipped), summarize what was done:

> **Initialization Complete!**
> 
> ✓ Beads initialized in stealth mode
> ✓ Git hooks installed
> ✓ AI resources discovered and installed:
>   - skill/react-component-builder
>   - command/create-component
> 
> **Next steps:**
> - Run `bd ready` to find available work
> - Run `bd create "Task description" --type task` to create new issues
> - Explore installed resources with `aimgr list`

## Guidelines for Agents

- **Make aimgr discovery optional**: Ask the user if they want to discover resources
- **Be intelligent about keywords**: Use project context to choose relevant search terms
- **Don't overwhelm**: Present 3-5 most relevant resources, not dozens
- **Allow selection**: Let user choose which resources to install
- **Handle missing aimgr gracefully**: Inform but don't fail initialization
- **Combine searches**: Use multiple keywords to find relevant resources (e.g., `*react* *test*`)
- **Explain benefits**: Briefly describe what each resource does
- **Skip if no matches**: If no relevant resources found, inform user and move on
