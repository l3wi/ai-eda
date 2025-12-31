/**
 * Install command
 * Fetch component and add to KiCad libraries
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createComponentService, createLibraryService, type SearchOptions } from 'jlc-core';
import { renderApp } from '../app/App.js';

const componentService = createComponentService();
const libraryService = createLibraryService();

interface InstallOptions {
  projectPath?: string;
  include3d?: boolean;
  interactive?: boolean;
}

export async function installCommand(id: string | undefined, options: InstallOptions): Promise<void> {
  // If ID provided, fetch component and launch TUI for install
  if (id) {
    const spinner = p.spinner();
    spinner.start(`Fetching component ${id}...`);

    try {
      const details = await componentService.getDetails(id);
      spinner.stop('Component found');

      // Launch TUI at info screen (user can navigate to install from there)
      renderApp('info', { componentId: id, component: details as any });
    } catch (error) {
      spinner.stop('Failed to fetch component');
      p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
    return;
  }

  // No ID provided - interactive search mode using @clack/prompts
  const query = await p.text({
    message: 'Search for component:',
    placeholder: 'e.g., STM32F103, ESP32, 10k resistor',
    validate: (value) => {
      if (!value) return 'Please enter a search term';
      return undefined;
    },
  });

  if (p.isCancel(query)) {
    p.cancel('Installation cancelled');
    process.exit(0);
  }

  const spinner = p.spinner();
  spinner.start(`Searching for "${query}"...`);

  const searchOptions: SearchOptions = { limit: 20 };
  let results = await componentService.search(query as string, searchOptions);

  // Sort results: basic parts first
  results = results.sort((a, b) => {
    if (a.libraryType === 'basic' && b.libraryType !== 'basic') return -1;
    if (a.libraryType !== 'basic' && b.libraryType === 'basic') return 1;
    return 0;
  });

  spinner.stop(`Found ${results.length} results`);

  if (results.length === 0) {
    p.log.warn('No components found. Try a different search term.');
    return;
  }

  // Launch TUI for selection and install
  renderApp('search', { query: query as string, results });
}
