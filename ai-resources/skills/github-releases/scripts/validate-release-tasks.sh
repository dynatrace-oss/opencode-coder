#!/usr/bin/env bash
set -euo pipefail

# Script: validate-release-tasks.sh  
# Purpose: Validate that all TODO markers have been replaced in release tasks
# Usage: bash scripts/validate-release-tasks.sh <parent-epic-id>
# Example: bash scripts/validate-release-tasks.sh oc-abc123

PARENT_ID="${1:-}"

if [ -z "$PARENT_ID" ]; then
    echo "Error: Parent epic ID required"
    echo "Usage: $0 <parent-epic-id>"
    echo "Example: $0 oc-abc123"
    exit 1
fi

if ! command -v bd &> /dev/null; then
    echo "Error: bd command not found. Is beads installed?"
    exit 1
fi

echo "Validating release tasks for epic: $PARENT_ID"
echo ""

# Get unique child task IDs
TASKS=$(bd list --parent="$PARENT_ID" | grep -oE "${PARENT_ID}\.[0-9]+" | sort -u)

if [ -z "$TASKS" ]; then
    echo "Error: No child tasks found for parent $PARENT_ID"
    exit 1
fi

TASK_COUNT=0
TODO_COUNT=0
FAILED_TASKS=()

# Check each task
while IFS= read -r task_id; do
    TASK_COUNT=$((TASK_COUNT + 1))
    
    # Get full task output and check for TODOs
    TASK_OUTPUT=$(bd show "$task_id")
    
    # Count TODOs in the task
    TODOS=$(echo "$TASK_OUTPUT" | grep -c "TODO:" || true)
    
    # Get title (extract from first line)
    TITLE=$(echo "$TASK_OUTPUT" | head -1 | awk -F'·' '{print $2}' | sed 's/\[.*\]//g' | xargs)
    
    if [ "$TODOS" -gt 0 ]; then
        TODO_COUNT=$((TODO_COUNT + TODOS))
        FAILED_TASKS+=("$task_id")
        echo "❌ $task_id: $TITLE ($TODOS TODO markers)"
    else
        echo "✅ $task_id: $TITLE"
    fi
done <<< "$TASKS"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "VALIDATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Tasks checked: $TASK_COUNT"
echo "TODO markers found: $TODO_COUNT"
echo ""

if [ "$TODO_COUNT" -gt 0 ]; then
    echo "❌ VALIDATION FAILED"
    echo ""
    echo "Tasks with TODOs:"
    for task in "${FAILED_TASKS[@]}"; do
        echo "  • $task"
    done
    echo ""
    echo "Next steps:"
    echo "  1. Review each task: bd show <task-id>"
    echo "  2. Replace TODO markers with project-specific info"
    echo "  3. Read docs/RELEASING.md for guidance"
    echo "  4. Run validation again"
    echo ""
    exit 1
else
    echo "✅ VALIDATION PASSED"
    echo ""
    echo "All tasks ready for execution."
    echo "Next: Review plan with beads-review-agent"
    echo ""
    exit 0
fi
