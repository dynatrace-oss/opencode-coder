# Task-Sync Skill Design Document

## Overview

The `task-sync` skill is a generic orchestrator for bidirectional synchronization between beads and external task systems (GitHub, Jira, etc.). It provides system-agnostic workflow guidance and delegates implementation to backend-specific skills.

## Skill Metadata

**Name**: `task-sync`

**Description**: 
```yaml
description: "Bidirectional synchronization between beads and external task systems (GitHub, Jira, etc.). Use when: (1) User wants to sync tasks or issues with external systems, (2) Import external issues into beads, (3) Export beads to external systems, (4) User mentions 'sync', 'GitHub issues', 'Jira tickets', 'import bugs', or 'export tasks'. Orchestrates workflow and delegates to backend-specific skills."
```

## SKILL.md Structure (~150-200 lines)

### Section Breakdown

1. **Frontmatter** (lines 1-4)
   - YAML with name and description
   - No other fields

2. **Introduction** (lines 6-15, ~10 lines)
   - Brief overview of skill purpose
   - Relationship to backend skills
   - Two invocation patterns supported

3. **Decision Tree** (lines 17-60, ~45 lines)
   - Detect sync direction (import/export/bidirectional)
   - Detect available backends
   - Load appropriate backend skill
   - Use question tool if unclear

4. **High-Level Workflows** (lines 62-110, ~50 lines)
   - Import workflow overview
   - Export workflow overview
   - Bidirectional workflow overview
   - Each references detailed docs

5. **Safety Principles** (lines 112-145, ~35 lines)
   - Never override without checking
   - Show summary before syncing
   - Agentic decision making
   - Examples of safe vs unsafe changes

6. **Metadata Conventions** (lines 147-170, ~25 lines)
   - Label patterns: source:external, github:123, jira:PROJ-456
   - Direction tracking approach
   - How backends should use labels

7. **Reference Files Index** (lines 172-185, ~15 lines)
   - List all reference files
   - When to load each one

**Total**: ~185 lines (under 200 target)

### Example SKILL.md Outline

```markdown
---
name: task-sync
description: "Bidirectional synchronization between beads and external task systems..."
---

# Task Sync

Bidirectional synchronization between beads and external task tracking systems.

## About This Skill

This skill orchestrates task synchronization workflows. It:
- Provides system-agnostic workflow guidance
- Detects which backend to use (GitHub, Jira, etc.)
- Delegates implementation to backend-specific skills
- Ensures safe, user-controlled synchronization

## Decision Tree

When this skill loads:

1. **Determine Sync Direction**
   - Import (external → beads)?
   - Export (beads → external)?
   - Bidirectional (both)?
   - If unclear, ask user

2. **Detect Backend System**
   - Check available backend skills
   - If only one available → use it
   - If multiple or none → ask user

3. **Load Backend Skill**
   - Load appropriate backend (github-task-sync, jira-task-sync)
   - Pass sync direction to backend
   - Backend follows workflows in reference files

[Question tool example here]

## Import Workflow

High-level steps:
1. Backend fetches external issues
2. Check for duplicates (skip if already imported)
3. Map external data to beads format
4. Create beads with source:external label
5. Show import summary

**For detailed steps**: See [references/import-workflow.md](references/import-workflow.md)

## Export Workflow

High-level steps:
1. Identify eligible beads (not already exported)
2. Show summary and ask confirmation
3. Create external issues for selected beads
4. Add external ID labels to beads
5. Show export summary

**For detailed steps**: See [references/export-workflow.md](references/export-workflow.md)

## Bidirectional Workflow

High-level steps:
1. Run import workflow
2. Detect potential conflicts
3. Run export workflow
4. Resolve conflicts (auto or ask user)

**For detailed steps**: See [references/bidirectional-workflow.md](references/bidirectional-workflow.md)

## Safety Principles

### Rule 1: Never Override Without Checking
Always compare before updating. Show user what will change.

### Rule 2: Agentic Decision Making
- Safe changes (e.g., closing already-closed) → Auto-proceed
- Conflicts (e.g., both changed title) → Ask user

### Rule 3: Show Summary Before Sync
Always preview:
- What will be imported
- What will be exported
- Any conflicts detected

**For conflict resolution guide**: See [references/safety-guidelines.md](references/safety-guidelines.md)

## Metadata Conventions

### Label Patterns

Backends should use these label patterns:

- `source:external` - Issue imported from external system
- `github:123` - Links to GitHub issue #123
- `jira:PROJ-456` - Links to Jira ticket PROJ-456

### Direction Tracking

- Has `source:external` + system label → Imported FROM external
- Has system label only → Created in beads, exported TO external

## Reference Files

Detailed workflows in references/:

- **[import-workflow.md](references/import-workflow.md)** - Complete import process
- **[export-workflow.md](references/export-workflow.md)** - Complete export process
- **[bidirectional-workflow.md](references/bidirectional-workflow.md)** - Combined workflow with conflicts
- **[safety-guidelines.md](references/safety-guidelines.md)** - Conflict resolution patterns
```

