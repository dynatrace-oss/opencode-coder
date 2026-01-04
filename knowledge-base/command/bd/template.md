---
description: Manage issue templates for streamlined issue creation
argument-hint: [list|show|create] [template-name]
---

Manage issue templates for streamlined issue creation.

Templates provide pre-filled structures for common issue types, making it faster to create well-formed issues with consistent formatting.

## Commands

### list

List all available templates (built-in and custom).

```bash
bd template list
bd template list --json
```

### show

Show detailed structure of a specific template.

```bash
bd template show <template-name>
bd template show <template-name> --json
```

### create

Create a custom template in `.beads/templates/` directory.

```bash
bd template create <template-name>
```

This creates a YAML file with default structure that you can edit to customize.

## Using Templates with `bd create`

Use the `--from-template` flag to create issues from templates:

```bash
bd create --from-template <template-name> "Issue title"
```

Template values can be overridden with explicit flags:

```bash
# Use bug template but override priority
bd create --from-template bug "Login crashes on special chars" -p 0

# Use epic template but add extra labels
bd create --from-template epic "Q4 Infrastructure" -l infrastructure,ops
```

## Built-in Templates

### epic

For large features composed of multiple issues.
- Type: epic, Priority: P1, Labels: epic

### bug

For bug reports with consistent structure.
- Type: bug, Priority: P1, Labels: bug

### feature

For feature requests and enhancements.
- Type: feature, Priority: P2, Labels: feature

## Custom Templates

Custom templates are stored in `.beads/templates/` directory as YAML files.

Template file format:

```yaml
name: template-name
description: |
  Multi-line description with placeholders
  
  ## Section heading
  
  [Placeholder text]

type: bug|feature|task|epic|chore
priority: 0-4
labels:
  - label1
  - label2

design: |
  Design notes structure

acceptance_criteria: |
  - [ ] Acceptance criterion 1
  - [ ] Acceptance criterion 2
```

Custom templates override built-in templates with the same name.
