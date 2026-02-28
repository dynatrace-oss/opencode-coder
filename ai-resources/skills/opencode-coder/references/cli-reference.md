# Beads CLI Reference

Complete reference for the `bd` CLI tool.

## Query Commands

| Command | Description |
|---------|-------------|
| `bd list` | List issues (add `--status=open`, `--type=task`, etc.) |
| `bd list --status=open` | All open issues |
| `bd list --status=in_progress` | Currently active work |
| `bd list --parent <id>` | Children of a specific issue |
| `bd list --pretty` | Tree format with status/priority symbols |
| `bd ready` | Issues ready to work (no blockers) |
| `bd ready --json` | Structured output for parsing |
| `bd show <id>` | Detailed view with dependencies and full body |
| `bd blocked` | All blocked issues |
| `bd stats` | Project statistics (open/closed/blocked counts) |

## Creation Commands

| Command | Description |
|---------|-------------|
| `bd create --title="..." --type=<type> --priority=<n>` | Create new issue |
| `bd create --title="..." --description="..."` | Create with inline description |
| `bd create --title="..." --body-file -` | Create with stdin body (for heredoc) |
| `bd dep add <issue> <depends-on>` | Add dependency |

**Issue Types**: `epic`, `feature`, `task`, `bug`, `chore`, `gate`

**Priority Levels**: 0 (P0, critical) → 4 (P4, backlog). Default: 2.

**Create Options**:
- `--description="..."` — Short inline description
- `--body-file -` — Read body from stdin (for multi-line content)
- `--labels=<label>` — Add labels (e.g., `need:review`, `has:open-questions`)
- `--parent <id>` — Set parent issue
- `--deps <id>` — Add dependencies at creation time

## Management Commands

| Command | Description |
|---------|-------------|
| `bd update <id> --status=in_progress` | Claim work |
| `bd update <id> --status=open` | Unclaim work |
| `bd update <id> --assignee=<user>` | Assign to someone |
| `bd update <id> --parent <id>` | Set parent issue |
| `bd close <id>` | Mark issue complete |
| `bd close <id1> <id2> ...` | Close multiple issues at once |
| `bd close <id> --reason="..."` | Close with explanation |
| `bd comment <id> "message"` | Add a comment |

## Sync & Health

| Command | Description |
|---------|-------------|
| `bd sync` | Sync with git remote |
| `bd sync --status` | Check sync status without syncing |
| `bd doctor` | Check for issues |

## Heredoc Syntax

> **Important**: Use `--body-file -` to read body from stdin. Heredoc alone does NOT work.

```bash
cat << 'EOF' | bd create --title="Task title" --type=task --priority=2 --body-file -
## Description
Multi-line description here.

## Instructions
1. Step one
2. Step two

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
EOF
```

**Key syntax notes:**
- `cat << 'EOF'` — Start heredoc (single quotes prevent variable expansion)
- Pipe `|` to `bd create`
- `--body-file -` tells bd to read from stdin
- End with `EOF` on its own line

## Efficiency Tips

**Close multiple issues at once:**
```bash
bd close oc-abc oc-def oc-ghi --reason="All implemented"
```

**Use `--json` for structured output:**
```bash
bd ready --json
bd show <id> --json
```

**Parallel creation:** When creating many issues, use parallel subagents for efficiency.

**WARNING**: Do NOT use `bd edit` — it opens $EDITOR (vim/nano) which blocks agents.
