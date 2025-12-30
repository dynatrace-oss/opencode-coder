import { parse as parseYaml } from "yaml";

/**
 * Parsed frontmatter key-value pairs.
 * Values can be any valid YAML type (string, number, boolean, array, object, etc.)
 */
export interface Frontmatter {
  [key: string]: unknown;
}

/**
 * Result of parsing a markdown document with optional frontmatter
 */
export interface ParsedDocument {
  /** Parsed frontmatter key-value pairs (empty object if no frontmatter) */
  frontmatter: Frontmatter;
  /** Document body after the frontmatter (or full content if no frontmatter) */
  body: string;
}

/**
 * Parse YAML frontmatter from a markdown document.
 *
 * Frontmatter must be:
 * - At the very start of the document
 * - Enclosed in --- delimiters
 * - Valid YAML content
 *
 * @example
 * ```markdown
 * ---
 * title: My Document
 * tags:
 *   - typescript
 *   - opencode
 * ---
 * Document body here...
 * ```
 *
 * @param content - The full document content
 * @returns Parsed frontmatter and body
 */
export function parseFrontmatter(content: string): ParsedDocument {
  // Match frontmatter block at the start of the document
  // Supports both LF and CRLF line endings
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n)?([\s\S]*)$/);

  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const [, yamlContent, body] = match;

  try {
    const parsed = parseYaml(yamlContent ?? "");

    // Ensure we have an object (YAML could parse to null, string, number, etc.)
    const frontmatter: Frontmatter =
      parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
        ? (parsed as Frontmatter)
        : {};

    return {
      frontmatter,
      body: body ?? "",
    };
  } catch {
    // Invalid YAML - return empty frontmatter, treat full content as body
    return { frontmatter: {}, body: content };
  }
}
