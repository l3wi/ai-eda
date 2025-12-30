/**
 * KiCad IPC command - Enable/configure KiCad IPC API for real-time control
 *
 * The KiCad IPC API allows external applications to control KiCad in real-time.
 * Reference: https://dev-docs.kicad.org/en/apis-and-binding/ipc-api/
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import chalk from 'chalk';
import { getKicadConfigDir, checkKicadIpcEnabled } from './doctor.js';

export interface KicadIpcOptions {
  enable?: boolean;
  disable?: boolean;
  status?: boolean;
  version?: string;
}

interface KicadConfig {
  api?: {
    enable_server?: boolean;
    interpreter_path?: string;
  };
  [key: string]: unknown;
}

/**
 * Get the IPC socket path based on platform
 */
function getIpcSocketPath(): string {
  const plat = platform();

  if (plat === 'win32') {
    // Windows uses named pipes
    return '\\\\.\\pipe\\kicad\\api';
  } else {
    // macOS and Linux use Unix sockets
    return '/tmp/kicad/api.sock';
  }
}

/**
 * Find which KiCad version is installed
 */
function findKicadVersion(): string | null {
  const versions = ['9.0', '8.99', '8.0'];

  for (const version of versions) {
    const configDir = getKicadConfigDir(version);
    if (existsSync(configDir)) {
      return version;
    }
  }

  return null;
}

export async function kicadIpcCommand(options: KicadIpcOptions): Promise<void> {
  const version = options.version || findKicadVersion() || '9.0';
  const configDir = getKicadConfigDir(version);
  const configPath = join(configDir, 'kicad_common.json');

  // Status check
  if (options.status || (!options.enable && !options.disable)) {
    showStatus(version, configPath);
    return;
  }

  // Enable IPC
  if (options.enable) {
    await enableIpc(version, configDir, configPath);
    return;
  }

  // Disable IPC
  if (options.disable) {
    await disableIpc(version, configPath);
    return;
  }
}

function showStatus(version: string, configPath: string): void {
  console.log(chalk.bold('\nKiCad IPC API Status\n'));

  const { enabled, exists } = checkKicadIpcEnabled(version);

  console.log(`${chalk.dim('KiCad Version:')} ${version}`);
  console.log(`${chalk.dim('Config Path:')} ${configPath}`);
  console.log(`${chalk.dim('Config Exists:')} ${exists ? chalk.green('Yes') : chalk.yellow('No')}`);
  console.log(`${chalk.dim('IPC Enabled:')} ${enabled ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`${chalk.dim('Socket Path:')} ${getIpcSocketPath()}`);

  if (existsSync(getIpcSocketPath())) {
    console.log(`${chalk.dim('Socket Active:')} ${chalk.green('Yes (KiCad is running with IPC)')}`);
  } else {
    console.log(`${chalk.dim('Socket Active:')} ${chalk.dim('No (KiCad not running or IPC disabled)')}`);
  }

  console.log('');

  if (!enabled) {
    console.log(chalk.yellow('To enable IPC API, run:'));
    console.log(chalk.cyan('  claude-eda kicad-ipc --enable'));
    console.log('');
  }

  console.log(chalk.dim('Documentation: https://dev-docs.kicad.org/en/apis-and-binding/ipc-api/'));
  console.log('');
}

async function enableIpc(version: string, configDir: string, configPath: string): Promise<void> {
  console.log(chalk.bold('\nEnabling KiCad IPC API...\n'));

  // Create config directory if it doesn't exist
  if (!existsSync(configDir)) {
    console.log(chalk.dim(`Creating config directory: ${configDir}`));
    mkdirSync(configDir, { recursive: true });
  }

  // Load existing config or create new one
  let config: KicadConfig = {};
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf-8');
      config = JSON.parse(content);
      console.log(chalk.dim('Loaded existing configuration'));
    } catch (e) {
      console.log(chalk.yellow('Warning: Could not parse existing config, creating new one'));
    }
  }

  // Enable IPC API
  if (!config.api) {
    config.api = {};
  }
  config.api.enable_server = true;

  // Write config back
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green('✓ IPC API enabled in configuration'));
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log(chalk.dim('  1.'), 'Restart KiCad if it is currently running');
  console.log(chalk.dim('  2.'), 'The IPC socket will be available at:', chalk.cyan(getIpcSocketPath()));
  console.log('');
  console.log(chalk.dim('Note: KiCad must be running for the IPC API to be accessible.'));
  console.log('');
}

async function disableIpc(version: string, configPath: string): Promise<void> {
  console.log(chalk.bold('\nDisabling KiCad IPC API...\n'));

  if (!existsSync(configPath)) {
    console.log(chalk.yellow('KiCad configuration not found. Nothing to disable.'));
    return;
  }

  // Load existing config
  let config: KicadConfig = {};
  try {
    const content = readFileSync(configPath, 'utf-8');
    config = JSON.parse(content);
  } catch (e) {
    console.log(chalk.red('Error: Could not parse KiCad configuration'));
    return;
  }

  // Disable IPC API
  if (config.api) {
    config.api.enable_server = false;
  }

  // Write config back
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(chalk.green('✓ IPC API disabled in configuration'));
  console.log('');
  console.log(chalk.dim('Restart KiCad for changes to take effect.'));
  console.log('');
}
