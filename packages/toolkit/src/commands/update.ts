/**
 * Update command - Update project templates
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

export interface UpdateOptions {
  commands: boolean;
  agents: boolean;
  skills: boolean;
  all: boolean;
}

export async function updateCommand(options: UpdateOptions): Promise<void> {
  const projectDir = process.cwd();

  // Check if we're in a project directory
  if (!existsSync(join(projectDir, 'CLAUDE.md')) && !existsSync(join(projectDir, '.mcp.json'))) {
    console.error('Error: Not in an AI-EDA project directory');
    console.error('Run this command from a project created with "ai-eda init"');
    process.exit(1);
  }

  console.log('\nUpdating project templates...\n');

  const updateAll = options.all || (!options.commands && !options.agents && !options.skills);

  const templatesDir = getTemplatesDir();
  if (!templatesDir) {
    console.error('Error: Could not find templates directory');
    console.error('Make sure @ai-eda/toolkit is installed correctly');
    process.exit(1);
  }

  let updated = 0;

  // Update commands
  if (updateAll || options.commands) {
    const commandsDir = join(templatesDir, 'claude/commands');
    if (existsSync(commandsDir)) {
      const destDir = join(projectDir, '.claude/commands');
      mkdirSync(destDir, { recursive: true });
      const count = copyDirectory(commandsDir, destDir);
      console.log(`Updated ${count} command(s)`);
      updated += count;
    }
  }

  // Update agents
  if (updateAll || options.agents) {
    const agentsDir = join(templatesDir, 'claude/agents');
    if (existsSync(agentsDir)) {
      const destDir = join(projectDir, '.claude/agents');
      mkdirSync(destDir, { recursive: true });
      const count = copyDirectory(agentsDir, destDir);
      console.log(`Updated ${count} agent(s)`);
      updated += count;
    }
  }

  // Update skills
  if (updateAll || options.skills) {
    const skillsDir = join(templatesDir, 'claude/skills');
    if (existsSync(skillsDir)) {
      const destDir = join(projectDir, '.claude/skills');
      mkdirSync(destDir, { recursive: true });
      const count = copyDirectory(skillsDir, destDir);
      console.log(`Updated ${count} skill(s)`);
      updated += count;
    }
  }

  console.log(`\nTotal: ${updated} file(s) updated`);
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

function copyDirectory(src: string, dest: string): number {
  let count = 0;

  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  for (const entry of readdirSync(src)) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);

    if (statSync(srcPath).isDirectory()) {
      count += copyDirectory(srcPath, destPath);
    } else {
      const content = Bun.file(srcPath);
      Bun.write(destPath, content);
      count++;
    }
  }

  return count;
}
