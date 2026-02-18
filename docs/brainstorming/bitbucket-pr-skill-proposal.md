# Bitbucket PR Skill - Implementation Proposal

## Overview

A skill for managing Bitbucket pull requests with three core use cases:
1. **Create/Update PR** - Create new PRs or update existing ones
2. **PR Review** - Analyze changes and provide feedback via comments and tasks
3. **Process PR Feedback** - Handle existing comments and tasks

**Key Principle**: The skill is **project-agnostic**. It provides the process and tools, but discovers project-specific rules (style guides, conventions) at runtime.

---

## Directory Structure

```
bitbucket-pr/
├── SKILL.md                          # Main skill entry point (~200 lines)
├── scripts/                          # Bash scripts for API interaction
│   ├── bb-api.sh                     # Core API wrapper functions
│   ├── create-or-update-pr.sh        # Use case 1: PR creation/update
│   ├── review-pr.sh                  # Use case 2: PR review orchestration
│   └── process-pr-feedback.sh        # Use case 3: Handle comments/tasks
├── references/                       # Detailed documentation
│   ├── create-update-workflow.md     # Use case 1 details
│   ├── review-workflow.md            # Use case 2 details
│   ├── feedback-workflow.md          # Use case 3 details
│   ├── api-reference.md              # Complete API endpoint docs
│   └── project-discovery.md          # How to find project-specific rules
└── README.md                         # Quick start guide
```

---

## Core Components

### 1. `bb-api.sh` - API Wrapper Library

**Purpose**: Reusable Bash functions for all Bitbucket API operations

**Key Functions**:
```bash
# Configuration
bb_init()                    # Initialize (check token, detect project/repo)

# Read Operations
bb_get_pr()                  # Get PR details
bb_get_pr_diff()             # Get full diff
bb_get_pr_changes()          # Get list of changed files
bb_get_pr_commits()          # Get commits in PR
bb_get_pr_comments()         # Get all comments
bb_get_pr_tasks()            # Get all tasks
bb_get_file_diff()           # Get diff for specific file

# Write Operations
bb_create_pr()               # Create new PR
bb_update_pr()               # Update PR title/description
bb_add_comment()             # Add general comment
bb_add_file_comment()        # Add inline comment (specific line)
bb_create_task()             # Create task
bb_resolve_task()            # Mark task as resolved
bb_approve_pr()              # Approve PR
bb_unapprove_pr()            # Remove approval

# Helper Functions
bb_parse_pr_url()            # Extract project/repo/pr from URL
bb_get_current_branch()      # Get current git branch
bb_detect_target_branch()    # Detect target branch (main/master/develop)
```

**Implementation Notes**:
- Use `jq` for JSON parsing
- Return structured data (JSON or tab-separated)
- Error handling with clear messages
- Support both URL and project/repo/pr arguments

---

## Use Case 1: Create or Update PR

### Script: `create-or-update-pr.sh`

**Usage**:
```bash
# Create PR from current branch
./create-or-update-pr.sh create

# Update existing PR
./create-or-update-pr.sh update <pr-url-or-id>

# Create with custom title/description
./create-or-update-pr.sh create --title "My PR" --description "Description"
```

**Workflow**:
1. **Detect context**:
   - Current git branch
   - Target branch (main/master/develop)
   - Project/repo from git remote
   
2. **Generate PR content**:
   - Title from branch name or commit messages
   - Description from commit messages
   - Auto-detect related issues/tickets

3. **Create or update PR**:
   - Call `bb_create_pr()` or `bb_update_pr()`
   - Add labels if supported
   - Add reviewers if configured

4. **Output**:
   - PR URL
   - PR ID
   - Success/failure message

**Agent Interaction**:
```markdown
Agent discovers project conventions:
- Check for `.github/pull_request_template.md`
- Check for CONTRIBUTING.md
- Look for commit message conventions
- Use discovered patterns to generate PR content
```

---

## Use Case 2: PR Review

### Script: `review-pr.sh`

