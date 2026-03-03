import { describe, expect, it, beforeEach, afterEach, spyOn } from "bun:test";
import * as path from "path";
import * as fs from "fs";
import * as childProcess from "child_process";
import { ProjectDetectorService } from "../../../src/service/project-detector-service";
import type { ProjectContext } from "../../../src/service/project-detector-service";
import { createMockLogger, type MockLogger } from "../../helpers/mock-logger";

describe("ProjectDetectorService", () => {
  let mockLogger: MockLogger;
  let service: ProjectDetectorService;

  beforeEach(() => {
    mockLogger = createMockLogger();
    service = new ProjectDetectorService({
      logger: mockLogger,
      workdir: "/test/project",
    });
  });

  afterEach(() => {
    // Restore any spies
  });

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  describe("constructor", () => {
    it("should create service with custom workdir", () => {
      expect(service).toBeDefined();
    });

    it("should default to process.cwd() when no workdir given", () => {
      const defaultService = new ProjectDetectorService({ logger: mockLogger });
      expect(defaultService).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Git detection
  // ---------------------------------------------------------------------------

  describe("detectGitInitialized", () => {
    it("should return true when .git directory exists", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const result = service.detectGitInitialized();

      expect(result).toBe(true);
      expect(accessSyncSpy).toHaveBeenCalledWith("/test/project/.git", fs.constants.F_OK);
      accessSyncSpy.mockRestore();
    });

    it("should return false when .git directory is missing", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });

      const result = service.detectGitInitialized();

      expect(result).toBe(false);
      accessSyncSpy.mockRestore();
    });
  });

  describe("detectRemoteUrl", () => {
    it("should return origin URL when configured", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue(
        "https://github.com/user/repo.git\n" as any
      );

      const result = service.detectRemoteUrl();

      expect(result).toBe("https://github.com/user/repo.git");
      execSyncSpy.mockRestore();
    });

    it("should return null when no origin remote exists", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("fatal: No such remote 'origin'");
      });

      const result = service.detectRemoteUrl();

      expect(result).toBeNull();
      execSyncSpy.mockRestore();
    });

    it("should return null when remote URL is empty", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue("   \n" as any);

      const result = service.detectRemoteUrl();

      expect(result).toBeNull();
      execSyncSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Platform detection
  // ---------------------------------------------------------------------------

  describe("detectPlatform", () => {
    it("should detect github from HTTPS remote", () => {
      expect(service.detectPlatform("https://github.com/user/repo.git")).toBe("github");
    });

    it("should detect github from SSH remote", () => {
      expect(service.detectPlatform("git@github.com:user/repo.git")).toBe("github");
    });

    it("should detect bitbucket from bitbucket.org remote", () => {
      expect(service.detectPlatform("https://bitbucket.org/user/repo.git")).toBe("bitbucket");
    });

    it("should detect bitbucket from bitbucket.com remote", () => {
      expect(service.detectPlatform("https://user@bitbucket.com/user/repo.git")).toBe("bitbucket");
    });

    it("should detect gitlab from gitlab.com remote", () => {
      expect(service.detectPlatform("https://gitlab.com/user/repo.git")).toBe("gitlab");
    });

    it("should detect gitlab from self-hosted gitlab remote", () => {
      expect(service.detectPlatform("https://gitlab.mycompany.com/user/repo.git")).toBe("gitlab");
    });

    it("should return null for unknown remote", () => {
      expect(service.detectPlatform("https://codeberg.org/user/repo.git")).toBeNull();
    });

    it("should return null when remote is null", () => {
      expect(service.detectPlatform(null)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // Beads detection
  // ---------------------------------------------------------------------------

  describe("detectBeadsInitialized", () => {
    it("should return true when .beads directory exists", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const result = service.detectBeadsInitialized();

      expect(result).toBe(true);
      expect(accessSyncSpy).toHaveBeenCalledWith("/test/project/.beads", fs.constants.F_OK);
      accessSyncSpy.mockRestore();
    });

    it("should return false when .beads directory is missing", () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });

      const result = service.detectBeadsInitialized();

      expect(result).toBe(false);
      accessSyncSpy.mockRestore();
    });
  });

  describe("detectStealthMode", () => {
    it("should return true when stealth marker is in .git/info/exclude", () => {
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# opencode-coder stealth mode\n.coder/\n" as any
      );

      const result = service.detectStealthMode();

      expect(result).toBe(true);
      expect(readFileSyncSpy).toHaveBeenCalledWith("/test/project/.git/info/exclude", "utf-8");
      readFileSyncSpy.mockRestore();
    });

    it("should return false when stealth marker is absent", () => {
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# git ls-files --others --exclude-from=.git/info/exclude\n.DS_Store\n" as any
      );

      const result = service.detectStealthMode();

      expect(result).toBe(false);
      readFileSyncSpy.mockRestore();
    });

    it("should return false when .git/info/exclude cannot be read", () => {
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });

      const result = service.detectStealthMode();

      expect(result).toBe(false);
      readFileSyncSpy.mockRestore();
    });
  });

  describe("detectBdCliInstalled", () => {
    it("should return true when bd is on PATH", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => undefined as any);

      const result = service.detectBdCliInstalled();

      expect(result).toBe(true);
      execSyncSpy.mockRestore();
    });

    it("should return false when bd is not on PATH", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = service.detectBdCliInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // aimgr detection
  // ---------------------------------------------------------------------------

  describe("detectAimgrInstalled", () => {
    it("should return true when aimgr is on PATH", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => undefined as any);

      const result = service.detectAimgrInstalled();

      expect(result).toBe(true);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr is not on PATH", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = service.detectAimgrInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });
  });

  describe("detectPackageYaml", () => {
    it("should return true when ai.package.yaml exists", () => {
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true);

      const result = service.detectPackageYaml();

      expect(result).toBe(true);
      expect(existsSyncSpy).toHaveBeenCalledWith("/test/project/ai.package.yaml");
      existsSyncSpy.mockRestore();
    });

    it("should return false when ai.package.yaml is absent", () => {
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);

      const result = service.detectPackageYaml();

      expect(result).toBe(false);
      existsSyncSpy.mockRestore();
    });
  });

  describe("detectCoderPackageInstalled", () => {
    it("should return true when aimgr list returns the package", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue(
        JSON.stringify([{
          type: "package",
          name: "opencode-coder",
          description: "opencode-coder plugin toolkit",
          targets: [],
          sync_status: "in-sync",
          health: "ok",
        }]) as any
      );

      const result = service.detectCoderPackageInstalled();

      expect(result).toBe(true);
      expect(execSyncSpy).toHaveBeenCalledWith(
        'aimgr list "package/opencode-coder" --format json',
        { cwd: "/test/project", encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }
      );
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr list returns empty array", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue("[]" as any);

      const result = service.detectCoderPackageInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr list returns non-JSON (not found message)", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue(
        "No installed resources match pattern 'package/opencode-coder'.\n\nInstall resources with: aimgr install <resource>\n" as any
      );

      const result = service.detectCoderPackageInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr is not installed", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = service.detectCoderPackageInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr list returns malformed JSON", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockReturnValue("{broken" as any);

      const result = service.detectCoderPackageInstalled();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });
  });

  describe("detectResourcesHealthy", () => {
    it("should return false when aimgr is not installed", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("command not found");
      });

      const result = service.detectResourcesHealthy();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });

    it("should return true when aimgr verify reports healthy status", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") return "" as any;
        if (cmd === "aimgr verify --format json") return JSON.stringify({ status: "ok", issues: [] }) as any;
        return "" as any;
      });

      const result = service.detectResourcesHealthy();

      expect(result).toBe(true);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr verify reports issues", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") return "" as any;
        if (cmd === "aimgr verify --format json") {
          return JSON.stringify({ status: "ok", issues: [{ id: "missing-skill" }] }) as any;
        }
        return "" as any;
      });

      const result = service.detectResourcesHealthy();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });

    it("should return false when aimgr verify fails", () => {
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "command -v aimgr") return "" as any;
        throw new Error("verify failed");
      });

      const result = service.detectResourcesHealthy();

      expect(result).toBe(false);
      execSyncSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // Mode derivation
  // ---------------------------------------------------------------------------

  describe("deriveMode", () => {
    it("should return 'stealth' when stealthMode is true", () => {
      expect(service.deriveMode(true, true)).toBe("stealth");
      expect(service.deriveMode(false, true)).toBe("stealth");
    });

    it("should return 'team' when beads initialized but no stealth", () => {
      expect(service.deriveMode(true, false)).toBe("team");
    });

    it("should return 'uninitialized' when neither beads nor stealth", () => {
      expect(service.deriveMode(false, false)).toBe("uninitialized");
    });
  });

  // ---------------------------------------------------------------------------
  // Install readiness
  // ---------------------------------------------------------------------------

  describe("deriveInstallReady", () => {
    it("should return true when all prerequisites are met", () => {
      expect(service.deriveInstallReady(true, true, true, true)).toBe(true);
    });

    it("should return false when git is not initialized", () => {
      expect(service.deriveInstallReady(false, true, true, true)).toBe(false);
    });

    it("should return false when bd CLI is not installed", () => {
      expect(service.deriveInstallReady(true, false, true, true)).toBe(false);
    });

    it("should return false when aimgr is not installed", () => {
      expect(service.deriveInstallReady(true, true, false, true)).toBe(false);
    });

    it("should return false when coderPackageInstalled is false", () => {
      expect(service.deriveInstallReady(true, true, true, false)).toBe(false);
    });

    it("should return false when nothing is installed", () => {
      expect(service.deriveInstallReady(false, false, false, false)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // Ecosystem readiness
  // ---------------------------------------------------------------------------

  describe("deriveEcosystemReady", () => {
    it("should return true when all components are operational", () => {
      expect(service.deriveEcosystemReady(true, true, true, true, true)).toBe(true);
    });

    it("should return false when git is not initialized", () => {
      expect(service.deriveEcosystemReady(false, true, true, true, true)).toBe(false);
    });

    it("should return false when beads is not initialized", () => {
      expect(service.deriveEcosystemReady(true, false, true, true, true)).toBe(false);
    });

    it("should return false when aimgr is not installed", () => {
      expect(service.deriveEcosystemReady(true, true, false, true, true)).toBe(false);
    });

    it("should return false when ai.package.yaml is missing", () => {
      expect(service.deriveEcosystemReady(true, true, true, false, true)).toBe(false);
    });

    it("should return false when resources are not healthy", () => {
      expect(service.deriveEcosystemReady(true, true, true, true, false)).toBe(false);
    });

    it("should return false when nothing is installed", () => {
      expect(service.deriveEcosystemReady(false, false, false, false, false)).toBe(false);
    });
  });

  // ---------------------------------------------------------------------------
  // writeProjectContext
  // ---------------------------------------------------------------------------

  describe("writeProjectContext", () => {
    it("should create .coder/ directory and write project.yaml", () => {
      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      const context: ProjectContext = {
        mode: "team",
        installReady: false,
        ecosystemReady: false,
        git: { initialized: true, platform: "github", remote: "https://github.com/user/repo.git" },
        beads: { initialized: true, stealthMode: false, bdCliInstalled: false },
        aimgr: { installed: false, packageYaml: false, resourcesHealthy: false, coderPackageInstalled: false },
        detectedAt: "2026-03-02T00:00:00.000Z",
        pluginVersion: "1.0.0",
      };

      service.writeProjectContext(context);

      expect(mkdirSyncSpy).toHaveBeenCalledWith("/test/project/.coder", { recursive: true });
      expect(writeFileSyncSpy).toHaveBeenCalledWith(
        "/test/project/.coder/project.yaml",
        expect.stringContaining("mode: team"),
        "utf-8"
      );
      mkdirSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should create .coder/.gitignore with '*' when it does not exist", () => {
      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      // .gitignore does NOT exist
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);
      const calls: Array<[string, string]> = [];
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (p: any, data: any) => { calls.push([String(p), String(data)]); }
      );

      const context: ProjectContext = {
        mode: "team",
        installReady: false,
        ecosystemReady: false,
        git: { initialized: true, platform: null, remote: null },
        beads: { initialized: true, stealthMode: false, bdCliInstalled: false },
        aimgr: { installed: false, packageYaml: false, resourcesHealthy: false, coderPackageInstalled: false },
        detectedAt: "2026-03-02T00:00:00.000Z",
        pluginVersion: "1.0.0",
      };

      service.writeProjectContext(context);

      const gitignoreCall = calls.find(([p]) => p === "/test/project/.coder/.gitignore");
      expect(gitignoreCall).toBeDefined();
      expect(gitignoreCall![1]).toBe("*\n");

      expect(existsSyncSpy).toHaveBeenCalledWith("/test/project/.coder/.gitignore");

      mkdirSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should NOT overwrite .coder/.gitignore when it already exists", () => {
      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      // .gitignore already exists
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true);
      const calls: Array<[string, string]> = [];
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (p: any, data: any) => { calls.push([String(p), String(data)]); }
      );

      const context: ProjectContext = {
        mode: "team",
        installReady: false,
        ecosystemReady: false,
        git: { initialized: true, platform: null, remote: null },
        beads: { initialized: true, stealthMode: false, bdCliInstalled: false },
        aimgr: { installed: false, packageYaml: false, resourcesHealthy: false, coderPackageInstalled: false },
        detectedAt: "2026-03-02T00:00:00.000Z",
        pluginVersion: "1.0.0",
      };

      service.writeProjectContext(context);

      // .gitignore should NOT be written when it already exists
      const gitignoreCall = calls.find(([p]) => p === "/test/project/.coder/.gitignore");
      expect(gitignoreCall).toBeUndefined();

      mkdirSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should include all required fields in YAML output", () => {
      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const context: ProjectContext = {
        mode: "stealth",
        installReady: false,
        ecosystemReady: true,
        git: { initialized: true, platform: "gitlab", remote: "https://gitlab.com/u/r.git" },
        beads: { initialized: false, stealthMode: true, bdCliInstalled: true },
        aimgr: { installed: true, packageYaml: true, resourcesHealthy: true, coderPackageInstalled: true },
        detectedAt: "2026-03-02T00:00:00.000Z",
        pluginVersion: "2.3.4",
      };

      service.writeProjectContext(context);

      expect(writtenContent).toContain("mode: stealth");
      expect(writtenContent).toContain("ecosystemReady: true");
      expect(writtenContent).toContain("platform: gitlab");
      expect(writtenContent).toContain("stealthMode: true");
      expect(writtenContent).toContain("installed: true");
      expect(writtenContent).toContain("resourcesHealthy: true");
      expect(writtenContent).toContain("pluginVersion: 2.3.4");
      expect(writtenContent).toContain("bdCliInstalled: true");
      expect(writtenContent).toContain("coderPackageInstalled: true");
      expect(writtenContent).toContain("installReady: false");

      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });
  });

  // ---------------------------------------------------------------------------
  // detectAndWrite (integration of all detections)
  // ---------------------------------------------------------------------------

  describe("detectAndWrite", () => {
    const versionInfo = { name: "@hk9890/opencode-coder", version: "1.2.3" };

    it("should write context with team mode for initialized beads repo", async () => {
      // .git exists
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((p: any) => {
        // Allow .git and .beads, reject everything else
        if (String(p).endsWith(".git") || String(p).endsWith(".beads")) return undefined;
        throw new Error("ENOENT");
      });

      const readFileSyncSpy = spyOn(fs, "readFileSync").mockImplementation(() => {
        // No stealth marker
        return "# default excludes\n" as any;
      });

      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);

      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") return "https://github.com/user/repo.git\n" as any;
        // aimgr not available
        if (cmd === "command -v aimgr") throw new Error("not found");
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.mode).toBe("team");
      expect(result.ecosystemReady).toBe(false);
      expect(writtenContent).toContain("mode: team");
      expect(writtenContent).toContain("ecosystemReady: false");
      expect(writtenContent).toContain("initialized: true");
      expect(writtenContent).toContain("platform: github");
      expect(writtenContent).toContain("pluginVersion: 1.2.3");

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should write context with stealth mode when marker present", async () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# opencode-coder stealth mode\n.coder/\n" as any
      );

      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);

      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") return "git@github.com:user/repo.git\n" as any;
        if (cmd === "command -v aimgr") throw new Error("not found");
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.mode).toBe("stealth");
      expect(result.ecosystemReady).toBe(false);
      expect(writtenContent).toContain("mode: stealth");
      expect(writtenContent).toContain("stealthMode: true");

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should write context with uninitialized mode when no .beads", async () => {
      // .git exists, .beads does NOT
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((p: any) => {
        if (String(p).endsWith(".git")) return undefined;
        throw new Error("ENOENT");
      });

      const readFileSyncSpy = spyOn(fs, "readFileSync").mockImplementation(() => {
        return "# default\n" as any;
      });

      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);

      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") throw new Error("no origin");
        if (cmd === "command -v aimgr") throw new Error("not found");
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.mode).toBe("uninitialized");
      expect(result.ecosystemReady).toBe(false);
      expect(writtenContent).toContain("mode: uninitialized");

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should set ecosystemReady true when all components operational", async () => {
      // .git and .beads both exist
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      // No stealth marker
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# default excludes\n" as any
      );

      // ai.package.yaml exists
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true);

      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") return "https://github.com/user/repo.git\n" as any;
        if (cmd === "command -v aimgr") return "/usr/local/bin/aimgr" as any;
        if (cmd === "aimgr verify --format json") return JSON.stringify({ status: "ok", issues: [] }) as any;
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.ecosystemReady).toBe(true);
      expect(result.mode).toBe("team");
      expect(writtenContent).toContain("ecosystemReady: true");

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should set installReady true when all install prerequisites are met", async () => {
      // .git exists, .beads exists
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => undefined);

      // No stealth marker
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# no stealth marker\n" as any
      );

      // ai.package.yaml exists
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true);

      const aimgrListResult = JSON.stringify([{
        type: "package", name: "opencode-coder", description: "toolkit",
        targets: [], sync_status: "in-sync", health: "ok",
      }]);
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") return "https://github.com/user/repo.git\n" as any;
        if (cmd === "command -v bd") return "/usr/local/bin/bd" as any;
        if (cmd === "command -v aimgr") return "/usr/local/bin/aimgr" as any;
        if (cmd === "aimgr verify --format json") return JSON.stringify({ status: "ok", issues: [] }) as any;
        if (cmd === 'aimgr list "package/opencode-coder" --format json') return aimgrListResult as any;
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      let writtenContent = "";
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(
        (_p: any, data: any) => { writtenContent = data; }
      );

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.installReady).toBe(true);
      expect(result.beads.bdCliInstalled).toBe(true);
      expect(result.aimgr.coderPackageInstalled).toBe(true);
      expect(writtenContent).toContain("installReady: true");
      expect(writtenContent).toContain("bdCliInstalled: true");
      expect(writtenContent).toContain("coderPackageInstalled: true");

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should set installReady false when bd CLI is missing", async () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((p: any) => {
        if (String(p).endsWith(".git")) return undefined;
        throw new Error("ENOENT");
      });
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue(
        "# no stealth marker\n" as any
      );
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(true);
      const aimgrListResult = JSON.stringify([{
        type: "package", name: "opencode-coder", description: "toolkit",
        targets: [], sync_status: "in-sync", health: "ok",
      }]);
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "command -v bd") throw new Error("not found");
        if (cmd === "command -v aimgr") return "/usr/local/bin/aimgr" as any;
        if (cmd === "aimgr verify --format json") return JSON.stringify({ status: "ok", issues: [] }) as any;
        if (cmd === 'aimgr list "package/opencode-coder" --format json') return aimgrListResult as any;
        if (cmd === "git remote get-url origin") return "https://github.com/user/repo.git\n" as any;
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      const result = await service.detectAndWrite(versionInfo as any);

      expect(result.installReady).toBe(false);
      expect(result.beads.bdCliInstalled).toBe(false);

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should not call detectCoderPackageInstalled when aimgr is not installed", async () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation((p: any) => {
        if (String(p).endsWith(".git")) return undefined;
        throw new Error("ENOENT");
      });
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockReturnValue("# default\n" as any);
      // ai.package.yaml does NOT exist
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation((cmd: string) => {
        if (cmd === "git remote get-url origin") throw new Error("no origin");
        if (cmd === "command -v bd") return "/usr/local/bin/bd" as any;
        // aimgr is NOT installed
        if (cmd === "command -v aimgr") throw new Error("not found");
        return "" as any;
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      const result = await service.detectAndWrite(versionInfo as any);

      // coderPackageInstalled should be false since aimgr is not installed
      expect(result.aimgr.coderPackageInstalled).toBe(false);
      // installReady should be false since coderPackageInstalled is false
      expect(result.installReady).toBe(false);

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });

    it("should create .coder/ directory if it does not exist", async () => {
      const accessSyncSpy = spyOn(fs, "accessSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });
      const readFileSyncSpy = spyOn(fs, "readFileSync").mockImplementation(() => {
        throw new Error("ENOENT");
      });
      const existsSyncSpy = spyOn(fs, "existsSync").mockReturnValue(false);
      const execSyncSpy = spyOn(childProcess, "execSync").mockImplementation(() => {
        throw new Error("not found");
      });

      const mkdirSyncSpy = spyOn(fs, "mkdirSync").mockImplementation(() => undefined as any);
      const writeFileSyncSpy = spyOn(fs, "writeFileSync").mockImplementation(() => undefined);

      await service.detectAndWrite(versionInfo as any);

      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        path.join("/test/project", ".coder"),
        { recursive: true }
      );

      accessSyncSpy.mockRestore();
      readFileSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
      execSyncSpy.mockRestore();
      mkdirSyncSpy.mockRestore();
      writeFileSyncSpy.mockRestore();
    });
  });
});
