/**
 * Init command - Interactive EDA project initialization
 */

import { existsSync, mkdirSync, writeFileSync, copyFileSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import * as p from '@clack/prompts';
import {
  isKicadMcpInstalled,
  installKicadMcp,
  getKicadMcpConfig,
  configureMcpJson,
} from './kicad-mcp.js';
import { getKicadProjectsDir, shortenPath, runAllChecks } from '../utils/index.js';

export interface InitOptions {
  noGit: boolean;
  yes?: boolean; // Non-interactive mode
}

// Default constraints template - layers defined later via /eda-new
const DEFAULT_CONSTRAINTS = {
  project: {
    name: '',
    version: '0.1.0',
    description: '',
  },
  power: {
    input: { type: '', voltage: { min: 0, max: 0 } },
    rails: [],
  },
  board: {
    size: { width_mm: 0, height_mm: 0 },
    mounting_holes: [],
  },
  interfaces: [],
  environment: {
    temp_min_c: -20,
    temp_max_c: 70,
  },
};

const DIRECTORIES = [
  '.claude/commands',
  '.claude/agents',
  '.claude/skills',
  'docs',
  'datasheets',
  'production',
];

export async function initCommand(
  nameArg?: string,
  options: InitOptions = { noGit: false }
): Promise<void> {
  // Show intro
  console.log('');
  p.intro(chalk.bgCyan.black(' AI-EDA Project Setup '));

  // Handle cancellation
  const onCancel = () => {
    p.cancel('Setup cancelled.');
    process.exit(0);
  };

  // Step 1: Project name
  let projectName: string;
  if (nameArg) {
    projectName = nameArg;
    p.log.info(`Project name: ${chalk.cyan(projectName)}`);
  } else if (options.yes) {
    p.cancel('Project name is required in non-interactive mode.');
    process.exit(1);
  } else {
    const nameResult = await p.text({
      message: 'Project name:',
      placeholder: 'my-pcb-project',
      validate: (value) => {
        if (!value) return 'Project name is required';
        if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
          return 'Use only letters, numbers, hyphens, and underscores';
        }
        return undefined;
      },
    });

    if (p.isCancel(nameResult)) {
      onCancel();
      return;
    }
    projectName = nameResult;
  }

  // Step 2: Location selection
  let projectDir: string;
  const kicadDir = getKicadProjectsDir();

  if (options.yes) {
    // Default to current directory in non-interactive mode
    projectDir = join(process.cwd(), projectName);
  } else {
    const locationOptions: { value: string; label: string; hint?: string }[] = [
      {
        value: 'cwd',
        label: `Current directory`,
        hint: `./${projectName}`,
      },
    ];

    if (kicadDir) {
      locationOptions.push({
        value: 'kicad',
        label: 'KiCad Projects folder',
        hint: shortenPath(join(kicadDir, projectName)),
      });
    }

    const locationResult = await p.select({
      message: 'Where should we create the project?',
      options: locationOptions,
    });

    if (p.isCancel(locationResult)) {
      onCancel();
      return;
    }

    projectDir = locationResult === 'kicad' && kicadDir
      ? join(kicadDir, projectName)
      : join(process.cwd(), projectName);
  }

  // Check if directory already exists
  if (existsSync(projectDir)) {
    p.log.error(`Directory "${projectDir}" already exists`);
    p.cancel('Cannot create project in existing directory.');
    process.exit(1);
  }

  // Step 4: Environment checks
  const envSpinner = p.spinner();
  envSpinner.start('Checking environment...');

  const envResults = await runAllChecks();
  envSpinner.stop('Environment checked');

  // Display results
  p.log.message(''); // blank line
  for (const r of envResults) {
    let icon: string;
    let message: string;

    if (r.status === 'pass') {
      icon = chalk.green('\u2713');
      message = chalk.dim(r.message);
    } else if (r.status === 'warn') {
      icon = chalk.yellow('\u26A0');
      message = chalk.yellow(r.message);
    } else {
      icon = chalk.red('\u2717');
      message = chalk.red(r.message);
    }

    p.log.message(`${icon} ${chalk.bold(r.name)}: ${message}`);
  }

  const hasWarnings = envResults.some((r) => r.status === 'warn' || r.status === 'fail');
  if (hasWarnings && !options.yes) {
    p.log.message('');
    p.log.warn(`Some tools are missing. Run ${chalk.cyan('claude-eda doctor --fix')} to install them.`);
    p.log.message('');

    const continueResult = await p.confirm({
      message: 'Continue with project creation?',
      initialValue: true,
    });

    if (p.isCancel(continueResult) || !continueResult) {
      onCancel();
      return;
    }
  }

  // Step 5: Create project
  const createSpinner = p.spinner();
  createSpinner.start('Creating project structure...');

  // Create directory structure
  mkdirSync(projectDir, { recursive: true });

  for (const dir of DIRECTORIES) {
    const dirPath = join(projectDir, dir);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, '.gitkeep'), '');
  }

  // Copy templates
  const templatesDir = getTemplatesDir();
  if (templatesDir && existsSync(templatesDir)) {
    await copyTemplates(templatesDir, projectDir, projectName);
  } else {
    createMinimalTemplates(projectDir, projectName);
  }

  createSpinner.stop('Created project structure');

  // Configure MCP
  const mcpSpinner = p.spinner();
  mcpSpinner.start('Configuring MCP servers...');

  const { built: mcpInstalled } = isKicadMcpInstalled();
  if (!mcpInstalled) {
    // Try to install KiCad MCP silently
    await installKicadMcp({ verbose: false });
  }

  if (configureMcpJson(projectDir)) {
    mcpSpinner.stop('Configured MCP servers');
  } else {
    mcpSpinner.stop('MCP configuration skipped (run claude-eda doctor --fix)');
  }

  // Initialize git
  if (!options.noGit) {
    const gitSpinner = p.spinner();
    gitSpinner.start('Initializing git repository...');
    try {
      const { execSync } = await import('child_process');
      execSync('git init', { cwd: projectDir, stdio: 'ignore' });
      gitSpinner.stop('Initialized git repository');
    } catch {
      gitSpinner.stop('Git initialization skipped');
    }
  }

  // Show success and next steps
  p.outro(chalk.green(`Project "${projectName}" created!`));

  // Print detailed next steps
  printNextSteps(projectName, projectDir);
}

