---
name: opencode-coder
description: "Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when the AI assistant needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync"
---

# Using the Coder Plugin

Guide for installing, configuring, and troubleshooting the opencode-coder plugin.

## Installation & Setup

The `/init` command handles complete project setup: skill discovery, beads initialization, and AGENTS.md creation.

### Step 1: Skill Discovery

**Check aimgr availability**:
```bash
aimgr --version
```
If not installed, inform user and continue without skill suggestions.

**Analyze project type** to determine relevant skills:

| File/Directory | Indicates |
|----------------|-----------|
| `package.json` | Node.js/JavaScript/TypeScript |
| `requirements.txt`, `pyproject.toml` | Python |
| `go.mod` | Go |
| `Cargo.toml` | Rust |
| `pom.xml`, `build.gradle` | Java |
| `.github/workflows/` | GitHub CI/CD |
| `docker-compose.yml` | Docker/containerized |

**Check package.json dependencies** for frameworks:
- React, Vue, Angular → frontend
- Express, Fastify, Koa → backend API
- Jest, Mocha, Vitest → testing
- TypeScript → type checking

**Ask user about non-obvious characteristics**:
- Team vs solo project
- Release frequency
- External system integrations (GitHub issues, Jira, etc.)

**Query available skills**:
```bash
aimgr repo list *release*        # Find release-related skills
aimgr repo list *task*           # Find task management skills
aimgr repo list *github*         # Find GitHub-related skills
```

**Categorize skills by use case**:

| Use Case | Keywords to Search |
|----------|-------------------|
| Releasing | `release`, `publish`, `ship`, `version` |
| Task Sync | `task`, `sync`, `github`, `jira` |
| Documentation | `doc`, `readme`, `contributing` |
| Code Quality | `lint`, `review`, `pr` |
| Monitoring | `observability`, `triage`, `logs`, `monitor` |

**Present suggestions**: Show 3-5 most relevant skills with brief explanations. Let user select which to install.

**Install selected skills**:
```bash
aimgr install <skill-name>
```

### Step 2: Beads Initialization

```bash
npm install -g beads                         # Install bd CLI
bd init --stealth && bd hooks install        # Initialize project
bd ready                                     # Verify
```

**Key Components**: bd CLI (issue tracking), beads initialization (stealth/team mode, git hooks), environment variables (`OPENCODE_CODER_DISABLED`, `BEADS_AUTO_APPROVE`)

### Step 3: AGENTS.md Creation

After beads init, generate or update AGENTS.md.

#### 3a. Check for Helper Skills

Before generating, check if there's a skill that can help with AGENTS.md creation:
```bash
ls .opencode/skills/ | grep -iE 'agents|docs|documentation'
```
If found, load and follow that skill's guidance instead of this workflow.

#### 3b. Determine Mode

```bash
ls AGENTS.md 2>/dev/null
```

| Mode | Condition | Behavior |
|------|-----------|----------|
| CREATE | AGENTS.md doesn't exist | Generate from scratch |
| UPDATE | AGENTS.md exists | Preserve custom sections, update template sections |

**No prompting** - always update if exists, create if doesn't.

#### 3c. Analyze Codebase

Gather information for generation:

| Information | Sources |
|-------------|---------|
| Project name/description | package.json, README.md, pyproject.toml |
| Build commands | package.json scripts, Makefile, pyproject.toml |
| Test commands | package.json scripts, pytest.ini, jest.config |
| Code conventions | .eslintrc, CONTRIBUTING.md, .editorconfig |
| Directory structure | Scan top-level directories |

If critical information missing (e.g., project description), ask user.

#### 3d. Detect Which Sections to Include

**Check installed skills**:
```bash
ls .opencode/skills/ 2>/dev/null           # List skill directories
aimgr list 2>/dev/null                     # List via aimgr if available
```

**Check beads**:
```bash
bd --version 2>/dev/null && ls .beads/ 2>/dev/null
```

**Section inclusion rules**:

| Section | Include If | Check Command |
|---------|------------|---------------|
| Project Overview | Always | - |
| Development/Build | Always | - |
| Code Guidelines | CONTRIBUTING.md exists | `ls CONTRIBUTING.md` |
| Testing | Test scripts exist | Check package.json scripts |
| Releases | Release skill installed | `ls .opencode/skills/ \| grep -i release` |
| Task Management | Beads installed | `bd --version && ls .beads/` |
| Monitoring | Observability skill installed | `ls .opencode/skills/ \| grep -iE 'observ\|triage\|monitor'` |
| Landing the Plane | Beads installed | `bd --version && ls .beads/` |

**ONLY include sections where relevant skill/tool is available.**

#### 3e. Generate AGENTS.md

Follow the template structure from [references/agents-md-template.md](references/agents-md-template.md).

