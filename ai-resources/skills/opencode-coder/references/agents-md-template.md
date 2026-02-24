# AGENTS.md Template Structure

Reference for generating adaptive AGENTS.md files during `/init`. The template adapts to installed skills and project structure.

## Overview

**Purpose**: Generate AGENTS.md as a quick reference for AI assistants during development.

**Target Size**: ~100-120 lines (varies by installed skills)

**Behavior**:
- Always update existing AGENTS.md (no prompting)
- Create if doesn't exist
- Adapt sections based on installed skills

---

## Skill Detection

### Methods

**Method 1: Check `.opencode/skills/` directory (Recommended)**
```bash
ls .opencode/skills/ 2>/dev/null
```
Returns list of installed skill directories.

**Method 2: Use aimgr CLI**
```bash
aimgr list 2>/dev/null
```
Returns table with NAME, STATUS columns. Skills show as `skill/<name>`.

### Detection Logic

For each use case section, check if relevant skills exist:

```
Use Case            | Look for skills containing keywords
--------------------|------------------------------------
Releasing           | "release", "publish", "ship"
Task Synchronization| "task-sync", "github-task"
Monitoring/Triage   | "observability", "triage", "monitoring", "logs"
Code Review         | "review", "pr", "pull-request"
Documentation       | "documentation", "docs", "fix-doc"
AI Resources        | "ai-resource", "aimgr"
```

### Checking Beads

Beads (bd CLI) is a special case - check directly:
```bash
bd --version 2>/dev/null && ls .beads/ 2>/dev/null
```
If both succeed, beads is installed and initialized.

---

## Template Structure

### Required Sections (Always Include)

#### 1. Project Overview (3-5 lines)

```markdown
# Project Name

Brief description of what this project does (1-2 sentences).

**Tech Stack**: [language/framework]  
**Build**: `<build command>` | **Test**: `<test command>`
```

**How to populate**:
- Read README.md for project description
- Read package.json/pyproject.toml/Cargo.toml for tech stack
- Extract build/test commands from scripts

#### 2. Project-Specific Context (20-30 lines)

```markdown
## Development

### Build & Test
<command>   # Build project
<command>   # Run tests
<command>   # Type check (if applicable)

### Project Structure
- `src/` - Source code
- `tests/` - Test files
- `docs/` - Documentation

### Conventions
- [Brief convention 1]
- [Brief convention 2]

See CONTRIBUTING.md for detailed guidelines.
```

