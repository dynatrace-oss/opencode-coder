import type { PermissionService } from "../../src/service/permission-service";
import type { PermissionAskInput, PermissionAskOutput } from "../../src/service/permission-service";

/**
 * Create a mock PermissionService for testing
 */
export function createMockPermissionService(): PermissionService {
  return {
    registerRule: () => {},
    processPermissionAsk: (input: PermissionAskInput, output: PermissionAskOutput) => {
      // Default: don't modify output (let OpenCode handle it)
    },
  } as PermissionService;
}
