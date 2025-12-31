/**
 * List command
 * List installed components from JLC-MCP libraries
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createLibraryService } from 'jlc-core';
import { renderApp } from '../app/App.js';

const libraryService = createLibraryService();

interface ListOptions {
  category?: string;
  json?: boolean;
}

export async function listCommand(options: ListOptions): Promise<void> {
  // JSON mode - non-interactive output for scripting
  if (options.json) {
    const spinner = p.spinner();
    spinner.start('Loading installed components...');

    try {
      const components = await libraryService.listInstalled({
        category: options.category as any,
      });

      spinner.stop(`Found ${components.length} installed components`);

      console.log(JSON.stringify(components, null, 2));
    } catch (error) {
      spinner.stop('Failed to list components');
      p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
    return;
  }

  // Interactive mode - launch TUI
  renderApp('list', { category: options.category });
}
