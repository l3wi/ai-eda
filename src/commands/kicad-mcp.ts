/**
 * KiCad MCP Server installation and management
 *
 * Handles installation of the external mixelpixx/KiCAD-MCP-Server
 * to ~/.claude-eda/kicad-mcp for use with Claude Code.
 *
 * The MCP server uses KiCad's bundled Python which includes the pcbnew module.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { homedir, platform } from 'os';
import chalk from 'chalk';
import ora from 'ora';
import { getKicadSchMcpConfig } from './kicad-sch-mcp.js';

const KICAD_MCP_REPO = 'https://github.com/mixelpixx/KiCAD-MCP-Server.git';
const KICAD_MCP_DIR_NAME = 'kicad-mcp';

export interface KicadMcpPaths {
  baseDir: string;       // ~/.claude-eda
  mcpDir: string;        // ~/.claude-eda/kicad-mcp
  distDir: string;       // ~/.claude-eda/kicad-mcp/dist
  entryPoint: string;    // ~/.claude-eda/kicad-mcp/dist/index.js
}

/**
 * Get the paths for the KiCad MCP installation
 */
export function getKicadMcpPaths(): KicadMcpPaths {
  const baseDir = join(homedir(), '.claude-eda');
  const mcpDir = join(baseDir, KICAD_MCP_DIR_NAME);
  const distDir = join(mcpDir, 'dist');
  const entryPoint = join(distDir, 'index.js');

  return { baseDir, mcpDir, distDir, entryPoint };
}

/**
 * Check if the KiCad MCP server is installed and built
 */
export function isKicadMcpInstalled(): {
  installed: boolean;
  built: boolean;
  paths: KicadMcpPaths
} {
  const paths = getKicadMcpPaths();
  const installed = existsSync(paths.mcpDir) && existsSync(join(paths.mcpDir, 'package.json'));
  const built = installed && existsSync(paths.entryPoint);

  return { installed, built, paths };
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

  console.log('');
  console.log(chalk.green.bold('✓ KiCAD-MCP-Server installed successfully'));
  console.log(chalk.dim(`  Location: ${paths.mcpDir}`));
  console.log(chalk.dim(`  Entry point: ${paths.entryPoint}`));
  console.log(chalk.dim(`  Python: Uses KiCad's bundled Python with pcbnew`));
  console.log('');

  return true;
}

/**
 * Get the MCP configuration for the KiCad PCB server
 */
export function getKicadMcpConfig(): { command: string; args: string[]; env?: Record<string, string> } | null {
  const { built, paths } = isKicadMcpInstalled();

  if (!built) {
    return null;
  }

  const config: { command: string; args: string[]; env?: Record<string, string> } = {
    command: 'node',
    args: [paths.entryPoint],
  };

  // On macOS, add homebrew lib path for cairo and other system libraries
  const plat = platform();
  if (plat === 'darwin') {
    // Check for Apple Silicon vs Intel
    const homebrewLib = existsSync('/opt/homebrew/lib')
      ? '/opt/homebrew/lib'
      : '/usr/local/lib';
    config.env = { DYLD_LIBRARY_PATH: homebrewLib };
  }

  return config;
}

/**
 * Get the MCP configuration for the JLC server
 */
export function getJlcMcpConfig(): { command: string; args: string[]; env: Record<string, string> } {
  return {
    command: 'npx',
    args: ['-y', '@jlcpcb/mcp@latest'],
    env: {
      JLC_CACHE_DIR: './.cache/jlc',
      EASYEDA_OUTPUT_DIR: './libraries',
    },
  };
}

/**
 * Update or create .mcp.json with MCP configuration
 */
export function configureMcpJson(projectDir: string): boolean {
  const mcpJsonPath = join(projectDir, '.mcp.json');
  const pcbConfig = getKicadMcpConfig();
  const schConfig = getKicadSchMcpConfig();
  const jlcConfig = getJlcMcpConfig();

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

  const servers = mcpConfig.mcpServers as Record<string, unknown>;

  // Remove old 'kicad' key if it exists (renamed to 'kicad-pcb')
  if ('kicad' in servers) {
    delete servers.kicad;
  }

  // Remove old 'lcsc' key if it exists (renamed to 'jlc')
  if ('lcsc' in servers) {
    delete servers.lcsc;
  }

  // Update JLC configuration (always available via npx)
  servers['jlc'] = jlcConfig;

  // Update KiCad PCB configuration (if installed)
  if (pcbConfig) {
    servers['kicad-pcb'] = pcbConfig;
  }

  // Update KiCad Schematic configuration (if installed)
  if (schConfig) {
    servers['kicad-sch'] = schConfig;
  }

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
 * Configure MCP servers in global Claude config
 */
export function configureGlobalMcp(): boolean {
  const globalConfigPath = getGlobalClaudeConfigPath();
  const globalConfigDir = join(homedir(), '.claude');
  const pcbConfig = getKicadMcpConfig();
  const schConfig = getKicadSchMcpConfig();
  const jlcConfig = getJlcMcpConfig();

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

  const servers = globalConfig.mcpServers as Record<string, unknown>;

  // Remove old 'kicad' key if it exists (renamed to 'kicad-pcb')
  if ('kicad' in servers) {
    delete servers.kicad;
  }

  // Remove old 'lcsc' key if it exists (renamed to 'jlc')
  if ('lcsc' in servers) {
    delete servers.lcsc;
  }

  // Update JLC configuration (always available via npx)
  servers['jlc'] = jlcConfig;

  // Update KiCad PCB configuration (if installed)
  if (pcbConfig) {
    servers['kicad-pcb'] = pcbConfig;
  }

  // Update KiCad Schematic configuration (if installed)
  if (schConfig) {
    servers['kicad-sch'] = schConfig;
  }

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
    console.log(`${chalk.dim('Cloned:')} ${installed ? chalk.green('Yes') : chalk.red('No')}`);
    console.log(`${chalk.dim('Built:')} ${built ? chalk.green('Yes') : chalk.red('No')}`);

    if (built) {
      console.log(`${chalk.dim('Entry Point:')} ${paths.entryPoint}`);
    }

    // Check global config
    const globalConfigPath = getGlobalClaudeConfigPath();
    const hasGlobalConfig = existsSync(globalConfigPath);
    console.log(`${chalk.dim('Global Config:')} ${hasGlobalConfig ? globalConfigPath : chalk.dim('Not configured')}`);

    console.log('');

    if (!built) {
      console.log(chalk.yellow('To install, run:'));
      console.log(chalk.cyan('  claude-eda kicad-mcp --install'));
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
