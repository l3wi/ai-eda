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
