/**
 * KiCad CLI wrapper
 * Wraps kicad-cli commands for schematic and PCB operations
 */

import { spawn } from 'child_process';
import { createLogger } from '@ai-eda/common';
import { getKiCadCliPath } from './paths.js';

const logger = createLogger('kicad-cli');

export interface CliResult {
  success: boolean;
  stdout: string;
  stderr: string;
  code: number | null;
}

export interface ExportOptions {
  outputDir?: string;
  layers?: string[];
}

/**
 * Execute a KiCad CLI command
 */
export async function execKiCadCli(args: string[]): Promise<CliResult> {
  const cliPath = getKiCadCliPath();

  if (!cliPath) {
    return {
      success: false,
      stdout: '',
      stderr: 'KiCad CLI not found. Please install KiCad.',
      code: 1,
    };
  }

  return new Promise((resolve) => {
    logger.debug(`Executing: ${cliPath} ${args.join(' ')}`);

    const proc = spawn(cliPath, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (code) => {
      resolve({
        success: code === 0,
        stdout,
        stderr,
        code,
      });
    });

    proc.on('error', (error) => {
      resolve({
        success: false,
        stdout,
        stderr: error.message,
        code: null,
      });
    });
  });
}

/**
 * Export schematic to PDF
 */
export async function exportSchematicPdf(
  schematicPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'sch',
    'export',
    'pdf',
    '--output', outputPath,
    schematicPath,
  ]);
}

/**
 * Export schematic to SVG
 */
export async function exportSchematicSvg(
  schematicPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'sch',
    'export',
    'svg',
    '--output', outputPath,
    schematicPath,
  ]);
}

/**
 * Export PCB to Gerber files
 */
export async function exportGerbers(
  pcbPath: string,
  outputDir: string,
  options: ExportOptions = {}
): Promise<CliResult> {
  const args = [
    'pcb',
    'export',
    'gerbers',
    '--output', outputDir,
  ];

  if (options.layers && options.layers.length > 0) {
    args.push('--layers', options.layers.join(','));
  }

  args.push(pcbPath);

  return execKiCadCli(args);
}

/**
 * Export PCB drill files
 */
export async function exportDrills(
  pcbPath: string,
  outputDir: string
): Promise<CliResult> {
  return execKiCadCli([
    'pcb',
    'export',
    'drill',
    '--output', outputDir,
    pcbPath,
  ]);
}

/**
 * Export BOM from schematic
 */
export async function exportBom(
  schematicPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'sch',
    'export',
    'bom',
    '--output', outputPath,
    schematicPath,
  ]);
}

/**
 * Export pick and place file
 */
export async function exportPositionFile(
  pcbPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'pcb',
    'export',
    'pos',
    '--output', outputPath,
    '--format', 'csv',
    pcbPath,
  ]);
}

/**
 * Export 3D STEP model
 */
export async function exportStep(
  pcbPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'pcb',
    'export',
    'step',
    '--output', outputPath,
    pcbPath,
  ]);
}

/**
 * Run DRC check
 */
export async function runDrc(
  pcbPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'pcb',
    'drc',
    '--output', outputPath,
    pcbPath,
  ]);
}

/**
 * Run ERC check
 */
export async function runErc(
  schematicPath: string,
  outputPath: string
): Promise<CliResult> {
  return execKiCadCli([
    'sch',
    'erc',
    '--output', outputPath,
    schematicPath,
  ]);
}
