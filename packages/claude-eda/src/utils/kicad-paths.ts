/**
 * KiCad path detection utilities
 */

import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';

/**
 * Get the KiCad projects directory if it exists
 * Returns null if not found
 */
export function getKicadProjectsDir(): string | null {
  const home = homedir();
  const plat = platform();

  // Platform-specific paths to check
  const possiblePaths: string[] = [];

  if (plat === 'darwin') {
    // macOS: Check versioned and non-versioned paths
    possiblePaths.push(
      join(home, 'Documents', 'KiCad', '9.0', 'projects'),
      join(home, 'Documents', 'KiCad', '8.0', 'projects'),
      join(home, 'Documents', 'KiCad', 'projects'),
    );
  } else if (plat === 'win32') {
    // Windows
    const docs = process.env.USERPROFILE
      ? join(process.env.USERPROFILE, 'Documents')
      : join(home, 'Documents');
    possiblePaths.push(
      join(docs, 'KiCad', '9.0', 'projects'),
      join(docs, 'KiCad', '8.0', 'projects'),
      join(docs, 'KiCad', 'projects'),
    );
  } else {
    // Linux and others
    possiblePaths.push(
      join(home, 'kicad', 'projects'),
      join(home, 'Documents', 'KiCad', 'projects'),
      join(home, '.local', 'share', 'kicad', 'projects'),
    );
  }

  // Return first existing path
  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

/**
 * Get KiCad version from installed path
 */
export function getKicadVersion(): string | null {
  const plat = platform();

  if (plat === 'darwin') {
    const appPath = '/Applications/KiCad/KiCad.app';
    if (existsSync(appPath)) {
      // Try to get version from Info.plist or just detect presence
      try {
        const { execSync } = require('child_process');
        const version = execSync(
          '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli --version',
          { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
        ).trim();
        return version;
      } catch {
        return null;
      }
    }
  }

  return null;
}

/**
 * Shorten a path for display by replacing home with ~
 */
export function shortenPath(path: string): string {
  const home = homedir();
  if (path.startsWith(home)) {
    return '~' + path.slice(home.length);
  }
  return path;
}

/**
 * Detect the installed KiCad major version (e.g., "9.0", "8.0")
 * Checks for existing version directories
 */
export function detectKicadMajorVersion(): string {
  const home = homedir();
  const plat = platform();
  const versions = ['9.0', '8.0'];

  let baseDir: string;
  if (plat === 'darwin' || plat === 'win32') {
    baseDir = join(home, 'Documents', 'KiCad');
  } else {
    baseDir = join(home, 'Documents', 'KiCad');
  }

  for (const version of versions) {
    if (existsSync(join(baseDir, version))) {
      return version;
    }
  }

  // Default to 9.0 if nothing found
  return '9.0';
}

/**
 * Get the KiCad user directory (e.g., ~/Documents/KiCad/9.0/)
 * Returns null if not found
 */
export function getKicadUserDir(): string | null {
  const home = homedir();
  const plat = platform();
  const version = detectKicadMajorVersion();

  let baseDir: string;
  if (plat === 'darwin' || plat === 'win32') {
    baseDir = join(home, 'Documents', 'KiCad', version);
  } else {
    baseDir = join(home, 'Documents', 'KiCad', version);
  }

  if (existsSync(baseDir)) {
    return baseDir;
  }

  return null;
}

/**
 * Get global library paths for the EDA-MCP library
 * These paths match kicad-sch-mcp's search pattern: ~/Documents/KiCad/{version}/symbols/*.kicad_sym
 */
export function getGlobalLibraryPaths(): {
  base: string;
  symbols: string;
  footprints: string;
  models3d: string;
  symbolFile: string;
  footprintDir: string;
  models3dDir: string;
} | null {
  const userDir = getKicadUserDir();
  if (!userDir) {
    return null;
  }

  const LIBRARY_NAME = 'EDA-MCP';

  return {
    base: userDir,
    symbols: join(userDir, 'symbols'),
    footprints: join(userDir, 'footprints'),
    models3d: join(userDir, '3dmodels'),
    // Full paths to our specific library files
    symbolFile: join(userDir, 'symbols', `${LIBRARY_NAME}.kicad_sym`),
    footprintDir: join(userDir, 'footprints', `${LIBRARY_NAME}.pretty`),
    models3dDir: join(userDir, '3dmodels', `${LIBRARY_NAME}.3dshapes`),
  };
}
