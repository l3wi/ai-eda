/**
 * List command
 * List installed components from JLC-MCP libraries
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createLibraryService } from 'jlc-core';

const libraryService = createLibraryService();

interface ListOptions {
  category?: string;
  json?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  const spinner = p.spinner();
  spinner.start('Loading installed components...');

  try {
    const components = await libraryService.listInstalled({
      category: options.category as any,
    });

    spinner.stop(`Found ${components.length} installed components`);

    if (components.length === 0) {
      p.log.info('No components installed yet. Use `jlc install <id>` to add components.');
      return;
    }

    if (options.json) {
      console.log(JSON.stringify(components, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold('  LCSC ID     Name                           Category         Library'));
    console.log(chalk.dim('  ─────────── ────────────────────────────── ──────────────── ────────────────────'));

    for (const c of components) {
      const id = c.lcscId.padEnd(11);
      const name = (c.name || '').slice(0, 30).padEnd(30);
      const category = (c.category || '').slice(0, 16).padEnd(16);
      const library = c.library;

      console.log(`  ${chalk.cyan(id)} ${name} ${category} ${library}`);
    }

    console.log('');
  } catch (error) {
    spinner.stop('Failed to list components');
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
