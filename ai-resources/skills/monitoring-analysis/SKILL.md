---
name: monitoring-analysis
description: >
  Analyze monitoring data (logs, metrics, dashboards) to find issues and
  create beads for tracking. Use when: (1) User wants to analyze logs,
  metrics, or monitoring data, (2) User mentions 'check logs', 'analyze
  errors', 'triage issues', 'review monitoring', (3) User wants to find
  bugs or issues from observability data, (4) User asks to 'create issues
  from logs' or 'triage alerts'. Requires MONITORING.md in project root.
---

# Monitoring Analysis

Analyze monitoring data to find issues and track them in beads.

## About This Skill

This skill helps turn monitoring data into tracked issues. It works with
any monitoring setup — logs, metrics, dashboards, error tracking — by
reading project-specific configuration that documents how to access and
interpret the data.

Key principles:

- **Project-specific** — Each project documents its own monitoring setup
- **LLM judgment** — No rigid parsing or hard thresholds; interpret data
- **Agentic autonomy** — Execute safe actions, ask about uncertain ones

## Prerequisites

This skill requires a `MONITORING.md` file in the project root that
documents:

- How to query monitoring data (commands, APIs, file paths)
- What to look for when analyzing (domain knowledge, what matters)

If no `MONITORING.md` exists, use the setup workflow to create one.

## Workflows

### 1. Setup Monitoring Configuration

Use when the project needs a `MONITORING.md` file, or when updating an
existing one.

**[setup-monitoring-config.md](references/setup-monitoring-config.md)** —
Interactive guide for documenting the project's monitoring setup through
conversation with the user.

### 2. Analyze and Triage

Use when analyzing monitoring data and creating issues from findings.

**[analyze-and-triage.md](references/analyze-and-triage.md)** — Workflow
for fetching data, identifying issues, checking for duplicates, and
creating or updating beads.

## Quick Start

1. Check if `MONITORING.md` exists in the project root
2. If not, use the setup workflow to create it
3. Use the analyze workflow to check monitoring data and create issues

## References

- **[setup-monitoring-config.md](references/setup-monitoring-config.md)**
  — Creating/updating MONITORING.md
- **[analyze-and-triage.md](references/analyze-and-triage.md)** — Analyze
  data and create beads
