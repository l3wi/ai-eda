#!/usr/bin/env node

/**
 * claude-eda
 * CLI for AI-assisted EDA project initialization and management
 */

import { Command } from 'commander';
import { initCommand, doctorCommand, updateCommand, configCommand, kicadIpcCommand, kicadMcpCommand, kicadSchMcpCommand, kicadPythonCommand } from './commands/index.js';

const program = new Command();

program
  .name('claude-eda')
  .description('AI-assisted EDA toolkit for KiCad and Claude Code')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new EDA project (interactive)')
  .argument('[name]', 'Project name (prompted if not provided)')
  .option('--no-git', 'Skip git initialization')
  .option('-y, --yes', 'Use defaults, no prompts (requires name argument)')
  .action(async (name, options) => {
    await initCommand(name, {
      noGit: !options.git,
      yes: options.yes,
    });
  });

program
  .command('doctor')
  .description('Check environment setup')
  .option('-f, --fix', 'Automatically fix issues (install missing components)')
  .option('-v, --verbose', 'Show verbose output during fixes')
  .action(async (options) => {
    await doctorCommand({
      fix: options.fix,
      verbose: options.verbose,
    });
  });

program
  .command('update')
  .description('Update project templates and MCP configuration')
  .option('-c, --commands', 'Update slash commands only')
  .option('-a, --agents', 'Update agents only')
  .option('-s, --skills', 'Update skills only')
  .option('-m, --mcp', 'Update .mcp.json only')
  .option('--all', 'Update everything')
  .action(async (options) => {
    await updateCommand({
      commands: options.commands,
      agents: options.agents,
      skills: options.skills,
      mcp: options.mcp,
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

program
  .command('kicad-mcp')
  .description('Manage KiCad PCB MCP Server (mixelpixx/KiCAD-MCP-Server)')
  .option('-i, --install', 'Install or update KiCad PCB MCP Server')
  .option('-u, --update', 'Update existing installation')
  .option('-s, --status', 'Show installation status')
  .option('-g, --configure-global', 'Configure global Claude MCP config')
  .action(async (options) => {
    await kicadMcpCommand({
      install: options.install,
      update: options.update,
      status: options.status,
      configureGlobal: options.configureGlobal,
    });
  });

program
  .command('kicad-sch-mcp')
  .description('Manage KiCad Schematic MCP Server (mcp-kicad-sch-api)')
  .option('-i, --install', 'Install or update KiCad Schematic MCP Server')
  .option('-u, --update', 'Update existing installation')
  .option('-s, --status', 'Show installation status')
  .action(async (options) => {
    await kicadSchMcpCommand({
      install: options.install,
      update: options.update,
      status: options.status,
    });
  });

program
  .command('kicad-python')
  .description('Manage kicad-python library (enables IPC backend)')
  .option('-i, --install', 'Install kicad-python to KiCad bundled Python')
  .option('-s, --status', 'Show installation status')
  .action(async (options) => {
    await kicadPythonCommand({
      install: options.install,
      status: options.status,
    });
  });

program.parse();
