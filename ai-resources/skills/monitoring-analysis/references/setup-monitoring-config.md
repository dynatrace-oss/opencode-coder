# Setup Monitoring Configuration

Guide for helping users create or update their project's `MONITORING.md`
file.

## Purpose

The `MONITORING.md` file documents how to access and interpret monitoring
data for a specific project. It's written in natural language for an AI
agent to understand and act upon.

This is NOT a structured config file — it's documentation that captures:

1. **How to get the data** — Commands, scripts, APIs, file paths
2. **What to look for** — Domain knowledge about what matters

## When to Use This Workflow

- Project has no `MONITORING.md` file
- User wants to document their monitoring setup
- User wants to add or modify data sources

## Step 1: Ask About Monitoring Tools

Start by understanding what the user has. Ask questions like:

- "What monitoring tools or systems do you use?" (Datadog, CloudWatch,
  Grafana, Prometheus, custom scripts, log files, etc.)
- "How do you currently query logs, metrics, or traces?"
- "Are there any dashboards, APIs, or CLI tools you use?"

Listen for:

- Command-line tools they use regularly
- Log file locations
- API endpoints for metrics
- Dashboard URLs they check
- Error tracking services (Sentry, Bugsnag, etc.)

## Step 2: Ask About What Matters

Understand the domain context:

- "What kinds of issues are important for your project?"
- "What errors or patterns typically indicate real problems?"
- "Are there things that look like errors but can be ignored?"
- "What would make you wake up at 2am vs. what can wait?"

This captures the human judgment that guides analysis:

- Which error codes matter
- What response times are concerning
- Which services are most critical
- What patterns indicate known issues vs. new problems

## Step 3: Document the Configuration

Create a `MONITORING.md` file that captures everything in natural language.

### What to Include

**Data access methods:**

- Actual commands to run (with any auth/environment needed)
- API endpoints and how to call them
- File paths for logs
- Dashboard URLs

**Domain knowledge:**

- What error patterns indicate real problems
- What can be safely ignored
- Which components are most critical
- Any context that helps interpretation

### Example Structure

The file doesn't need a rigid format. Here's one approach:

```markdown
# Monitoring Configuration

## How to Get Monitoring Data

### Application Logs
Our logs are in CloudWatch. To fetch recent errors:
\`\`\`bash
aws logs filter-log-events --log-group-name /app/production \
  --filter-pattern "ERROR" --start-time $(date -d '1 hour ago' +%s000)
\`\`\`

### Metrics Dashboard
Main dashboard: https://grafana.internal/d/production
API for metrics: `curl -H "Authorization: Bearer $GRAFANA_TOKEN" https://grafana.internal/api/...`

### Error Tracking
We use Sentry. The CLI can pull recent issues:
\`\`\`bash
sentry-cli issues list --project=myapp --status=unresolved
\`\`\`

## What to Look For

### Critical (needs immediate attention)
- Database connection failures — usually means the DB is overloaded
- "CircuitBreaker OPEN" — downstream service is failing
- HTTP 5xx rates above 1%

### Important (should be tracked)
- Slow queries (>500ms is concerning for our API)
- Memory warnings from the worker service
- Rate limit errors from third-party APIs

### Can Usually Ignore
- 404 errors on `/favicon.ico` — some old clients request this
- "Connection reset by peer" on websockets — normal client disconnects
- Timeout errors from the legacy batch job — it's flaky but non-critical
```

## Step 4: Verify and Refine

After creating the initial file:

1. Try running the documented commands to verify they work
2. Ask if there's anything missing
3. Suggest they update it as they learn more

## Agentic Guidelines

### Let the User Lead

Don't assume what monitoring tools they use. Ask.

### Capture Real Knowledge

The most valuable content is the domain expertise — what matters, what
doesn't, and why. Commands are easy to look up; judgment is hard to
document.

### Keep It Natural

The file is for an AI agent to read. Natural language is better than
rigid structure. "Check CloudWatch for ERROR level logs in the last
hour" is better than a complex YAML schema.

### Iterate

The first version won't be perfect. Encourage the user to update it as
they discover gaps during actual analysis sessions.
