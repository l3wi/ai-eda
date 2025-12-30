/**
 * KiCad Schematic MCP Server installation and management
 *
 * Handles installation of mcp-kicad-sch-api Python package
 * to ~/.claude-eda/kicad-sch-venv for use with Claude Code.
 *
 * Uses kicad-sch-api library for schematic file manipulation.
 * Source: https://github.com/circuit-synth/mcp-kicad-sch-api
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import chalk from 'chalk';
import ora from 'ora';

const KICAD_SCH_VENV_NAME = 'kicad-sch-venv';
const KICAD_SCH_PACKAGE = 'kicad-sch-api';

export interface KicadSchMcpPaths {
  baseDir: string;       // ~/.claude-eda
  venvDir: string;       // ~/.claude-eda/kicad-sch-venv
  pythonPath: string;    // ~/.claude-eda/kicad-sch-venv/bin/python (or Scripts/python.exe on Windows)
}

/**
 * Get the paths for the KiCad Schematic MCP installation
 */
export function getKicadSchMcpPaths(): KicadSchMcpPaths {
  const baseDir = join(homedir(), '.claude-eda');
  const venvDir = join(baseDir, KICAD_SCH_VENV_NAME);

  // Python path differs between Windows and Unix
  const isWindows = platform() === 'win32';
  const pythonPath = isWindows
    ? join(venvDir, 'Scripts', 'python.exe')
    : join(venvDir, 'bin', 'python');

  return { baseDir, venvDir, pythonPath };
}

/**
 * Check if uv is available in PATH
 */
async function isUvAvailable(): Promise<boolean> {
  const { execSync } = await import('child_process');
  try {
    execSync('uv --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the KiCad Schematic MCP server is installed
 */
export function isKicadSchMcpInstalled(): {
  installed: boolean;
  paths: KicadSchMcpPaths;
} {
  const paths = getKicadSchMcpPaths();
  const installed = existsSync(paths.venvDir) && existsSync(paths.pythonPath);

  return { installed, paths };
}

/**
 * Install the KiCad Schematic MCP server using uv
 */
export async function installKicadSchMcp(options: { verbose?: boolean } = {}): Promise<boolean> {
  const { execSync } = await import('child_process');
  const paths = getKicadSchMcpPaths();

  // Check uv is available
  if (!(await isUvAvailable())) {
    console.error(chalk.red('Error: uv is not installed or not in PATH'));
    console.error(chalk.dim('Install uv: https://docs.astral.sh/uv/getting-started/installation/'));
    return false;
  }

  // Ensure base directory exists
  if (!existsSync(paths.baseDir)) {
    mkdirSync(paths.baseDir, { recursive: true });
  }

  // Create virtual environment
  const venvSpinner = ora('Creating virtual environment...').start();
  try {
    if (existsSync(paths.venvDir)) {
      venvSpinner.text = 'Virtual environment already exists';
      venvSpinner.succeed('Virtual environment ready');
    } else {
      execSync(`uv venv "${paths.venvDir}" --python 3.10`, {
        cwd: paths.baseDir,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
      venvSpinner.succeed('Created virtual environment');
    }
  } catch (error) {
    venvSpinner.fail('Failed to create virtual environment');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Install mcp-kicad-sch-api package
  const installSpinner = ora(`Installing ${KICAD_SCH_PACKAGE}...`).start();
  try {
    execSync(`uv pip install ${KICAD_SCH_PACKAGE} --python "${paths.pythonPath}"`, {
      cwd: paths.baseDir,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });
    installSpinner.succeed(`Installed ${KICAD_SCH_PACKAGE}`);
  } catch (error) {
    installSpinner.fail(`Failed to install ${KICAD_SCH_PACKAGE}`);
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Verify installation by checking the kicad-sch-mcp command exists
  const verifySpinner = ora('Verifying installation...').start();
  try {
    const isWindows = platform() === 'win32';
    const mcpCommand = isWindows
      ? join(paths.venvDir, 'Scripts', 'kicad-sch-mcp.exe')
      : join(paths.venvDir, 'bin', 'kicad-sch-mcp');

    if (!existsSync(mcpCommand)) {
      throw new Error('kicad-sch-mcp command not found');
    }
    verifySpinner.succeed('Installation verified');
  } catch (error) {
    verifySpinner.fail('Installation verification failed');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  console.log('');
  console.log(chalk.green.bold('✓ KiCad Schematic MCP Server installed successfully'));
  console.log(chalk.dim(`  Virtual env: ${paths.venvDir}`));
  console.log(chalk.dim(`  Python: ${paths.pythonPath}`));
  console.log(chalk.dim(`  Package: ${KICAD_SCH_PACKAGE}`));
  console.log('');

  return true;
}

/**
 * Get the MCP configuration for the KiCad Schematic server
 */
export function getKicadSchMcpConfig(): { command: string; args: string[] } | null {
  const { installed, paths } = isKicadSchMcpInstalled();

  if (!installed) {
    return null;
  }

  // Use the kicad-sch-mcp entry point command
  const isWindows = platform() === 'win32';
  const mcpCommand = isWindows
    ? join(paths.venvDir, 'Scripts', 'kicad-sch-mcp.exe')
    : join(paths.venvDir, 'bin', 'kicad-sch-mcp');

  return {
    command: mcpCommand,
    args: [],
  };
}

/**
 * CLI command to install/update KiCad Schematic MCP
 */
export async function kicadSchMcpCommand(options: {
  install?: boolean;
  update?: boolean;
  status?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\nKiCad Schematic MCP Server Management\n'));

  const { installed, paths } = isKicadSchMcpInstalled();

  // Status check (default action)
  if (options.status || (!options.install && !options.update)) {
    console.log(`${chalk.dim('Virtual Env:')} ${paths.venvDir}`);
    console.log(`${chalk.dim('Installed:')} ${installed ? chalk.green('Yes') : chalk.red('No')}`);

    if (installed) {
      const isWindows = platform() === 'win32';
      const mcpCommand = isWindows
        ? join(paths.venvDir, 'Scripts', 'kicad-sch-mcp.exe')
        : join(paths.venvDir, 'bin', 'kicad-sch-mcp');
      console.log(`${chalk.dim('MCP Command:')} ${mcpCommand}`);
    }

    console.log('');

    if (!installed) {
      console.log(chalk.yellow('To install, run:'));
      console.log(chalk.cyan('  claude-eda kicad-sch-mcp --install'));
      console.log('');
    }

    return;
  }

  // Install or update
  if (options.install || options.update) {
    await installKicadSchMcp({ verbose: false });
    return;
  }
}
