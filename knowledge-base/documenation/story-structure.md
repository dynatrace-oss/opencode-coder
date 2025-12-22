# Story Structure

Every story MUST include these sections:

## Story Statement

Use the standard format:

```
**As a** [role],
**I want** [action],
**so that** [benefit]
```

## Acceptance Criteria

Numbered list of testable criteria that define "done"

## Tasks / Subtasks

Detailed, sequential technical tasks:

```
- [ ] Task 1 (AC: # if applicable)
  - [ ] Subtask 1.1...
- [ ] Task 2 (AC: # if applicable)
  - [ ] Subtask 2.1...
```

## Dev Notes

Critical section containing:

- **Data Models**: Schemas, validation rules, relationships [with source references]
- **API Specifications**: Endpoint details, request/response formats [with source references]
- **File Locations**: Exact paths where new code should be created
- **Testing Requirements**: Specific test cases from testing-strategy.md
- **Technical Constraints**: Version requirements, performance considerations

## Questions and Design Decisions

Logs all the open questions that we have for the story

How to track questions

```
**Questions 1: How should we handle x**
- **Problem**: A is not the same as B how should we handle that 
- **Option1**: We Ignore B
- **Option2**: We implement both
- **Option3**: We ignore A
```

Once those questions get answered they get converted to decisions

How to track decisions

```
**Decision 1: We do x**
- **Problem**: A is not the same as B how should we handle that 
- **Decision**: We Ignore B
- **Rationale**: For 90% of use cases B is not relevant so we do not handle it
```

### Risks and Considerations

## Validation Report

Final report

| Category                             | Status | Issues                                               |
|--------------------------------------|--------|------------------------------------------------------|
| 1. Goal & Context Clarity            | <TBD>  | Clear problem statement and desired end state        |
| 2. Technical Implementation Guidance | <TBD>  | Complete file lists, package structure, code samples |
| 3. Reference Effectiveness           | <TBD>  | Current locations and migration targets documented   |
| 4. Self-Containment Assessment       | <TBD>  | All design decisions with rationale included         |
| 5. Testing Guidance                  | <TBD>  | Validation steps clearly defined                     |
| 6. No option questions               | <TBD>  | All questions converted to descisions                |

Possible Status values DONE|OPEN
Only if all categories are DONE then the story is Ready for Implementation
