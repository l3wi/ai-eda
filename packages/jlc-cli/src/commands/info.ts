/**
 * Info command
 * Display component details
 */

import * as p from '@clack/prompts';
import chalk from 'chalk';
import { createComponentService } from 'jlc-core';

const componentService = createComponentService();

interface InfoOptions {
  json?: boolean;
}

export async function infoCommand(id: string, options: InfoOptions): Promise<void> {
  const spinner = p.spinner();
  spinner.start(`Fetching component ${id}...`);

  try {
    const details = await componentService.getDetails(id);
    spinner.stop('Component found');

    if (options.json) {
      console.log(JSON.stringify(details, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold(`  Component: ${details.name}`));
    console.log(chalk.dim('  ─────────────────────────────────────────'));
    console.log(`  LCSC ID:      ${chalk.cyan(details.lcscId)}`);
    console.log(`  Manufacturer: ${details.manufacturer || 'N/A'}`);
    console.log(`  Package:      ${details.package || 'N/A'}`);
    console.log(`  Category:     ${details.category || 'N/A'}`);
    console.log(`  Description:  ${details.description || 'N/A'}`);
    console.log('');
    console.log(chalk.bold('  Symbol & Footprint:'));
    console.log(`  Pin Count:    ${details.pinCount}`);
    console.log(`  Pad Count:    ${details.padCount}`);
    console.log(`  3D Model:     ${details.has3DModel ? chalk.green('Available') : chalk.dim('Not available')}`);

    if (details.datasheet) {
      console.log('');
      console.log(`  Datasheet:    ${chalk.blue(details.datasheet)}`);
    }

    console.log('');
    console.log(chalk.dim(`Use: jlc install ${id} to add to your libraries`));
  } catch (error) {
    spinner.stop('Failed to fetch component');
    p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    process.exit(1);
  }
}
