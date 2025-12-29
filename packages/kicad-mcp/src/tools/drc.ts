/**
 * Design Rule Check (DRC) and Electrical Rule Check (ERC) tools
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync } from 'fs';
import { join, dirname, basename } from 'path';
import { runDrc, runErc } from '../kicad/cli.js';

export const runDrcTool: Tool = {
  name: 'kicad_run_drc',
  description: 'Run Design Rule Check on a PCB layout.',
  inputSchema: {
    type: 'object',
    properties: {
      pcb_path: {
        type: 'string',
        description: 'Path to .kicad_pcb file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for DRC report',
      },
    },
    required: ['pcb_path'],
  },
};

export const runErcTool: Tool = {
  name: 'kicad_run_erc',
  description: 'Run Electrical Rule Check on a schematic.',
  inputSchema: {
    type: 'object',
    properties: {
      schematic_path: {
        type: 'string',
        description: 'Path to .kicad_sch file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for ERC report',
      },
    },
    required: ['schematic_path'],
  },
};

// Schemas
export const RunDrcParamsSchema = z.object({
  pcb_path: z.string().min(1),
  output_path: z.string().optional(),
});

export const RunErcParamsSchema = z.object({
  schematic_path: z.string().min(1),
  output_path: z.string().optional(),
});

// Handlers
export async function handleRunDrc(args: unknown) {
  const params = RunDrcParamsSchema.parse(args);

  if (!existsSync(params.pcb_path)) {
    return {
      content: [{
        type: 'text' as const,
        text: `PCB file not found: ${params.pcb_path}`,
      }],
      isError: true,
    };
  }

  const outputPath = params.output_path ||
    join(dirname(params.pcb_path), `${basename(params.pcb_path, '.kicad_pcb')}_drc.rpt`);

  const result = await runDrc(params.pcb_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        stdout: result.stdout,
        message: result.success ? 'DRC completed' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleRunErc(args: unknown) {
  const params = RunErcParamsSchema.parse(args);

  if (!existsSync(params.schematic_path)) {
    return {
      content: [{
        type: 'text' as const,
        text: `Schematic file not found: ${params.schematic_path}`,
      }],
      isError: true,
    };
  }

  const outputPath = params.output_path ||
    join(dirname(params.schematic_path), `${basename(params.schematic_path, '.kicad_sch')}_erc.rpt`);

  const result = await runErc(params.schematic_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        stdout: result.stdout,
        message: result.success ? 'ERC completed' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}
