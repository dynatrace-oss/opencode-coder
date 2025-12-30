import { describe, expect, it, beforeEach } from "bun:test";
import { TemplateService } from "../../src/template";
import type { KnowledgeBaseDefinition, BeadsDefinition } from "../../src/template";
import type { CoderConfig } from "../../src/config/schema";
import type { VersionInfo } from "../../src/core/version";
import { createMockLogger, type MockLogger } from "../helpers/mock-logger";

describe("TemplateService", () => {
  let mockLogger: MockLogger;
  let mockConfig: CoderConfig;
  let mockVersion: VersionInfo;

  beforeEach(() => {
    mockLogger = createMockLogger();
    mockConfig = { active: true };
    mockVersion = {
      name: "@hk9890/opencode-coder",
      version: "1.0.0",
      description: "Test plugin",
    };
  });

  describe("constructor", () => {
    it("should initialize with base context", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const context = service.getContext();
      expect(context.coder.config).toBe(mockConfig);
      expect(context.coder.version).toBe(mockVersion);
      expect(context.coder.cwd).toBe("/test/path");
    });

    it("should not have knowledgeBase in context initially", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const context = service.getContext();
      expect(context.knowledgeBase).toBeUndefined();
    });

    it("should not have beads in context initially", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const context = service.getContext();
      expect(context.beads).toBeUndefined();
    });
  });

  describe("render", () => {
    it("should render simple variable", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("Version: {{coder.version.version}}");
      expect(result).toBe("Version: 1.0.0");
    });

    it("should render nested object access", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("{{coder.version.name}} - {{coder.version.description}}");
      expect(result).toBe("@hk9890/opencode-coder - Test plugin");
    });

    it("should render conditional sections (truthy)", () => {
      const service = new TemplateService({
        config: { active: true },
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("{{#coder.config.active}}active{{/coder.config.active}}");
      expect(result).toBe("active");
    });

    it("should render conditional sections (falsy)", () => {
      const service = new TemplateService({
        config: { active: false },
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("{{#coder.config.active}}active{{/coder.config.active}}");
      expect(result).toBe("");
    });

    it("should render inverted sections", () => {
      const service = new TemplateService({
        config: { active: false },
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("{{^coder.config.active}}inactive{{/coder.config.active}}");
      expect(result).toBe("inactive");
    });

    it("should render template without variables unchanged", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const result = service.render("Plain text without variables");
      expect(result).toBe("Plain text without variables");
    });

    it("should warn about unresolved top-level variables", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      service.render("{{nonexistent}}");
      expect(mockLogger.hasLogged("warn", "nonexistent")).toBe(true);
    });

    it("should warn about unresolved nested variables", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      service.render("{{coder.nonexistent.field}}");
      expect(mockLogger.hasLogged("warn", "coder.nonexistent.field")).toBe(true);
    });
  });

  describe("registerKnowledgeBase", () => {
    it("should add knowledgeBase to context", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockKbDef: KnowledgeBaseDefinition = {
        commands: () => [
          { name: "test/cmd", template: "Test", description: "Test command" },
        ],
        agents: () => [
          { name: "test-agent", prompt: "Test prompt", description: "Test agent" },
        ],
      };

      service.registerKnowledgeBase(mockKbDef);

      const context = service.getContext();
      expect(context.knowledgeBase).toBeDefined();
      expect(context.knowledgeBase?.commandCount).toBe(1);
      expect(context.knowledgeBase?.agentCount).toBe(1);
      expect(context.knowledgeBase?.commands[0].name).toBe("test/cmd");
      expect(context.knowledgeBase?.agents[0].name).toBe("test-agent");
    });

    it("should allow rendering knowledgeBase data in templates", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockKbDef: KnowledgeBaseDefinition = {
        commands: () => [
          { name: "cmd1", template: "T1" },
          { name: "cmd2", template: "T2" },
        ],
        agents: () => [],
      };

      service.registerKnowledgeBase(mockKbDef);

      const result = service.render("Commands: {{knowledgeBase.commandCount}}");
      expect(result).toBe("Commands: 2");
    });

    it("should iterate over commands array", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockKbDef: KnowledgeBaseDefinition = {
        commands: () => [
          { name: "story/next", template: "T1" },
          { name: "bug/fix", template: "T2" },
        ],
        agents: () => [],
      };

      service.registerKnowledgeBase(mockKbDef);

      const result = service.render("{{#knowledgeBase.commands}}/{{name}} {{/knowledgeBase.commands}}");
      expect(result).toBe("/story/next /bug/fix ");
    });

    it("should log debug message on registration", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockKbDef: KnowledgeBaseDefinition = {
        commands: () => [{ name: "cmd1", template: "T" }],
        agents: () => [{ name: "agent1", prompt: "P" }],
      };

      service.registerKnowledgeBase(mockKbDef);

      expect(mockLogger.hasLogged("debug", "registered knowledge base")).toBe(true);
    });
  });

  describe("registerBeads", () => {
    it("should add beads to context", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockBeadsDef: BeadsDefinition = {
        enabled: () => true,
      };

      service.registerBeads(mockBeadsDef);

      const context = service.getContext();
      expect(context.beads).toBeDefined();
      expect(context.beads?.enabled).toBe(true);
    });

    it("should allow rendering beads data in templates (enabled)", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockBeadsDef: BeadsDefinition = {
        enabled: () => true,
      };

      service.registerBeads(mockBeadsDef);

      const result = service.render("{{#beads.enabled}}yes{{/beads.enabled}}{{^beads.enabled}}no{{/beads.enabled}}");
      expect(result).toBe("yes");
    });

    it("should allow rendering beads data in templates (disabled)", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockBeadsDef: BeadsDefinition = {
        enabled: () => false,
      };

      service.registerBeads(mockBeadsDef);

      const result = service.render("{{#beads.enabled}}yes{{/beads.enabled}}{{^beads.enabled}}no{{/beads.enabled}}");
      expect(result).toBe("no");
    });

    it("should log debug message on registration", () => {
      const service = new TemplateService({
        config: mockConfig,
        version: mockVersion,
        cwd: "/test/path",
        logger: mockLogger,
      });

      const mockBeadsDef: BeadsDefinition = {
        enabled: () => false,
      };

      service.registerBeads(mockBeadsDef);

      expect(mockLogger.hasLogged("debug", "registered beads")).toBe(true);
    });
  });

  describe("complex templates", () => {
    it("should render a complete status template", () => {
      const service = new TemplateService({
        config: { active: true },
        version: {
          name: "test-plugin",
          version: "2.0.0",
          description: "A test plugin",
        },
        cwd: "/project",
        logger: mockLogger,
      });

      service.registerKnowledgeBase({
        commands: () => [
          { name: "story/next", template: "T", description: "Next story" },
          { name: "bug/fix", template: "T", description: "Fix bug" },
        ],
        agents: () => [
          { name: "reviewer", prompt: "P", description: "Reviews code" },
        ],
      });

      service.registerBeads({
        enabled: () => true,
      });

      const template = `
**{{coder.version.name}}** v{{coder.version.version}}

Status: {{#coder.config.active}}active{{/coder.config.active}}
Beads: {{#beads.enabled}}enabled{{/beads.enabled}}

Commands ({{knowledgeBase.commandCount}}):
{{#knowledgeBase.commands}}
- /{{name}}: {{description}}
{{/knowledgeBase.commands}}

Agents ({{knowledgeBase.agentCount}}):
{{#knowledgeBase.agents}}
- @{{name}}: {{description}}
{{/knowledgeBase.agents}}
`.trim();

      const result = service.render(template);

      expect(result).toContain("**test-plugin** v2.0.0");
      expect(result).toContain("Status: active");
      expect(result).toContain("Beads: enabled");
      expect(result).toContain("Commands (2):");
      expect(result).toContain("/story/next: Next story");
      expect(result).toContain("/bug/fix: Fix bug");
      expect(result).toContain("Agents (1):");
      expect(result).toContain("@reviewer: Reviews code");
    });
  });
});
