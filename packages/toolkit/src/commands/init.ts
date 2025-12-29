/**
 * Init command - Initialize a new EDA project
 */

import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

export interface InitOptions {
  template: 'basic' | 'advanced';
  noGit: boolean;
  layers: number;
}

const DIRECTORIES = [
  '.claude/commands',
  '.claude/agents',
  '.claude/skills',
  'docs',
  'datasheets',
  'hardware',
  'libraries/symbols',
  'libraries/footprints',
  'libraries/3dmodels',
  'production',
];

export async function initCommand(
  projectName: string,
  options: InitOptions
): Promise<void> {
  const projectDir = join(process.cwd(), projectName);

  console.log('');
  console.log(chalk.bold(`Initializing EDA project: ${chalk.cyan(projectName)}`));
  console.log(chalk.dim(`Template: ${options.template} | Layers: ${options.layers}`));
  console.log('');

  // Create project directory
  if (existsSync(projectDir)) {
    console.error(chalk.red(`Error: Directory "${projectName}" already exists`));
    process.exit(1);
  }

  // Create directory structure
  const dirSpinner = ora('Creating directory structure...').start();
  mkdirSync(projectDir, { recursive: true });

  for (const dir of DIRECTORIES) {
    const dirPath = join(projectDir, dir);
    mkdirSync(dirPath, { recursive: true });

    // Add .gitkeep to empty directories
    writeFileSync(join(dirPath, '.gitkeep'), '');
  }
  dirSpinner.succeed('Created directory structure');

  // Copy templates from the templates directory
  const templateSpinner = ora('Copying templates...').start();
  const templatesDir = getTemplatesDir();
  if (templatesDir && existsSync(templatesDir)) {
    await copyTemplates(templatesDir, projectDir, projectName, options);
    templateSpinner.succeed('Copied project templates');
  } else {
    // Create minimal templates inline
    createMinimalTemplates(projectDir, projectName, options);
    templateSpinner.succeed('Created project files');
  }

  // Initialize git if not disabled
  if (!options.noGit) {
    const gitSpinner = ora('Initializing git repository...').start();
    try {
      const { execSync } = await import('child_process');
      execSync('git init', { cwd: projectDir, stdio: 'ignore' });
      gitSpinner.succeed('Initialized git repository');
    } catch {
      gitSpinner.warn('Could not initialize git repository');
    }
  }

  console.log('');
  console.log(chalk.bold.green(`Project "${projectName}" created successfully!`));
  console.log('');
  console.log(chalk.bold('Next steps:'));
  console.log(chalk.dim('  1.'), `cd ${projectName}`);
  console.log(chalk.dim('  2.'), 'Open in Claude Code');
  console.log(chalk.dim('  3.'), `Run ${chalk.cyan('/eda-spec')} to define requirements`);
  console.log('');
}

function getTemplatesDir(): string | null {
  // Try to find templates relative to the package
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // Look for templates in various locations
  const possiblePaths = [
    join(__dirname, '../../templates'),
    join(__dirname, '../../../templates'),
    join(__dirname, '../../../../templates'),
  ];

  for (const p of possiblePaths) {
    if (existsSync(p)) {
      return p;
    }
  }

  return null;
}

async function copyTemplates(
  templatesDir: string,
  projectDir: string,
  projectName: string,
  options: InitOptions
): Promise<void> {
  // Copy Claude commands
  const commandsDir = join(templatesDir, 'claude/commands');
  if (existsSync(commandsDir)) {
    copyDirectory(commandsDir, join(projectDir, '.claude/commands'));
  }

  // Copy Claude agents
  const agentsDir = join(templatesDir, 'claude/agents');
  if (existsSync(agentsDir)) {
    copyDirectory(agentsDir, join(projectDir, '.claude/agents'));
  }

  // Copy Claude skills
  const skillsDir = join(templatesDir, 'claude/skills');
  if (existsSync(skillsDir)) {
    copyDirectory(skillsDir, join(projectDir, '.claude/skills'));
  }

  // Copy and render project files
  const projectFilesDir = join(templatesDir, 'project-files');
  if (existsSync(projectFilesDir)) {
    for (const file of readdirSync(projectFilesDir)) {
      if (file.endsWith('.template')) {
        const content = readFileSync(join(projectFilesDir, file), 'utf-8');
        const rendered = renderTemplate(content, {
          PROJECT_NAME: projectName,
          LAYERS: String(options.layers),
        });
        const outputName = file.replace('.template', '');
        writeFileSync(join(projectDir, outputName), rendered);
      }
    }
  }

  // Copy CLAUDE.md template
  const claudeMdDir = join(templatesDir, 'claude-md');
  if (existsSync(claudeMdDir)) {
    const claudeMdPath = join(claudeMdDir, 'CLAUDE.md.template');
    if (existsSync(claudeMdPath)) {
      const content = readFileSync(claudeMdPath, 'utf-8');
      const rendered = renderTemplate(content, {
        PROJECT_NAME: projectName,
        PROJECT_DESCRIPTION: 'AI-assisted EDA project',
      });
      writeFileSync(join(projectDir, 'CLAUDE.md'), rendered);
    }
  }

  // Create design-constraints.json with layer count
  const constraints = {
    project: {
      name: projectName,
      version: '0.1.0',
      description: '',
    },
    power: {
      input: { type: '', voltage: { min: 0, max: 0 } },
      rails: [],
    },
    board: {
      layers: options.layers,
      size: { width_mm: 0, height_mm: 0 },
      mounting_holes: [],
    },
    interfaces: [],
    environment: {
      temp_min_c: -20,
      temp_max_c: 70,
    },
  };
  writeFileSync(join(projectDir, 'docs/design-constraints.json'), JSON.stringify(constraints, null, 2));
}

