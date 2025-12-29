/**
 * Export tools for KiCad MCP
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import {
  exportSchematicPdf,
  exportGerbers,
  exportDrills,
  exportBom,
  exportPositionFile,
  exportStep,
} from '../kicad/cli.js';

export const exportGerbersTool: Tool = {
  name: 'kicad_export_gerbers',
  description: 'Export Gerber files for PCB manufacturing.',
  inputSchema: {
    type: 'object',
    properties: {
      pcb_path: {
        type: 'string',
        description: 'Path to .kicad_pcb file',
      },
      output_dir: {
        type: 'string',
        description: 'Output directory for Gerber files',
      },
    },
    required: ['pcb_path'],
  },
};

export const exportDrillsTool: Tool = {
  name: 'kicad_export_drills',
  description: 'Export drill files for PCB manufacturing.',
  inputSchema: {
    type: 'object',
    properties: {
      pcb_path: {
        type: 'string',
        description: 'Path to .kicad_pcb file',
      },
      output_dir: {
        type: 'string',
        description: 'Output directory for drill files',
      },
    },
    required: ['pcb_path'],
  },
};

export const exportBomTool: Tool = {
  name: 'kicad_export_bom',
  description: 'Export Bill of Materials from schematic.',
  inputSchema: {
    type: 'object',
    properties: {
      schematic_path: {
        type: 'string',
        description: 'Path to .kicad_sch file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for BOM file',
      },
    },
    required: ['schematic_path'],
  },
};

export const exportPositionTool: Tool = {
  name: 'kicad_export_position',
  description: 'Export pick and place / component position file.',
  inputSchema: {
    type: 'object',
    properties: {
      pcb_path: {
        type: 'string',
        description: 'Path to .kicad_pcb file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for position file',
      },
    },
    required: ['pcb_path'],
  },
};

export const exportStepTool: Tool = {
  name: 'kicad_export_step',
  description: 'Export 3D STEP model of the PCB.',
  inputSchema: {
    type: 'object',
    properties: {
      pcb_path: {
        type: 'string',
        description: 'Path to .kicad_pcb file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for STEP file',
      },
    },
    required: ['pcb_path'],
  },
};

export const exportSchematicPdfTool: Tool = {
  name: 'kicad_export_schematic_pdf',
  description: 'Export schematic to PDF.',
  inputSchema: {
    type: 'object',
    properties: {
      schematic_path: {
        type: 'string',
        description: 'Path to .kicad_sch file',
      },
      output_path: {
        type: 'string',
        description: 'Output path for PDF file',
      },
    },
    required: ['schematic_path'],
  },
};

// Schemas
export const ExportGerbersParamsSchema = z.object({
  pcb_path: z.string().min(1),
  output_dir: z.string().optional(),
});

export const ExportDrillsParamsSchema = z.object({
  pcb_path: z.string().min(1),
  output_dir: z.string().optional(),
});

export const ExportBomParamsSchema = z.object({
  schematic_path: z.string().min(1),
  output_path: z.string().optional(),
});

export const ExportPositionParamsSchema = z.object({
  pcb_path: z.string().min(1),
  output_path: z.string().optional(),
});

export const ExportStepParamsSchema = z.object({
  pcb_path: z.string().min(1),
  output_path: z.string().optional(),
});

export const ExportSchematicPdfParamsSchema = z.object({
  schematic_path: z.string().min(1),
  output_path: z.string().optional(),
});

// Handlers
export async function handleExportGerbers(args: unknown) {
  const params = ExportGerbersParamsSchema.parse(args);

  if (!existsSync(params.pcb_path)) {
    return {
      content: [{
        type: 'text' as const,
        text: `PCB file not found: ${params.pcb_path}`,
      }],
      isError: true,
    };
  }

  const outputDir = params.output_dir || join(dirname(params.pcb_path), 'gerbers');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const result = await exportGerbers(params.pcb_path, outputDir);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_dir: outputDir,
        message: result.success ? 'Gerbers exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleExportDrills(args: unknown) {
  const params = ExportDrillsParamsSchema.parse(args);

  if (!existsSync(params.pcb_path)) {
    return {
      content: [{
        type: 'text' as const,
        text: `PCB file not found: ${params.pcb_path}`,
      }],
      isError: true,
    };
  }

  const outputDir = params.output_dir || join(dirname(params.pcb_path), 'gerbers');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  const result = await exportDrills(params.pcb_path, outputDir);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_dir: outputDir,
        message: result.success ? 'Drill files exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleExportBom(args: unknown) {
  const params = ExportBomParamsSchema.parse(args);

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
    join(dirname(params.schematic_path), `${basename(params.schematic_path, '.kicad_sch')}_bom.csv`);

  const result = await exportBom(params.schematic_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        message: result.success ? 'BOM exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleExportPosition(args: unknown) {
  const params = ExportPositionParamsSchema.parse(args);

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
    join(dirname(params.pcb_path), `${basename(params.pcb_path, '.kicad_pcb')}_pos.csv`);

  const result = await exportPositionFile(params.pcb_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        message: result.success ? 'Position file exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleExportStep(args: unknown) {
  const params = ExportStepParamsSchema.parse(args);

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
    join(dirname(params.pcb_path), `${basename(params.pcb_path, '.kicad_pcb')}.step`);

  const result = await exportStep(params.pcb_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        message: result.success ? 'STEP model exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}

export async function handleExportSchematicPdf(args: unknown) {
  const params = ExportSchematicPdfParamsSchema.parse(args);

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
    join(dirname(params.schematic_path), `${basename(params.schematic_path, '.kicad_sch')}.pdf`);

  const result = await exportSchematicPdf(params.schematic_path, outputPath);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: result.success,
        output_path: outputPath,
        message: result.success ? 'Schematic PDF exported successfully' : result.stderr,
      }, null, 2),
    }],
    isError: !result.success,
  };
}
