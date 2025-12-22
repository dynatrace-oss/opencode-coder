# Bug Structure

Every bug report MUST include these sections:

## Bug Details

Contains:

- Brief bug description (1-2 sentences)
- Environment and context (OS, runtime versions, configuration)
- Date discovered and reporter

## Steps to Reproduce

Contains a detailed, numbered list of steps to reproduce the problem. Each step should be explicit and verifiable.

```
1. [Exact command or action]
2. [Next step]
3. [Continue until bug manifests]
```

## Expected Behavior

Contains a detailed description of what the expected behavior should be, with:
- Links to documentation or specifications
- If this is a regression, include the version that worked correctly

## Actual Behavior

Contains a detailed description of what the system actually does. This MUST include:
- Exact error messages (copy-pasted, not paraphrased)
- Stack traces (full, not truncated)
- Relevant log output

## Problem Analysis

Contains analysis of the problem. This includes:

1. **Root Cause Analysis**: Why did the problem occur?
2. **Testing Gap Analysis**: Why was this bug not caught during testing and QA?
3. **Logging Assessment**: Was logging sufficient? Were error messages helpful and actionable?

## Acceptance Criteria

Contains a numbered list of criteria that must be met to mark the bug as Fixed:

```
1. [Specific, testable criterion]
2. [Another criterion]
```

## Tasks

Contains a list of tasks to fix the bug. This should include:

- [ ] How to fix the root cause
- [ ] How to improve tests to catch this and similar issues
- [ ] How to improve logging and error messages
- [ ] How to improve documentation (if applicable)

## Dev Notes

Critical technical information:

- **Relevant Code Locations**: File paths with line numbers
- **Recommended Fix**: Suggested approach to resolve the issue
- **Relevant Documentation**: Links to related docs
- **Useful Tools**: Links to debugging tools or utilities

## Questions and Design Decisions

Logs all open questions and resolved decisions for the bug.

### How to Track Questions

```
**Question 1: How should we handle X?**
- **Problem**: A is not the same as B. How should we handle that?
- **Option 1**: Ignore B
- **Option 2**: Implement both
- **Option 3**: Ignore A
```

### How to Track Decisions

Once questions are answered, convert them to decisions:

```
**Decision 1: We do X**
- **Problem**: A is not the same as B. How should we handle that?
- **Decision**: Ignore B
- **Rationale**: For 90% of use cases, B is not relevant, so we do not handle it
```

## Post-Mortem Analysis

Detailed analysis of why the bug happened (required before marking as Done):

- **Why wasn't this caught earlier?** Analysis of gaps in testing, code review, or processes
- **What could we improve?** Concrete suggestions for preventing similar bugs
- **Preventive measures taken**: List of new tests, linting rules, or process changes implemented

