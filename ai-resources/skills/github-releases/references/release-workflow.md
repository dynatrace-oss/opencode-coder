# Release Workflow

## 1. Prerequisites

```bash
bash scripts/check-release-prereqs.sh
```

## 2. Create Structure

```bash
bash scripts/create-release-tasks.sh <version>
```

## 3. Fill TODOs

**YOU MUST fill TODOs in all tasks.**

Read `docs/RELEASING.md` and replace TODO markers with project-specific commands.

## 4. Review

```
Task(subagent_type: "beads-review-agent", 
     prompt: "Review release structure for v<version>")
```

## 5. Execute

```
Task(subagent_type: "beads-task-agent",
     prompt: "Execute task <id>")
```

Repeat for each ready task.

## 6. Verify

```
Task(subagent_type: "beads-verify-agent",
     prompt: "Verify task <id>")
```

## Rules

- Tests MUST pass (zero failures)
- Fill all TODOs (read docs/RELEASING.md)
- Delegate to subagents (never execute directly)
