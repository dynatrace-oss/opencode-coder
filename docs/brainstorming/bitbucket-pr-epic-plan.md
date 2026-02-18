# Epic: Bitbucket PR Skill Implementation

## Overview

Implement a comprehensive Bitbucket PR management skill with three core use cases:
1. Create/Update PRs
2. Review PRs (analyze changes, provide feedback)
3. Process PR feedback (handle comments and tasks)

**Timeline**: 2 phases
- **Phase 1**: Base structure, scripts, and first draft
- **Phase 2**: Review and refinement

---

## Epic Structure

### Epic: Implement Bitbucket PR Skill
**Priority**: P1  
**Type**: Epic

**Description**:
Create a project-agnostic skill for managing Bitbucket Data Center pull requests. The skill provides bash scripts for API interaction and workflows for PR creation, review, and feedback processing.

**Goals**:
- ✅ API wrapper library (`bb-api.sh`) with all Bitbucket operations
- ✅ Three use-case scripts (create/update, review, process feedback)
- ✅ Project discovery mechanism (finds style guides, conventions at runtime)
- ✅ Complete documentation (SKILL.md + reference files)
- ✅ Validated and packaged skill

**Success Criteria**:
- [ ] All scripts work with real Bitbucket instance
- [ ] Skill follows skill-creator best practices
- [ ] Documentation is clear and comprehensive
- [ ] Skill passes validation (markdownlint, link checks)
- [ ] Successfully tested on PR 2639

---

## Phase 1: Base Implementation

### Task 1: Initialize Skill Structure
**Priority**: P1  
**Type**: Task  
**Depends on**: None

**Description**:
Create the skill directory structure and initialize all necessary files using the skill-creator patterns.

**Instructions**:
1. Run skill initialization script:
   ```bash
   cd ai-resources/skills
   ../../.opencode/skills/skill-creator/scripts/init_skill.py bitbucket-pr --path .
   ```

2. Verify structure created:
   ```
   bitbucket-pr/
   ├── SKILL.md
   ├── scripts/
   ├── references/
   └── assets/
   ```