**Key rules**:
- Target ~150 lines (less if fewer sections apply)
- Use **generic language** for skill references:
  - Good: "Load the release skill..."
  - Bad: "Load github-releases skill..."
- Include commands that are valid for the project
- Reference docs (CONTRIBUTING.md, RELEASING.md) rather than duplicating

**UPDATE mode additional rules**:
- Parse existing sections by `## Header` patterns
- Preserve sections with headers not in template
- Update sections with headers matching template
- Add missing template sections
- Remove skill-specific sections if skill no longer installed

#### 3f. Verification

After generating, verify:
- [ ] All commands are valid for the project
- [ ] File paths referenced exist
- [ ] Skill-specific sections only appear if skill installed
- [ ] Beads sections only appear if beads installed
- [ ] No hardcoded skill names (use generic references)

**See [references/agents-md-template.md](references/agents-md-template.md) for detailed template structure and examples.**
**See [references/installation-setup.md](references/installation-setup.md) for full installation guide.**

---

## Update & Maintenance

### Re-running /init

Run `/init` on existing projects to:
- **Discover new skills** that have become available
- **Update AGENTS.md** to reflect installed skills
- **Fix configuration** after project structure changes

### When to Re-run

| Trigger | Action |
|---------|--------|
| New skills released | `/init` to discover and install |
| Project structure changed | `/init` to update AGENTS.md |
| Skills installed manually | `/init` to update AGENTS.md |
| Skills uninstalled | `/init` to clean up AGENTS.md |
| Beads added to project | `/init` to add beads sections |

### AGENTS.md Update Behavior

- **Always updates** existing AGENTS.md (no prompting)
- **Creates** AGENTS.md if it doesn't exist
- **Preserves** custom sections not in template
- **Adds** missing template sections
- **Removes** outdated skill-specific sections if skill no longer installed

### Checking Current State

```bash
# Check installed skills
ls .opencode/skills/
aimgr list

# Check beads status
bd --version
ls .beads/

# Check AGENTS.md sections
head -50 AGENTS.md
```

---

## Troubleshooting & Diagnostics

```bash
bd --version                    # Check bd CLI
bd doctor                       # Check beads health
bd sync --status                # Check sync status
ls -la .git/hooks/              # Verify git hooks
echo $OPENCODE_CODER_DISABLED   # Check plugin status
```

**Understanding bd doctor**: Run `bd hooks install` if it suggests installing hooks. Ignore curl/bash upgrade suggestions - use `npm install -g beads` instead.

**See [references/debugging-logs.md](references/debugging-logs.md) for log analyzer tool.**

---

## Debug Logging

```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"  # All OpenCode internals
export OPENCODE_CODER_DEBUG=1                        # Plugin messages only
```

**Log Locations**: Linux `~/.config/opencode/logs/`, macOS `~/Library/Logs/opencode/`, Windows `%APPDATA%\opencode\logs\`

```bash
ls -lt ~/.config/opencode/logs/ | head -5            # Recent logs
grep -i "error" ~/.config/opencode/logs/*.log        # Find errors
```

**See [references/debugging-logs.md](references/debugging-logs.md) for complete guide.**

---

## Status & Health Checks

```bash
bd --version                     # CLI available
ls .beads                        # Project initialized
ls .git/hooks/pre-commit         # Hooks installed
bd sync --status                 # Sync status
```

**Maintenance**: Daily `bd sync --status`, weekly verify hooks and check updates (`npm outdated -g beads`)

**See [references/status-health.md](references/status-health.md) for comprehensive guide.**

---

## Reporting Issues

**Report plugin issues only** (bd CLI, knowledge-base, agents, docs). Don't report your project code bugs.

1. Enable debug logging
2. Run health checks  
3. Report to: https://github.com/hk9890/opencode-coder

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body "Problem: ...\nSteps: ...\nEnvironment: ..."
```

**See [references/bug-reporting.md](references/bug-reporting.md) for detailed guide.**

---

## Common Problems & Solutions

**bd command not found**
```bash
export PATH="$(npm bin -g):$PATH"                      # Quick fix
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc  # Permanent
```

**Git hooks not triggering**
```bash
bd hooks install && chmod +x .git/hooks/pre-commit
```

**Database errors**
```bash
rm .beads/beads.db && bd ready
```

**See [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)** for more solutions.

---

## Reference Documentation

- [Installation & Setup Guide](references/installation-setup.md)
- [Debug Logging & Log Analysis](references/debugging-logs.md)
- [Status & Health Checks](references/status-health.md)
- [Bug Reporting Guide](references/bug-reporting.md)
- [Troubleshooting Patterns](references/troubleshooting-patterns.md)

https://github.com/hk9890/opencode-coder
