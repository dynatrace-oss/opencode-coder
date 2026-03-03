# Changelog

All notable changes to the opencode-coder plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.31.1] - 2026-03-03

### Fixed

- **Package detection broken**: `detectCoderPackageInstalled()` checked for `packages` key in `ai.package.yaml` but aimgr uses `resources`, causing detection to always return false and `/init` to loop on the install guide
- **Init install UX**: Agent now offers to run `aimgr init && aimgr install package/opencode-coder` via `question()` instead of just printing commands

## [0.31.0] - 2026-03-03

### Added

- **Init readiness gating**: `/init` command now checks installation readiness before running, preventing use when prerequisites are missing

### Fixed

- **Default agent selection**: Orchestrator is now correctly set as the default agent only when the full ecosystem (beads, aimgr, stealth mode) is ready (closes #11)

## [0.30.0] - 2026-03-02

### Added

- **ProjectDetectorService**: Detects git platform, beads status, stealth mode, and aimgr status; writes `.coder/project.yaml` on startup
- **Smart skill discovery**: `/init` delegates to ai-resource-manager for context-aware skill filtering
- **Unified stealth mode**: Hide all opencode-coder artifacts from git in one operation
- **Aimgr repair integration**: Integrated aimgr repair into `/init` and `/doctor` commands
- **Agent improvements**: Agent colors, command argument forwarding, init bootstrapping, aimgr verify

### Fixed

- **Stealth AGENTS.md**: Moved to `.coder/` and injected via plugin config hook
- **Hooks structure**: Flattened to match SDK Hooks interface
- **Stealth mode awareness**: Added to fix-documentation skill

### Changed

- **Agent definitions**: Improved orchestrator, reviewer, tasker, and verifier agents
- **Planning references**: Updated with `needs:discussion` and `open-questions` patterns
- **Package manifest**: ai-resource-manager added

## [0.29.0] - 2026-02-28

### Added

- **opencode-coder-dev skill**: New internal skill separating developer-facing content from the public opencode-coder skill
- **Project context discovery**: All agents now discover and use project-specific context automatically

### Changed

- **Agent architecture**: Redesigned to 4 focused agents (orchestrator, reviewer, tasker, verifier); skill serves as reference hub
- **AI resources consolidation**: Slimmed skill, inlined CLI reference, promoted /init command
- **AGENTS.md**: Rewritten as a routing table; coding guidelines moved to CODING.md; TESTING.md added
- **ai-resources template**: Slimmed down template, added update-agent-md command, fixed package list

### Fixed

- **Skill links**: Repaired broken links in opencode-coder and opencode-coder-dev skills
- **JSON blocks**: Fixed invalid JSON blocks in bitbucket-pr skill; added orphaned reference link in github-releases skill
- **Cross-skill references**: Replaced hard-coded skill name references with capability descriptions

### Removed

- **Beads injection machinery**: Removed BeadsContext and KnowledgeBaseService; simplified beads integration

## [0.28.0] - 2026-02-24

### Added

- **New template**: AGENTS.md template file for project initialization

### Changed

- **AGENTS.md**: Complete rewrite with comprehensive coding conventions, build/test commands, directory structure, code style guidelines, async patterns, error handling, and naming conventions
- **Enhanced /init command**: Enhanced with 3-step workflow — skill discovery → beads init → AGENTS.md creation, with mandatory user interaction points
- **Enhanced opencode-coder skill**: Step-by-step init workflow with project type detection and framework analysis

## [0.26.1] - 2026-02-17

### Added

- **github-releases skill**: TODO validation script to verify all placeholders filled
- **github-releases skill**: Script-based task generation for releases

### Fixed

- **github-releases skill**: Removed technology assumptions, added TODO markers for customization
- **github-releases skill**: Corrected task parent type from task to epic

### Changed

- **Beads**: Updated migration hint for better clarity

## [0.26.0] - 2026-02-15

### Added

- **monitoring-analysis skill**: Agentic log/metric triage for production monitoring (ai-resources/)
- **Release workflow structure**: Now uses --parent and bd dep add for proper task hierarchy

### Changed

- **github-releases skill**: Enforces epic/task structure to prevent skipped steps
- **release-workflow.md**: Condensed from 457 to 261 lines with clearer instructions

### Fixed

- **Release workflow**: Strengthened to prevent agents skipping critical steps
- **Markdown linting**: Resolved errors in release-workflow.md

## [0.25.0] - 2026-02-14

### Added

- **github-releases skill**: Complete language-agnostic release workflow (ai-resources/)
  - Quality gates validation (tests, builds, CI checks)
  - Documentation validation integration
  - Version management and semver guidance
  - GitHub Actions and manual release support
  - Release notes templates and best practices
  - Comprehensive troubleshooting guides
  - Setup guide for creating project-specific RELEASING.md files

### Changed

- **AGENTS.md**: Added ai-resources/ section explaining optional installable resources
  - Clarified three-tier directory structure (knowledge-base/, .opencode/, ai-resources/)
  - Simplified release section to reference github-releases skill
- **docs/RELEASING.md**: Created comprehensive project-specific release guide
  - Exact build, test, and typecheck commands
  - GitHub Actions workflow instructions (primary method)
  - Manual release fallback procedures
  - Pre-release checklist and post-release verification
  - Rollback procedures and troubleshooting

### Fixed

- **Documentation**: Fixed plugin path and hook references
- **Markdown linting**: Resolved all 27 linting errors in github-releases skill
  - Line length violations (MD013)
  - Blank lines around lists and fences (MD031/MD032)
  - Missing code block language tags (MD040)

## [0.24.0] - 2026-02-14

### Fixed

- **E2E test failures**: Removed obsolete command registration tests (bug oc-xbxi)
  - Plugin now only registers agents; commands provided by OpenCode's skill system
  - All 148 tests passing (was 146 passing, 2 failing)
  - Added comprehensive test analysis documentation

### Removed

- **system_info tool**: Removed in favor of direct bash commands in skill instructions
  - The tool provided no value over simple bash commands
  - Current implementation had bugs (plugin version showed "unknown" due to path resolution issues)
  - Simplification aligns with "best code is no code" philosophy
  - Status command now uses direct bash commands documented in skill (more reliable)
  - **Removed 212 lines of unnecessary code**
  - **Migration**: The system_info tool was only used internally by the status command, which has been updated. No external migration needed.

### Added

- **Comprehensive status check documentation**: New `status-checks-reference.md` in skill with battle-tested bash commands for all status checks
  - Plugin version detection via package.json
  - Configuration status checks
  - Beads integration verification
  - Complete copy-paste ready status script
  - Troubleshooting guides
- **Test analysis documentation**: Complete analysis of test suite health and coverage

### Changed

- **Status command**: Now uses direct bash commands instead of system_info tool
  - More reliable (no path resolution bugs)
  - More transparent (LLM sees actual commands)
  - Easier to debug and maintain

## [0.23.0] - 2026-02-13

*(Previous releases would be documented here)*
