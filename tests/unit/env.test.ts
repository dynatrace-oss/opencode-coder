import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { isPluginDisabled } from "../../src/config/env";

describe("Environment Variable Helpers", () => {
  // Store original env values to restore after tests
  let originalDisabled: string | undefined;

  beforeEach(() => {
    // Save original values
    originalDisabled = process.env["OPENCODE_CODER_DISABLED"];

    // Clear env vars before each test
    delete process.env["OPENCODE_CODER_DISABLED"];
  });

  afterEach(() => {
    // Restore original values
    if (originalDisabled === undefined) {
      delete process.env["OPENCODE_CODER_DISABLED"];
    } else {
      process.env["OPENCODE_CODER_DISABLED"] = originalDisabled;
    }
  });

  describe("isPluginDisabled", () => {
    it("should return false by default when env var is not set", () => {
      expect(isPluginDisabled()).toBe(false);
    });

    it("should return true when OPENCODE_CODER_DISABLED is 'true'", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "true";
      expect(isPluginDisabled()).toBe(true);
    });

    it("should return true when OPENCODE_CODER_DISABLED is 'TRUE' (case-insensitive)", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "TRUE";
      expect(isPluginDisabled()).toBe(true);
    });

    it("should return true when OPENCODE_CODER_DISABLED is 'True' (mixed case)", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "True";
      expect(isPluginDisabled()).toBe(true);
    });

    it("should return false when OPENCODE_CODER_DISABLED is 'false'", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "false";
      expect(isPluginDisabled()).toBe(false);
    });

    it("should return false when OPENCODE_CODER_DISABLED is 'FALSE' (case-insensitive)", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "FALSE";
      expect(isPluginDisabled()).toBe(false);
    });

    it("should return false when OPENCODE_CODER_DISABLED is empty string", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "";
      expect(isPluginDisabled()).toBe(false);
    });

    it("should return false (default) when OPENCODE_CODER_DISABLED is invalid value", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "invalid";
      expect(isPluginDisabled()).toBe(false);
    });

    it("should return false (default) when OPENCODE_CODER_DISABLED is '1'", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "1";
      expect(isPluginDisabled()).toBe(false);
    });

    it("should trim whitespace from OPENCODE_CODER_DISABLED value", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "  true  ";
      expect(isPluginDisabled()).toBe(true);
    });
  });
});