**Usage**:
```bash
# Review specific PR
./review-pr.sh <pr-url-or-id>

# Review with focus areas
./review-pr.sh <pr-url-or-id> --focus "security,performance"

# Dry run (no comments/tasks created)
./review-pr.sh <pr-url-or-id> --dry-run
```

**Workflow**:

1. **Fetch PR data**:
   ```bash
   PR_INFO=$(bb_get_pr $PR_ID)
   CHANGES=$(bb_get_pr_changes $PR_ID)
   COMMITS=$(bb_get_pr_commits $PR_ID)
   ```

2. **Discover project rules** (agent does this):
   - Find style guides (e.g., `docs/style-guide.md`)
   - Find coding standards (e.g., `.editorconfig`, `CONTRIBUTING.md`)
   - Check for project-specific review checklists
   - Look for test requirements (e.g., `pytest.ini`, test coverage configs)

3. **Analyze each changed file**:
   ```bash
   for FILE in $CHANGED_FILES; do
       DIFF=$(bb_get_file_diff $PR_ID $FILE)
       
       # Agent analyzes:
       # - Code quality
       # - Security issues
       # - Performance concerns
       # - Test coverage
       # - Documentation
       # - Project-specific rules
       
       # Generate feedback (JSON format)
       echo "$FEEDBACK" > /tmp/feedback-$FILE.json
   done
   ```

4. **Post feedback**:
   ```bash
   # Add inline comments
   bb_add_file_comment $PR_ID "path/to/file.py" 42 "Comment text"
   
   # Create tasks for required changes
   bb_create_task $PR_ID "Task description"
   
   # Add summary comment
   bb_add_comment $PR_ID "Review summary..."
   ```

5. **Output**:
   - Summary of findings
   - Number of comments added
   - Number of tasks created
   - Approval recommendation

**Feedback Structure** (JSON):
```json
{
  "file": "src/example.py",
  "line": 42,
  "severity": "error|warning|info",
  "category": "security|performance|style|tests|docs",
  "message": "Description of issue",
  "suggestion": "How to fix it (optional)",
  "create_task": true
}
```

**Agent's Role**:
- Read changed files
- Discover project rules
- Analyze against rules
- Generate feedback JSON
- Script posts feedback to Bitbucket

---

## Use Case 3: Process PR Feedback

### Script: `process-pr-feedback.sh`

**Usage**:
```bash
# Process all feedback in PR
./process-pr-feedback.sh <pr-url-or-id>

# Process specific comment
./process-pr-feedback.sh <pr-url-or-id> --comment <comment-id>

# Auto-resolve addressed tasks
./process-pr-feedback.sh <pr-url-or-id> --auto-resolve
```

**Workflow**:

1. **Fetch all feedback**:
   ```bash
   COMMENTS=$(bb_get_pr_comments $PR_ID)
   TASKS=$(bb_get_pr_tasks $PR_ID)
   ```

2. **Categorize feedback**:
   - Active tasks (OPEN)
   - Resolved tasks (RESOLVED)
   - Unresolved comments
   - Questions needing answers

3. **Agent analyzes**:
   - Read current code
   - Check if task has been addressed
   - Verify comment concerns resolved
   - Detect new issues introduced

4. **Take actions**:
   ```bash
   # Resolve tasks that are addressed
   bb_resolve_task $TASK_ID
   
   # Reply to comments
   bb_add_comment $PR_ID "Response to comment"
   
   # Create new tasks if issues found
   bb_create_task $PR_ID "New issue description"
   ```

5. **Output**:
   - Summary of feedback status
   - Tasks resolved
   - Comments addressed
   - Remaining work

**Auto-Resolution Logic**:
```bash
# For each open task:
# 1. Parse task description
# 2. Check if related code changed
# 3. Verify issue is fixed
# 4. Resolve task with comment
```

---

## API Reference Structure

### `references/api-reference.md`

Complete documentation of all Bitbucket API endpoints used:

