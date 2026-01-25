---
name: using-coder-plugin
description: Complete guide to installing, configuring, and troubleshooting the opencode-coder plugin. Use when Claude needs to: (1) Install or upgrade the bd CLI or plugin dependencies, (2) Initialize beads in a project (bd init, hooks setup), (3) Debug plugin loading or configuration issues, (4) Analyze OpenCode logs for errors or patterns, (5) Check system/plugin status and health, (6) Guide users through reporting bugs or issues, (7) Troubleshoot common problems with beads, git hooks, or sync
---

# Using the Coder Plugin

This skill provides comprehensive guidance for installing, configuring, and troubleshooting the opencode-coder plugin. Use this when users need help with plugin setup, debugging issues, or understanding how the plugin works.

## Table of Contents

1. [Installation](#installation)
2. [Initialization](#initialization)
3. [Configuration](#configuration)
4. [Troubleshooting & Diagnostics](#troubleshooting--diagnostics)
5. [Debug Logging](#debug-logging)
6. [Analyzing OpenCode Logs](#analyzing-opencode-logs)
7. [Reporting Issues](#reporting-issues)
8. [Status & Health Checks](#status--health-checks)
9. [Common Problems & Solutions](#common-problems--solutions)

**Reference Documentation:**
- [Detailed Troubleshooting Patterns](references/troubleshooting-patterns.md) - Complete solutions by category

---

## Installation

Install the global dependencies required by the opencode-coder plugin. This is a one-time setup that should be performed before initializing any project.

### Installing the bd CLI

The coder plugin requires the `bd` CLI (beads) for issue tracking:

```bash
npm install -g beads
```

### Verify Installation

After installation, verify that beads is available:

```bash
bd --version
```

You should see output showing the beads version number.

### Upgrading Dependencies

To upgrade beads to the latest version:

```bash
npm update -g beads
```

**Important**: Always use npm for installation and upgrades. Do NOT use curl/bash install scripts that might be suggested by `bd doctor`.

### Installation Troubleshooting

| Issue | Solution |
|-------|----------|
| npm permission error | Use `sudo npm install -g beads` or fix npm permissions |
| bd command not found after install | Ensure npm global bin is in PATH |
| Wrong version installed | Run `npm update -g beads` |

### Next Steps

After installation, initialize a project with the coder plugin (see [Initialization](#initialization) section).

---

## Initialization

Initialize a project to use the opencode-coder plugin. This command is idempotent and can be run multiple times safely.

### Prerequisites

Before initializing, verify:
1. The project has git initialized (`git status` should work)
2. The `bd` CLI is available (`bd --version`) - if not, see [Installation](#installation)

### Quick Start

**For most users, this is all you need:**

```bash
# 1. Check if already initialized
ls -la .beads .coder

# 2. If not initialized, run stealth mode setup
bd init --stealth && bd hooks install

# 3. Verify beads is working
bd ready

# Done! The plugin is now active.
```

**Verification:**
- ✓ `.beads/` directory exists with config files
- ✓ `bd ready` runs without errors
- ✓ Files stay local (not in git status)

If you need team collaboration or multi-device sync, see the detailed [Initialization Steps](#initialization-steps) below for team mode setup.

### Initialization Steps

#### Step 1: Check Current Status

First, check if the project is already initialized:

```bash
ls -la .beads .coder
```

If directories already exist, the project may already be initialized. The initialization process will skip what's already set up.

#### Step 2: Choose Beads Mode

If the project is not yet initialized, you need to choose a mode:

**Stealth Mode (Recommended)**
- Beads files stay local to your machine
- Won't affect git history or other team members
- Perfect for: personal use, OSS contributions, teams not using beads yet
- Files are excluded via `.git/info/exclude`

**Team Mode**
- Beads files are committed and synced via git
- Enables multi-device sync and team collaboration
- Perfect for: teams adopting beads together
- Uses standard `.gitignore` for database file

#### Step 3: Run Initialization

**For Stealth Mode:**
```bash
bd init --stealth
bd hooks install
```

**For Team Mode:**
```bash
bd init
bd hooks install
```

#### Step 4: Set Up Coder Config

Create the coder configuration directory and file:

```bash
mkdir -p .coder
echo '{ "active": true }' > .coder/coder.json
```

#### Step 5: Handle Git Exclusions

**For Stealth Mode:**
The `.beads/`, `.coder/`, and `.opencode/` directories should be added to `.git/info/exclude`:

```bash
echo ".beads/" >> .git/info/exclude
echo ".coder/" >> .git/info/exclude
echo ".opencode/" >> .git/info/exclude
```

**For Team Mode:**
Add the beads database to `.gitignore`:

```bash
echo ".beads/beads.db" >> .gitignore
```

#### Step 6: Commit (Team Mode Only)

**For Team Mode:**
```bash
git add .beads/ .coder/ .gitignore AGENTS.md
git commit -m "chore: initialize coder plugin"
```

**For Stealth Mode:**
No commit needed - all files are excluded from git.

### File Structure After Initialization

```
.beads/
  config.yaml       # Beads configuration
  issues.jsonl      # Git-versioned issue data
  interactions.jsonl # Session interactions
  metadata.json     # Repository metadata
  beads.db          # Local SQLite cache (gitignored)

.coder/
  coder.json        # Coder plugin configuration

AGENTS.md           # Beads quick reference (optional)
```

### Note on AGENTS.md

The `bd init` command may create or update `AGENTS.md` with a minimal beads quick reference (~12 lines). This is harmless:
- Serves as human-readable documentation that the project uses beads
- Plugin hooks automatically inject full beads context, so AGENTS.md is not read by AI
- Can be safely committed or ignored based on project preference

### Idempotent Behavior

The initialization process is safe to run multiple times:
- Already initialized components are skipped
- No duplicate entries in `.gitignore` or `.git/info/exclude`
- No duplicate commits
- Reports what was already present vs newly created

### First Steps After Initialization

After initialization, try these commands:

```bash
# Create your first issue
bd create "Setup project" --type task

# Check project health
# See the Health Checks section below

# Find available work
bd ready
```

---

## Configuration

The coder plugin uses a simple JSON configuration file located at `.coder/coder.json`.

### Configuration File Format

```json
{
  "active": true
}
```

### Configuration Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `active` | boolean | true | Enables/disables the coder plugin |

### Checking Current Configuration

To view the current configuration and plugin status, check if the `.coder/coder.json` file exists and contains valid JSON:

```bash
cat .coder/coder.json
```

### Modifying Configuration

Edit `.coder/coder.json` directly to change settings:

```bash
# Disable the plugin
echo '{ "active": false }' > .coder/coder.json

# Re-enable the plugin
echo '{ "active": true }' > .coder/coder.json
```

---

## Troubleshooting & Diagnostics

When experiencing issues with the coder plugin, follow these diagnostic steps.

### Running Health Checks

The coder plugin includes a comprehensive health check system. Run diagnostics to check:

1. **Coder Config Check**: Verifies `.coder/coder.json` exists and is valid
2. **Beads Check**: Verifies `.beads/` directory and runs `bd doctor`
3. **Git Hooks Check**: Verifies beads git hooks are installed
4. **Git Sync Check**: Checks for uncommitted beads changes

### Understanding Health Check Results

**All OK Example:**
```
Coder Health Check

Components:
  Coder config:  OK
  Beads:         OK
  Git hooks:     OK
  Git sync:      OK

No issues found.
```

**Issues Found Example:**
```
Coder Health Check

Components:
  Coder config:  OK
  Beads:         OK
  Git hooks:     MISSING
  Git sync:      WARN

Issues:
  - Git hooks not installed. Run: bd hooks install
  - Uncommitted beads changes. Run: bd sync
```

### Common Diagnostic Commands

```bash
# Check if bd CLI is installed
bd --version

# Check beads health
bd doctor

# Check sync status
bd sync --status

# Verify git hooks
ls -la .git/hooks/

# Check coder config
cat .coder/coder.json
```

### Interpreting bd doctor Output

When running `bd doctor`, filter the suggestions:

| bd doctor suggestion | Action |
|---------------------|--------|
| Install git hooks | Run `bd hooks install` |
| Set upstream | Optional - not critical for local use |
| Upgrade CLI (curl script) | **Ignore** - Use `npm install -g @beads/bd@latest` instead |

**Important**: Never use the curl/bash upgrade method. Always use npm for beads updates.

### Advanced Log Analysis

For deep analysis of OpenCode logs, the plugin includes a powerful log analyzer tool. See [Analyzing OpenCode Logs](#analyzing-opencode-logs) for:
- Interactive session/process browsing with fzf
- Filtering by session ID, process ID, service, and log level
- JSON export for programmatic analysis
- Integration with troubleshooting workflows

---

## Debug Logging

When troubleshooting plugin issues or reporting bugs, debug logging is essential for understanding what's happening.

OpenCode provides two types of debug logging:
1. **General OpenCode debug logging** - Shows all OpenCode internals and plugin activity
2. **Plugin-specific debug logging** - Shows only opencode-coder plugin messages

### Enabling Debug Logging

To enable debug logging, set the `OPENCODE_DEFAULT_OPTIONS` environment variable:

```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"
```

**Important**: The `OPENCODE_LOG` environment variable does NOT work for OpenCode. You must use `OPENCODE_DEFAULT_OPTIONS`.

### Plugin-Specific Debug Logging

The opencode-coder plugin provides its own debug logging that can be enabled independently:

```bash
export OPENCODE_CODER_DEBUG=1
```

**When to use each variable:**

| Variable | What it shows | When to use |
|----------|---------------|-------------|
| `OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"` | All OpenCode internals, all plugins, verbose output | General OpenCode troubleshooting, understanding flow |
| `OPENCODE_CODER_DEBUG=1` | Only opencode-coder plugin messages | Debugging plugin behavior, cleaner logs |
| Both together | Full context with plugin details highlighted | Complex issues, plugin interaction problems |

**Key differences:**
- `OPENCODE_DEFAULT_OPTIONS` affects all of OpenCode and produces verbose output
- `OPENCODE_CODER_DEBUG` only enables opencode-coder plugin messages
- Plugin debug messages log at **info level** and are always visible in OpenCode logs
- Plugin messages are tagged with the `opencode-coder` service name for easy filtering

**Example - Using both together:**

```bash
# Enable all debug logging
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"
export OPENCODE_CODER_DEBUG=1
```

**Filtering plugin messages in logs:**

When plugin debug logging is enabled, messages are tagged with the service name. Use grep to filter:

```bash
# View only opencode-coder plugin messages
grep "opencode-coder" ~/.config/opencode/logs/*.log

# View plugin messages with context (3 lines before/after)
grep -C 3 "opencode-coder" ~/.config/opencode/logs/*.log
```

See [Analyzing Log Files](#analyzing-log-files) for more log analysis techniques.

### Setting Debug Logging Permanently

Add the export command to your shell configuration file:

**For bash (~/.bashrc or ~/.bash_profile):**
```bash
# General OpenCode debug logging
echo 'export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"' >> ~/.bashrc
# Plugin-specific debug logging
echo 'export OPENCODE_CODER_DEBUG=1' >> ~/.bashrc
source ~/.bashrc
```

**For zsh (~/.zshrc):**
```bash
# General OpenCode debug logging
echo 'export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"' >> ~/.zshrc
# Plugin-specific debug logging
echo 'export OPENCODE_CODER_DEBUG=1' >> ~/.zshrc
source ~/.zshrc
```

### Log File Locations

OpenCode log locations vary by operating system:

**Linux:**
```
~/.config/opencode/logs/
```

**macOS:**
```
~/Library/Logs/opencode/
```

**Windows:**
```
%APPDATA%\opencode\logs\
```

### Finding Log Files

To locate your log directory:

```bash
# Linux
ls -la ~/.config/opencode/logs/

# macOS
ls -la ~/Library/Logs/opencode/

# Windows (PowerShell)
dir $env:APPDATA\opencode\logs\
```

### Analyzing Log Files

Log files are named by date and session. Look for:

1. **Recent files**: Sort by modification time to find latest logs
2. **Error messages**: Search for "ERROR" or "WARN" keywords
3. **Stack traces**: Look for multi-line error traces
4. **Plugin loading**: Check for coder plugin initialization messages

### Useful Log Analysis Commands

```bash
# Find most recent log file (Linux/macOS)
ls -lt ~/.config/opencode/logs/ | head -5

# Search for errors in recent logs
grep -i "error" ~/.config/opencode/logs/*.log

# View last 100 lines of most recent log
tail -100 $(ls -t ~/.config/opencode/logs/*.log | head -1)

# Search for opencode-coder plugin messages (when OPENCODE_CODER_DEBUG=1)
grep "opencode-coder" ~/.config/opencode/logs/*.log

# Search for plugin messages with context
grep -C 3 "opencode-coder" ~/.config/opencode/logs/*.log

# Search for any coder-related messages
grep -i "coder" ~/.config/opencode/logs/*.log
```

### What to Look For

When analyzing logs for plugin issues:

| Issue Type | What to Search For |
|------------|-------------------|
| Plugin not loading | "plugin", "knowledge-base", "coder" keywords |
| Plugin debug messages | "opencode-coder" (when `OPENCODE_CODER_DEBUG=1`) |
| Command failures | "command", "error", stack traces |
| bd CLI issues | "bd", "beads", "spawn", "ENOENT" |
| Hook failures | "hook", "git", "post-commit" |

**Tip**: When `OPENCODE_CODER_DEBUG=1` is set, plugin debug messages are tagged with the service name `opencode-coder` and log at info level, making them easy to filter from general OpenCode logs.

### Disabling Debug Logging

To disable debug logging, unset the environment variables:

```bash
# Disable general OpenCode debug logging
unset OPENCODE_DEFAULT_OPTIONS

# Disable plugin-specific debug logging
unset OPENCODE_CODER_DEBUG
```

Or remove them from your shell configuration file.

---

## Analyzing OpenCode Logs

The opencode-coder plugin includes a powerful log analyzer tool for debugging plugin loading issues, command execution, agent behavior, and other OpenCode-related problems. The analyzer provides fast filtering, interactive mode with fzf, and various output formats.

### Overview

The log analyzer is a CLI tool located at `scripts/log-analyzer/` that:

- **Discovers** processes and sessions across all OpenCode log files
- **Filters** logs by process ID, session ID, service name, log level, and time range
- **Formats** output with colors, timestamps, and structured data
- **Analyzes** patterns using ripgrep for performance (falls back gracefully if not available)
- **Provides** interactive mode with fzf for easy process/session selection

The tool automatically locates your OpenCode log directory based on your operating system (see [Debug Logging](#debug-logging) for log locations).

### Running the Log Analyzer

The log analyzer requires the Bun runtime. It's located in the plugin development repository:

```bash
# From the opencode-coder repository root
bun run scripts/log-analyzer
```

**Note**: This tool is primarily for plugin developers and advanced troubleshooting. Regular users should start with [Debug Logging](#debug-logging) and only use the analyzer when directed by maintainers.

### Interactive Mode

Interactive mode uses `fzf` to provide a visual picker for selecting processes or sessions. This is the easiest way to explore logs.

**Requirements:**
- `fzf` must be installed: https://github.com/junegunn/fzf#installation

**Usage:**
```bash
# Run without arguments to enter interactive mode
bun run scripts/log-analyzer
```

**What happens:**
1. Analyzer scans all log files for processes and sessions
2. Presents a searchable list with fzf
3. Shows process info (PID, directory, session count, line count)
4. Shows session info (session ID, PID, timestamps, line count)
5. After selection, displays filtered logs

**If fzf is not available:**
```
Error: fzf is required for interactive mode but was not found.
Install fzf: https://github.com/junegunn/fzf#installation

Alternatively, use CLI arguments:
  bun run scripts/log-analyzer list sessions
  bun run scripts/log-analyzer --session=<sessionID>
```

### CLI Mode

CLI mode allows direct filtering with command-line arguments. Useful for scripting, automation, or when fzf is not available.

#### List Commands

**List all processes:**
```bash
bun run scripts/log-analyzer list processes
```

Output example:
```
Found 3 processes:

Process 12345
  Directory: /home/user/project
  Session count: 2
  Line count: 847
  Started: 2026-01-25 10:30:15
  Ended: 2026-01-25 10:45:22
  Log files: 2026-01-25-session.log

Process 12346
  Directory: /home/user/another-project
  Session count: 1
  Line count: 423
  ...
```

**List all sessions:**
```bash
bun run scripts/log-analyzer list sessions
```

Output example:
```
Found 5 sessions:

Session ses_48058fe91ffeRYQhrEE0q0u8rm
  Process ID: 12345
  Line count: 512
  Started: 2026-01-25 10:30:15
  Ended: 2026-01-25 10:35:40
  Log files: 2026-01-25-session.log

Session ses_xyz789...
  Process ID: 12346
  Line count: 201
  ...
```

#### Filter Options

**Filter by process ID:**
```bash
bun run scripts/log-analyzer --pid=12345
```

Shows all log entries from the specified process across all sessions.

**Filter by session ID:**
```bash
bun run scripts/log-analyzer --session=ses_48058fe91ffeRYQhrEE0q0u8rm
```

Shows all log entries from a specific session. Most useful for debugging a particular interaction.

**Filter by service:**
```bash
# Single service
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder

# Multiple services (comma-separated)
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder,session.prompt
```

Available service names typically include:
- `opencode-coder` - Plugin-specific logs
- `session.prompt` - AI session management
- `server` - OpenCode server logs
- `plugin.loader` - Plugin loading system

**Filter by log level:**
```bash
# Show only errors and warnings
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR,WARN

# Show only errors
bun run scripts/log-analyzer --pid=12345 --level=ERROR

# Multiple levels
bun run scripts/log-analyzer --session=ses_xxx --level=WARN,ERROR,DEBUG
```

Available log levels:
- `DEBUG` - Detailed diagnostic information
- `INFO` - General informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages

**Limit output with tail:**
```bash
# Show last 50 lines
bun run scripts/log-analyzer --session=ses_xxx --tail=50

# Show last 100 lines of errors only
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --tail=100
```

Tail is applied after all other filters and sorting by timestamp.

#### Output Options

**JSON output:**
```bash
bun run scripts/log-analyzer --session=ses_xxx --json
```

Returns structured JSON array of log entries:
```json
[
  {
    "level": "INFO",
    "timestamp": "2026-01-25T10:30:15.234Z",
    "deltaMs": 0,
    "pid": 12345,
    "service": "opencode-coder",
    "sessionID": "ses_xxx",
    "directory": "/home/user/project",
    "fields": { "key": "value" },
    "message": "Plugin loaded successfully",
    "raw": "INFO ...",
    "sourceFile": "2026-01-25-session.log"
  }
]
```

Useful for:
- Further processing with `jq` or other tools
- Scripting and automation
- Extracting specific fields

**Disable colors:**
```bash
bun run scripts/log-analyzer --session=ses_xxx --no-color
```

Useful when:
- Piping to files
- Using in CI/CD environments
- Terminal doesn't support ANSI colors

**Raw output:**
```bash
bun run scripts/log-analyzer --session=ses_xxx --raw
```

Shows original log lines without formatting. Useful for:
- Copying exact log output
- Debugging log format issues
- Preserving exact spacing and formatting

**Full timestamps:**
```bash
bun run scripts/log-analyzer --session=ses_xxx --full-timestamp
```

Shows complete ISO timestamps instead of just time. Useful when analyzing logs across multiple days or when exact dates matter.

### Common Use Cases

#### Debugging Plugin Loading Issues

When the plugin fails to load or commands aren't recognized:

```bash
# Find recent session with plugin issues
bun run scripts/log-analyzer list sessions

# Analyze plugin loading for that session
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder,plugin.loader

# Look for errors during plugin initialization
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --level=ERROR,WARN
```

**What to look for:**
- "Plugin failed to load" messages
- Missing dependencies or configuration files
- Path resolution errors
- Permission issues

#### Analyzing Command Execution

When custom commands fail or behave unexpectedly:

```bash
# Show all logs from a session where command failed
bun run scripts/log-analyzer --session=ses_xxx

# Filter to command execution logs
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder | grep -i "command"

# Check for errors during command execution
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --service=opencode-coder
```

**What to look for:**
- Command registration messages
- Argument parsing errors
- Execution failures
- Return value issues

#### Investigating Agent Behavior

When beads agents don't follow instructions or behave incorrectly:

```bash
# Get full session context
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder

# Focus on session/agent interactions
bun run scripts/log-analyzer --session=ses_xxx --service=session.prompt

# Last 200 lines to see recent context
bun run scripts/log-analyzer --session=ses_xxx --tail=200
```

**What to look for:**
- Agent mode initialization
- Context injection messages
- Prompt construction logs
- Tool execution logs

#### Finding Patterns Across Sessions

When issues occur intermittently across multiple sessions:

```bash
# List all sessions to identify affected ones
bun run scripts/log-analyzer list sessions

# Search for specific error across all recent logs
bun run scripts/log-analyzer list sessions | grep "ENOENT"

# Analyze multiple sessions with same issue
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR
bun run scripts/log-analyzer --session=ses_yyy --level=ERROR
```

#### Performance Analysis

When OpenCode feels slow or unresponsive:

```bash
# Get full timeline of a session
bun run scripts/log-analyzer --session=ses_xxx --full-timestamp

# Look for slow operations (check deltaMs in output)
bun run scripts/log-analyzer --session=ses_xxx --json | jq '.[] | select(.deltaMs > 1000)'

# Focus on server performance logs
bun run scripts/log-analyzer --session=ses_xxx --service=server
```

### Integration with Troubleshooting Workflows

The log analyzer integrates with the troubleshooting process outlined in [Troubleshooting & Diagnostics](#troubleshooting--diagnostics):

**Step 1: Enable debug logging**
```bash
export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"
```

**Step 2: Reproduce the issue**
Perform the action that causes the problem in OpenCode.

**Step 3: Find the session**
```bash
# Interactive mode (easiest)
bun run scripts/log-analyzer

# Or list recent sessions
bun run scripts/log-analyzer list sessions | head -20
```

**Step 4: Analyze the session**
```bash
# Start broad
bun run scripts/log-analyzer --session=ses_xxx

# Narrow to errors
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR,WARN

# Focus on plugin
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --level=ERROR,WARN
```

**Step 5: Extract relevant logs for reporting**
```bash
# Get JSON for detailed analysis
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --json > issue-logs.json

# Get formatted output for issue description
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --level=ERROR,WARN --no-color > issue-logs.txt
```

See [Reporting Issues](#reporting-issues) for how to include log analysis in bug reports.

### Advanced Filtering Examples

**Combine multiple filters:**
```bash
# Errors and warnings from plugin in last 50 lines
bun run scripts/log-analyzer --session=ses_xxx --service=opencode-coder --level=ERROR,WARN --tail=50

# All plugin activity for a specific process
bun run scripts/log-analyzer --pid=12345 --service=opencode-coder --json

# Recent errors across all services
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --tail=100 --full-timestamp
```

**Using with other CLI tools:**
```bash
# Count errors by service
bun run scripts/log-analyzer --level=ERROR --json | jq -r '.[] | .service' | sort | uniq -c

# Find sessions with specific error
bun run scripts/log-analyzer list sessions | grep "opencode-coder" | head -5

# Extract error messages only
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --json | jq -r '.[] | .message'

# Get timestamps of all errors
bun run scripts/log-analyzer --session=ses_xxx --level=ERROR --json | jq -r '.[] | .timestamp'
```

### Performance Notes

**Fast filtering with ripgrep:**

The log analyzer uses `ripgrep` (rg) for fast log filtering when available. This makes analyzing large log files much faster.

To install ripgrep:
```bash
# Ubuntu/Debian
apt-get install ripgrep

# macOS
brew install ripgrep

# Fedora
dnf install ripgrep
```

**Graceful fallback:**

If ripgrep is not available, the analyzer falls back to reading files directly. Functionality is identical, just slower for large log directories.

**Performance tips:**
- Use `--session` to narrow scope before other filters
- Use `--tail` to limit output size
- Filter by `--service` when debugging specific components
- Use `--level=ERROR,WARN` to focus on problems

### Troubleshooting the Log Analyzer

**Issue: "Cannot find log directory"**

The analyzer looks in standard OpenCode log locations. If logs are in a custom location, ensure `OPENCODE_DEFAULT_OPTIONS` is set correctly.

**Issue: "bun: command not found"**

The log analyzer requires Bun runtime. Install it:
```bash
curl -fsSL https://bun.sh/install | bash
```

Or check: https://bun.sh/docs/installation

**Issue: Interactive mode fails without fzf**

Install fzf or use CLI mode with explicit filters:
```bash
# Instead of interactive mode
bun run scripts/log-analyzer

# Use explicit session filter
bun run scripts/log-analyzer list sessions
bun run scripts/log-analyzer --session=ses_xxx
```

**Issue: No matching log entries found**

Check that:
1. Debug logging is enabled: `echo $OPENCODE_DEFAULT_OPTIONS`
2. The session ID is correct: `bun run scripts/log-analyzer list sessions`
3. Log files exist: `ls -la ~/.config/opencode/logs/` (Linux)
4. Filters aren't too restrictive: remove `--level` or `--service` filters

### Summary

The log analyzer is a powerful tool for:

- **Discovery**: Find processes and sessions across log files
- **Filtering**: Narrow logs by process, session, service, level, and time
- **Analysis**: Understand plugin loading, command execution, and agent behavior
- **Debugging**: Identify errors, warnings, and performance issues
- **Reporting**: Extract relevant logs for bug reports

For most troubleshooting, start with [Debug Logging](#debug-logging), then use the analyzer when you need precise filtering or when reporting issues (see [Reporting Issues](#reporting-issues)).

---

---

## Reporting Issues

When you encounter problems with the opencode-coder plugin itself (not your project code), you can report them to the plugin maintainers.

### What to Report

**Report issues with:**
- bd CLI commands and behavior
- Knowledge-base loading and commands
- Beads agents (planner, task, review, verify)
- Plugin documentation gaps
- Plugin features not working as expected

**Do NOT report:**
- Your own code bugs
- Build/test failures in your project
- General coding mistakes
- Configuration issues with your project

### Before Reporting

1. **Enable debug logging** (see [Debug Logging](#debug-logging))
2. **Run health checks** (see [Troubleshooting & Diagnostics](#troubleshooting--diagnostics))
3. **Collect information**:
   - What command or feature you were using
   - What you expected to happen
   - What actually happened
   - Error messages or outputs
   - Steps to reproduce (if known)

### Information to Include

A good bug report includes:

1. **Component**: What part of the plugin (bd CLI, agent, command)
2. **Expected behavior**: What should have happened
3. **Actual behavior**: What actually happened
4. **Steps to reproduce**: How to trigger the issue
5. **Environment**:
   - Operating system
   - Node.js version (`node --version`)
   - bd version (`bd --version`)
   - Plugin version
6. **Logs**: Relevant log excerpts with debug logging enabled
7. **Context**: What you were trying to accomplish

### Creating a GitHub Issue

Issues should be reported to: https://github.com/hk9890/opencode-coder

#### Bug Report Template

A structured template is available at [`assets/bug-report-template.md`](./assets/bug-report-template.md) to help you include all necessary information.

#### Collecting System Information

**Automated Collection:**

Run the helper script to automatically collect system information:

```bash
./scripts/collect-system-info.sh
```

This script collects:
- Operating system and version
- Node.js and npm versions
- bd CLI version
- Plugin version
- Shell type
- Git repository status (if applicable)
- Beads health check output (if applicable)

Copy the output and paste it into the Environment section of your bug report.

**Manual Collection:**

If you prefer to collect information manually:

```bash
# Operating System
uname -a                           # Linux/macOS
# or: systeminfo                   # Windows

# Node.js version
node --version

# bd CLI version
bd --version

# Plugin version
npm list opencode-coder

# Shell
echo $SHELL

# bd health check (if using beads)
bd doctor
```

#### Quick Report Pattern

For simple, easily reproducible issues:

**Manual Issue Creation:**

1. Visit https://github.com/hk9890/opencode-coder/issues/new
2. Use a descriptive title with component in brackets:
   - `[bd ready] Returns empty when issues exist`
   - `[plugin] Knowledge-base fails to load custom commands`
   - `[agent] Task agent doesn't follow closing rules`
3. Fill in the key sections: Problem, Steps to Reproduce, Environment

**Using gh CLI:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[bd ready] Returns empty when issues exist" \
  --body "$(cat <<'EOF'
## Problem
Running `bd ready` returns no results even though open issues exist in .beads/

## Steps to Reproduce
1. Create issues with `bd create --title="Test" --type=task`
2. Verify issues exist with `bd list --status=open`
3. Run `bd ready`
4. No issues shown

## Environment
- OS: Ubuntu 22.04
- Node.js: v20.10.0
- bd version: 1.2.3
- Plugin version: 1.0.0

## Expected
Should show unblocked issues

## Actual
Returns empty list
EOF
)"
```

#### Detailed Report Pattern

For complex issues requiring logs, reproduction steps, or additional context:

**Using the Bug Report Template:**

```bash
# Copy the template
cp ai-resources/skills/using-coder-plugin/assets/bug-report-template.md /tmp/bug-report.md

# Collect system info
./scripts/collect-system-info.sh > /tmp/system-info.txt

# Edit the template, fill in all sections, paste system info
# Then create the issue

gh issue create --repo hk9890/opencode-coder \
  --title "[component] Short description" \
  --body-file /tmp/bug-report.md
```

**Complete Example:**

```bash
gh issue create --repo hk9890/opencode-coder \
  --title "[agent] Task agent creates duplicate commits" \
  --body "$(cat <<'EOF'
## Problem
The beads-task-agent is creating duplicate git commits when closing tasks, resulting in redundant commit history.

## Expected Behavior
Task agent should create a single commit when closing a task, following the git safety protocol.

## Actual Behavior
Two identical commits are created for each task closure:
- First commit: "Implement feature X"
- Second commit: "Implement feature X" (duplicate)

## Steps to Reproduce
1. Create a task: `bd create --title="Test feature" --type=task`
2. Invoke task agent via Claude Code
3. Agent implements the task and closes it
4. Check git log: `git log --oneline -10`
5. Observe duplicate commits

## Environment
- OS: Ubuntu 22.04 LTS
- Node.js: v20.10.0
- bd CLI: 1.2.3
- Plugin: opencode-coder@1.0.0
- Shell: bash 5.1.16

## Logs

Debug logging enabled with `export DEBUG=opencode-coder:*`

```
[opencode-coder:task-agent] Starting task execution for beads-xxx
[opencode-coder:task-agent] Changes detected, creating commit
[opencode-coder:git] Running: git add src/feature.ts
[opencode-coder:git] Running: git commit -m "Implement feature X"
[opencode-coder:git] Commit successful: a1b2c3d
[opencode-coder:task-agent] Task complete, closing beads-xxx
[opencode-coder:git] Running: git add src/feature.ts
[opencode-coder:git] Running: git commit -m "Implement feature X"
[opencode-coder:git] Commit successful: e4f5g6h
```

## Additional Context

This appears to happen consistently when:
- Task agent makes code changes
- No pre-commit hooks are configured
- Git status is clean before agent starts

Git log output:
```
e4f5g6h Implement feature X
a1b2c3d Implement feature X
```

Workaround: Manually squash duplicate commits with `git rebase -i HEAD~2`

Related: This might be connected to the session close protocol in AGENTS.md
EOF
)"
```

#### Tips for Effective Bug Reports

1. **Use descriptive titles**: Include the component and a clear summary
   - Good: `[bd sync] Fails to push when .beads/ has merge conflicts`
   - Bad: `Sync doesn't work`

2. **Enable debug logging BEFORE reproducing**:
   ```bash
   export DEBUG=opencode-coder:*
   # Then reproduce the issue
   ```

3. **Include minimal reproduction steps**: The fewer steps, the easier to diagnose

4. **Attach relevant files**: If the issue involves configuration files, include sanitized versions

5. **Search existing issues**: Your issue might already be reported or resolved

6. **One issue per report**: Don't combine multiple unrelated problems

7. **Follow up**: If maintainers ask for more information, provide it promptly

### Issue Classification

Before creating an issue, determine if it's a plugin issue or a project issue:

**Plugin Issues** (create GitHub issue):
| Category | Examples |
|----------|----------|
| bd CLI errors | Command not found, invalid arguments, unexpected failures |
| Plugin errors | Knowledge-base loading failures, command execution failures |
| Agent behavior | Wrong actions, poor responses from beads agents |
| Documentation gaps | Unclear instructions, missing examples in plugin docs |

**Project Issues** (do NOT create GitHub issue):
| Category | Examples |
|----------|----------|
| User code bugs | Errors in your own source files |
| Build/test failures | npm/yarn errors, test failures in your project |
| Configuration issues | Your own config files, environment setup |
| General coding | Syntax errors, logic bugs in your code |

### Getting Help

If you're unsure whether something is a plugin issue:
1. Ask in the session: "Is this a plugin issue or a project issue?"
2. Run health checks to verify plugin setup
3. Check [Common Problems & Solutions](#common-problems--solutions)
4. Create a GitHub discussion for questions: https://github.com/hk9890/opencode-coder/discussions

---

## Status & Health Checks

Monitor the health and status of your coder plugin installation.

### Checking Plugin Status

To view comprehensive plugin status information, including configuration, integrations, and available commands/agents, examine the coder configuration:

```bash
# Check if plugin is active
cat .coder/coder.json

# Verify plugin directory structure
ls -la .coder/ .beads/
```

### Health Check Components

A complete health check verifies:

1. **Coder Config**: `.coder/coder.json` exists and is valid JSON
2. **Beads**: `.beads/` directory exists and `bd doctor` passes
3. **Git Hooks**: Beads git hooks are properly installed
4. **Git Sync**: No uncommitted beads changes

### Running a Complete Health Check

```bash
# Check coder config
test -f .coder/coder.json && echo "Coder config: OK" || echo "Coder config: MISSING"

# Check beads
test -d .beads && bd doctor || echo "Beads: NOT INITIALIZED"

# Check git hooks
test -f .git/hooks/post-commit && echo "Git hooks: OK" || echo "Git hooks: MISSING"

# Check sync status (if beads initialized)
bd sync --status
```

### Comprehensive Status Check

For a complete system status including versions and configuration, run this comprehensive check sequence:

```bash
#!/bin/bash
# Comprehensive Coder Plugin Status Check

echo "=== System Information ==="
echo "OS: $(uname -s) $(uname -r)"
echo "Node.js: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "npm: $(npm --version 2>/dev/null || echo 'NOT INSTALLED')"
echo ""

echo "=== Beads CLI Installation ==="
if command -v bd &> /dev/null; then
    echo "Status: INSTALLED"
    echo "Version: $(bd --version 2>&1)"
    echo "Location: $(which bd)"
else
    echo "Status: NOT INSTALLED"
    echo "Action: Run 'npm install -g beads'"
fi
echo ""

echo "=== Plugin Installation ==="
PLUGIN_PATH="$(npm root -g)/opencode-coder"
if [ -d "$PLUGIN_PATH" ]; then
    echo "Status: INSTALLED"
    if [ -f "$PLUGIN_PATH/package.json" ]; then
        echo "Version: $(node -p "require('$PLUGIN_PATH/package.json').version" 2>/dev/null || echo 'UNKNOWN')"
    fi
    echo "Location: $PLUGIN_PATH"
else
    echo "Status: NOT INSTALLED"
    echo "Action: Run 'npm install -g opencode-coder'"
fi
echo ""

echo "=== Beads Initialization ==="
if [ -d ".beads" ]; then
    echo "Status: INITIALIZED"
    if [ -f ".beads/config.json" ]; then
        echo "Mode: $(node -p "require('./.beads/config.json').mode || 'local'" 2>/dev/null || echo 'local')"
    else
        echo "Mode: local (default)"
    fi
    echo "Directory: .beads/"
else
    echo "Status: NOT INITIALIZED"
    echo "Action: Run 'bd init'"
fi
echo ""

echo "=== Coder Configuration ==="
if [ -f ".coder/coder.json" ]; then
    echo "Status: CONFIGURED"
    if node -e "JSON.parse(require('fs').readFileSync('.coder/coder.json', 'utf8'))" 2>/dev/null; then
        echo "Validity: VALID JSON"
    else
        echo "Validity: INVALID JSON"
        echo "Action: Fix .coder/coder.json syntax"
    fi
else
    echo "Status: NOT CONFIGURED"
    echo "Action: Run 'coder init' or create .coder/coder.json"
fi
echo ""

echo "=== Git Hooks Status ==="
if [ -f ".git/hooks/post-commit" ]; then
    echo "post-commit: INSTALLED"
    [ -x ".git/hooks/post-commit" ] && echo "  Executable: YES" || echo "  Executable: NO (run chmod +x)"
else
    echo "post-commit: MISSING"
fi
if [ -f ".git/hooks/post-merge" ]; then
    echo "post-merge: INSTALLED"
    [ -x ".git/hooks/post-merge" ] && echo "  Executable: YES" || echo "  Executable: NO (run chmod +x)"
else
    echo "post-merge: MISSING"
fi
if [ ! -f ".git/hooks/post-commit" ] || [ ! -f ".git/hooks/post-merge" ]; then
    echo "Action: Run 'bd init' or 'bd doctor' to install hooks"
fi
echo ""

echo "=== Sync Status ==="
if [ -d ".beads" ] && command -v bd &> /dev/null; then
    bd sync --status 2>&1 | head -n 5
else
    echo "Status: N/A (beads not initialized)"
fi
echo ""

echo "=== Overall Status ==="
if [ -d ".beads" ] && [ -f ".coder/coder.json" ] && [ -f ".git/hooks/post-commit" ] && command -v bd &> /dev/null; then
    echo "✓ System is fully configured and ready"
else
    echo "⚠ Some components are missing or not configured"
    echo "Review the sections above for required actions"
fi
```

**Save this script** as `.coder/scripts/status-check.sh` and run:

```bash
chmod +x .coder/scripts/status-check.sh
./.coder/scripts/status-check.sh
```

#### Example Output

```
=== System Information ===
OS: Linux 5.15.0
Node.js: v20.11.0
npm: 10.2.4

=== Beads CLI Installation ===
Status: INSTALLED
Version: 0.5.2
Location: /usr/local/bin/bd

=== Plugin Installation ===
Status: INSTALLED
Version: 1.2.0
Location: /usr/local/lib/node_modules/opencode-coder

=== Beads Initialization ===
Status: INITIALIZED
Mode: local
Directory: .beads/

=== Coder Configuration ===
Status: CONFIGURED
Validity: VALID JSON

=== Git Hooks Status ===
post-commit: INSTALLED
  Executable: YES
post-merge: INSTALLED
  Executable: YES

=== Sync Status ===
✓ No uncommitted changes

=== Overall Status ===
✓ System is fully configured and ready
```

#### Version Checking Commands

Check individual component versions:

```bash
# Beads CLI version
bd --version

# Node.js version
node --version

# npm version
npm --version

# Plugin version
npm list -g opencode-coder

# Or check package.json directly
node -p "require('$(npm root -g)/opencode-coder/package.json').version"

# Check for updates
npm outdated -g beads opencode-coder
```

#### Troubleshooting Version Issues

**Problem: Wrong beads version installed**

```bash
# Check current version
bd --version

# Update to latest
npm update -g beads

# Or install specific version
npm install -g beads@0.5.2

# Verify update
bd --version
```

**Problem: Wrong plugin version installed**

```bash
# Check current version
npm list -g opencode-coder

# Update to latest
npm update -g opencode-coder

# Or install specific version
npm install -g opencode-coder@1.2.0

# Verify update
npm list -g opencode-coder
```

**Problem: Version mismatch between beads and plugin**

The plugin may require specific beads versions. Check compatibility:

```bash
# Check plugin's beads dependency
node -p "require('$(npm root -g)/opencode-coder/package.json').peerDependencies"

# If mismatch, update both
npm update -g beads opencode-coder

# Verify versions match requirements
bd --version
npm list -g opencode-coder
```

**Problem: Node.js version too old**

```bash
# Check current version
node --version

# Plugin requires Node.js 18+
# Update using your Node version manager (nvm, n, etc.)

# With nvm:
nvm install 20
nvm use 20

# Verify
node --version
```

### Quick Health Verification

For a quick check, verify the essential components:

```bash
# Verify bd CLI is available
bd --version

# Verify project is initialized
ls .beads .coder

# Verify git hooks are installed
ls .git/hooks/post-commit
```

### Component Status Meanings

| Status | Meaning | Action |
|--------|---------|--------|
| OK | Component working correctly | None |
| MISSING | Component not installed | Run initialization |
| INVALID | Component exists but has errors | Fix configuration |
| WARN | Component has warnings | Review and fix if needed |

### Regular Maintenance

Perform these checks regularly:

**Daily (when active):**
- Check for uncommitted changes: `bd sync --status`

**Weekly:**
- Verify hooks are still installed: `ls .git/hooks/`
- Check for beads updates: `npm outdated -g beads`

**After Updates:**
- Run full health check after updating beads
- Verify configuration is still valid
- Test basic commands (`bd ready`, `bd list`)

---

## Common Problems & Solutions

This section covers the most frequently encountered issues. For detailed troubleshooting patterns and additional solutions, see **[references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)**.

### Quick Search

Use grep to quickly find solutions for specific errors:

```bash
# Search by error type
grep -n "not found" ai-resources/skills/using-coder-plugin/references/troubleshooting-patterns.md
grep -n "permission" ai-resources/skills/using-coder-plugin/references/troubleshooting-patterns.md
grep -n "hooks" ai-resources/skills/using-coder-plugin/references/troubleshooting-patterns.md
```

### Most Common Issues

**Problem: bd command not found after installation**

```bash
# Quick fix: Add npm global bin to PATH
export PATH="$(npm bin -g):$PATH"

# Permanent fix: Add to ~/.bashrc or ~/.zshrc
echo 'export PATH="$(npm bin -g):$PATH"' >> ~/.bashrc
```

**Problem: Git hooks not triggering**

```bash
# Reinstall hooks
bd hooks install

# Verify they're executable
chmod +x .git/hooks/post-commit
```

**Problem: bd commands failing with database errors**

```bash
# Rebuild the local cache
rm .beads/beads.db
bd ready  # Will rebuild cache
```

### Issue Categories

For detailed solutions, see [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md):

- **Installation Issues**: PATH problems, npm permissions
- **Initialization Issues**: Git requirements, hook installation, mode switching
- **Runtime Issues**: Database errors, hook failures, sync problems
- **Configuration Issues**: Plugin activation, log file locations
- **Agent and Command Issues**: Command recognition, agent behavior
- **Sync and Git Issues**: File visibility in stealth vs team mode
- **Performance Issues**: Slow commands, large log files

### Getting Additional Help

If your issue isn't covered:

1. **Check detailed patterns**: [references/troubleshooting-patterns.md](references/troubleshooting-patterns.md)
2. **Enable debug logging**: `export OPENCODE_DEFAULT_OPTIONS="--log-level DEBUG"`
3. **Run health checks**: `bd doctor` and `bd sync --status`
4. **Search issues**: https://github.com/hk9890/opencode-coder/issues
5. **Create discussion**: https://github.com/hk9890/opencode-coder/discussions
6. **Report bug**: See [Reporting Issues](#reporting-issues)

---

## Summary

This skill covers the complete lifecycle of using the opencode-coder plugin:

1. **Install** the bd CLI via npm
2. **Initialize** your project (stealth or team mode)
3. **Configure** the plugin with `.coder/coder.json`
4. **Troubleshoot** issues using health checks and diagnostics
5. **Debug** with proper logging (`OPENCODE_DEFAULT_OPTIONS`)
6. **Report** plugin issues to GitHub
7. **Monitor** status and health regularly
8. **Resolve** common problems quickly

For the latest documentation and updates, visit: https://github.com/hk9890/opencode-coder
