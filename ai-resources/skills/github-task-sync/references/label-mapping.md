# Label and Priority Mapping

Bidirectional mapping between GitHub labels and beads metadata for task synchronization.

## Priority Mapping

### GitHub Labels → Beads Priority

Map GitHub issue labels to beads priority levels (0-4):

| GitHub Label Pattern | Beads Priority | Priority Value | Description |
|----------------------|----------------|----------------|-------------|
| `critical`, `P0`, `severity:critical`, `blocker` | P0 | 0 | Critical issues requiring immediate attention |
| `high`, `P1`, `severity:high`, `urgent` | P1 | 1 | High priority issues |
| `medium`, `P2`, `severity:medium`, `normal` | P2 | 2 | Normal priority (default) |
| `low`, `P3`, `severity:low`, `minor` | P3 | 3 | Low priority issues |
| `backlog`, `P4`, `someday`, `nice-to-have` | P4 | 4 | Backlog items |
| *(no priority label)* | P2 (default) | 2 | Default when no priority found |

**Mapping Algorithm**:

1. Extract all label names from GitHub issue
2. Convert labels to lowercase for case-insensitive matching
3. Check each label against priority patterns
4. Use the **highest priority** found (lowest number)
5. If no priority label found, default to P2

**Example**:
```
GitHub labels: ["bug", "high", "needs-triage"]
Match: "high" → P1
Result: Priority 1
```

**Multiple priority labels**:
```
GitHub labels: ["critical", "low"]  # Edge case
Matches: "critical" → P0, "low" → P3
Result: P0 (highest priority wins)
```

### Beads Priority → GitHub Label

Map beads priority to GitHub labels for export:

| Beads Priority | Priority Value | GitHub Label |
|----------------|----------------|--------------|
| P0 | 0 | `critical` |
| P1 | 1 | `high` |
| P2 | 2 | `medium` |
| P3 | 3 | `low` |
| P4 | 4 | `backlog` |

**Note**: When exporting, always create these exact labels. If they don't exist in the GitHub repository, GitHub will auto-create them.

**Additional labels to add**:
- Always add beads type as label (e.g., `bug`, `feature`, `task`)
- Preserve any custom beads labels when exporting (optional)

## Tracking Labels

### Labels for Import (GitHub → Beads)

When importing GitHub issues into beads, add these labels:

#### 1. Source Label

```
source:external
```

**Purpose**: Marks issue as imported from external system
**Applied**: Only on import, not on export
**Usage**: Identify which beads originated from GitHub

#### 2. GitHub ID Label

```
github:<number>
```

**Format**: `github:` prefix + GitHub issue number
**Examples**: `github:123`, `github:456`
**Purpose**: Links bead to specific GitHub issue
**Applied**: On both import and export

**Parsing**:
```bash
# Extract number from label
LABEL="github:123"
NUMBER=${LABEL#github:}  # Result: 123
```

### Labels for Export (Beads → GitHub)

When exporting beads to GitHub, apply beads ID as GitHub label:

```
beads:<id>
```

**Format**: `beads:` prefix + bead ID
**Examples**: `beads:oc-abc1`, `beads:oc-def2`
**Purpose**: Links GitHub issue back to originating bead
**Applied**: Only on export

**Note**: This allows bidirectional tracking. GitHub issue can reference the bead that created it.

## Direction Tracking

Use labels to determine sync direction:

### Imported Issues (GitHub → Beads)

**Pattern**: Has both `source:external` and `github:<number>`

```
Labels: ["source:external", "github:123"]
→ Issue was imported from GitHub #123
```

### Exported Issues (Beads → GitHub)

**Pattern**: Has `github:<number>` but NOT `source:external`

```
Labels: ["github:456"]
→ Issue was created in beads, exported to GitHub #456
```

### Local Issues (Not Synced)

**Pattern**: No `github:` label

```
Labels: ["bug", "high"]
→ Issue is local to beads, not synced with GitHub
```

## Title Formatting

### Import Title Format

When importing from GitHub, append GitHub reference to title:

```
<Original GitHub title> (github:#<number>)
```

**Examples**:
- Original: `Fix login timeout`
- Beads: `Fix login timeout (github:#123)`

**Rationale**: Makes GitHub origin visible in beads UI and reports

### Export Title Format

When exporting to GitHub, use beads title as-is (no modification):

```
<Beads title>
```

**Example**:
- Beads: `Fix authentication flow`
- GitHub: `Fix authentication flow`

**Rationale**: GitHub UI shows issue number already, no need to add bead ID to title

## Body Formatting

### Import Body Format

When importing GitHub issue into beads:

```markdown
## Original GitHub Issue

**GitHub**: <org/repo>#<number>
**Created**: <created date>
**URL**: https://github.com/<org/repo>/issues/<number>

## Description

<body content from GitHub issue>

---
*Imported from GitHub on <import date>*
```

