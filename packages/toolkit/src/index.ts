#!/usr/bin/env node

/**
 * @ai-eda/toolkit
 * CLI for AI-assisted EDA project initialization and management
 */

import { Command } from 'commander';
import { initCommand, doctorCommand, updateCommand, configCommand, kicadIpcCommand } from './commands/index.js';

const program = new Command();

program
  .name('ai-eda')
  .description('AI-assisted EDA toolkit for KiCad and Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new EDA project')
  .argument('<name>', 'Project name')
  .option('-t, --template <type>', 'Project template (basic|advanced)', 'basic')
  .option('--no-git', 'Skip git initialization')
  .option('-l, --layers <count>', 'Default layer count', '2')
  .action(async (name, options) => {
    await initCommand(name, {
      template: options.template as 'basic' | 'advanced',
      noGit: !options.git,
      layers: parseInt(options.layers),
    });
  });

program
  .command('doctor')
  .description('Check environment setup')
  .action(async () => {
    await doctorCommand();
  });

program
  .command('update')
  .description('Update project templates')
  .option('-c, --commands', 'Update slash commands only')
  .option('-a, --agents', 'Update agents only')
  .option('-s, --skills', 'Update skills only')
  .option('--all', 'Update everything')
  .action(async (options) => {
    await updateCommand({
      commands: options.commands,
      agents: options.agents,
      skills: options.skills,
      all: options.all,
    });
  });

program
  .command('config')
  .description('Manage project configuration')
  .option('-s, --set <key=value>', 'Set a configuration value')
  .option('-g, --get <key>', 'Get a configuration value')
  .option('-l, --list', 'List all configuration')
  .action(async (options) => {
    await configCommand({
      set: options.set,
      get: options.get,
      list: options.list,
    });
  });

program
  .command('kicad-ipc')
  .description('Manage KiCad IPC API for real-time control')
  .option('-e, --enable', 'Enable KiCad IPC API')
  .option('-d, --disable', 'Disable KiCad IPC API')
  .option('-s, --status', 'Show IPC API status')
  .option('-v, --version <version>', 'KiCad version (e.g., 9.0, 8.0)', '9.0')
  .action(async (options) => {
    await kicadIpcCommand({
      enable: options.enable,
      disable: options.disable,
      status: options.status,
      version: options.version,
    });
  });

program.parse();