## Reference Files

### 1. references/import-workflow.md (~100-150 lines)

**Purpose**: Detailed step-by-step import workflow (external → beads)

**Content**:
- Prerequisites (backend must be ready)
- Step 1: Fetch external issues
- Step 2: Deduplication check (existing labels)
- Step 3: Map external data to beads
  - Priority mapping approach
  - Label mapping approach
  - Metadata extraction
- Step 4: Create beads
  - Title format
  - Body format
  - Labels to apply (source:external, system:ID)
- Step 5: Show summary report
  - Imported count
  - Skipped count
  - Table of imported issues
- Error handling scenarios
- Example import report

### 2. references/export-workflow.md (~100-150 lines)

**Purpose**: Detailed step-by-step export workflow (beads → external)

**Content**:
- Prerequisites (backend must be ready)
- Step 1: Identify eligible beads
  - Criteria: type (bug/feature/task), no external ID label
  - Query: `bd list` with filters
- Step 2: Show summary to user
  - Count of eligible beads
  - Table with bead ID, type, priority, title
  - Ask: "Export all? Select specific? Cancel?"
- Step 3: User decision
  - Export all
  - Export selected (follow-up question)
  - Cancel
- Step 4: For each selected bead
  - Map beads data to external format
  - Create external issue (backend-specific)
  - Capture external ID
  - Add external ID label to bead
- Step 5: Show export report
  - Exported count
  - Table of bead → external mappings
  - Any errors
- Error handling scenarios
- Example export report

### 3. references/bidirectional-workflow.md (~150-200 lines)

**Purpose**: Combined import + export with conflict detection

**Content**:
- Prerequisites
- High-level flow diagram
- Step 1: Run import workflow
  - Follow import-workflow.md
  - Collect import results
- Step 2: Detect conflicts
  - Compare beads state vs external state
  - Identify changes in both systems
  - Categorize: safe changes vs conflicts
- Step 3: Show import summary
  - What was imported
  - Any conflicts detected
- Step 4: Run export workflow
  - Follow export-workflow.md
  - Collect export results
- Step 5: Resolve conflicts
  - Auto-resolve safe changes
  - Ask user for conflict resolution
  - Show conflict summary
- Step 6: Show final summary
  - Import + export counts
  - Conflicts resolved
  - Any remaining issues
- Conflict detection logic
  - Status conflicts (closed vs open)
  - Content conflicts (title, description)
  - Timing conflicts (both modified recently)
- Example scenarios with resolutions

### 4. references/safety-guidelines.md (~100-150 lines)

**Purpose**: Conflict resolution patterns and safety rules

**Content**:
- Core safety principles
  - Rule 1: Safety first
  - Rule 2: Agentic decision making
  - Rule 3: Show before sync
- Safe change patterns
  - Closing already-closed issue
  - Adding comment to existing issue
  - Updating metadata (labels, priority)
- Unsafe change patterns
  - Overwriting user-generated content
  - Changing status without confirmation
  - Deleting issues
- Conflict scenarios with examples
  - Scenario 1: Title changed in both (ask user)
  - Scenario 2: Issue closed in beads, open external (safe, close external)
  - Scenario 3: Issue closed external, open beads (ask user)
  - Scenario 4: New comments in both (safe, add both)
  - Scenario 5: Priority changed in both (ask user)
- User confirmation patterns
  - Preview format
  - Question format
  - Options to provide
- Agentic decision tree
  - When to proceed automatically
  - When to ask user
  - When to skip/abort

## Directory Structure

```
task-sync/
├── SKILL.md                                 (~185 lines)
└── references/
    ├── import-workflow.md                   (~120 lines)
    ├── export-workflow.md                   (~120 lines)
    ├── bidirectional-workflow.md            (~180 lines)
    └── safety-guidelines.md                 (~120 lines)
```

**No scripts/ or assets/ directories** - This is a pure orchestrator

## Key Design Decisions

1. **System-agnostic terminology**: Never mention GitHub/Jira specifics in SKILL.md
2. **Progressive disclosure**: SKILL.md = workflow guidance, references = detailed steps
3. **Backend delegation**: This skill doesn't implement sync, backends do
4. **Safety first**: Always preview, ask when uncertain, never blind override
5. **Two invocation patterns**: Can be loaded directly or via backend skill
6. **Agentic approach**: Model makes safe decisions, asks human for conflicts

## Integration with Backend Skills

Backend skills (e.g., github-task-sync) should:
1. Reference task-sync for workflow guidance
2. Implement system-specific commands
3. Follow metadata conventions defined here
4. Use safety guidelines for conflict resolution
5. Call task-sync reference files for detailed workflow steps

## Success Criteria

- [ ] SKILL.md is ~150-200 lines (under 500 max)
- [ ] Decision tree clearly guides backend selection
- [ ] All 4 reference files planned with clear purpose
- [ ] Safety principles emphasized
- [ ] System-agnostic terminology throughout
- [ ] Progressive disclosure pattern applied
- [ ] Follows skill-creator principles
- [ ] References clearly linked from SKILL.md
