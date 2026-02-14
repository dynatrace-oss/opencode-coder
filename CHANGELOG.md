# Changelog

All notable changes to the opencode-coder plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
