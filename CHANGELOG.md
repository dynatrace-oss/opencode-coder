# Changelog

All notable changes to the opencode-coder plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
