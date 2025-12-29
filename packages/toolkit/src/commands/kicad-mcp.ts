/**
 * KiCad MCP Server installation and management
 *
 * Handles installation of the external mixelpixx/KiCAD-MCP-Server
 * to ~/.ai-eda/kicad-mcp for use with Claude Code.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import chalk from 'chalk';
import ora from 'ora';

const KICAD_MCP_REPO = 'https://github.com/mixelpixx/KiCAD-MCP-Server.git';
const KICAD_MCP_DIR_NAME = 'kicad-mcp';

export interface KicadMcpPaths {
  baseDir: string;       // ~/.ai-eda
  mcpDir: string;        // ~/.ai-eda/kicad-mcp
  distDir: string;       // ~/.ai-eda/kicad-mcp/dist
  entryPoint: string;    // ~/.ai-eda/kicad-mcp/dist/index.js
}

/**
 * Get the paths for the KiCad MCP installation
 */
export function getKicadMcpPaths(): KicadMcpPaths {
  const baseDir = join(homedir(), '.ai-eda');
  const mcpDir = join(baseDir, KICAD_MCP_DIR_NAME);
  const distDir = join(mcpDir, 'dist');
  const entryPoint = join(distDir, 'index.js');

  return { baseDir, mcpDir, distDir, entryPoint };
}

/**
 * Check if the KiCad MCP server is installed and built
 */
export function isKicadMcpInstalled(): { installed: boolean; built: boolean; paths: KicadMcpPaths } {
  const paths = getKicadMcpPaths();
  const installed = existsSync(paths.mcpDir) && existsSync(join(paths.mcpDir, 'package.json'));
  const built = installed && existsSync(paths.entryPoint);

  return { installed, built, paths };
}

/**
 * Check if Python dependencies are installed
 */
export async function checkPythonDependencies(): Promise<{ installed: boolean; missing: string[] }> {
  const requiredPackages = ['skip', 'PIL', 'cairosvg', 'pydantic'];
  const missing: string[] = [];

  try {
    const { execSync } = await import('child_process');

    for (const pkg of requiredPackages) {
      try {
        // Check if package can be imported
        const importName = pkg === 'PIL' ? 'PIL' : pkg === 'skip' ? 'skip' : pkg;
        execSync(`python3 -c "import ${importName}"`, { stdio: 'pipe' });
      } catch {
        // Map import names back to pip package names
        const pipName = pkg === 'PIL' ? 'Pillow' : pkg === 'skip' ? 'kicad-skip' : pkg;
        missing.push(pipName);
      }
    }

    return { installed: missing.length === 0, missing };
  } catch {
    return { installed: false, missing: ['python3 not found'] };
  }
}

/**
 * Install the KiCad MCP server from GitHub
 */
export async function installKicadMcp(options: { verbose?: boolean } = {}): Promise<boolean> {
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
    console.error(chalk.red(`Error: ${error}`));
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
    console.error(chalk.red(`Error: ${error}`));
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
    console.error(chalk.red(`Error: ${error}`));
    return false;
  }

  // Check and install Python dependencies
  const pythonSpinner = ora('Checking Python dependencies...').start();
  const { installed: pythonInstalled, missing } = await checkPythonDependencies();

  if (!pythonInstalled) {
    pythonSpinner.text = 'Installing Python dependencies...';
    try {
      const pipPackages = missing.join(' ');
      execSync(`pip install ${pipPackages}`, {
        stdio: options.verbose ? 'inherit' : 'pipe',
      });
      pythonSpinner.succeed('Installed Python dependencies');
    } catch (error) {
      pythonSpinner.warn(`Some Python dependencies may need manual installation: ${missing.join(', ')}`);
    }
  } else {
    pythonSpinner.succeed('Python dependencies already installed');
  }

  console.log('');
  console.log(chalk.green.bold('✓ KiCAD-MCP-Server installed successfully'));
  console.log(chalk.dim(`  Location: ${paths.mcpDir}`));
  console.log(chalk.dim(`  Entry point: ${paths.entryPoint}`));
  console.log('');

  return true;
}

/**
 * Get the MCP configuration for the KiCad server
 */
export function getKicadMcpConfig(): { command: string; args: string[]; env: Record<string, string> } | null {
  const { built, paths } = isKicadMcpInstalled();

  if (!built) {
    return null;
  }

  return {
    command: 'node',
    args: [paths.entryPoint],
    env: {
      KICAD_PROJECT_DIR: './hardware',
    },
  };
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

  const { installed, built, paths } = isKicadMcpInstalled();

  // Status check (default action)
  if (options.status || (!options.install && !options.update && !options.configureGlobal)) {
    console.log(`${chalk.dim('Installation Path:')} ${paths.mcpDir}`);
    console.log(`${chalk.dim('Installed:')} ${installed ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`${chalk.dim('Built:')} ${built ? chalk.green('Yes') : chalk.red('No')}`);

    if (built) {
      console.log(`${chalk.dim('Entry Point:')} ${paths.entryPoint}`);
    }

    const { installed: pythonOk, missing } = await checkPythonDependencies();
    console.log(`${chalk.dim('Python Deps:')} ${pythonOk ? chalk.green('OK') : chalk.yellow(`Missing: ${missing.join(', ')}`)}`);

    // Check global config
    const globalConfigPath = getGlobalClaudeConfigPath();
    const hasGlobalConfig = existsSync(globalConfigPath);
    console.log(`${chalk.dim('Global Config:')} ${hasGlobalConfig ? globalConfigPath : chalk.dim('Not configured')}`);

    console.log('');

    if (!built) {
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