**Read Endpoints**:
- GET PR details
- GET PR diff
- GET PR changes (file list)
- GET PR commits
- GET PR comments
- GET PR tasks
- GET file-specific diff

**Write Endpoints**:
- POST create PR
- PUT update PR
- POST add comment (general)
- POST add comment (inline)
- POST create task
- PUT resolve/unresolve task
- POST approve PR
- DELETE unapprove PR

**For each endpoint**:
- URL pattern
- Required parameters
- Optional parameters
- Request body format
- Response format
- Error codes
- Example curl command
- Example response

---

## Project Discovery Workflow

### `references/project-discovery.md`

**How the skill discovers project-specific rules**:

1. **Style Guides**:
   ```bash
   # Common locations
   - docs/style-guide.md
   - STYLEGUIDE.md
   - .github/STYLE_GUIDE.md
   - docs/coding-standards.md
   ```

2. **Contributing Guidelines**:
   ```bash
   - CONTRIBUTING.md
   - .github/CONTRIBUTING.md
   - docs/CONTRIBUTING.md
   ```

3. **Review Checklists**:
   ```bash
   - .github/PULL_REQUEST_TEMPLATE.md
   - docs/review-checklist.md
   - REVIEW_CHECKLIST.md
   ```

4. **Testing Requirements**:
   ```bash
   - Look for test config files (pytest.ini, jest.config.js)
   - Check for coverage requirements
   - Find test documentation
   ```

5. **Code Formatters/Linters**:
   ```bash
   - .editorconfig
   - .prettierrc
   - .eslintrc
   - pyproject.toml
   - .flake8
   ```

6. **Project-Specific Tools**:
   ```bash
   - Check package.json scripts
   - Check Makefile targets
   - Check CI/CD config (.github/workflows, .gitlab-ci.yml)
   ```

**Agent Workflow**:
```markdown
1. Agent is invoked: "Review PR 2639"
2. Skill loads: bitbucket-pr
3. Agent calls: ./review-pr.sh 2639
4. Script fetches PR data
5. Agent discovers project rules:
   - Reads CONTRIBUTING.md
   - Finds .flake8 config
   - Checks pytest.ini
6. Agent analyzes changes against rules
7. Agent generates feedback JSON
8. Script posts feedback to Bitbucket
```

---

## SKILL.md Structure

```markdown
---
name: bitbucket-pr
description: "Manage Bitbucket pull requests: create/update PRs, perform code reviews, process feedback"
---

# Bitbucket PR Management

Comprehensive PR management for Bitbucket Data Center/Server.

## Use Cases

1. **Create or Update PR** - Generate PRs from branches or update existing ones
2. **PR Review** - Analyze changes and provide structured feedback
3. **Process Feedback** - Handle comments and tasks systematically

## Prerequisites

- `BITBUCKET_TOKEN` environment variable set
- `jq` installed (JSON parsing)
- Git repository with Bitbucket remote

## Quick Start

### Use Case 1: Create PR
[Link to create-update-workflow.md]

### Use Case 2: Review PR
[Link to review-workflow.md]

### Use Case 3: Process Feedback
[Link to feedback-workflow.md]

## Project Discovery

This skill is **project-agnostic**. It discovers project-specific rules at runtime:
- Style guides
- Coding standards
- Review checklists
- Testing requirements

[Link to project-discovery.md for details]

## Scripts

- `bb-api.sh` - Core API wrapper
- `create-or-update-pr.sh` - Create/update PRs
- `review-pr.sh` - Perform code review
- `process-pr-feedback.sh` - Handle feedback

## Reference Files

- [API Reference](references/api-reference.md)
- [Create/Update Workflow](references/create-update-workflow.md)
- [Review Workflow](references/review-workflow.md)
- [Feedback Workflow](references/feedback-workflow.md)
- [Project Discovery](references/project-discovery.md)
```

---

## Key Design Decisions

### 1. Bash for API Interaction
**Why**: 
- Simple, portable
- Easy to debug
- Shell-friendly for CI/CD
- `jq` provides excellent JSON handling
- Can be called from agent directly