**Example**:
```markdown
## Original GitHub Issue

**GitHub**: hk9890/opencode-coder#123
**Created**: 2026-02-01T10:00:00Z
**URL**: https://github.com/hk9890/opencode-coder/issues/123

## Description

Users are experiencing timeout after 30 seconds when trying to log in.
This happens consistently on production but not in development environment.

---
*Imported from GitHub on 2026-02-13*
```

### Export Body Format

When exporting bead to GitHub:

```markdown
<bead description content>

---
*Created from beads issue: <bead-id>*
*Priority: P<priority>*
*Type: <type>*
```

**Example**:
```markdown
Implement export feature to push beads issues to GitHub.

Requirements:
- Map beads data to GitHub format
- Capture GitHub issue ID
- Update bead with tracking label

---
*Created from beads issue: oc-abc123*
*Priority: P1*
*Type: feature*
```

## Type Mapping

### GitHub → Beads Type

GitHub doesn't have explicit issue types, determine from labels:

| GitHub Label Pattern | Beads Type |
|----------------------|------------|
| `bug`, `defect`, `error` | `bug` |
| `feature`, `enhancement`, `improvement` | `feature` |
| `task`, `chore`, `maintenance` | `task` |
| *(no type label)* | `bug` (default) |

**Default**: Import as `bug` type if unclear

### Beads → GitHub Type

Beads types map to GitHub labels:

| Beads Type | GitHub Labels |
|------------|---------------|
| `bug` | `bug` |
| `feature` | `enhancement` |
| `task` | `task` |
| `chore` | `chore` |
| `epic` | `epic` (large feature) |

**Note**: Always add type label when exporting to GitHub

## Status Mapping

### GitHub States

GitHub has only two states:
- `OPEN` - Issue is open
- `CLOSED` - Issue is closed

### Beads Statuses

Beads has multiple statuses:
- `open` - Not started
- `in_progress` - Actively worked on
- `blocked` - Waiting on something
- `closed` - Completed
- `done` - Alternative to closed

### Status Mapping Rules

**GitHub → Beads**:
- `OPEN` → `open` (beads status)
- `CLOSED` → `closed` (beads status)

**Beads → GitHub**:
- `open` → `OPEN`
- `in_progress` → `OPEN`
- `blocked` → `OPEN`
- `closed` → `CLOSED`
- `done` → `CLOSED`

**Summary**: Any non-closed beads status maps to GitHub `OPEN`. Only closed/done beads map to GitHub `CLOSED`.

## Label Management Best Practices

### Deduplication

Before importing, always check for existing labels:

```bash
# Check if issue already imported
bd list --json | jq '.[] | select(.labels[]? == "github:123")'
```

If found, skip import to avoid duplicates.

### Label Consistency

**On import**:
- Always add both `source:external` and `github:<number>`
- Never add just one - they work together

**On export**:
- Add `github:<number>` after successful creation
- Add `beads:<id>` to GitHub issue for back-reference

### Label Cleanup

When issue is closed:
- Keep tracking labels (`github:`, `beads:`, `source:external`)
- Don't remove them even when closed
- They maintain audit trail and history

## Example Scenarios

### Scenario 1: Import GitHub Issue

**GitHub Issue #123**:
- Title: "Fix login timeout"
- Labels: ["bug", "high"]
- State: OPEN

**Beads Creation**:
```bash
bd create \
  --title="Fix login timeout (github:#123)" \
  --type=bug \
  --priority=1 \
  --label="source:external" \
  --label="github:123"
```

**Result**:
- Bead ID: oc-abc1
- Priority: P1 (from "high" label)
- Type: bug
- Labels: ["source:external", "github:123"]

### Scenario 2: Export Bead to GitHub

**Bead oc-def2**:
- Title: "Add dark mode"
- Type: feature
- Priority: P2
- Status: open

**GitHub Creation**:
```bash
gh issue create --repo $REPO \
  --title "Add dark mode" \
  --body "...\n---\n*Created from beads issue: oc-def2*\n*Priority: P2*\n*Type: feature*" \
  --label "enhancement" \
  --label "medium" \
  --label "beads:oc-def2"
```

**Result**:
- GitHub issue #456 created
- Update bead: `bd update oc-def2 --label "github:456"`

### Scenario 3: Bidirectional Conflict

**GitHub Issue #789** (imported as oc-ghi3):
- GitHub title: "Fix auth timeout" 
- Beads title: "Fix authentication timeout"
- Both changed after initial import

**Detection**:
- Both systems have `github:789` link
- Titles differ → conflict

**Resolution**:
- Ask user which title to keep
- Update both systems to match chosen title
