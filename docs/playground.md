# Private Playground

The playground feature provides each Claude Code session with a private, temporary folder for experimentation, scratch work, and intermediate files.

## What is the Playground?

The playground is an isolated, session-specific temporary directory where agents can:
- Create test files and prototypes
- Store intermediate computation results
- Run experiments without affecting your project files
- Generate temporary outputs during complex operations

Think of it as a "scratch pad" that's automatically cleaned up by your operating system.

## How It Works

### Automatic Setup

The playground is created automatically when needed—no manual setup required:
- Each session gets its own unique folder
- Created on-demand when an agent needs it
- Cached for performance (subsequent requests are instant)
- Isolated from other sessions and projects

### Storage Location

Playground folders are created in your system's temporary directory:

```
$TMPDIR/opencode/<session-id>/
```

Platform-specific locations:
- **macOS/Linux**: `/tmp/opencode/<session-id>/`
- **Windows**: `%TEMP%\opencode\<session-id>\`

## When to Use It

### Good Use Cases

✅ **Experimentation**: Try code changes without modifying project files
✅ **Intermediate files**: Store temporary data during multi-step operations
✅ **Testing**: Create isolated test environments
✅ **Scratch work**: Draft files before committing to project structure
✅ **Generated outputs**: Store temporary build artifacts or analysis results

### Not Recommended

❌ **Permanent storage**: Playground files are temporary and will be cleaned up
❌ **Sharing between sessions**: Each session has its own isolated playground
❌ **Project deliverables**: Use your project directory for final outputs
❌ **Version control**: Playground files are not tracked by git

## Cleanup

Playground folders are managed by your operating system's temporary directory cleanup:
- **Short-term**: Cleaned on system restart (most OSes)
- **Long-term**: Removed during periodic temp cleanup (varies by OS)
- **Manual**: Safe to delete `$TMPDIR/opencode/` at any time

No manual cleanup is required—the OS handles it automatically.

## Examples

### Agent Using Playground

When agents need scratch space, they automatically use the playground:

```markdown
User: "Can you test if this regex pattern works with various inputs?"

Agent: I'll use the playground to test this pattern with sample data.
- Creates: /tmp/opencode/abc123/test-input.txt
- Tests regex against various patterns
- Reports results
- Files remain until OS cleanup
```

### Multi-Step Analysis

For complex operations requiring intermediate files:

```markdown
User: "Analyze this JSON dataset and generate a summary report"

Agent workflow:
1. Writes raw data to playground: /tmp/opencode/abc123/raw-data.json
2. Processes and creates intermediate: /tmp/opencode/abc123/processed.json
3. Generates final report in your project: ./reports/summary.md
```

### Safe Experimentation

Testing changes without affecting project files:

```markdown
User: "Try refactoring this component to see if it improves readability"

Agent:
1. Copies component to playground: /tmp/opencode/abc123/Component.tsx
2. Applies refactoring changes
3. Shows you the result
4. If approved, applies to actual project file
```

## Developer Integration

For developers integrating with the playground service, see the [PlaygroundService documentation](#) in the coding guidelines.

## FAQ

**Q: Can I manually add files to the playground?**  
A: Yes, but it's designed for agent use. You can write files directly to the path if needed.

**Q: How do I find my current playground path?**  
A: Check the agent logs—they report the path when creating the playground.

**Q: Can I disable the playground?**  
A: The playground is only created when needed. If not used, no folders are created.

**Q: What if playground creation fails?**  
A: The system gracefully falls back—agents will work without it or report the issue.

**Q: Are playground files secure?**  
A: They use standard OS temp permissions. Don't store sensitive data in the playground.

## Troubleshooting

### Playground Not Created

If agents report playground creation failures:

1. **Check permissions**: Ensure write access to `$TMPDIR`
2. **Check disk space**: Verify temp directory has available space
3. **Check environment**: Confirm `TMPDIR` or `TEMP` is set correctly

### Disk Space Concerns

Playground folders are lightweight, but if concerned about disk usage:

```bash
# Check current playground usage
du -sh $TMPDIR/opencode/

# Manually clean up old sessions (safe to do anytime)
rm -rf $TMPDIR/opencode/
```

### Finding Old Playgrounds

To see all playground folders:

```bash
# List all session playgrounds
ls -la $TMPDIR/opencode/
```

Each folder is named by session ID for easy identification.
