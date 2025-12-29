/**
 * Doctor command - Check environment setup
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import chalk from 'chalk';
import {
  isKicadMcpInstalled,
  checkPythonDependencies,
  installKicadMcp,
  configureGlobalMcp,
  getKicadMcpPaths,
} from './kicad-mcp.js';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
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
export function checkKicadIpcEnabled(version: string = '9.0'): { enabled: boolean; configPath: string; exists: boolean } {
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

export interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
}

export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  console.log(chalk.bold('\nChecking AI-EDA environment...\n'));

  const results: CheckResult[] = [];

  // Check KiCad
  results.push(await checkKiCad());

  // Check KiCad IPC API
  results.push(checkKicadIpc());

  // Check KiCad MCP Server
  const mcpResult = await checkKicadMcp();
  results.push(mcpResult);

  // Check Python dependencies for KiCad MCP
  results.push(await checkKicadMcpPython());

  // Check Bun
  results.push(await checkBun());

  // Check Node/npm (for npx)
  results.push(await checkNode());

  // Check current project structure
  results.push(checkProjectStructure());

  // Print results
  for (const result of results) {
    let icon: string;
    let coloredMessage: string;

    if (result.status === 'pass') {
      icon = chalk.green('✓');
      coloredMessage = chalk.dim(result.message);
    } else if (result.status === 'warn') {
      icon = chalk.yellow('⚠');
      coloredMessage = chalk.yellow(result.message);
    } else {
      icon = chalk.red('✗');
      coloredMessage = chalk.red(result.message);
    }

    console.log(`${icon} ${chalk.bold(result.name)}: ${coloredMessage}`);
  }

  const failures = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warn');

  console.log('');
  if (failures.length > 0) {
    console.log(chalk.red.bold(`${failures.length} check(s) failed`));
  }
  if (warnings.length > 0) {
    console.log(chalk.yellow(`${warnings.length} warning(s)`));
  }
  if (failures.length === 0 && warnings.length === 0) {
    console.log(chalk.green.bold('All checks passed!'));
  }
  console.log('');

  // Handle --fix option
  if (options.fix) {
    const needsMcpInstall = mcpResult.status !== 'pass';

    if (needsMcpInstall) {
      console.log(chalk.bold('Attempting to fix issues...\n'));

      console.log(chalk.cyan('Installing KiCad MCP Server...'));
      const success = await installKicadMcp({ verbose: options.verbose });

      if (success) {
        console.log(chalk.cyan('Configuring global Claude config...'));
        if (configureGlobalMcp()) {
          console.log(chalk.green('✓ Global Claude MCP config updated'));
        }
      }
    } else {
      console.log(chalk.dim('No automatic fixes needed.'));
    }
    console.log('');
  } else if (mcpResult.status !== 'pass') {
    console.log(chalk.dim('Run with --fix to automatically install missing components:'));
    console.log(chalk.cyan('  ai-eda doctor --fix'));
    console.log('');
  }
}

async function checkKicadMcp(): Promise<CheckResult> {
  const { installed, built, paths } = isKicadMcpInstalled();

  if (built) {
    return {
      name: 'KiCad MCP Server',
      status: 'pass',
      message: `Installed at ${paths.mcpDir}`,
    };
  }

  if (installed) {
    return {
      name: 'KiCad MCP Server',
      status: 'warn',
      message: 'Installed but not built. Run "ai-eda doctor --fix" to rebuild.',
    };
  }

  return {
    name: 'KiCad MCP Server',
    status: 'warn',
    message: 'Not installed. Run "ai-eda doctor --fix" to install.',
  };
}

async function checkKicadMcpPython(): Promise<CheckResult> {
  const { installed, missing } = await checkPythonDependencies();

  if (installed) {
    return {
      name: 'KiCad MCP Python Deps',
      status: 'pass',
      message: 'kicad-skip, Pillow, cairosvg, pydantic installed',
    };
  }

  return {
    name: 'KiCad MCP Python Deps',
    status: 'warn',
    message: `Missing: ${missing.join(', ')}. Run "ai-eda doctor --fix" to install.`,
  };
}

function checkKicadIpc(): CheckResult {
  // Try multiple KiCad versions
  const versions = ['9.0', '8.0', '8.99'];

  for (const version of versions) {
    const { enabled, configPath, exists } = checkKicadIpcEnabled(version);

    if (exists) {
      if (enabled) {
        return {
          name: 'KiCad IPC API',
          status: 'pass',
          message: `Enabled (KiCad ${version})`,
        };
      } else {
        return {
          name: 'KiCad IPC API',
          status: 'warn',
          message: `Disabled. Run "ai-eda kicad-ipc enable" to enable real-time control.`,
        };
      }
    }
  }

  return {
    name: 'KiCad IPC API',
    status: 'warn',
    message: 'KiCad config not found. Install KiCad 9.0+ for IPC API support.',
  };
}

async function checkKiCad(): Promise<CheckResult> {
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
            message: `Found at ${p} (${version})`,
          };
        } catch {
          continue;
        }
      }
    }

    // Try PATH
    try {
      const version = execSync('kicad-cli --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      return {
        name: 'KiCad',
        status: 'pass',
        message: `Found in PATH (${version})`,
      };
    } catch {
      // Not found
    }

    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Not found. Install KiCad 8.0+ for full functionality.',
    };
  } catch {
    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Could not check. Install KiCad 8.0+ for full functionality.',
    };
  }
}

async function checkBun(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    const version = execSync('bun --version', { encoding: 'utf-8' }).trim();
    return {
      name: 'Bun',
      status: 'pass',
      message: `v${version}`,
    };
  } catch {
    return {
      name: 'Bun',
      status: 'warn',
      message: 'Not found. Bun is recommended but not required.',
    };
  }
}

async function checkNode(): Promise<CheckResult> {
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

function checkProjectStructure(): CheckResult {
  const cwd = process.cwd();

  // Check if we're in a project directory
  if (existsSync(join(cwd, 'CLAUDE.md')) || existsSync(join(cwd, '.mcp.json'))) {
    const hasClaude = existsSync(join(cwd, '.claude'));
    const hasHardware = existsSync(join(cwd, 'hardware'));

    if (hasClaude && hasHardware) {
      return {
        name: 'Project Structure',
        status: 'pass',
        message: 'Valid AI-EDA project detected',
      };
    } else {
      return {
        name: 'Project Structure',
        status: 'warn',
        message: 'Partial project structure. Run "ai-eda init" to create a new project.',
      };
    }
  }

  return {
    name: 'Project Structure',
    status: 'warn',
    message: 'Not in an AI-EDA project. Use "ai-eda init <name>" to create one.',
  };
}
