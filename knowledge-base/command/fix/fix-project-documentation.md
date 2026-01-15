---
description: Audit and synchronize README.md, CONTRIBUTING.md, and AGENTS.md with codebase
---
# Command: Document project changes

## Purpose

This command audits and maintains the project's documentation in a synchronized, accurate state by **identifying and fixing issues** across three documentation files that must stay in sync with each other and with the actual codebase implementation.

When issues are discovered:
- **Verify** the issue against the actual codebase
- **Identify** which documentation file(s) need updates
- **Update** the documentation to match reality
- **Test** that changes are correct and consistent

### Documentation Guidelines

Each documentation file serves a specific purpose and audience:

**README.md** (End User Documentation):
- Focus: How to install, configure, and use the tool
- Content: Installation instructions, CLI usage examples, configuration options, and troubleshooting
- NO developer content: Never include development instructions, testing procedures, or internal architecture details
- NO build and test commands: End users should not execute tests or run builds
- NO project structure: End users are not interested in code structure or architecture
- References to CONTRIBUTING.md are acceptable for technical details

**CONTRIBUTING.md** (Developer Documentation):
- Focus: Technical documentation for developers extending the tool
- Content: Architecture concepts, main folder structure (without listing every file), Code Style Guidelines, Development Workflow, and Architecture Guidelines
- NO excessive file details: Document what goes in `xz/`, `src/folderx/`, `src/foldery/` without listing every individual file. If you do a directory tree, NEVER include files—only folders
- NO detailed code examples in guidelines: Code examples are acceptable in "Adding New Processors" or "Adding New Transformation Profiles" sections only
- Exclude: Don't mention AGENTS.md or include license information in this section

**AGENTS.md** (AI Agent Instructions):
- Focus: Quick reference for AI coding assistants during development
- Content: Essential commands, quick architecture reference pointing to CONTRIBUTING.md, code style reminders, quick references
- NO redundancy: Keep it brief and avoid duplicating information from README or CONTRIBUTING
- All commands and file paths must be accurate and tested

## The Three Documentation Files

### 1. README.md (User-Facing Documentation)
**Purpose**: What end users need to know to install and use the tool.

**Content**:
- Installation instructions: how the user can install the tool/service
- Usage examples for CLI commands or how to start the server
- Configuration file formats and examples for configuring the product
- CLI options and flags
- Troubleshooting common issues
- Link to CONTRIBUTING.md for developers

**Verification Checklist**:
- ✓ Installation steps are accurate and tested
- ✓ All CLI commands listed work as documented
- ✓ Default values match actual defaults in code
- ✓ Example commands can be copy-pasted and work
- ✓ Configuration options are accurate
- ✓ Option descriptions match the actual behavior

### 2. CONTRIBUTING.md (Developer Documentation)
**Purpose**: What developers need to know to extend and maintain the tool.

**Content**:
- Tech stack used
- Complete architecture overview
- Project structure with all key directories listed
- Design patterns and principles
- Step-by-step guides for adding profiles and processors
- Development workflow with testing procedures
- Code style guidelines
- TypeScript best practices

**Verification Checklist**:
- ✓ Tech stack is up to date and matches what is used in the project
- ✓ Architecture diagram matches actual code structure
- ✓ All directories listed in project structure exist
- ✓ Code examples are syntactically correct
- ✓ Commands in workflow section work as written
- ✓ References to files use correct paths
- ✓ Design patterns documented are actually used in code

### 3. AGENTS.md (AI Agent Instructions)
**Purpose**: Quick reference for AI coding assistants when working with the codebase.

**Content**:
- Essential commands for development (compile, build, test)
- Quick architecture reference pointing to CONTRIBUTING.md for details
- Code style reminders
- Quick references for common tasks

**Verification Checklist**:
- ✓ All build scripts listed and explained
- ✓ All command examples work as written
- ✓ File paths are accurate
- ✓ Descriptions match actual behavior
- ✓ Links to README.md and CONTRIBUTING.md are correct
- ✓ Brief format maintained (not redundant with other docs)

## Cross-File Synchronization

The three files must be synchronized in these ways:

1. **No Contradictions**: Same information presented in different files must be identical
   - Example: Default config values in README must match CONTRIBUTING and AGENTS
   - Example: Command options must be described consistently

2. **Consistent Terminology**: Use the same term names across all files
   - "transformation profiles" not "transformation rules"
   - "processors" not "transformers"
   - "pipeline" consistently capitalized or not