function copyDirectory(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

function renderTemplate(content: string, variables: Record<string, string>): string {
  let result = content;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
}

function createMinimalTemplates(
  projectDir: string,
  projectName: string,
  options: InitOptions
): void {
  // Create .mcp.json
  const mcpConfig = {
    mcpServers: {
      kicad: {
        command: 'npx',
        args: ['-y', '@ai-eda/kicad-mcp@latest'],
        env: {
          KICAD_PROJECT_DIR: '${PROJECT_DIR}/hardware',
        },
      },
      lcsc: {
        command: 'npx',
        args: ['-y', '@ai-eda/lcsc-mcp@latest'],
        env: {
          LCSC_CACHE_DIR: '${PROJECT_DIR}/.cache/lcsc',
          EASYEDA_OUTPUT_DIR: '${PROJECT_DIR}/libraries',
        },
      },
    },
  };
  writeFileSync(join(projectDir, '.mcp.json'), JSON.stringify(mcpConfig, null, 2));

  // Create .gitignore
  const gitignore = `# OS
.DS_Store
Thumbs.db

# Dependencies
node_modules/

# Build
dist/
build/

# Cache
.cache/

# KiCad backup files
*-backups/
*.bak
*~
*.lck
fp-info-cache

# Production files (keep originals, ignore copies)
production/*.zip

# Environment
.env
.env.local
`;
  writeFileSync(join(projectDir, '.gitignore'), gitignore);

  // Create CLAUDE.md
  const claudeMd = `# ${projectName} - EDA Project

## Project Overview

AI-assisted EDA project using @ai-eda toolkit.

## Build Commands

- Run DRC: Use KiCad or \`/eda-validate pcb\`
- Export: Use \`/eda-export jlcpcb\`

## Project Structure

- \`hardware/\`: KiCad project files
- \`docs/\`: Design documentation
- \`datasheets/\`: Component datasheets
- \`libraries/\`: Project component libraries
- \`production/\`: Manufacturing outputs

## EDA Workflow

Use these commands for the EDA workflow:

1. \`/eda-spec\` - Define project requirements
2. \`/eda-source [role]\` - Source components
3. \`/eda-library [part]\` - Fetch component libraries
4. \`/eda-schematic\` - Create schematic
5. \`/eda-pcb-place\` - Place components on PCB
6. \`/eda-pcb-route\` - Route traces
7. \`/eda-validate\` - Validate design
8. \`/eda-export\` - Export manufacturing files

## IMPORTANT

- Always run \`/eda-validate\` before \`/eda-export\`
- Check stock levels before finalizing component selection
`;
  writeFileSync(join(projectDir, 'CLAUDE.md'), claudeMd);

  // Create design-constraints.json template
  const constraints = {
    project: {
      name: projectName,
      version: '0.1.0',
      description: '',
    },
    power: {
      input: { type: '', voltage: { min: 0, max: 0 } },
      rails: [],
    },
    board: {
      layers: options.layers,
      size: { width_mm: 0, height_mm: 0 },
      mounting_holes: [],
    },
    interfaces: [],
    environment: {
      temp_min_c: -20,
      temp_max_c: 70,
    },
  };
  writeFileSync(join(projectDir, 'docs/design-constraints.json'), JSON.stringify(constraints, null, 2));
}
