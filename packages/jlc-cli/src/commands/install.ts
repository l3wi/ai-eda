/**
 * Install command
 * Fetch component and add to KiCad libraries
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createComponentService, createLibraryService, type SearchOptions } from 'jlc-core';

const componentService = createComponentService();
const libraryService = createLibraryService();

interface InstallOptions {
  projectPath?: string;
  include3d?: boolean;
}

export async function installCommand(id: string | undefined, options: InstallOptions): Promise<void> {
  let componentId = id;

  // Interactive mode if no ID provided
  if (!componentId) {
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

    const searchOptions: SearchOptions = { limit: 10 };
    const results = await componentService.search(query as string, searchOptions);
    spinner.stop(`Found ${results.length} results`);

    if (results.length === 0) {
      p.log.warn('No components found. Try a different search term.');
      return;
    }

    const selection = await p.select({
      message: 'Select a component to install:',
      options: results.map((r) => ({
        value: r.lcscId,
        label: `${r.lcscId} - ${r.name}`,
        hint: `${r.package || 'N/A'} | ${r.libraryType === 'basic' ? 'Basic' : 'Extended'}`,
      })),
    });

    if (p.isCancel(selection)) {
      p.cancel('Installation cancelled');
      process.exit(0);
    }

    componentId = selection as string;
  }

  // Install the component
  const spinner = p.spinner();
  spinner.start(`Installing ${componentId}...`);

  try {
    const result = await libraryService.install(componentId, {
      projectPath: options.projectPath,
      include3d: options.include3d,
    });

    spinner.stop('Installation complete');

    console.log('');
    console.log(chalk.bold.green('  Component installed successfully!'));
    console.log(chalk.dim('  ─────────────────────────────────────────'));
    console.log(`  Category:     ${result.category || 'N/A'}`);
    console.log(`  Symbol:       ${chalk.cyan(result.symbolRef)}`);
    console.log(`  Footprint:    ${chalk.cyan(result.footprintRef)}`);
    console.log(`  Storage:      ${result.storageMode === 'global' ? 'Global' : 'Project-local'}`);
    console.log('');
    console.log(chalk.bold('  Files:'));
    console.log(`  Symbol lib:   ${result.files.symbolLibrary}`);
    if (result.files.footprint) {
      console.log(`  Footprint:    ${result.files.footprint}`);
    }
    if (result.files.model3d) {
      console.log(`  3D Model:     ${result.files.model3d}`);
    }
    console.log('');
    console.log(chalk.bold('  Validation:'));
    console.log(`  Pin count:    ${result.validationData.symbol.pin_count}`);
    console.log(`  Pad count:    ${result.validationData.footprint.pad_count}`);
    console.log(`  Match:        ${result.validationData.checks.pin_pad_count_match ? chalk.green('Yes') : chalk.yellow('No')}`);
    console.log('');
    console.log(chalk.dim('  Ready to use in KiCad!'));
  } catch (error) {
    spinner.stop('Installation failed');
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