function printNextSteps(projectName: string, projectDir: string): void {
  const isInCwd = projectDir === join(process.cwd(), projectName);
  const cdPath = isInCwd ? projectName : projectDir;

  console.log('');
  console.log(chalk.bold('  Next steps:'));
  console.log('');
  console.log(`  ${chalk.dim('1.')} cd ${cdPath}`);
  console.log(`  ${chalk.dim('2.')} claude`);
  console.log(`  ${chalk.dim('3.')} /eda-new`);
  console.log('');
  console.log(chalk.bold('  Available commands:'));
  console.log('');
  console.log(`  ${chalk.cyan('/eda-new')}        Define project requirements`);
  console.log(`  ${chalk.cyan('/eda-source')}     Source components`);
  console.log(`  ${chalk.cyan('/eda-schematic')}  Create schematic`);
  console.log(`  ${chalk.cyan('/eda-layout')}     Layout PCB`);
  console.log(`  ${chalk.cyan('/eda-check')}      Validate design`);
  console.log(`  ${chalk.cyan('/eda-export')}     Export for manufacturing`);
  console.log('');
  console.log(chalk.dim(`  Need help? Run: claude-eda doctor`));
  console.log('');
}

function getTemplatesDir(): string | null {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

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
  projectName: string
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

  // Create design-constraints.json template
  const constraints = {
    ...DEFAULT_CONSTRAINTS,
    project: {
      ...DEFAULT_CONSTRAINTS.project,
      name: projectName,
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
  projectName: string
): void {
  // Create .mcp.json
  const mcpConfig: Record<string, unknown> = {
    mcpServers: {
      jlc: {
        command: 'npx',
        args: ['-y', 'jlc-mcp@latest'],
        env: {
          JLC_CACHE_DIR: './.cache/jlc',
        },
      },
    },
  };

  const kicadConfig = getKicadMcpConfig();
  if (kicadConfig) {
    (mcpConfig.mcpServers as Record<string, unknown>).kicad = kicadConfig;
  }

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

AI-assisted EDA project using @claude-eda toolkit.

## Project Structure

- \`${projectName}.kicad_pro\`: KiCad project file (in root)
- \`${projectName}.kicad_sch\`: Schematic
- \`${projectName}.kicad_pcb\`: PCB layout
- \`docs/\`: Design documentation
- \`datasheets/\`: Component datasheets
- \`production/\`: Manufacturing outputs

## Component Libraries

Components are stored in the **global EDA-MCP library** at:
- \`~/Documents/KiCad/9.0/symbols/EDA-MCP.kicad_sym\` - Unified symbol library
- \`~/Documents/KiCad/9.0/footprints/EDA-MCP.pretty/\` - Footprints
- \`~/Documents/KiCad/9.0/3dmodels/EDA-MCP.3dshapes/\` - 3D models

This global library is automatically discovered by kicad-mcp.

## EDA Workflow

Use these commands for the EDA workflow:

1. \`/eda-new\` - Define project requirements
2. \`/eda-source [role]\` - Source components
3. \`/eda-schematic [sheet]\` - Create schematic
4. \`/eda-layout [phase]\` - Layout PCB
5. \`/eda-check [scope]\` - Validate design
6. \`/eda-export [format]\` - Export manufacturing files

## IMPORTANT

- Always run \`/eda-check full\` before \`/eda-export\`
- Check stock levels before finalizing component selection
`;
  writeFileSync(join(projectDir, 'CLAUDE.md'), claudeMd);

  // Create design-constraints.json template
  const constraints = {
    ...DEFAULT_CONSTRAINTS,
    project: {
      ...DEFAULT_CONSTRAINTS.project,
      name: projectName,
    },
  };
  writeFileSync(join(projectDir, 'docs/design-constraints.json'), JSON.stringify(constraints, null, 2));
}
