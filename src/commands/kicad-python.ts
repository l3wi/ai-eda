/**
 * KiCad Python library installation and management
 *
 * Handles installation of kicad-python package to KiCad's bundled Python.
 * Required for IPC backend communication with running KiCad instances.
 * Without it, KiCad MCP falls back to SWIG backend (file-based only).
 *
 * Source: https://github.com/adamwolf/kicad-python
 */

import { existsSync } from 'fs';
import { join } from 'path';
import { platform } from 'os';
import chalk from 'chalk';
import ora from 'ora';

const KICAD_PYTHON_PACKAGE = 'kicad-python';

export interface KicadBundledPythonPaths {
  pythonPath: string;
  pipPath: string;
}

/**
 * Get the paths for KiCad's bundled Python based on platform
 */
export function getKicadBundledPythonPaths(): KicadBundledPythonPaths | null {
  const plat = platform();

  if (plat === 'darwin') {
    // macOS: KiCad bundles Python in the app framework
    const frameworkBase = '/Applications/KiCad/KiCad.app/Contents/Frameworks/Python.framework/Versions';

    // Try Current symlink first, then specific versions
    const versionPaths = ['Current', '3.11', '3.10', '3.9'];

    for (const version of versionPaths) {
      const pythonPath = join(frameworkBase, version, 'bin', 'python3');
      const pipPath = join(frameworkBase, version, 'bin', 'pip3');

      if (existsSync(pythonPath)) {
        return { pythonPath, pipPath };
      }
    }

    return null;
  } else if (plat === 'win32') {
    // Windows: KiCad installs Python alongside the application
    const kicadVersions = ['9.0', '8.0', '8.99'];
    const basePaths = [
      'C:\\Program Files\\KiCad',
      'C:\\Program Files (x86)\\KiCad',
    ];

    for (const base of basePaths) {
      for (const version of kicadVersions) {
        const pythonPath = join(base, version, 'bin', 'python.exe');
        const pipPath = join(base, version, 'bin', 'pip.exe');

        if (existsSync(pythonPath)) {
          return { pythonPath, pipPath };
        }
      }
    }

    return null;
  } else {
    // Linux: KiCad typically uses system Python, check for common locations
    const pythonPaths = [
      '/usr/bin/python3',
      '/usr/local/bin/python3',
    ];

    for (const pythonPath of pythonPaths) {
      if (existsSync(pythonPath)) {
        // On Linux, pip is usually pip3 or python3 -m pip
        return { pythonPath, pipPath: 'pip3' };
      }
    }

    return null;
  }
}

/**
 * Check if kicad-python is installed in KiCad's bundled Python
 */
export async function isKicadPythonInstalled(): Promise<{
  installed: boolean;
  pythonPaths: KicadBundledPythonPaths | null;
}> {
  const pythonPaths = getKicadBundledPythonPaths();

  if (!pythonPaths) {
    return { installed: false, pythonPaths: null };
  }

  try {
    const { execSync } = await import('child_process');

    // kicad-python package provides the 'kipy' module
    execSync(`"${pythonPaths.pythonPath}" -c "import kipy"`, {
      stdio: 'pipe',
      timeout: 10000,
    });

    return { installed: true, pythonPaths };
  } catch {
    return { installed: false, pythonPaths };
  }
}

/**
 * Install kicad-python to KiCad's bundled Python
 */
export async function installKicadPython(options: { verbose?: boolean } = {}): Promise<boolean> {
  const { execSync } = await import('child_process');
  const pythonPaths = getKicadBundledPythonPaths();

  if (!pythonPaths) {
    console.error(chalk.red('Error: Could not find KiCad bundled Python'));
    console.error(chalk.dim('Make sure KiCad is installed'));
    return false;
  }

  // Install kicad-python using pip
  const installSpinner = ora(`Installing ${KICAD_PYTHON_PACKAGE}...`).start();
  try {
    // Use python -m pip for more reliable pip execution
    const installCmd = `"${pythonPaths.pythonPath}" -m pip install ${KICAD_PYTHON_PACKAGE}`;

    execSync(installCmd, {
      stdio: options.verbose ? 'inherit' : 'pipe',
      timeout: 120000, // 2 minute timeout
    });

    installSpinner.succeed(`Installed ${KICAD_PYTHON_PACKAGE}`);
  } catch (error) {
    installSpinner.fail(`Failed to install ${KICAD_PYTHON_PACKAGE}`);
    if (options.verbose && error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    console.error(chalk.dim('You may need to run with sudo or fix permissions'));
    return false;
  }

  // Verify installation - kicad-python provides the 'kipy' module
  const verifySpinner = ora('Verifying installation...').start();
  try {
    execSync(`"${pythonPaths.pythonPath}" -c "import kipy"`, {
      stdio: 'pipe',
      timeout: 10000,
    });
    verifySpinner.succeed('Installation verified');
  } catch (error) {
    verifySpinner.fail('Installation verification failed');
    if (options.verbose && error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
    return false;
  }

  console.log('');
  console.log(chalk.green.bold(`✓ ${KICAD_PYTHON_PACKAGE} installed successfully`));
  console.log(chalk.dim(`  Python: ${pythonPaths.pythonPath}`));
  console.log(chalk.dim('  IPC backend now available for KiCad MCP'));
  console.log('');

  return true;
}

/**
 * CLI command to install/check kicad-python
 */
export async function kicadPythonCommand(options: {
  install?: boolean;
  status?: boolean;
}): Promise<void> {
  console.log(chalk.bold('\nKiCad Python Library Management\n'));

  const { installed, pythonPaths } = await isKicadPythonInstalled();

  // Status check (default action)
  if (options.status || !options.install) {
    if (pythonPaths) {
      console.log(`${chalk.dim('Python Path:')} ${pythonPaths.pythonPath}`);
    } else {
      console.log(`${chalk.dim('Python Path:')} ${chalk.red('Not found')}`);
    }
    console.log(`${chalk.dim('Installed:')} ${installed ? chalk.green('Yes') : chalk.yellow('No')}`);

    console.log('');

    if (!installed) {
      if (pythonPaths) {
        console.log(chalk.yellow('To install, run:'));
        console.log(chalk.cyan('  claude-eda kicad-python --install'));
      } else {
        console.log(chalk.red('KiCad bundled Python not found.'));
        console.log(chalk.dim('Make sure KiCad is installed first.'));
      }
      console.log('');
    } else {
      console.log(chalk.green('IPC backend is available for KiCad MCP server.'));
      console.log('');
    }

    return;
  }

  // Install
  if (options.install) {
    await installKicadPython({ verbose: false });
    return;
  }
}
