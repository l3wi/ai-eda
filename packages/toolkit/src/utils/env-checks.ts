/**
 * Environment check utilities
 * Reusable functions for checking tool availability
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import { isKicadMcpInstalled } from '../commands/kicad-mcp.js';
import { isKicadSchMcpInstalled } from '../commands/kicad-sch-mcp.js';

export interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
  icon?: string;
}

/**
 * Get icon for check result status
 */
export function getStatusIcon(status: 'pass' | 'warn' | 'fail'): string {
  switch (status) {
    case 'pass':
      return '\u2713'; // checkmark
    case 'warn':
      return '\u26A0'; // warning
    case 'fail':
      return '\u2717'; // x
  }
}

/**
 * Get the KiCad configuration directory based on platform
 */
export function getKicadConfigDir(version: string = '9.0'): string {
  const home = homedir();
  const plat = platform();

  if (plat === 'darwin') {
    return join(home, 'Library', 'Preferences', 'kicad', version);
  } else if (plat === 'win32') {
    return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), 'kicad', version);
  } else {
    // Linux and others
    return join(home, '.config', 'kicad', version);
  }
}

/**
 * Check if KiCad IPC API is enabled
 */
export function checkKicadIpcEnabled(version: string = '9.0'): {
  enabled: boolean;
  configPath: string;
  exists: boolean;
} {
  const configDir = getKicadConfigDir(version);
  const configPath = join(configDir, 'kicad_common.json');

  if (!existsSync(configPath)) {
    return { enabled: false, configPath, exists: false };
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content);
    const enabled = config?.api?.enable_server === true;
    return { enabled, configPath, exists: true };
  } catch {
    return { enabled: false, configPath, exists: true };
  }
}

/**
 * Check KiCad installation
 */
export async function checkKiCad(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');

    // Try to find kicad-cli
    const paths = [
      '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli',
      '/usr/bin/kicad-cli',
      '/usr/local/bin/kicad-cli',
      'C:\\Program Files\\KiCad\\bin\\kicad-cli.exe',
    ];

    for (const p of paths) {
      if (existsSync(p)) {
        try {
          const version = execSync(`"${p}" --version`, { encoding: 'utf-8' }).trim();
          return {
            name: 'KiCad',
            status: 'pass',
            message: version,
          };
        } catch {
          continue;
        }
      }
    }

    // Try PATH
    try {
      const version = execSync('kicad-cli --version', {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
      return {
        name: 'KiCad',
        status: 'pass',
        message: version,
      };
    } catch {
      // Not found
    }

    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Not found. Install KiCad 8.0+',
    };
  } catch {
    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Could not check',
    };
  }
}

/**
 * Check KiCad IPC API status
 */
export function checkKicadIpc(): CheckResult {
  // Try multiple KiCad versions
  const versions = ['9.0', '8.0', '8.99'];

  for (const version of versions) {
    const { enabled, exists } = checkKicadIpcEnabled(version);

    if (exists) {
      if (enabled) {
        return {
          name: 'KiCad IPC API',
          status: 'pass',
          message: `Enabled (${version})`,
        };
      } else {
        return {
          name: 'KiCad IPC API',
          status: 'warn',
          message: 'Disabled (optional)',
        };
      }
    }
  }

  return {
    name: 'KiCad IPC API',
    status: 'warn',
    message: 'Not configured (optional)',
  };
}

/**
 * Check KiCad PCB MCP Server installation (mixelpixx/KiCAD-MCP-Server)
 */
export async function checkKicadMcp(): Promise<CheckResult> {
  const { installed, built } = isKicadMcpInstalled();

  if (built) {
    return {
      name: 'KiCad PCB MCP',
      status: 'pass',
      message: 'Installed (kicad-pcb)',
    };
  }

  if (installed) {
    return {
      name: 'KiCad PCB MCP',
      status: 'warn',
      message: 'Needs build. Run: ai-eda kicad-mcp --install',
    };
  }

  return {
    name: 'KiCad PCB MCP',
    status: 'warn',
    message: 'Not installed. Run: ai-eda kicad-mcp --install',
  };
}

/**
 * Check KiCad Schematic MCP Server installation (mcp-kicad-sch-api)
 */
export function checkKicadSchMcp(): CheckResult {
  const { installed } = isKicadSchMcpInstalled();

  if (installed) {
    return {
      name: 'KiCad Schematic MCP',
      status: 'pass',
      message: 'Installed (kicad-sch)',
    };
  }

  return {
    name: 'KiCad Schematic MCP',
    status: 'warn',
    message: 'Not installed. Run: ai-eda kicad-sch-mcp --install',
  };
}

/**
 * Check Node.js version
 */
export async function checkNode(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);

    if (major >= 18) {
      return {
        name: 'Node.js',
        status: 'pass',
        message: version,
      };
    } else {
      return {
        name: 'Node.js',
        status: 'warn',
        message: `${version} (v18+ recommended)`,
      };
    }
  } catch {
    return {
      name: 'Node.js',
      status: 'fail',
      message: 'Not found. Node.js 18+ is required.',
    };
  }
}

/**
 * Run all environment checks
 */
export async function runAllChecks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  results.push(await checkKiCad());
  results.push(checkKicadIpc());
  results.push(await checkKicadMcp());
  results.push(checkKicadSchMcp());
  results.push(await checkNode());

  // Add icons
  for (const r of results) {
    r.icon = getStatusIcon(r.status);
  }

  return results;
}
