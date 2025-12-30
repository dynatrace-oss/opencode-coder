import { describe, expect, it } from "bun:test";
import { parseFrontmatter } from "../../src/core/parser";

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
url: "https://example.com/path"
time: "12:30:45"
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

  it("should handle boolean values (YAML-parsed as actual booleans)", () => {
    const content = `---
enabled: true
disabled: false
---
Body`;

    const result = parseFrontmatter(content);

    // YAML parser returns actual booleans
    expect(result.frontmatter).toEqual({
      enabled: true,
      disabled: false,
    });
  });

  it("should handle numeric values (YAML-parsed as actual numbers)", () => {
    const content = `---
count: 42
price: 19.99
---
Body`;

    const result = parseFrontmatter(content);

    // YAML parser returns actual numbers
    expect(result.frontmatter).toEqual({
      count: 42,
      price: 19.99,
    });
  });

  it("should handle string values that look like versions", () => {
    const content = `---
version: "1.0.0"
---
Body`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      version: "1.0.0",
    });
  });

  it("should handle arrays in frontmatter", () => {
    const content = `---
tags:
  - typescript
  - opencode
  - plugin
---
Body`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      tags: ["typescript", "opencode", "plugin"],
    });
  });

  it("should handle nested objects in frontmatter", () => {
    const content = `---
config:
  enabled: true
  options:
    timeout: 30
---
Body`;

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({
      config: {
        enabled: true,
        options: {
          timeout: 30,
        },
      },
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
      subtask: true,
    });
    expect(result.body).toContain("Review the current story");
    expect(result.body).toContain("## Instructions");
  });

  it("should return empty frontmatter for invalid YAML", () => {
    const content = `---
key: [invalid yaml
  - missing bracket
---
Body`;

    const result = parseFrontmatter(content);

    // Invalid YAML should return empty frontmatter
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe(content);
  });

  it("should handle CRLF line endings", () => {
    const content = "---\r\nkey: value\r\n---\r\nBody content";

    const result = parseFrontmatter(content);

    expect(result.frontmatter).toEqual({ key: "value" });
    expect(result.body).toBe("Body content");
  });

  it("should handle frontmatter that parses to non-object (null)", () => {
    const content = `---
null
---
Body`;

    const result = parseFrontmatter(content);

    // YAML null should result in empty object
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("Body");
  });

  it("should handle frontmatter that parses to array", () => {
    const content = `---
- item1
- item2
---
Body`;

    const result = parseFrontmatter(content);

    // YAML array at root should result in empty object (not valid frontmatter)
    expect(result.frontmatter).toEqual({});
    expect(result.body).toBe("Body");
  });
});
