# Debug Logging & Log Analysis

Complete guide to enabling debug logging and analyzing OpenCode logs for troubleshooting.

## Table of Contents

1. [Debug Logging](#debug-logging)
   - [Enabling Debug Logging](#enabling-debug-logging)
   - [Plugin-Specific Debug Logging](#plugin-specific-debug-logging)
   - [Setting Debug Logging Permanently](#setting-debug-logging-permanently)
   - [Log File Locations](#log-file-locations)
   - [Finding Log Files](#finding-log-files)
   - [Analyzing Log Files](#analyzing-log-files)
   - [Useful Log Analysis Commands](#useful-log-analysis-commands)
   - [What to Look For](#what-to-look-for)
   - [Disabling Debug Logging](#disabling-debug-logging)
2. [Analyzing OpenCode Logs](#analyzing-opencode-logs)
   - [Overview](#overview)
   - [Running the Log Analyzer](#running-the-log-analyzer)
   - [Interactive Mode](#interactive-mode)
   - [CLI Mode](#cli-mode)
   - [List Commands](#list-commands)
   - [Filter Options](#filter-options)
   - [Output Options](#output-options)
   - [Common Use Cases](#common-use-cases)
   - [Integration with Troubleshooting Workflows](#integration-with-troubleshooting-workflows)
   - [Advanced Filtering Examples](#advanced-filtering-examples)
   - [Performance Notes](#performance-notes)
   - [Troubleshooting the Log Analyzer](#troubleshooting-the-log-analyzer)
   - [Summary](#summary)

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

The tool automatically locates your OpenCode log directory based on your operating system.

### Running the Log Analyzer

The log analyzer requires the Bun runtime. It's located in the plugin development repository:

```bash
# From the opencode-coder repository root
bun run scripts/log-analyzer
```

**Note**: This tool is primarily for plugin developers and advanced troubleshooting. Regular users should start with basic debug logging and only use the analyzer when directed by maintainers.

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

The log analyzer integrates with the overall troubleshooting process:

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

For most troubleshooting, start with basic debug logging, then use the analyzer when you need precise filtering or when reporting issues.
