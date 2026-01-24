import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { OpencodeCoder } from "../../src/index";
import { createMockPluginInput, asMockPluginInput } from "../helpers/mock-client";
import type { Config } from "@opencode-ai/sdk";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";

describe("Skill Loading Integration", () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    // Save original working directory
    originalCwd = process.cwd();

    // Create temp directory for this test
    tempDir = join("/tmp/opencode/ses_4147f0295ffe62tPYviytPdPDE", `test-skill-loading-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });

    // Change to temp directory
    process.chdir(tempDir);
  });

  afterEach(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temp directory
    try {
      await rm(tempDir, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe("skill loads from .opencode/skills/ directory", () => {
    it("should discover and register skill from .opencode/skills/", async () => {
      // Create skill directory structure
      const skillDir = join(tempDir, ".opencode/skills/test-skill");
      await mkdir(skillDir, { recursive: true });

      // Create SKILL.md
      const skillContent = `---
description: Test skill from .opencode
agent: test-agent
---

# Test Skill

This is a test skill template from .opencode/skills.`;

      await writeFile(join(skillDir, "SKILL.md"), skillContent, "utf-8");

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify command was registered
      expect(config.command).toBeDefined();
      expect(config.command!["skills/test-skill"]).toBeDefined();

      const command = config.command!["skills/test-skill"];
      expect(command.template).toContain("This is a test skill template");
      expect(command.description).toBe("Test skill from .opencode");
      expect(command.agent).toBe("test-agent");

      // Verify logs
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered") && log.message.includes("skills")
      );
      expect(registeredLog).toBeDefined();
    });
  });

  describe("skill loads from .claude/skills/ directory", () => {
    it("should discover and register skill from .claude/skills/", async () => {
      // Create skill directory structure
      const skillDir = join(tempDir, ".claude/skills/legacy-skill");
      await mkdir(skillDir, { recursive: true });

      // Create SKILL.md
      const skillContent = `---
description: Legacy skill from .claude
model: gpt-4
---

# Legacy Skill

This is a legacy skill from .claude/skills.`;

      await writeFile(join(skillDir, "SKILL.md"), skillContent, "utf-8");

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify command was registered
      expect(config.command).toBeDefined();
      expect(config.command!["skills/legacy-skill"]).toBeDefined();

      const command = config.command!["skills/legacy-skill"];
      expect(command.template).toContain("This is a legacy skill");
      expect(command.description).toBe("Legacy skill from .claude");
      expect(command.model).toBe("gpt-4");
    });
  });

  describe("multiple skills load correctly", () => {
    it("should load and register multiple skills from different directories", async () => {
      // Create 3 skills in different directories
      const skills = [
        {
          dir: ".opencode/skills/skill-one",
          name: "skills/skill-one",
          content: `---
description: First skill
---

Skill one template`,
        },
        {
          dir: ".opencode/skills/skill-two",
          name: "skills/skill-two",
          content: `---
description: Second skill
---

Skill two template`,
        },
        {
          dir: ".claude/skills/skill-three",
          name: "skills/skill-three",
          content: `---
description: Third skill
---

Skill three template`,
        },
      ];

      // Create all skill directories and files
      for (const skill of skills) {
        const skillDir = join(tempDir, skill.dir);
        await mkdir(skillDir, { recursive: true });
        await writeFile(join(skillDir, "SKILL.md"), skill.content, "utf-8");
      }

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify all 3 skills were registered
      expect(config.command).toBeDefined();
      expect(config.command!["skills/skill-one"]).toBeDefined();
      expect(config.command!["skills/skill-two"]).toBeDefined();
      expect(config.command!["skills/skill-three"]).toBeDefined();

      // Verify content
      expect(config.command!["skills/skill-one"].template).toContain("Skill one template");
      expect(config.command!["skills/skill-two"].template).toContain("Skill two template");
      expect(config.command!["skills/skill-three"].template).toContain("Skill three template");

      // Verify log message
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered 3 skills")
      );
      expect(registeredLog).toBeDefined();
    });
  });

  describe("invalid skill skipped gracefully", () => {
    it("should skip skill without description and log error, but load other skills", async () => {
      // Create one valid skill
      const validSkillDir = join(tempDir, ".opencode/skills/valid-skill");
      await mkdir(validSkillDir, { recursive: true });
      await writeFile(
        join(validSkillDir, "SKILL.md"),
        `---
description: Valid skill
---

Valid skill template`,
        "utf-8"
      );

      // Create one invalid skill (empty template body)
      const invalidSkillDir = join(tempDir, ".opencode/skills/invalid-skill");
      await mkdir(invalidSkillDir, { recursive: true });
      await writeFile(
        join(invalidSkillDir, "SKILL.md"),
        `---
description: Invalid skill
---

   
`, // Only whitespace
        "utf-8"
      );

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify valid skill was registered
      expect(config.command).toBeDefined();
      expect(config.command!["skills/valid-skill"]).toBeDefined();
      expect(config.command!["skills/valid-skill"].template).toContain("Valid skill template");

      // Verify invalid skill was skipped
      expect(config.command!["skills/invalid-skill"]).toBeUndefined();

      // Verify warning was logged
      const warnLog = mockInput.client.app.logs.find(
        (log) =>
          log.level === "warn" &&
          log.message.includes("Skipping skill invalid-skill") &&
          log.message.includes("empty template body")
      );
      expect(warnLog).toBeDefined();

      // Verify only 1 skill was registered (not 2)
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered 1 skills")
      );
      expect(registeredLog).toBeDefined();
    });

    it("should handle file read errors gracefully", async () => {
      // Create one valid skill
      const validSkillDir = join(tempDir, ".opencode/skills/working-skill");
      await mkdir(validSkillDir, { recursive: true });
      await writeFile(
        join(validSkillDir, "SKILL.md"),
        `Valid skill content`,
        "utf-8"
      );

      // Create directory without SKILL.md (will be skipped with debug log)
      const emptySkillDir = join(tempDir, ".opencode/skills/no-skill-md");
      await mkdir(emptySkillDir, { recursive: true });

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify valid skill was registered
      expect(config.command).toBeDefined();
      expect(config.command!["skills/working-skill"]).toBeDefined();

      // Verify skill without SKILL.md was skipped
      expect(config.command!["skills/no-skill-md"]).toBeUndefined();

      // Verify debug log about missing SKILL.md
      const debugLog = mockInput.client.app.logs.find(
        (log) =>
          log.level === "debug" &&
          log.message.includes("Skipping no-skill-md") &&
          log.message.includes("no SKILL.md found")
      );
      expect(debugLog).toBeDefined();
    });
  });

  describe("command name format is correct", () => {
    it("should use format 'skills/{dir-name}' not just '{dir-name}'", async () => {
      // Create skill with specific directory name
      const skillDir = join(tempDir, ".opencode/skills/my-custom-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `Skill template content`,
        "utf-8"
      );

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify command name includes 'skills/' prefix
      expect(config.command!["skills/my-custom-skill"]).toBeDefined();
      
      // Verify it's NOT registered without the prefix
      expect(config.command!["my-custom-skill"]).toBeUndefined();

      // Verify the debug log shows correct name
      const debugLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Discovered skill: skills/my-custom-skill")
      );
      expect(debugLog).toBeDefined();
    });

    it("should preserve directory name in command name", async () => {
      // Test with different naming patterns
      const skillNames = [
        "simple",
        "kebab-case-skill",
        "snake_case_skill",
        "CamelCaseSkill",
        "skill.with.dots",
      ];

      for (const skillName of skillNames) {
        const skillDir = join(tempDir, `.opencode/skills/${skillName}`);
        await mkdir(skillDir, { recursive: true });
        await writeFile(
          join(skillDir, "SKILL.md"),
          `Template for ${skillName}`,
          "utf-8"
        );
      }

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify all skills are registered with correct names
      for (const skillName of skillNames) {
        const commandName = `skills/${skillName}`;
        expect(config.command![commandName]).toBeDefined();
        expect(config.command![commandName].template).toContain(`Template for ${skillName}`);
      }
    });
  });

  describe("integration with config system", () => {
    it("should not override existing commands", async () => {
      // Create a skill
      const skillDir = join(tempDir, ".opencode/skills/new-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `New skill template`,
        "utf-8"
      );

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config with existing commands
      const config: Config = {
        command: {
          "existing/command": {
            template: "Existing command template",
            description: "Existing command",
          },
        },
      };
      await hooks.config?.(config);

      // Verify existing command is preserved
      expect(config.command!["existing/command"]).toBeDefined();
      expect(config.command!["existing/command"].template).toBe("Existing command template");

      // Verify new skill was added
      expect(config.command!["skills/new-skill"]).toBeDefined();
      expect(config.command!["skills/new-skill"].template).toContain("New skill template");
    });

    it("should work alongside knowledge base commands", async () => {
      // Create a skill
      const skillDir = join(tempDir, ".opencode/skills/test-skill");
      await mkdir(skillDir, { recursive: true });
      await writeFile(
        join(skillDir, "SKILL.md"),
        `Test skill`,
        "utf-8"
      );

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Should have both skills and knowledge base commands
      expect(config.command).toBeDefined();
      
      // Should have skill command
      expect(config.command!["skills/test-skill"]).toBeDefined();

      // Should have knowledge base commands (from real knowledge-base/)
      const allCommands = Object.keys(config.command!);
      const kbCommands = allCommands.filter((cmd) => !cmd.startsWith("skills/"));
      expect(kbCommands.length).toBeGreaterThan(0);
    });
  });

  describe("error logging for invalid skills", () => {
    it("should log error when skill file is corrupted but continue loading", async () => {
      // Create one valid skill
      const validDir = join(tempDir, ".opencode/skills/valid");
      await mkdir(validDir, { recursive: true });
      await writeFile(join(validDir, "SKILL.md"), `Valid template`, "utf-8");

      // Create skill directory structure but we'll test error handling
      // by creating a directory instead of a file for SKILL.md
      const corruptedDir = join(tempDir, ".opencode/skills/corrupted");
      await mkdir(corruptedDir, { recursive: true });
      // Create SKILL.md as a directory (not a file) to cause read error
      await mkdir(join(corruptedDir, "SKILL.md"), { recursive: true });

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify valid skill was loaded
      expect(config.command!["skills/valid"]).toBeDefined();

      // Verify corrupted skill was not loaded
      expect(config.command!["skills/corrupted"]).toBeUndefined();

      // Verify error was logged
      const errorLog = mockInput.client.app.logs.find(
        (log) =>
          log.level === "error" &&
          log.message.includes("Failed to load skill corrupted")
      );
      expect(errorLog).toBeDefined();

      // Verify only 1 skill was registered
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered 1 skills")
      );
      expect(registeredLog).toBeDefined();
    });
  });

  describe("full integration end-to-end", () => {
    it("should handle complete workflow from discovery to registration", async () => {
      // Create comprehensive test scenario
      const scenarios = [
        {
          path: ".opencode/skills/prod-skill",
          content: `---
description: Production skill
agent: production-agent
model: claude-3-opus-20240229
subtask: false
---

# Production Skill

This is a production-ready skill.`,
        },
        {
          path: ".claude/skills/legacy-skill",
          content: `---
description: Legacy skill
---

Legacy skill content`,
        },
        {
          path: ".opencode/skills/minimal-skill",
          content: `Minimal skill with no frontmatter`,
        },
      ];

      // Create all scenarios
      for (const scenario of scenarios) {
        const skillDir = join(tempDir, scenario.path);
        await mkdir(skillDir, { recursive: true });
        await writeFile(join(skillDir, "SKILL.md"), scenario.content, "utf-8");
      }

      // Also create an invalid one (empty body)
      const invalidDir = join(tempDir, ".opencode/skills/invalid");
      await mkdir(invalidDir, { recursive: true });
      await writeFile(join(invalidDir, "SKILL.md"), `---
description: Invalid
---

  
`, "utf-8");

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify all valid skills registered with correct properties
      expect(config.command!["skills/prod-skill"]).toBeDefined();
      expect(config.command!["skills/prod-skill"].description).toBe("Production skill");
      expect(config.command!["skills/prod-skill"].agent).toBe("production-agent");
      expect(config.command!["skills/prod-skill"].model).toBe("claude-3-opus-20240229");
      expect(config.command!["skills/prod-skill"].subtask).toBe(false);

      expect(config.command!["skills/legacy-skill"]).toBeDefined();
      expect(config.command!["skills/legacy-skill"].description).toBe("Legacy skill");

      expect(config.command!["skills/minimal-skill"]).toBeDefined();
      expect(config.command!["skills/minimal-skill"].description).toBeUndefined();

      // Verify invalid skill was skipped
      expect(config.command!["skills/invalid"]).toBeUndefined();

      // Verify correct count registered (3 valid)
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered 3 skills")
      );
      expect(registeredLog).toBeDefined();

      // Verify error logged for invalid skill
      const warnLog = mockInput.client.app.logs.find(
        (log) => log.level === "warn" && log.message.includes("Skipping skill invalid")
      );
      expect(warnLog).toBeDefined();
    });
  });

  describe("duplicate skill handling", () => {
    it("should deduplicate skills found in multiple locations (.opencode takes precedence)", async () => {
      // Create same skill in TWO locations (.opencode and .claude)
      const opencodeSkillDir = join(tempDir, ".opencode/skills/shared-skill");
      await mkdir(opencodeSkillDir, { recursive: true });
      await writeFile(
        join(opencodeSkillDir, "SKILL.md"),
        `---
description: Skill from .opencode (should win)
---

This is from .opencode/skills`,
        "utf-8"
      );

      const claudeSkillDir = join(tempDir, ".claude/skills/shared-skill");
      await mkdir(claudeSkillDir, { recursive: true });
      await writeFile(
        join(claudeSkillDir, "SKILL.md"),
        `---
description: Skill from .claude (should be skipped)
---

This is from .claude/skills`,
        "utf-8"
      );

      // Initialize plugin
      const mockInput = createMockPluginInput();
      const hooks = await OpencodeCoder(asMockPluginInput(mockInput));

      // Process config
      const config: Config = {};
      await hooks.config?.(config);

      // Verify skill was registered ONCE
      expect(config.command).toBeDefined();
      expect(config.command!["skills/shared-skill"]).toBeDefined();

      // Verify it used the .opencode version (first location wins)
      const command = config.command!["skills/shared-skill"];
      expect(command.template).toContain("This is from .opencode/skills");
      expect(command.description).toBe("Skill from .opencode (should win)");

      // Verify only 1 skill was registered (not 2)
      const registeredLog = mockInput.client.app.logs.find(
        (log) => log.message.includes("Registered 1 skills")
      );
      expect(registeredLog).toBeDefined();

      // Verify debug log for skipped duplicate
      const duplicateLog = mockInput.client.app.logs.find(
        (log) =>
          log.level === "debug" &&
          log.message.includes("Skipping duplicate skill") &&
          log.message.includes("shared-skill")
      );
      expect(duplicateLog).toBeDefined();
    });
  });
});
