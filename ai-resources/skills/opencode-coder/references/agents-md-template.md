# Generating AGENTS.md

Instructions for generating or updating an AGENTS.md file for any project.

**Goal**: Produce a small AGENTS.md that acts as a routing table — each section points agents to the right documents and skills for a given use case. No inline content except Project Overview and Landing the Plane.

**Target size**: 30-60 lines.

---

## Standard File Convention

Each section maps to a standard file in `docs/`:

| Section | Standard File | Always Present |
|---------|--------------|----------------|
| Project Overview | *(inline)* | Yes |
| Coding | `docs/CODING.md` | Yes |
| Testing | `docs/TESTING.md` | Only if relevant docs/skills exist |
| Releases | `docs/RELEASING.md` | Only if relevant docs/skills exist |
| Monitoring | `docs/MONITORING.md` | Only if relevant docs/skills exist |
| Landing the Plane | *(inline)* | Only if beads is installed |

---

## Workflow

### Step 1: Gather Context

Spawn an **explore agent** with the following prompt:

> Analyze this project and return a structured summary with:
>
> 1. **Project identity** — Name, one-sentence description, tech stack
> 2. **Build & test commands** — How to build, test, lint, type-check (extract from project config files and scripts)
> 3. **Directory structure** — Top-level directories with one-line purpose each
> 4. **Existing docs** — List ALL files in `docs/` directory (if it exists). Also check for `CONTRIBUTING.md`, `CODING.md`, `TESTING.md`, `RELEASING.md`, `MONITORING.md` in project root. Report full paths.
> 5. **Coding conventions** — Are there any files that describe coding conventions, guidelines, or architecture? Check: `CONTRIBUTING.md`, `docs/coding-guidelines.md`, `docs/CODING.md`, `.editorconfig`, or similar. Report filenames only.
> 6. **Testing docs** — Are there files that describe testing patterns, test setup, or test conventions? Report filenames only.
> 7. **Release docs** — Are there files that describe the release process? Report filenames only.
> 8. **Monitoring docs** — Are there files that describe monitoring, observability, or log analysis? Report filenames only.
> 9. **Installed skills** — List all skills in `.opencode/skills/` directory with their descriptions
> 10. **Beads status** — Is `bd` CLI available? Is `.beads/` directory present?
>
> Be thorough but return ONLY the structured summary, no commentary.

Wait for the explore agent to return before proceeding.

### Step 2: Map Existing Docs to Sections

From the explore output, map every discovered doc file to a section:

| Section | Matches these existing files |
|---------|------------------------------|
| Coding | `CONTRIBUTING.md`, `docs/coding-guidelines.md`, `docs/CODING.md`, `docs/architecture.md`, `.editorconfig` |
| Testing | `docs/TESTING.md`, `docs/testing-guide.md`, `docs/test-patterns.md` |
| Releases | `docs/RELEASING.md`, `docs/release-process.md`, `RELEASING.md` |
| Monitoring | `docs/MONITORING.md`, `docs/observability.md`, `docs/logging.md` |

Also map installed skills to sections:
- Skills matching "release", "publish", "ship" → Releases
- Skills matching "observability", "triage", "monitoring" → Monitoring
- Skills matching "test" → Testing

A section is **active** if it has at least one matching doc file OR one matching skill. Exception: **Coding** is always active.

### Step 3: Migration Decision

Check if any active section has docs under **non-standard names** (e.g., `docs/coding-guidelines.md` instead of `docs/CODING.md`, or `CONTRIBUTING.md` containing coding conventions in root instead of `docs/`).

If non-standard names are found, ask the user **once**:

> "This plugin uses a standard documentation structure where each topic has a dedicated file in `docs/`:
>
> | Topic | Standard File |
> |-------|--------------|
> | Coding | `docs/CODING.md` |
> | Testing | `docs/TESTING.md` |
> | Releases | `docs/RELEASING.md` |
> | Monitoring | `docs/MONITORING.md` |
>
> I found existing docs that could be migrated into this structure:
>
> - `docs/coding-guidelines.md` → `docs/CODING.md`
> - `CONTRIBUTING.md` (coding conventions) → `docs/CODING.md` (CONTRIBUTING.md would reference it)
> - *(list all proposed moves)*
>
> Would you like to adopt the standard structure?"

**If yes:**
1. Create the standard files and move/consolidate content
2. If `CONTRIBUTING.md` had coding conventions mixed with contribution process, split them: coding conventions go to `docs/CODING.md`, `CONTRIBUTING.md` keeps the contribution process and adds a reference to `docs/CODING.md`
3. Reference the new standard paths in AGENTS.md

**If no:**
- Reference the existing file paths as-is in AGENTS.md

### Step 4: Create Missing Standard Files

For the **Coding** section (always active): if no conventions files exist anywhere, create `docs/CODING.md` with build commands, directory structure, and basic conventions extracted from the codebase.

For other active sections: only create the standard file if the explore step gathered enough relevant content to populate it meaningfully. If a section is active only because a skill is installed (no doc content found), just reference the skill in AGENTS.md — don't create a hollow doc file.

**Before creating any new file, ask the user to confirm** — show them a summary of what you plan to write and let them approve or adjust.

### Step 5: Generate AGENTS.md

Build the file section by section:

#### Project Overview (always, inline)

```markdown
# Project Name

One-sentence description.

**Tech Stack**: [from explore agent]
```

Just what the project is and the tech stack. Nothing else.

#### Coding (always)

```markdown
## Coding

Read `docs/CODING.md` for build commands, project structure, and code conventions.
```

If additional files are relevant (e.g., CONTRIBUTING.md was kept separately), list them too:

```markdown
## Coding

Read `docs/CODING.md` for build commands, project structure, and code conventions.

Read `CONTRIBUTING.md` for contribution workflow.
```

#### Testing (conditional)

```markdown
## Testing

Read `docs/TESTING.md` for test patterns and commands.
```

If a testing skill is installed, add: `Load the **skill-name** skill for [description].`

#### Releases (conditional)

```markdown
## Releases

Load the **release-skill-name** skill for release workflow. Read `docs/RELEASING.md` for details.
```

#### Monitoring (conditional)

```markdown
## Monitoring

Load the **monitoring-skill-name** skill for observability and triage. Read `docs/MONITORING.md` for data sources.
```

#### Landing the Plane (conditional — only if beads installed)

Include this exact content:

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

### Step 6: Verify

After generating, confirm:

- [ ] Project Overview is just name + description + tech stack (no commands)
- [ ] Every other section is a pointer (file or skill reference), not a summary
- [ ] All referenced file paths actually exist
- [ ] Coding section is present (always required)
- [ ] Conditional sections only appear when relevant docs/skills exist
- [ ] Landing the Plane only appears if beads is installed
- [ ] No duplicated content from referenced files
- [ ] Total size is under 60 lines

---

## Updating an Existing AGENTS.md

When AGENTS.md already exists:

1. Run the same explore + mapping steps
2. Match existing sections by `##` headers
3. **Update** sections that match template sections (with fresh data)
4. **Preserve** custom sections that don't match any template section
5. **Add** new sections for newly discovered docs/skills
6. **Remove** sections for content that no longer exists
7. Keep custom sections in their original position; place new sections before "Landing the Plane"
8. Offer migration if non-standard file names are detected (same as Step 3)
