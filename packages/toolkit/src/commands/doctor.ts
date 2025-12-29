/**
 * Doctor command - Check environment setup
 */

import { existsSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import {
  isKicadMcpInstalled,
  installKicadMcp,
  configureGlobalMcp,
} from './kicad-mcp.js';
import {
  checkKiCad,
  checkKicadIpc,
  checkKicadMcp,
  checkNode,
  CheckResult,
  getKicadConfigDir,
  checkKicadIpcEnabled,
} from '../utils/env-checks.js';

export { getKicadConfigDir, checkKicadIpcEnabled };

export interface DoctorOptions {
  fix?: boolean;
  verbose?: boolean;
}

export async function doctorCommand(options: DoctorOptions = {}): Promise<void> {
  console.log(chalk.bold('\nChecking AI-EDA environment...\n'));

  const results: CheckResult[] = [];

  // Run all checks
  results.push(await checkKiCad());
  results.push(checkKicadIpc());
  results.push(await checkKicadMcp());
  results.push(await checkNode());
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
    const { built } = isKicadMcpInstalled();

    if (!built) {
      console.log(chalk.bold('Attempting to fix issues...\n'));

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
  } else if (warnings.length > 0 || failures.length > 0) {
    const { built } = isKicadMcpInstalled();
    if (!built) {
      console.log(chalk.dim('Run with --fix to automatically install missing components:'));
      console.log(chalk.cyan('  ai-eda doctor --fix'));
      console.log('');
    }
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
        message: 'Partial project structure',
      };
    }
  }

  return {
    name: 'Project Structure',
    status: 'warn',
    message: 'Not in an AI-EDA project. Use "ai-eda init" to create one.',
  };
}
