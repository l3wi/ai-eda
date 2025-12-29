/**
 * Config command - Manage project configuration
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

export interface ConfigOptions {
  set?: string;
  get?: string;
  list?: boolean;
}

interface ProjectConfig {
  [key: string]: unknown;
}

const CONFIG_FILE = 'docs/design-constraints.json';

export async function configCommand(options: ConfigOptions): Promise<void> {
  const projectDir = process.cwd();
  const configPath = join(projectDir, CONFIG_FILE);

  // Check if we're in a project directory
  if (!existsSync(join(projectDir, 'CLAUDE.md')) && !existsSync(join(projectDir, '.mcp.json'))) {
    console.error(chalk.red('Error: Not in an AI-EDA project directory'));
    console.error('Run this command from a project created with "ai-eda init"');
    process.exit(1);
  }

  // Load existing config
  let config: ProjectConfig = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8'));
    } catch (e) {
      console.error(chalk.red('Error: Could not parse config file'));
      process.exit(1);
    }
  }

  // Handle --list
  if (options.list) {
    console.log(chalk.bold('\nProject Configuration:\n'));
    printConfig(config, '');
    return;
  }

  // Handle --get
  if (options.get) {
    const value = getNestedValue(config, options.get);
    if (value === undefined) {
      console.error(chalk.yellow(`Key "${options.get}" not found`));
      process.exit(1);
    }
    if (typeof value === 'object') {
      console.log(JSON.stringify(value, null, 2));
    } else {
      console.log(value);
    }
    return;
  }

  // Handle --set
  if (options.set) {
    const [key, ...valueParts] = options.set.split('=');
    const valueStr = valueParts.join('=');

    if (!key || valueStr === undefined) {
      console.error(chalk.red('Error: Invalid format. Use --set key=value'));
      process.exit(1);
    }

    // Parse value (try JSON first, then string)
    let value: unknown;
    try {
      value = JSON.parse(valueStr);
    } catch {
      value = valueStr;
    }

    setNestedValue(config, key, value);
    writeFileSync(configPath, JSON.stringify(config, null, 2));
    console.log(chalk.green(`Set ${key} = ${JSON.stringify(value)}`));
    return;
  }

  // No options provided, show help
  console.log(chalk.bold('\nConfiguration Commands:\n'));
  console.log('  ai-eda config --list           List all configuration');
  console.log('  ai-eda config --get <key>      Get a configuration value');
  console.log('  ai-eda config --set <key>=<value>  Set a configuration value');
  console.log('');
  console.log(chalk.dim('Examples:'));
  console.log('  ai-eda config --get project.name');
  console.log('  ai-eda config --set board.layers=4');
  console.log('  ai-eda config --set project.description="My awesome board"');
}

function printConfig(obj: Record<string, unknown>, indent: string = ''): void {
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
      console.log(`${indent}${chalk.bold(key)}:`);
      printConfig(value as Record<string, unknown>, indent + '  ');
    } else if (Array.isArray(value) && value.length === 0) {
      console.log(`${indent}${chalk.dim(key)}: ${chalk.dim('[]')}`);
    } else if (Array.isArray(value)) {
      console.log(`${indent}${chalk.dim(key)}:`);
      for (const item of value) {
        console.log(`${indent}  - ${chalk.cyan(JSON.stringify(item))}`);
      }
    } else {
      console.log(`${indent}${chalk.dim(key)}: ${chalk.cyan(JSON.stringify(value))}`);
    }
  }
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object') {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
}
