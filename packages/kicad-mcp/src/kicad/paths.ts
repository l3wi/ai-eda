/**
 * KiCad installation detection and path utilities
 */

import { existsSync } from 'fs';
import { homedir, platform } from 'os';
import { join } from 'path';

export interface KiCadPaths {
  bin: string;
  cli: string;
  libraries: string;
  templates: string;
  userLibraries: string;
}

/**
 * Detect KiCad installation paths based on platform
 */
export function detectKiCadPaths(): KiCadPaths | null {
  const os = platform();

  if (os === 'darwin') {
    return detectMacOSPaths();
  } else if (os === 'linux') {
    return detectLinuxPaths();
  } else if (os === 'win32') {
    return detectWindowsPaths();
  }

  return null;
}

function detectMacOSPaths(): KiCadPaths | null {
  const appPaths = [
    '/Applications/KiCad/KiCad.app',
    `${homedir()}/Applications/KiCad/KiCad.app`,
  ];

  for (const appPath of appPaths) {
    if (existsSync(appPath)) {
      return {
        bin: join(appPath, 'Contents/MacOS'),
        cli: join(appPath, 'Contents/MacOS/kicad-cli'),
        libraries: join(appPath, 'Contents/SharedSupport/symbols'),
        templates: join(appPath, 'Contents/SharedSupport/template'),
        userLibraries: join(homedir(), 'Documents/KiCad'),
      };
    }
  }

  return null;
}

function detectLinuxPaths(): KiCadPaths | null {
  const binPaths = [
    '/usr/bin/kicad-cli',
    '/usr/local/bin/kicad-cli',
    '/snap/bin/kicad-cli',
  ];

  for (const binPath of binPaths) {
    if (existsSync(binPath)) {
      return {
        bin: '/usr/bin',
        cli: binPath,
        libraries: '/usr/share/kicad/symbols',
        templates: '/usr/share/kicad/template',
        userLibraries: join(homedir(), '.local/share/kicad'),
      };
    }
  }

  return null;
}

function detectWindowsPaths(): KiCadPaths | null {
  const programFiles = process.env['ProgramFiles'] || 'C:\\Program Files';
  const appPath = join(programFiles, 'KiCad');

  if (existsSync(appPath)) {
    return {
      bin: join(appPath, 'bin'),
      cli: join(appPath, 'bin', 'kicad-cli.exe'),
      libraries: join(appPath, 'share', 'kicad', 'symbols'),
      templates: join(appPath, 'share', 'kicad', 'template'),
      userLibraries: join(homedir(), 'Documents', 'KiCad'),
    };
  }

  return null;
}

/**
 * Check if KiCad CLI is available
 */
export function isKiCadAvailable(): boolean {
  const paths = detectKiCadPaths();
  return paths !== null && existsSync(paths.cli);
}

/**
 * Get KiCad CLI path
 */
export function getKiCadCliPath(): string | null {
  const paths = detectKiCadPaths();
  return paths?.cli || null;
}
