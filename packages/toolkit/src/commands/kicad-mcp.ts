/**
 * KiCad MCP Server installation and management
 *
 * Handles installation of the external mixelpixx/KiCAD-MCP-Server
 * to ~/.ai-eda/kicad-mcp for use with Claude Code.
 *
 * Uses UV for Python dependency management in an isolated venv.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import chalk from 'chalk';
import ora from 'ora';

const KICAD_MCP_REPO = 'https://github.com/mixelpixx/KiCAD-MCP-Server.git';
const KICAD_MCP_DIR_NAME = 'kicad-mcp';
const PYTHON_DEPS = ['kicad-skip', 'Pillow', 'cairosvg', 'pydantic'];

export interface KicadMcpPaths {
  baseDir: string;       // ~/.ai-eda
  mcpDir: string;        // ~/.ai-eda/kicad-mcp
  distDir: string;       // ~/.ai-eda/kicad-mcp/dist
  entryPoint: string;    // ~/.ai-eda/kicad-mcp/dist/index.js
  venvDir: string;       // ~/.ai-eda/kicad-mcp/.venv
  venvPython: string;    // ~/.ai-eda/kicad-mcp/.venv/bin/python
}

/**
 * Get the paths for the KiCad MCP installation
 */
export function getKicadMcpPaths(): KicadMcpPaths {
  const baseDir = join(homedir(), '.ai-eda');
  const mcpDir = join(baseDir, KICAD_MCP_DIR_NAME);
  const distDir = join(mcpDir, 'dist');
  const entryPoint = join(distDir, 'index.js');
  const venvDir = join(mcpDir, '.venv');
  const isWindows = platform() === 'win32';
  const venvPython = isWindows
    ? join(venvDir, 'Scripts', 'python.exe')
    : join(venvDir, 'bin', 'python');

  return { baseDir, mcpDir, distDir, entryPoint, venvDir, venvPython };
}

/**
 * Check if UV is installed
 */
