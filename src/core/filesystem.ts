import { readdir, readFile, access } from "fs/promises";

/**
 * File system interface for dependency injection.
 * Provides a minimal subset of fs/promises needed by loaders and services.
 *
 * Note: All methods are included even though some consumers only use a subset.
 * This allows consistent mocking across the codebase.
 */
export interface FileSystem {
  readdir(
    path: string,
    options: { withFileTypes: true }
  ): Promise<{ name: string; isDirectory(): boolean; isFile(): boolean }[]>;
  readFile(path: string, encoding: BufferEncoding): Promise<string>;
  access(path: string): Promise<void>;
}

/**
 * Default file system implementation using Node's fs/promises.
 */
export const defaultFileSystem: FileSystem = {
  readdir: (path, options) => readdir(path, options),
  readFile: (path, encoding) => readFile(path, encoding),
  access: (path) => access(path),
};