3. Remove unnecessary example files from assets/ (this skill won't need assets)

**Acceptance Criteria**:
- [ ] Directory structure exists
- [ ] SKILL.md template created with proper frontmatter
- [ ] scripts/, references/ directories exist
- [ ] No errors from init script

**Files Created**:
- ai-resources/skills/bitbucket-pr/SKILL.md (template)
- ai-resources/skills/bitbucket-pr/scripts/
- ai-resources/skills/bitbucket-pr/references/

---

### Task 2: Implement Core API Library (bb-api.sh)
**Priority**: P1  
**Type**: Task  
**Depends on**: Task 1

**Description**:
Create the core Bash library with reusable functions for all Bitbucket API operations.

**Instructions**:

1. Create `ai-resources/skills/bitbucket-pr/scripts/bb-api.sh` with:
   - Configuration functions (bb_init, bb_check_token)
   - Read operations (bb_get_pr, bb_get_pr_diff, bb_get_pr_changes, etc.)
   - Write operations (bb_create_pr, bb_add_comment, bb_create_task, etc.)
   - Helper functions (bb_parse_pr_url, bb_detect_target_branch)

2. Key functions to implement:
   ```bash
   # Configuration
   bb_init()                    # Check token, detect project/repo
   bb_check_token()             # Verify BITBUCKET_TOKEN is set
   
   # Read Operations
   bb_get_pr()                  # Get PR details
   bb_get_pr_changes()          # Get list of changed files
   bb_get_pr_commits()          # Get commits in PR
   bb_get_pr_comments()         # Get all comments
   bb_get_pr_tasks()            # Get all tasks
   bb_get_pr_diff()             # Get full diff or file-specific diff
   
   # Write Operations
   bb_create_pr()               # Create new PR
   bb_update_pr()               # Update PR title/description
   bb_add_comment()             # Add general comment
   bb_add_file_comment()        # Add inline comment (line-specific)
   bb_create_task()             # Create task
   bb_resolve_task()            # Mark task as resolved
   bb_approve_pr()              # Approve PR
   
   # Helper Functions
   bb_parse_pr_url()            # Extract project/repo/pr from URL
   bb_get_current_branch()      # Get current git branch
   bb_detect_target_branch()    # Detect target (main/master/develop)
   bb_extract_repo_info()       # Get project/repo from git remote
   ```

3. Implementation requirements:
   - Use `curl` for API calls
   - Use `jq` for JSON parsing
   - Consistent error handling (return codes + stderr messages)
   - All functions output structured data (JSON or tab-separated)
   - Base URL: `https://bitbucket.lab.dynatrace.org/rest/api/1.0`
   - Authentication: `Authorization: Bearer $BITBUCKET_TOKEN`

4. Test each function manually:
   ```bash
   export BITBUCKET_TOKEN='your_token'
   source scripts/bb-api.sh
   bb_get_pr PFS copilot-skills 2639
   ```

**Acceptance Criteria**:
- [ ] bb-api.sh file created with all functions
- [ ] All read operations tested and working
- [ ] All write operations implemented (test manually on non-critical PR)
- [ ] Error handling works (clear messages for missing token, invalid PR, etc.)
- [ ] Functions return structured, parseable data
- [ ] Code is well-commented

**Files to Create**:
- ai-resources/skills/bitbucket-pr/scripts/bb-api.sh

**Reference**:
- See docs/brainstorming/bitbucket-pr-skill-proposal.md for API details
- Test script: docs/brainstorming/test-bitbucket.sh

---

### Task 3: Implement Use Case 1 Script (Create/Update PR)
**Priority**: P1  
**Type**: Task  
**Depends on**: Task 2

**Description**:
Create script for creating new PRs or updating existing ones.

**Instructions**:

1. Create `ai-resources/skills/bitbucket-pr/scripts/create-or-update-pr.sh`:
   ```bash
   #!/bin/bash
   # Create or update Bitbucket pull requests
   
   # Usage:
   #   create-or-update-pr.sh create [--title "..."] [--description "..."]
   #   create-or-update-pr.sh update <pr-id> [--title "..."] [--description "..."]
   ```

2. Script workflow:
   - Parse command-line arguments
   - Source bb-api.sh for API functions
   - Detect git context (current branch, target branch, project/repo)
   - For CREATE: call bb_create_pr with detected/provided info
   - For UPDATE: call bb_update_pr with new info
   - Output PR URL and ID

3. Features:
   - Auto-detect target branch (main, master, develop)
   - Auto-generate title from branch name if not provided
   - Auto-generate description from recent commits if not provided
   - Support both URL and PR ID for updates

4. Test:
   ```bash
   # Don't actually create PRs during testing
   # Just test argument parsing and detection logic
   ./create-or-update-pr.sh create --dry-run
   ```

**Acceptance Criteria**:
- [ ] Script created and executable
- [ ] Argument parsing works correctly
- [ ] Git context detection works (branch, remote)
- [ ] CREATE mode implemented
- [ ] UPDATE mode implemented
- [ ] Clear error messages for missing arguments
- [ ] Outputs PR URL on success

**Files to Create**:
- ai-resources/skills/bitbucket-pr/scripts/create-or-update-pr.sh

---

### Task 4: Implement Use Case 2 Script (Review PR)
**Priority**: P1  
**Type**: Task  
**Depends on**: Task 2

**Description**:
Create script for reviewing PRs (fetches data, agent analyzes, posts feedback).

**Instructions**:

1. Create `ai-resources/skills/bitbucket-pr/scripts/review-pr.sh`:
   ```bash
   #!/bin/bash
   # Review a Bitbucket pull request
   
   # Usage:
   #   review-pr.sh <pr-id-or-url> [--dry-run] [--focus "security,performance"]
   ```

2. Script workflow:
   - Parse PR ID/URL
   - Source bb-api.sh
   - Fetch PR data (details, changes, commits)
   - Output fetched data for agent analysis
   - Read feedback from stdin (JSON format)
   - Post feedback to Bitbucket (comments, tasks)

3. Feedback JSON format (agent generates this):
   ```json
   {
     "summary": "Overall review summary",
     "items": [
       {
         "file": "path/to/file.py",
         "line": 42,
         "severity": "error|warning|info",
         "category": "security|performance|style|tests|docs",
         "message": "Issue description",
         "suggestion": "How to fix (optional)",
         "create_task": true
       }
     ]
   }
   ```

4. Script posts:
   - Summary comment (general)
   - Inline comments (file-specific, line-specific)
   - Tasks (for items with create_task: true)

**Acceptance Criteria**:
- [ ] Script created and executable
- [ ] Fetches PR data correctly
- [ ] Accepts feedback JSON from stdin
- [ ] Posts summary comments
- [ ] Posts inline comments (file + line)
- [ ] Creates tasks
- [ ] Dry-run mode works (shows what would be posted)

**Files to Create**:
- ai-resources/skills/bitbucket-pr/scripts/review-pr.sh

---

### Task 5: Implement Use Case 3 Script (Process Feedback)
**Priority**: P1  
**Type**: Task  
**Depends on**: Task 2

**Description**:
Create script for processing PR feedback (fetches comments/tasks, agent analyzes, updates status).

**Instructions**:

1. Create `ai-resources/skills/bitbucket-pr/scripts/process-pr-feedback.sh`:
   ```bash
   #!/bin/bash
   # Process feedback on a Bitbucket pull request
   
   # Usage:
   #   process-pr-feedback.sh <pr-id-or-url> [--auto-resolve]
   ```

2. Script workflow:
   - Parse PR ID/URL
   - Source bb-api.sh
   - Fetch all comments and tasks
   - Output for agent analysis
   - Read actions from stdin (JSON format)
   - Execute actions (resolve tasks, reply to comments)

3. Actions JSON format (agent generates this):
   ```json
   {
     "resolve_tasks": [123, 456],
     "replies": [
       {
         "comment_id": 789,
         "text": "Reply text"
       }
     ],
     "new_tasks": [
       {
         "text": "New issue found"
       }
     ]
   }
   ```

4. Script executes:
   - Resolve specified tasks
   - Post replies to comments
   - Create new tasks if needed

**Acceptance Criteria**:
- [ ] Script created and executable
- [ ] Fetches comments and tasks correctly
- [ ] Accepts actions JSON from stdin
- [ ] Resolves tasks
- [ ] Posts comment replies
- [ ] Creates new tasks
- [ ] Summary output of actions taken

**Files to Create**:
- ai-resources/skills/bitbucket-pr/scripts/process-pr-feedback.sh

---

### Task 6: Write SKILL.md (First Draft)
**Priority**: P2  
**Type**: Task  
**Depends on**: Tasks 3, 4, 5

**Description**:
Write the main SKILL.md file with overview and workflow guidance.

**Instructions**:

1. Update `ai-resources/skills/bitbucket-pr/SKILL.md` frontmatter:
   ```yaml
   ---
   name: bitbucket-pr
   description: "Manage Bitbucket pull requests: create/update PRs, perform code reviews with project-specific rules, process feedback and tasks. Use when working with Bitbucket Data Center/Server PRs for: (1) Creating or updating pull requests, (2) Reviewing code changes and providing structured feedback, (3) Processing and resolving PR comments and tasks. Project-agnostic - discovers style guides and conventions at runtime."
   ---
   ```

2. Write body (~200 lines):
   - Introduction (what the skill does)
   - Prerequisites (BITBUCKET_TOKEN, jq)
   - Three use cases with examples
   - Project discovery overview
   - Links to reference files

3. Structure:
   ```markdown
   # Bitbucket PR Management
   
   ## Overview
   [Brief intro]
   
   ## Prerequisites
   [Requirements]
   
   ## Use Case 1: Create or Update PR
   [Quick example, link to references/create-update-workflow.md]
   
   ## Use Case 2: Review PR
   [Quick example, link to references/review-workflow.md]
   
   ## Use Case 3: Process Feedback
   [Quick example, link to references/feedback-workflow.md]
   
   ## Project Discovery
   [How skill finds project rules, link to references/project-discovery.md]
   
   ## Scripts
   [List all scripts with brief descriptions]
   
   ## Reference Files
   [List all reference docs]
   ```

4. Follow skill-creator principles:
   - Concise (under 500 lines)
   - Clear when to use each workflow
   - Progressive disclosure (details in references/)
   - No duplication

**Acceptance Criteria**:
- [ ] Frontmatter complete with clear description
- [ ] Body under 500 lines
- [ ] All three use cases documented with examples
- [ ] Links to reference files
- [ ] Clear prerequisites section
- [ ] Follows skill-creator patterns

**Files to Modify**:
- ai-resources/skills/bitbucket-pr/SKILL.md

---

### Task 7: Write Reference Files
**Priority**: P2  
**Type**: Task  
**Depends on**: Task 6

**Description**:
Create detailed reference documentation for each workflow and the API.

**Instructions**:

Create the following reference files:

1. **references/api-reference.md** (~200 lines):
   - Complete documentation of all Bitbucket API endpoints
   - For each endpoint: URL, parameters, request/response format, example
   - Error codes and handling

2. **references/create-update-workflow.md** (~150 lines):
   - Detailed workflow for creating/updating PRs
   - Branch detection logic
   - Title/description generation strategies
   - Examples

3. **references/review-workflow.md** (~200 lines):
   - Detailed review process
   - Feedback JSON schema
   - How agent analyzes code
   - How script posts feedback
   - Examples of good feedback

4. **references/feedback-workflow.md** (~150 lines):
   - Detailed feedback processing workflow
   - Task resolution logic
   - Comment reply strategies
   - Auto-resolution criteria
   - Examples

5. **references/project-discovery.md** (~150 lines):
   - How to find style guides
   - How to find coding standards
   - How to find review checklists
   - How to find test requirements
   - Example discovery workflow

**Acceptance Criteria**:
- [ ] All 5 reference files created
- [ ] Each file is comprehensive and well-structured
- [ ] Examples included where helpful
- [ ] Links work correctly
- [ ] No duplication with SKILL.md

**Files to Create**:
- ai-resources/skills/bitbucket-pr/references/api-reference.md
- ai-resources/skills/bitbucket-pr/references/create-update-workflow.md
- ai-resources/skills/bitbucket-pr/references/review-workflow.md
- ai-resources/skills/bitbucket-pr/references/feedback-workflow.md
- ai-resources/skills/bitbucket-pr/references/project-discovery.md

---

### Task 8: Test End-to-End with Real PR
**Priority**: P1  
**Type**: Task  
**Depends on**: Tasks 2, 3, 4, 5

**Description**:
Test all scripts with real Bitbucket instance using PR 2639 or a test PR.

**Instructions**:

1. Test bb-api.sh functions:
   ```bash
   cd ai-resources/skills/bitbucket-pr
   export BITBUCKET_TOKEN='your_token'
   source scripts/bb-api.sh
   
   # Test each function
   bb_get_pr PFS copilot-skills 2639
   bb_get_pr_changes PFS copilot-skills 2639
   bb_get_pr_comments PFS copilot-skills 2639
   # etc.
   ```

2. Test create-or-update-pr.sh:
   ```bash
   # Test detection (dry-run)
   ./scripts/create-or-update-pr.sh create --dry-run
   
   # Don't actually create PR unless needed for testing
   ```

3. Test review-pr.sh:
   ```bash
   # Fetch PR data
   ./scripts/review-pr.sh 2639 --dry-run
   
   # Test with sample feedback JSON
   echo '{"summary": "Test review", "items": []}' | \
     ./scripts/review-pr.sh 2639 --dry-run
   ```

4. Test process-pr-feedback.sh:
   ```bash
   # Fetch feedback
   ./scripts/process-pr-feedback.sh 2639
   
   # Test with sample actions (dry-run)
   echo '{"resolve_tasks": [], "replies": []}' | \
     ./scripts/process-pr-feedback.sh 2639 --dry-run
   ```

5. Document any issues found and fix them

**Acceptance Criteria**:
- [ ] All bb-api.sh functions tested and working
- [ ] create-or-update-pr.sh tested (at least dry-run)
- [ ] review-pr.sh tested with PR 2639
- [ ] process-pr-feedback.sh tested with PR 2639
- [ ] All errors fixed
- [ ] Scripts handle edge cases (missing token, invalid PR, etc.)

**Files to Modify**:
- Fix any bugs found in scripts

---

## Phase 2: Review and Refinement

### Gate: Phase 1 Review
**Priority**: P1  
**Type**: Gate

**Description**:
Review the base implementation before proceeding to Phase 2 refinements.

**Gate Criteria**:
- [ ] All Phase 1 tasks complete
- [ ] Scripts tested and working
- [ ] SKILL.md first draft complete
- [ ] Reference files created
- [ ] User reviews implementation and provides feedback

**Owner**: User (Hans)

---

### Task 9: Validate Skill Structure
**Priority**: P2  
**Type**: Task  
**Depends on**: Phase 1 Review Gate

**Description**:
Use skill-validator to check the skill for errors.

**Instructions**:

1. Load skill-validator skill (if not already loaded)

2. Run markdown validation:
   ```bash
   cd ai-resources/skills/bitbucket-pr
   markdownlint-cli2 "**/*.md"
   ```

3. Check for broken links:
   - Verify all links in SKILL.md resolve
   - Verify all links in reference files resolve

4. Validate code blocks:
   - Check bash code syntax with shellcheck
   - Verify JSON examples are valid

5. Fix any issues found

**Acceptance Criteria**:
- [ ] Markdown lint passes with zero errors
- [ ] All links resolve correctly
- [ ] Code blocks are syntactically valid
- [ ] No validation errors

**Files to Modify**:
- Fix any issues found in SKILL.md or reference files

---

### Task 10: Refinements Based on Review
**Priority**: P2  
**Type**: Task  
**Depends on**: Phase 1 Review Gate

**Description**:
Implement any changes requested during Phase 1 review.

**Instructions**:
- TBD based on review feedback
- May include:
  - Adding new API functions
  - Improving documentation
  - Adding examples
  - Enhancing error handling
  - Performance improvements

**Acceptance Criteria**:
- [ ] All review feedback addressed
- [ ] Changes tested
- [ ] Documentation updated

---

### Task 11: Package Skill
**Priority**: P2  
**Type**: Task  
**Depends on**: Tasks 9, 10

**Description**:
Package the skill into a distributable .skill file.

**Instructions**:

1. Run packaging script:
   ```bash
   cd .opencode/skills/skill-creator
   ./scripts/package_skill.py \
     ../../../ai-resources/skills/bitbucket-pr \
     ../../../dist
   ```

2. Script will:
   - Validate skill automatically
   - Create bitbucket-pr.skill file if validation passes

3. Test the packaged skill:
   - Extract .skill file (it's a zip)
   - Verify all files present
   - Check structure

**Acceptance Criteria**:
- [ ] Packaging succeeds with no errors
- [ ] bitbucket-pr.skill file created
- [ ] Packaged skill contains all necessary files
- [ ] Validation passes

**Files Created**:
- dist/bitbucket-pr.skill

---

### Gate: Epic Acceptance
**Priority**: P1  
**Type**: Gate

**Description**:
Final verification that the Bitbucket PR skill is complete and ready for use.

**Gate Criteria**:
- [ ] All tasks complete
- [ ] Skill validated and packaged
- [ ] End-to-end testing successful
- [ ] Documentation complete and clear
- [ ] No critical bugs or issues
- [ ] User approves final skill

**Owner**: beads-verify-agent

---

## Summary

**Phase 1 Tasks** (Base Implementation):
1. Initialize skill structure
2. Implement bb-api.sh (core library)
3. Implement create-or-update-pr.sh
4. Implement review-pr.sh
5. Implement process-pr-feedback.sh
6. Write SKILL.md first draft
7. Write reference files
8. Test end-to-end

**Phase 2 Tasks** (Review & Refinement):
9. Validate skill structure
10. Refinements based on review
11. Package skill

**Gates**:
- Phase 1 Review (after Task 8)
- Epic Acceptance (final)

**Estimated Effort**: 
- Phase 1: ~4-6 hours of focused work
- Phase 2: ~2-3 hours (depends on review feedback)
- Total: ~6-9 hours