**How to populate**:
- Extract from package.json scripts, Makefile, or equivalent
- Scan directory structure
- Reference CONTRIBUTING.md if exists (don't duplicate)

### Conditional Sections (Include If Skills Installed)

#### 3. Code Development (5-10 lines)

**Include if**: coding-related skills exist OR project has CONTRIBUTING.md

```markdown
## Code Guidelines

Follow CONTRIBUTING.md for architecture and patterns.

Key points:
- [Critical convention from CONTRIBUTING.md]
- [Another critical convention]

[If coding skill installed]: Load coding skill for detailed guidance.
```

#### 4. Testing (5-10 lines)

**Include if**: test framework detected OR test scripts exist

```markdown
## Testing

<test command>           # Run all tests
<test command pattern>   # Run specific tests

Coverage: <coverage command if exists>
```

#### 5. Releasing (1-2 lines)

**Include if**: Release skill installed (`ls .opencode/skills/ | grep -i release`)

```markdown
## Releases

Use the **github-releases** skill for version management and releases. See docs/RELEASING.md for details.
```

**Do NOT include if**: No release skill installed

#### 6. Task Synchronization (1-2 lines)

**Include if**: Task sync skill installed (`ls .opencode/skills/ | grep -iE 'task-sync|github-task'`)

```markdown
## Task Synchronization

Load the **task-sync** skill for syncing with external systems (GitHub Issues, etc.).
```

**Do NOT include if**: No task sync skill installed

#### 7. Documentation (1-2 lines)

**Include if**: Documentation skill installed (`ls .opencode/skills/ | grep -iE 'doc|fix-doc'`)

```markdown
## Documentation

Load the **fix-documentation** skill for documentation fixes and cross-file synchronization.
```

**Do NOT include if**: No documentation skill installed

#### 8. AI Resource Management (1-2 lines)

**Include if**: AI resource manager skill installed (`ls .opencode/skills/ | grep -iE 'ai-resource|aimgr'`)

```markdown
## AI Resource Management

Use aimgr CLI for managing AI resources. Load **ai-resource-manager** skill for help.
```

**Do NOT include if**: No AI resource manager skill installed

#### 9. Monitoring & Bug Analysis (5-10 lines)

**Include if**: Observability/triage skill installed (`ls .opencode/skills/ | grep -iE 'observ|triage|monitor'`)

```markdown
## Monitoring

For analyzing logs, metrics, and triaging issues:
- Load the observability skill
- See docs/MONITORING.md for data sources

The skill handles fetching data and creating issues automatically.
```

**Do NOT include if**: No observability skill installed

#### 10. Landing the Plane (15-20 lines)

**Include if**: beads installed

```markdown
## Landing the Plane (Session Completion)

**When ending a work session**, complete ALL steps:

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** - All changes committed AND pushed

**CRITICAL**: Work is NOT complete until `git push` succeeds.
```

**Do NOT include if**: beads not installed (no `bd sync` command)

---

## Edge Cases

### Minimal Project (No Skills Installed)

When NO skills are detected:

```markdown
# Project Name

Brief description.

## Development

### Build & Test
<build command>
<test command>

### Project Structure
- `src/` - Source code

### Conventions
See CONTRIBUTING.md for guidelines.
```

**Total**: ~25-30 lines (just Project Overview + Project-Specific Context)

### Project Without Beads

Omit these sections entirely:
- Landing the Plane (no `bd sync` command)

Keep: Project Overview, Development, Testing (if detected)

### Existing AGENTS.md

**Strategy**: Update in-place, preserving project-specific customizations.

1. Parse existing AGENTS.md to identify sections
2. Update sections that match template structure
3. Preserve custom sections not in template
4. Add missing template sections
5. Remove outdated skill-specific sections if skill no longer installed

**Detection**: Look for section headers (`## Section Name`)

**Preserve**: Sections with headers not matching template sections
**Update**: Sections with headers matching template sections
**Add**: Template sections not present in existing file

---

## Section Sizing Guide

| Section | Lines | When to Include |
|---------|-------|-----------------|
| Project Overview | 3-5 | Always |
| Development/Build | 20-30 | Always |
| Code Guidelines | 5-10 | If CONTRIBUTING.md exists |
| Testing | 5-10 | If test scripts exist |
| Releases | 1-2 | If release skill installed |
| Task Synchronization | 1-2 | If task-sync skill installed |
| Documentation | 1-2 | If fix-documentation skill installed |
| AI Resource Management | 1-2 | If ai-resource-manager skill installed |
| Monitoring | 5-10 | If observability skill installed |
| Landing the Plane | 15-20 | If beads installed |

**Total Range**: 25-120 lines depending on project configuration

---

## Examples

### Example 1: Node.js/TypeScript with Release Skill

**Detected**:
- package.json with scripts
- `.opencode/skills/github-releases`
- beads initialized (`.beads/` exists)
- CONTRIBUTING.md exists

**Generated AGENTS.md** (~90 lines):

```markdown
# my-typescript-project

TypeScript library for data validation with runtime type checking.

**Tech Stack**: TypeScript, Node.js  
**Build**: `npm run build` | **Test**: `npm test`

## Development

### Build & Test
npm run build      # Compile TypeScript
npm test           # Run Jest tests
npm run typecheck  # Check types only
npm run lint       # Run ESLint

### Project Structure
- `src/` - TypeScript source
- `dist/` - Compiled JavaScript
- `tests/` - Jest test files
- `docs/` - Documentation

### Conventions
- Use functional patterns over classes
- All exports must have JSDoc comments
- Tests required for public APIs

See CONTRIBUTING.md for detailed architecture.

## Code Guidelines

Follow CONTRIBUTING.md for architecture and patterns.

Key points:
- Pure functions preferred
- Error handling via Result types
- No external dependencies in core

## Testing

npm test                    # All tests
npm test -- --watch        # Watch mode
npm test -- path/to/test   # Specific test
npm run coverage           # Coverage report

## Releases

Use the **github-releases** skill for version management and releases. See docs/RELEASING.md for details.

## Landing the Plane (Session Completion)

**When ending a work session**, complete ALL steps:

1. **File issues for remaining work** - Create issues for follow-up
2. **Run quality gates** - `npm test && npm run lint && npm run build`
3. **Update issue status** - Close finished, update in-progress
4. **PUSH TO REMOTE**:
   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```
5. **Verify** - All changes committed AND pushed

**CRITICAL**: Work is NOT complete until `git push` succeeds.
```

### Example 2: Minimal Python Project (No Skills)

**Detected**:
- pyproject.toml with scripts
- No `.opencode/skills/` directory
- No beads
- No CONTRIBUTING.md

**Generated AGENTS.md** (~30 lines):

```markdown
# simple-python-tool

CLI tool for file organization.

**Tech Stack**: Python 3.11  
**Build**: `pip install -e .` | **Test**: `pytest`

## Development

### Build & Test
pip install -e .    # Install in editable mode
pytest              # Run tests
pytest -v           # Verbose output

### Project Structure
- `src/` - Python source
- `tests/` - Pytest tests
- `pyproject.toml` - Project config

### Conventions
- Type hints required for public functions
- Docstrings follow Google style
```

---

## Implementation Notes

### Generic Language Pattern

Use generic references to skills, not hardcoded names:

**Good**:
```markdown
For releases, load the release skill...
Check if observability skills are available...
```

**Bad**:
```markdown
Load the github-releases skill...
Use skill/observability-triage...
```

### Skill Reference Pattern

When referencing skills, use this pattern:

```markdown
[Use Case Description]

Check if there are skills available for [use case]. If found, load and follow their guidance.
```

This allows AGENTS.md to remain valid even if skill names change.

### Verification Checklist

After generating AGENTS.md:

- [ ] All commands are valid for the project
- [ ] File paths referenced exist
- [ ] Skill-specific sections only appear if skill installed
- [ ] beads sections only appear if beads installed
- [ ] Total length within target range
- [ ] No hardcoded skill names