export async function isUvInstalled(): Promise<boolean> {
  try {
    const { execSync } = await import('child_process');
    execSync('uv --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if the KiCad MCP server is installed and built
 */
export function isKicadMcpInstalled(): {
  installed: boolean;
  built: boolean;
  hasVenv: boolean;
  paths: KicadMcpPaths
} {
  const paths = getKicadMcpPaths();
  const installed = existsSync(paths.mcpDir) && existsSync(join(paths.mcpDir, 'package.json'));
  const built = installed && existsSync(paths.entryPoint);
  const hasVenv = existsSync(paths.venvPython);

  return { installed, built, hasVenv, paths };
}

/**
 * Check if Python dependencies are installed in the venv
 */
export async function checkPythonDependencies(): Promise<{ installed: boolean; missing: string[] }> {
  const { hasVenv, paths } = isKicadMcpInstalled();

  if (!hasVenv) {
    return { installed: false, missing: ['venv not created'] };
  }

  const missing: string[] = [];

  try {
    const { execSync } = await import('child_process');

    for (const pkg of PYTHON_DEPS) {
      try {
        // Use uv pip show to check if package is installed in the venv
        execSync(`uv pip show ${pkg} --python "${paths.venvPython}"`, {
          stdio: 'pipe',
          cwd: paths.mcpDir,
        });
      } catch {
        missing.push(pkg);
      }
    }

    return { installed: missing.length === 0, missing };
  } catch {
    return { installed: false, missing: ['could not check venv'] };
  }
}

/**
 * Install UV if not present (provides instructions)
 */
export async function ensureUvInstalled(options: { verbose?: boolean } = {}): Promise<boolean> {
  if (await isUvInstalled()) {
    return true;
  }

  console.log(chalk.yellow('\nUV is not installed. UV is required for Python dependency management.'));
  console.log(chalk.dim('\nInstall UV with one of these methods:\n'));

  const plat = platform();
  if (plat === 'darwin' || plat === 'linux') {
    console.log(chalk.cyan('  curl -LsSf https://astral.sh/uv/install.sh | sh'));
    console.log(chalk.dim('  or'));
    console.log(chalk.cyan('  brew install uv'));
  } else if (plat === 'win32') {
    console.log(chalk.cyan('  powershell -c "irm https://astral.sh/uv/install.ps1 | iex"'));
    console.log(chalk.dim('  or'));
    console.log(chalk.cyan('  winget install astral-sh.uv'));
  }

  console.log(chalk.dim('\nThen run this command again.\n'));
  return false;
}

/**
 * Install the KiCad MCP server from GitHub
 */
export async function installKicadMcp(options: { verbose?: boolean } = {}): Promise<boolean> {
  // Check UV first
  if (!await ensureUvInstalled(options)) {
    return false;
  }

  const { execSync } = await import('child_process');
  const { paths } = isKicadMcpInstalled();

  // Ensure base directory exists
  if (!existsSync(paths.baseDir)) {
    mkdirSync(paths.baseDir, { recursive: true });
  }

  // Clone repository
  const cloneSpinner = ora('Cloning KiCAD-MCP-Server...').start();
  try {
    if (existsSync(paths.mcpDir)) {
      cloneSpinner.text = 'Updating existing installation...';
      execSync('git pull origin main', {
        cwd: paths.mcpDir,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
      cloneSpinner.succeed('Updated KiCAD-MCP-Server');
    } else {
      execSync(`git clone ${KICAD_MCP_REPO} ${KICAD_MCP_DIR_NAME}`, {
        cwd: paths.baseDir,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
      cloneSpinner.succeed('Cloned KiCAD-MCP-Server');
    }
  } catch (error) {
    cloneSpinner.fail('Failed to clone repository');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Install npm dependencies
  const npmSpinner = ora('Installing npm dependencies...').start();
  try {
    execSync('npm install', {
      cwd: paths.mcpDir,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });
    npmSpinner.succeed('Installed npm dependencies');
  } catch (error) {
    npmSpinner.fail('Failed to install npm dependencies');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Build the project
  const buildSpinner = ora('Building KiCAD-MCP-Server...').start();
  try {
    execSync('npm run build', {
      cwd: paths.mcpDir,
      stdio: options.verbose ? 'inherit' : 'pipe',
    });
    buildSpinner.succeed('Built KiCAD-MCP-Server');
  } catch (error) {
    buildSpinner.fail('Failed to build');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Create venv with UV
  const venvSpinner = ora('Creating Python virtual environment...').start();
  try {
    // Create venv if it doesn't exist
    if (!existsSync(paths.venvDir)) {
      execSync('uv venv .venv', {
        cwd: paths.mcpDir,
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
    }
    venvSpinner.succeed('Created Python virtual environment');
  } catch (error) {
    venvSpinner.fail('Failed to create venv');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Install Python dependencies with UV
  const pythonSpinner = ora('Installing Python dependencies...').start();
  try {
    const depsStr = PYTHON_DEPS.join(' ');
    execSync(`uv pip install ${depsStr}`, {
      cwd: paths.mcpDir,
      stdio: options.verbose ? 'inherit' : 'pipe',
      env: {
        ...process.env,
        VIRTUAL_ENV: paths.venvDir,
      },
    });
    pythonSpinner.succeed('Installed Python dependencies');
  } catch (error) {
    pythonSpinner.fail('Failed to install Python dependencies');
    if (options.verbose) console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  console.log('');
  console.log(chalk.green.bold('✓ KiCAD-MCP-Server installed successfully'));
  console.log(chalk.dim(`  Location: ${paths.mcpDir}`));
  console.log(chalk.dim(`  Entry point: ${paths.entryPoint}`));
  console.log(chalk.dim(`  Python venv: ${paths.venvDir}`));
  console.log('');

  return true;
}

/**
 * Get the MCP configuration for the KiCad server
 */
export function getKicadMcpConfig(): { command: string; args: string[]; env: Record<string, string> } | null {
  const { built, hasVenv, paths } = isKicadMcpInstalled();

  if (!built) {
    return null;
  }

  const config: { command: string; args: string[]; env: Record<string, string> } = {
    command: 'node',
    args: [paths.entryPoint],
    env: {
      KICAD_PROJECT_DIR: './hardware',
    },
  };

  // Add venv Python path if available
  if (hasVenv) {
    config.env.PYTHON_PATH = paths.venvPython;
    config.env.VIRTUAL_ENV = paths.venvDir;
  }

  // On macOS, add homebrew lib path for cairo and other system libraries
  const plat = platform();
  if (plat === 'darwin') {
    // Check for Apple Silicon vs Intel
    const homebrewLib = existsSync('/opt/homebrew/lib')
      ? '/opt/homebrew/lib'
      : '/usr/local/lib';
    config.env.DYLD_LIBRARY_PATH = homebrewLib;
  }

  return config;
}

/**
 * Update or create .mcp.json with KiCad MCP configuration
 */
export function configureMcpJson(projectDir: string): boolean {
  const mcpJsonPath = join(projectDir, '.mcp.json');
  const config = getKicadMcpConfig();

  if (!config) {
    console.error(chalk.red('KiCad MCP server not installed. Run "ai-eda doctor --fix" first.'));
    return false;
  }

  let mcpConfig: Record<string, unknown> = { mcpServers: {} };

  // Load existing config if present
  if (existsSync(mcpJsonPath)) {
    try {
      const content = readFileSync(mcpJsonPath, 'utf-8');
      mcpConfig = JSON.parse(content);
      if (!mcpConfig.mcpServers) {
        mcpConfig.mcpServers = {};
      }
    } catch {
      console.warn(chalk.yellow('Warning: Could not parse existing .mcp.json, creating new one'));
      mcpConfig = { mcpServers: {} };
    }
  }

  // Update KiCad configuration
  (mcpConfig.mcpServers as Record<string, unknown>).kicad = config;

  // Write updated config
  writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));

  return true;
}

/**
 * Check global Claude configuration for MCP servers
 */
export function getGlobalClaudeConfigPath(): string {
  return join(homedir(), '.claude', 'mcp.json');
}

/**
 * Configure KiCad MCP in global Claude config
 */
export function configureGlobalMcp(): boolean {
  const globalConfigPath = getGlobalClaudeConfigPath();
  const globalConfigDir = join(homedir(), '.claude');
  const config = getKicadMcpConfig();

  if (!config) {
    return false;
  }

  // Ensure .claude directory exists
  if (!existsSync(globalConfigDir)) {
    mkdirSync(globalConfigDir, { recursive: true });
  }

  let globalConfig: Record<string, unknown> = { mcpServers: {} };

  // Load existing config if present
  if (existsSync(globalConfigPath)) {
    try {
      const content = readFileSync(globalConfigPath, 'utf-8');
      globalConfig = JSON.parse(content);
      if (!globalConfig.mcpServers) {
        globalConfig.mcpServers = {};
      }
    } catch {
      globalConfig = { mcpServers: {} };
    }
  }

  // Update KiCad configuration
  (globalConfig.mcpServers as Record<string, unknown>).kicad = config;

  // Write updated config
  writeFileSync(globalConfigPath, JSON.stringify(globalConfig, null, 2));

  return true;
}

/**
 * CLI command to install/update KiCad MCP
 */
export async function kicadMcpCommand(options: {
  install?: boolean;
  update?: boolean;
  status?: boolean;
  configureGlobal?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\nKiCad MCP Server Management\n'));

  const { installed, built, hasVenv, paths } = isKicadMcpInstalled();
  const hasUv = await isUvInstalled();

  // Status check (default action)
  if (options.status || (!options.install && !options.update && !options.configureGlobal)) {
    console.log(`${chalk.dim('UV Installed:')} ${hasUv ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`${chalk.dim('Installation Path:')} ${paths.mcpDir}`);
    console.log(`${chalk.dim('Cloned:')} ${installed ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`${chalk.dim('Built:')} ${built ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`${chalk.dim('Python Venv:')} ${hasVenv ? chalk.green('Yes') : chalk.red('No')}`);

    if (built) {
      console.log(`${chalk.dim('Entry Point:')} ${paths.entryPoint}`);
    }

    if (hasVenv) {
      const { installed: depsOk, missing } = await checkPythonDependencies();
      console.log(`${chalk.dim('Python Deps:')} ${depsOk ? chalk.green('OK') : chalk.yellow(`Missing: ${missing.join(', ')}`)}`);
    }

    // Check global config
    const globalConfigPath = getGlobalClaudeConfigPath();
    const hasGlobalConfig = existsSync(globalConfigPath);
    console.log(`${chalk.dim('Global Config:')} ${hasGlobalConfig ? globalConfigPath : chalk.dim('Not configured')}`);

    console.log('');

    if (!hasUv) {
      console.log(chalk.yellow('UV is required. Install it first:'));
      console.log(chalk.cyan('  curl -LsSf https://astral.sh/uv/install.sh | sh'));
      console.log('');
    } else if (!built || !hasVenv) {
      console.log(chalk.yellow('To install, run:'));
      console.log(chalk.cyan('  ai-eda kicad-mcp --install'));
      console.log('');
    }

    return;
  }

  // Install or update
  if (options.install || options.update) {
    const success = await installKicadMcp({ verbose: false });
    if (success && options.configureGlobal) {
      console.log(chalk.dim('Configuring global Claude config...'));
      if (configureGlobalMcp()) {
        console.log(chalk.green('✓ Global Claude config updated'));
      }
    }
    return;
  }

  // Configure global only
  if (options.configureGlobal) {
    if (!built) {
      console.log(chalk.red('KiCad MCP not installed. Run with --install first.'));
      return;
    }
    if (configureGlobalMcp()) {
      console.log(chalk.green('✓ Global Claude config updated'));
      console.log(chalk.dim(`  Config: ${getGlobalClaudeConfigPath()}`));
    }
  }
}