3. **Cross-References**: Links and references between files must be accurate
   - AGENTS.md points to CONTRIBUTING.md for detailed info
   - README.md points to CONTRIBUTING.md for dev guidelines
   - All file paths must be correct

4. **Single Source of Truth for Code Examples**:
   - Complex examples live in CONTRIBUTING.md
   - README.md can reference them
   - AGENTS.md keeps examples minimal

## Verification and Fix Procedures

**Important**: Do NOT create test directories or files during verification. You may execute project commands (npm scripts, compiled CLI), but skip any tests that require creating new files or folders. Focus on verifying documentation against existing code and testing commands that work with current state.

When testing documentation, follow this process for each issue found:

### 1. Command Verification and Fix
**Test**: For each command documented, verify it actually works.
**If Issue Found**:
- ✅ Test the command against the actual codebase
- ✅ Note the correct behavior
- ✅ Update all documentation files with the correct command and output
- ✅ Re-test to confirm the fix works

Example: If README.md documents an option that doesn't exist, update README.md to remove it or document the actual option.

### 2. File Reference Verification and Fix
**Test**: Check that all file paths exist.
**If Issue Found**:
- ✅ Verify the correct file path in the codebase
- ✅ Update the path in all documentation files
- ✅ Test that examples still work with corrected paths

### 3. Code Example Verification and Fix
**Test**: Run code examples from CONTRIBUTING.md to ensure they're syntactically correct.
**If Issue Found**:
- ✅ Identify where the example is used (README, CONTRIBUTING, AGENTS)
- ✅ Fix the example to be syntactically correct
- ✅ Verify code compiles without errors
- ✅ Test that processor examples follow actual patterns in codebase

### 4. Consistency Checks and Fixes
**Test**:
- Search for architecture descriptions in all files to ensure they're identical
- Verify option descriptions match across README and CONTRIBUTING
- Check that examples produce expected output

**If Issue Found** (Contradiction):
- ✅ Identify the source of truth from actual codebase behavior
- ✅ Update all documentation files to match the correct behavior
- ✅ Remove any conflicting or outdated information
- ✅ Re-test for consistency

## Usage Examples

### Scenario 1: After Adding a New Feature
1. Document it in README.md with usage and options
2. Document full implementation details in CONTRIBUTING.md
3. Verify all three files reference the command correctly
4. Test that the documented command works

### Scenario 2: After Changing Configuration
1. Update example configs in project
2. Update all references in README.md
3. Update all references in CONTRIBUTING.md (Config section)
4. Update defaults in AGENTS.md if listed
5. Verify consistency across all files

### Scenario 3: After Refactoring Project Structure
1. Update CONTRIBUTING.md Project Structure section
2. Update AGENTS.md Architecture Quick Reference
3. Update any file paths in code examples
4. Update README.md if user-facing paths changed
5. Verify all references point to correct locations

## Testing and Update Checklist

**This is an action checklist, not just verification.** For each item, test it and **fix any issues found** in the documentation files.

### Action Items (Test and Fix)

- [ ] **Test scripts in AGENTS.md**: Run each command. If any fail or behave differently than documented, update AGENTS.md
- [ ] **Test all features described in README.md**: Execute each command example. If output differs or command doesn't work, update README.md (and CONTRIBUTING.md if needed)
- [ ] **Verify architecture in CONTRIBUTING.md**: Check that the architecture flow matches actual code structure. If not, update the architecture description
- [ ] **Verify file paths**: Check that all listed files exist. If any are missing, outdated, or paths changed, update all three docs consistently
- [ ] **Verify option values**: Test that defaults in README match actual code defaults. If they differ, update README and check CONTRIBUTING for consistency
- [ ] **Test code examples**: Run examples from CONTRIBUTING.md. If they fail to compile or run, fix them
- [ ] **Check for contradictions**: Search all three files for conflicting information. For any contradictions found, determine the source of truth and update all files to match
- [ ] **Verify cross-references**: Follow links between files. If any are broken or inaccurate, fix them
- [ ] **Check terminology**: Ensure the same terms are used consistently. If inconsistencies exist, standardize terminology across all three files
- [ ] **Verify command output**: Run documented commands and compare output. If actual output differs from documentation, update the docs to match

### Before Submitting
- [ ] All issues discovered have been identified and fixed
- [ ] All three files have been updated to match the actual codebase behavior
- [ ] All commands documented have been tested and work as written
- [ ] No contradictions remain between the three files
- [ ] Ready to commit changes to update the documentation
