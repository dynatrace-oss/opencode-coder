import { describe, expect, it } from "bun:test";
import { parseFrontmatter } from "../../src/kb/parser";

describe("parseFrontmatter", () => {
  it("should parse valid frontmatter with body", () => {
    const content = `---
name: test-name
description: A test description
---
This is the body content.

It has multiple lines.`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      name: "test-name",
      description: "A test description",
    });
    expect(result.body).toBe("This is the body content.\n\nIt has multiple lines.");
  });

  it("should return empty frontmatter when no frontmatter present", () => {
    const content = "Just some plain content\nwith multiple lines.";

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("should handle frontmatter with colons in values", () => {
    const content = `---
url: https://example.com/path
time: 12:30:45
---
Body content`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      url: "https://example.com/path",
      time: "12:30:45",
    });
    expect(result.body).toBe("Body content");
  });

  it("should handle empty body after frontmatter", () => {
    const content = `---
key: value
---
`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({ key: "value" });
    expect(result.body).toBe("");
  });

  it("should ignore lines without colons in frontmatter", () => {
    const content = `---
valid: value
invalid line without colon
another: valid
---
Body`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      valid: "value",
      another: "valid",
    });
    expect(result.body).toBe("Body");
  });

  it("should trim whitespace from keys and values", () => {
    const content = `---
  key  :   value with spaces   
another:value
---
Body`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      key: "value with spaces",
      another: "value",
    });
  });

  it("should handle empty content", () => {
    const result = parseFrontmatter("");

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("");
  });

  it("should handle incomplete frontmatter without closing delimiter", () => {
    const content = `---
key: value
This line has no closing delimiter`;

    // No closing --- means no valid frontmatter
    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("should parse frontmatter even with non-key lines", () => {
    // The regex will match frontmatter even with invalid lines inside
    const content = `---
key: value
This line breaks the frontmatter
---
Body`;

    const result = parseFrontmatter(content);

    // The parser still extracts key:value pairs and ignores invalid lines
    expect(result.frontmatter).toEqual({ key: "value" });
    expect(result.body).toBe("Body");
  });

  it("should handle boolean-like string values", () => {
    const content = `---
enabled: true
disabled: false
---
Body`;

    const result = parseFrontmatter(content);

    // Values are kept as strings, not converted to booleans
    expect(result.frontmatter).toEqual({
      enabled: "true",
      disabled: "false",
    });
  });

  it("should handle numeric-like string values", () => {
    const content = `---
count: 42
version: 1.0.0
---
Body`;

    const result = parseFrontmatter(content);

    // Values are kept as strings
    expect(result.frontmatter).toEqual({
      count: "42",
      version: "1.0.0",
    });
  });

  it("should handle real-world agent frontmatter", () => {
    const content = `---
name: code-reviewer
description: Reviews code for correctness, security, best practices, and test coverage
model: claude-3-opus
mode: subagent
---
You are a code reviewer. Analyze the code and provide feedback.`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      name: "code-reviewer",
      description: "Reviews code for correctness, security, best practices, and test coverage",
      model: "claude-3-opus",
      mode: "subagent",
    });
    expect(result.body).toBe("You are a code reviewer. Analyze the code and provide feedback.");
  });

  it("should handle real-world command frontmatter", () => {
    const content = `---
description: Shows next steps for the current story
agent: story-reviewer
subtask: true
---
Review the current story and suggest next steps.

## Instructions
1. Read the story
2. Analyze progress
3. Suggest next actions`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      description: "Shows next steps for the current story",
      agent: "story-reviewer",
      subtask: "true",
    });
    expect(result.body).toContain("Review the current story");
    expect(result.body).toContain("## Instructions");
  });
});
