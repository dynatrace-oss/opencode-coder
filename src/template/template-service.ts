import Mustache from "mustache";
import type { Logger } from "../core/logger";
import type {
  TemplateContext,
  TemplateServiceOptions,
  KnowledgeBaseDefinition,
  BeadsDefinition,
} from "./types";

// Disable HTML escaping since we're not generating HTML
// This prevents "/" from becoming "&#x2F;" etc.
Mustache.escape = (text: string) => text;

/**
 * Service for rendering Mustache templates with dynamic context data.
 *
 * The context is built incrementally via register functions:
 * - Base context (coder.config, coder.version, coder.cwd) set in constructor
 * - registerKnowledgeBase() adds knowledgeBase.* data
 * - registerBeads() adds beads.* data
 */
export class TemplateService {
  private context: TemplateContext;
  private logger: Logger;

  constructor(options: TemplateServiceOptions) {
    this.logger = options.logger;
    this.context = {
      coder: {
        config: options.config,
        version: options.version,
        cwd: options.cwd,
      },
    };
  }

  /**
   * Register a knowledge base definition to make its data available in templates.
   * After calling this, templates can access {{knowledgeBase.commands}}, etc.
   */
  registerKnowledgeBase(definition: KnowledgeBaseDefinition): void {
    const commands = definition.commands();
    const agents = definition.agents();

    this.context.knowledgeBase = {
      commands,
      agents,
      commandCount: commands.length,
      agentCount: agents.length,
    };

    this.logger.debug("TemplateService: registered knowledge base", {
      commandCount: commands.length,
      agentCount: agents.length,
    });
  }

  /**
   * Register beads definition to make its data available in templates.
   * After calling this, templates can access {{beads.enabled}}, etc.
   */
  registerBeads(definition: BeadsDefinition): void {
    this.context.beads = {
      enabled: definition.enabled(),
    };

    this.logger.debug("TemplateService: registered beads", {
      enabled: this.context.beads.enabled,
    });
  }

  /**
   * Render a Mustache template string with the current context.
   * Logs warnings for any unresolved template variables.
   *
   * @param templateStr - The template string with {{variable}} placeholders
   * @returns The rendered string
   */
  render(templateStr: string): string {
    // Check for unresolved variables before rendering
    this.warnUnresolvedVariables(templateStr);

    return Mustache.render(templateStr, this.context);
  }

  /**
   * Warn about template variables that don't exist in the context.
   * This helps catch typos and missing registrations.
   */
  private warnUnresolvedVariables(templateStr: string): void {
    // Parse the template to get the AST
    const tokens = Mustache.parse(templateStr);

    const checkToken = (token: Mustache.TemplateSpans[number], path: string[] = []): void => {
      const type = token[0];
      const name = token[1];

      // Types: 'name' = {{var}}, '#' = {{#section}}, '^' = {{^inverted}}
      if (type === "name" || type === "#" || type === "^") {
        const fullPath = path.length > 0 ? `${path.join(".")}.${name}` : name;

        // For sections iterating over arrays, we check the array exists
        // For simple variables, we check the value exists
        if (!this.resolveValue(fullPath)) {
          this.logger.warn(`Template variable not found: {{${fullPath}}}`);
        }
      }

      // Recurse into sections (token[4] contains nested tokens)
      if ((type === "#" || type === "^") && Array.isArray(token[4])) {
        // When inside a section that iterates over an array,
        // the context changes to the array item, so we don't append the section name to path
        // for child lookups. However, we still want to warn about the section itself.
        for (const childToken of token[4]) {
          // Inside sections, variables might reference array item properties
          // We can't fully validate these without knowing the array item structure
          // So we only check top-level path for sections
          checkToken(childToken, []);
        }
      }
    };

    for (const token of tokens) {
      checkToken(token);
    }
  }

  /**
   * Check if a dotted path resolves to a value in the context.
   */
  private resolveValue(path: string): boolean {
    const parts = path.split(".");
    let current: unknown = this.context;

    for (const part of parts) {
      if (current === undefined || current === null) {
        return false;
      }
      if (typeof current !== "object") {
        return false;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current !== undefined;
  }

  /**
   * Get the current context (for testing/debugging purposes).
   */
  getContext(): TemplateContext {
    return this.context;
  }
}