### 2. Separate Scripts per Use Case
**Why**:
- Clear separation of concerns
- Easy to test independently
- Agent can invoke specific workflow
- Simpler maintenance

### 3. Project-Agnostic Design
**How**:
- Skill provides process/tools only
- Agent discovers project rules at runtime
- No hardcoded conventions
- Flexible for any project

### 4. JSON for Feedback
**Why**:
- Structured data
- Easy to parse and post
- Agent generates, script consumes
- Clear contract between agent and script

### 5. bb-api.sh Library
**Why**:
- DRY principle
- Consistent API usage
- Easy to extend
- All three use cases share same functions

---

## Implementation Plan

### Phase 1: Core API Library
1. Create `bb-api.sh` with all API functions
2. Test each function independently
3. Document return formats

### Phase 2: Use Case 1 (Create/Update PR)
1. Implement `create-or-update-pr.sh`
2. Test PR creation and updates
3. Write workflow documentation

### Phase 3: Use Case 2 (PR Review)
1. Implement `review-pr.sh`
2. Define feedback JSON schema
3. Test review workflow end-to-end
4. Write review documentation

### Phase 4: Use Case 3 (Process Feedback)
1. Implement `process-pr-feedback.sh`
2. Test feedback processing
3. Implement auto-resolution logic
4. Write feedback documentation

### Phase 5: Integration & Documentation
1. Create SKILL.md
2. Write all reference docs
3. Create project-discovery guide
4. End-to-end testing with real PR

---

## Example Usage Scenarios

### Scenario 1: Developer Creates PR
```bash
# Agent invoked: "Create a PR from my current branch"
./scripts/create-or-update-pr.sh create

# Script:
# - Detects current branch: feature/add-auth
# - Detects target: main
# - Generates title from commits
# - Creates PR
# - Returns URL
```

### Scenario 2: Code Review
```bash
# Agent invoked: "Review PR 2639"
./scripts/review-pr.sh 2639

# Workflow:
# 1. Script fetches PR data
# 2. Agent discovers project rules (CONTRIBUTING.md, .flake8)
# 3. Agent analyzes each changed file
# 4. Agent generates feedback JSON
# 5. Script posts comments/tasks to Bitbucket
```

### Scenario 3: Process Feedback
```bash
# Agent invoked: "Process feedback for PR 2639"
./scripts/process-pr-feedback.sh 2639

# Workflow:
# 1. Script fetches comments and tasks
# 2. Agent reads current code
# 3. Agent checks if tasks addressed
# 4. Script resolves completed tasks
# 5. Agent replies to unresolved comments
```

---

## Testing Strategy

### Unit Tests (per function in bb-api.sh)
```bash
test_bb_get_pr()
test_bb_create_pr()
test_bb_add_comment()
# etc.
```

### Integration Tests (per use case)
```bash
test_create_pr_workflow()
test_review_pr_workflow()
test_process_feedback_workflow()
```

### End-to-End Test
```bash
# Full cycle:
# 1. Create test branch
# 2. Make changes
# 3. Create PR via script
# 4. Review PR via script
# 5. Process feedback via script
# 6. Verify Bitbucket state
```

---

## Success Criteria

- ✅ All API operations work correctly
- ✅ Each use case has dedicated script
- ✅ Scripts are project-agnostic
- ✅ Agent can discover project rules at runtime
- ✅ Clear separation: agent (analysis) vs script (API calls)
- ✅ Comprehensive documentation
- ✅ Error handling and logging
- ✅ Tested with real Bitbucket instance

---

## Future Enhancements

1. **PR Templates**: Auto-apply templates based on PR type
2. **Auto-Assignment**: Suggest reviewers based on file ownership
3. **Conflict Detection**: Warn about merge conflicts early
4. **CI/CD Integration**: Monitor build status
5. **Metrics**: Track review times, comment resolution rates
6. **Batch Operations**: Review multiple PRs at once

