/**
 * Doctor command - Check environment setup
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'warn' | 'fail';
  message: string;
}

export async function doctorCommand(): Promise<void> {
  console.log('\nChecking AI-EDA environment...\n');

  const results: CheckResult[] = [];

  // Check KiCad
  results.push(await checkKiCad());

  // Check Bun
  results.push(await checkBun());

  // Check Node/npm (for npx)
  results.push(await checkNode());

  // Check current project structure
  results.push(checkProjectStructure());

  // Print results
  for (const result of results) {
    const icon = result.status === 'pass' ? '✓' : result.status === 'warn' ? '⚠' : '✗';
    const color = result.status === 'pass' ? '\x1b[32m' : result.status === 'warn' ? '\x1b[33m' : '\x1b[31m';
    console.log(`${color}${icon}\x1b[0m ${result.name}: ${result.message}`);
  }

  const failures = results.filter((r) => r.status === 'fail');
  const warnings = results.filter((r) => r.status === 'warn');

  console.log('');
  if (failures.length > 0) {
    console.log(`\x1b[31m${failures.length} check(s) failed\x1b[0m`);
  }
  if (warnings.length > 0) {
    console.log(`\x1b[33m${warnings.length} warning(s)\x1b[0m`);
  }
  if (failures.length === 0 && warnings.length === 0) {
    console.log('\x1b[32mAll checks passed!\x1b[0m');
  }
}

async function checkKiCad(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');

    // Try to find kicad-cli
    const paths = [
      '/Applications/KiCad/KiCad.app/Contents/MacOS/kicad-cli',
      '/usr/bin/kicad-cli',
      '/usr/local/bin/kicad-cli',
      'C:\\Program Files\\KiCad\\bin\\kicad-cli.exe',
    ];

    for (const p of paths) {
      if (existsSync(p)) {
        try {
          const version = execSync(`"${p}" --version`, { encoding: 'utf-8' }).trim();
          return {
            name: 'KiCad',
            status: 'pass',
            message: `Found at ${p} (${version})`,
          };
        } catch {
          continue;
        }
      }
    }

    // Try PATH
    try {
      const version = execSync('kicad-cli --version', { encoding: 'utf-8' }).trim();
      return {
        name: 'KiCad',
        status: 'pass',
        message: `Found in PATH (${version})`,
      };
    } catch {
      // Not found
    }

    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Not found. Install KiCad 8.0+ for full functionality.',
    };
  } catch {
    return {
      name: 'KiCad',
      status: 'warn',
      message: 'Could not check. Install KiCad 8.0+ for full functionality.',
    };
  }
}

async function checkBun(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    const version = execSync('bun --version', { encoding: 'utf-8' }).trim();
    return {
      name: 'Bun',
      status: 'pass',
      message: `v${version}`,
    };
  } catch {
    return {
      name: 'Bun',
      status: 'warn',
      message: 'Not found. Bun is recommended but not required.',
    };
  }
}

async function checkNode(): Promise<CheckResult> {
  try {
    const { execSync } = await import('child_process');
    const version = execSync('node --version', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0]);

    if (major >= 18) {
      return {
        name: 'Node.js',
        status: 'pass',
        message: version,
      };
    } else {
      return {
        name: 'Node.js',
        status: 'warn',
        message: `${version} (v18+ recommended)`,
      };
    }
  } catch {
    return {
      name: 'Node.js',
      status: 'fail',
      message: 'Not found. Node.js 18+ is required.',
    };
  }
}

function checkProjectStructure(): CheckResult {
  const cwd = process.cwd();

  // Check if we're in a project directory
  if (existsSync(join(cwd, 'CLAUDE.md')) || existsSync(join(cwd, '.mcp.json'))) {
    const hasClaude = existsSync(join(cwd, '.claude'));
    const hasHardware = existsSync(join(cwd, 'hardware'));

    if (hasClaude && hasHardware) {
      return {
        name: 'Project Structure',
        status: 'pass',
        message: 'Valid AI-EDA project detected',
      };
    } else {
      return {
        name: 'Project Structure',
        status: 'warn',
        message: 'Partial project structure. Run "ai-eda init" to create a new project.',
      };
    }
  }

  return {
    name: 'Project Structure',
    status: 'warn',
    message: 'Not in an AI-EDA project. Use "ai-eda init <name>" to create one.',
  };
}
