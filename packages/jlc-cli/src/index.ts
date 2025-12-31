#!/usr/bin/env node

/**
 * jlc-cli
 * CLI for JLC/EasyEDA component sourcing and KiCad library management
 */

import { Command } from 'commander';
import { searchCommand } from './commands/search.js';
import { infoCommand } from './commands/info.js';
import { installCommand } from './commands/install.js';
import { listCommand } from './commands/list.js';

const program = new Command();

program
  .name('jlc')
  .description('JLC/EasyEDA component sourcing and KiCad library management')
  .version('0.1.0');

program
  .command('search <query...>')
  .description('Search for components (basic parts sorted first)')
  .option('-l, --limit <number>', 'Maximum results', '20')
  .option('--in-stock', 'Only show in-stock components')
  .option('--basic-only', 'Only show basic parts (no extended)')
  .option('--community', 'Search EasyEDA community library')
  .action(async (queryParts: string[], options) => {
    const query = queryParts.join(' ');
    await searchCommand(query, {
      limit: parseInt(options.limit, 10),
      inStock: options.inStock,
      basicOnly: options.basicOnly || false,
      source: options.community ? 'easyeda-community' : 'lcsc',
    });
  });

program
  .command('info <id>')
  .description('Get component details')
  .option('--json', 'Output as JSON')
  .action(async (id, options) => {
    await infoCommand(id, { json: options.json });
  });

program
  .command('install [id]')
  .description('Install component to KiCad libraries')
  .option('-p, --project <path>', 'Install to project-local library')
  .option('--with-3d', 'Include 3D model')
  .action(async (id, options) => {
    await installCommand(id, {
      projectPath: options.project,
      include3d: options.with3d,
    });
  });

program
  .command('list')
  .description('List installed components')
  .option('-c, --category <category>', 'Filter by category')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    await listCommand({
      category: options.category,
      json: options.json,
    });
  });

program.parse();
