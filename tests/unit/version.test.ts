import { describe, expect, it } from "bun:test";
import { getVersionInfo } from "../../src/core/version";

describe("getVersionInfo", () => {
  it("should return version info from package.json", async () => {
    const info = await getVersionInfo();

    expect(info.name).toBe("@hk9890/opencode-coder");
    expect(info.version).toMatch(/^\d+\.\d+\.\d+/);
    expect(info.description).toBe("OpenCode plugin for story-driven development with agents and commands");
  });

  it("should return a valid semver version", async () => {
    const info = await getVersionInfo();

    // Basic semver pattern: major.minor.patch with optional prerelease
    const semverPattern = /^\d+\.\d+\.\d+(-[\w.]+)?(\+[\w.]+)?$/;
    expect(info.version).toMatch(semverPattern);
  });

  it("should return consistent results on multiple calls", async () => {
    const info1 = await getVersionInfo();
    const info2 = await getVersionInfo();

    expect(info1.name).toBe(info2.name);
    expect(info1.version).toBe(info2.version);
    expect(info1.description).toBe(info2.description);
  });
});
