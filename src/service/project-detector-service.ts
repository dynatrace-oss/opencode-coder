import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { stringify } from "yaml";
import type { Logger } from "../core/logger";
import type { VersionInfo } from "../core/version";

/**
 * Options for ProjectDetectorService
 */
export interface ProjectDetectorServiceOptions {
  /** Logger for reporting status and errors */
  logger: Logger;
  /** Working directory (defaults to process.cwd()) */
  workdir?: string;
}

/**
 * Detected project context written to .coder/project.yaml on every startup.
 */
export interface ProjectContext {
  /** Overall operational mode */
  mode: "stealth" | "team" | "uninitialized";

  /**
   * True when all ecosystem components are installed and operational:
   * git initialized, beads initialized, aimgr installed with package yaml,
   * and all declared resources healthy.
   *
   * Used by the plugin config hook to set the default agent to orchestrator.
   */
  ecosystemReady: boolean;

  /** Git repository information */
  git: {
    /** Whether a .git directory exists */
    initialized: boolean;
    /** Detected platform: 'github' | 'bitbucket' | 'gitlab' | null */
    platform: string | null;
    /** Origin remote URL, or null if not configured */
    remote: string | null;
  };

  /** Beads issue-tracker status */
  beads: {
    /** Whether .beads/ directory exists */
    initialized: boolean;
    /** Whether the stealth-mode marker is present in .git/info/exclude */
    stealthMode: boolean;
  };

  /** aimgr AI-resource-manager status */
  aimgr: {
    /** Whether the aimgr CLI is available on PATH */
    installed: boolean;
    /** Whether ai.package.yaml exists */
    packageYaml: boolean;
    /** Whether aimgr verify reports no issues (false when aimgr is not installed) */
    resourcesHealthy: boolean;
  };

  /** Detection metadata */
  detectedAt: string;
  /** Plugin version string */
  pluginVersion: string;
}

/**
 * Marker string embedded by `bd init --stealth` in .git/info/exclude.
 * We search for this line to determine whether the project is in stealth mode.
 */
const STEALTH_MARKER = "# opencode-coder stealth mode";

/**
 * Service that detects facts about the current project and writes them
 * to `.coder/project.yaml` on every plugin startup.
 *
 * All detection methods are synchronous filesystem / CLI checks that are
 * cheap enough to run on every startup without perceptible overhead.
 */
export class ProjectDetectorService {
  private readonly logger: Logger;
  private readonly workdir: string;

  constructor(options: ProjectDetectorServiceOptions) {
    this.logger = options.logger;
    this.workdir = options.workdir ?? process.cwd();
  }

  // ---------------------------------------------------------------------------
  // Git detection
  // ---------------------------------------------------------------------------

  /**
   * Check whether a .git directory exists in the working directory.
   */
  detectGitInitialized(): boolean {
    const gitDir = path.join(this.workdir, ".git");
    try {
      fs.accessSync(gitDir, fs.constants.F_OK);
      this.logger.debug("Git directory detected", { path: gitDir });
      return true;
    } catch {
      this.logger.debug("Git directory not found", { path: gitDir });
      return false;
    }
  }

