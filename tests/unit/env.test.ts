import { describe, expect, it, beforeEach, afterEach } from "bun:test";
import { isPluginDisabled, shouldAutoApproveBeads } from "../../src/config/env";

describe("Environment Variable Helpers", () => {
  // Store original env values to restore after tests
  let originalDisabled: string | undefined;
  let originalAutoApprove: string | undefined;

  beforeEach(() => {
    // Save original values
    originalDisabled = process.env["OPENCODE_CODER_DISABLED"];
    originalAutoApprove = process.env["BEADS_AUTO_APPROVE"];
    
    // Clear env vars before each test
    delete process.env["OPENCODE_CODER_DISABLED"];
    delete process.env["BEADS_AUTO_APPROVE"];
  });

  afterEach(() => {
    // Restore original values
    if (originalDisabled === undefined) {
      delete process.env["OPENCODE_CODER_DISABLED"];
    } else {
      process.env["OPENCODE_CODER_DISABLED"] = originalDisabled;
    }
    
    if (originalAutoApprove === undefined) {
      delete process.env["BEADS_AUTO_APPROVE"];
    } else {
      process.env["BEADS_AUTO_APPROVE"] = originalAutoApprove;
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

  describe("shouldAutoApproveBeads", () => {
    it("should return true by default when env var is not set", () => {
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should return false when BEADS_AUTO_APPROVE is 'false'", () => {
      process.env["BEADS_AUTO_APPROVE"] = "false";
      expect(shouldAutoApproveBeads()).toBe(false);
    });

    it("should return false when BEADS_AUTO_APPROVE is 'FALSE' (case-insensitive)", () => {
      process.env["BEADS_AUTO_APPROVE"] = "FALSE";
      expect(shouldAutoApproveBeads()).toBe(false);
    });

    it("should return false when BEADS_AUTO_APPROVE is 'False' (mixed case)", () => {
      process.env["BEADS_AUTO_APPROVE"] = "False";
      expect(shouldAutoApproveBeads()).toBe(false);
    });

    it("should return true when BEADS_AUTO_APPROVE is 'true'", () => {
      process.env["BEADS_AUTO_APPROVE"] = "true";
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should return true when BEADS_AUTO_APPROVE is 'TRUE' (case-insensitive)", () => {
      process.env["BEADS_AUTO_APPROVE"] = "TRUE";
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should return true when BEADS_AUTO_APPROVE is empty string", () => {
      process.env["BEADS_AUTO_APPROVE"] = "";
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should return true (default) when BEADS_AUTO_APPROVE is invalid value", () => {
      process.env["BEADS_AUTO_APPROVE"] = "invalid";
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should return true (default) when BEADS_AUTO_APPROVE is '0'", () => {
      process.env["BEADS_AUTO_APPROVE"] = "0";
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should trim whitespace from BEADS_AUTO_APPROVE value", () => {
      process.env["BEADS_AUTO_APPROVE"] = "  false  ";
      expect(shouldAutoApproveBeads()).toBe(false);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle both env vars set to true", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "true";
      process.env["BEADS_AUTO_APPROVE"] = "true";
      
      expect(isPluginDisabled()).toBe(true);
      expect(shouldAutoApproveBeads()).toBe(true);
    });

    it("should handle both env vars set to false", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "false";
      process.env["BEADS_AUTO_APPROVE"] = "false";
      
      expect(isPluginDisabled()).toBe(false);
      expect(shouldAutoApproveBeads()).toBe(false);
    });

    it("should handle mixed values", () => {
      process.env["OPENCODE_CODER_DISABLED"] = "true";
      process.env["BEADS_AUTO_APPROVE"] = "false";
      
      expect(isPluginDisabled()).toBe(true);
      expect(shouldAutoApproveBeads()).toBe(false);
    });
  });
});