  /**
   * Get the origin remote URL, or null if there is no origin remote.
   */
  detectRemoteUrl(): string | null {
    try {
      const output = execSync("git remote get-url origin", {
        cwd: this.workdir,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      this.logger.debug("Git remote URL detected", { remote: output });
      return output || null;
    } catch {
      this.logger.debug("No git remote origin found", { cwd: this.workdir });
      return null;
    }
  }

  /**
   * Detect the hosting platform from the remote URL.
   *
   * @returns 'github' | 'bitbucket' | 'gitlab' | null
   */
  detectPlatform(remoteUrl: string | null): string | null {
    if (!remoteUrl) return null;
    const url = remoteUrl.toLowerCase();
    if (url.includes("github.com")) return "github";
    if (url.includes("bitbucket.org") || url.includes("bitbucket.com")) return "bitbucket";
    if (url.includes("gitlab.com") || url.includes("gitlab.")) return "gitlab";
    return null;
  }

  // ---------------------------------------------------------------------------
  // Beads detection
  // ---------------------------------------------------------------------------

  /**
   * Check whether .beads/ directory exists.
   */
  detectBeadsInitialized(): boolean {
    const beadsDir = path.join(this.workdir, ".beads");
    try {
      fs.accessSync(beadsDir, fs.constants.F_OK);
      this.logger.debug("Beads directory detected", { path: beadsDir });
      return true;
    } catch {
      this.logger.debug("Beads directory not found", { path: beadsDir });
      return false;
    }
  }

  /**
   * Check whether the stealth-mode marker is present in .git/info/exclude.
   */
  detectStealthMode(): boolean {
    const excludeFile = path.join(this.workdir, ".git", "info", "exclude");
    try {
      const content = fs.readFileSync(excludeFile, "utf-8");
      const isStealthy = content.includes(STEALTH_MARKER);
      this.logger.debug("Stealth mode detection", { stealthMode: isStealthy });
      return isStealthy;
    } catch {
      this.logger.debug("Could not read .git/info/exclude, assuming no stealth mode");
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // aimgr detection
  // ---------------------------------------------------------------------------

  /**
   * Check whether the aimgr CLI is available on PATH.
   */
  detectAimgrInstalled(): boolean {
    try {
      execSync("command -v aimgr", { stdio: "ignore" });
      this.logger.debug("aimgr CLI is available");
      return true;
    } catch {
      this.logger.debug("aimgr CLI not found on PATH");
      return false;
    }
  }

  /**
   * Check whether ai.package.yaml exists in the working directory.
   */
  detectPackageYaml(): boolean {
    const packagePath = path.join(this.workdir, "ai.package.yaml");
    const exists = fs.existsSync(packagePath);
    this.logger.debug("Checking for ai.package.yaml", { path: packagePath, exists });
    return exists;
  }

  /**
   * Run `aimgr verify --format json` and return true when no issues are found.
   * Returns false when aimgr is not installed, the command fails, or issues exist.
   */
  detectResourcesHealthy(): boolean {
    if (!this.detectAimgrInstalled()) {
      this.logger.debug("aimgr not available, skipping resource health check");
      return false;
    }

    try {
      const stdout = execSync("aimgr verify --format json", { encoding: "utf-8" });
      const result = JSON.parse(stdout);
      const hasIssues =
        (Array.isArray(result.issues) && result.issues.length > 0) ||
        (Array.isArray(result.errors) && result.errors.length > 0) ||
        (result.error && result.error !== "") ||
        (result.status && result.status !== "ok" && result.status !== "healthy");
      this.logger.debug("aimgr verify completed", { healthy: !hasIssues });
      return !hasIssues;
    } catch (error) {
      this.logger.error("Failed to run aimgr verify", { error: String(error) });
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Mode derivation
  // ---------------------------------------------------------------------------

  /**
   * Derive the overall project mode from beads/stealth detection results.
   *
   * - stealth: stealth marker found in .git/info/exclude
   * - team: .beads/ exists but no stealth marker
   * - uninitialized: neither condition is met
   */
  deriveMode(beadsInitialized: boolean, stealthMode: boolean): "stealth" | "team" | "uninitialized" {
    if (stealthMode) return "stealth";
    if (beadsInitialized) return "team";
    return "uninitialized";
  }

  /**
   * Derive whether the full ecosystem is installed and operational.
   *
   * True when all of:
   * - git is initialized
   * - beads is initialized
   * - aimgr CLI is installed
   * - ai.package.yaml exists
   * - all declared resources are healthy (agents, commands, skills in sync)
   */
  deriveEcosystemReady(
    gitInitialized: boolean,
    beadsInitialized: boolean,
    aimgrInstalled: boolean,
    packageYaml: boolean,
    resourcesHealthy: boolean,
  ): boolean {
    return gitInitialized && beadsInitialized && aimgrInstalled && packageYaml && resourcesHealthy;
  }

  // ---------------------------------------------------------------------------
  // YAML writing
  // ---------------------------------------------------------------------------

  /**
   * Ensure `.coder/` exists and write `context` as YAML to `.coder/project.yaml`.
   */
  writeProjectContext(context: ProjectContext): void {
    const coderDir = path.join(this.workdir, ".coder");
    fs.mkdirSync(coderDir, { recursive: true });

    const outputPath = path.join(coderDir, "project.yaml");
    const yamlContent = stringify(context);
    fs.writeFileSync(outputPath, yamlContent, "utf-8");
    this.logger.debug("Project context written", { path: outputPath });
  }

  // ---------------------------------------------------------------------------
  // Main orchestration
  // ---------------------------------------------------------------------------

  /**
   * Detect all project facts, build a `ProjectContext` object, and write it
   * to `.coder/project.yaml`.
   *
   * This method is designed to be called from plugin startup. All errors
   * during individual detections are caught internally; the method itself
   * never throws.
   *
   * @returns The detected project context.
   */
  async detectAndWrite(versionInfo: VersionInfo): Promise<ProjectContext> {
    const start = Date.now();
    this.logger.debug("Starting project detection", { workdir: this.workdir });

    // Git
    const gitInitialized = this.detectGitInitialized();
    const remote = gitInitialized ? this.detectRemoteUrl() : null;
    const platform = this.detectPlatform(remote);

    // Beads
    const beadsInitialized = this.detectBeadsInitialized();
    const stealthMode = this.detectStealthMode();

    // aimgr
    const aimgrInstalled = this.detectAimgrInstalled();
    const packageYaml = this.detectPackageYaml();
    // Only check health when aimgr is installed (avoids double detection call)
    const resourcesHealthy = aimgrInstalled ? this.detectResourcesHealthy() : false;

    // Derived
    const mode = this.deriveMode(beadsInitialized, stealthMode);
    const ecosystemReady = this.deriveEcosystemReady(
      gitInitialized,
      beadsInitialized,
      aimgrInstalled,
      packageYaml,
      resourcesHealthy,
    );

    const context: ProjectContext = {
      mode,
      ecosystemReady,
      git: {
        initialized: gitInitialized,
        platform,
        remote,
      },
      beads: {
        initialized: beadsInitialized,
        stealthMode,
      },
      aimgr: {
        installed: aimgrInstalled,
        packageYaml,
        resourcesHealthy,
      },
      detectedAt: new Date().toISOString(),
      pluginVersion: versionInfo.version,
    };

    this.writeProjectContext(context);

    this.logger.debug("Project detection completed", {
      durationMs: Date.now() - start,
      mode,
      ecosystemReady,
    });

    return context;
  }
}
