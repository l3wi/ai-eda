/**
 * Project management tools for KiCad MCP
 */

import { z } from 'zod';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { isKiCadAvailable, detectKiCadPaths } from '../kicad/paths.js';

export const checkInstallationTool: Tool = {
  name: 'kicad_check_installation',
  description: 'Check if KiCad is installed and available on the system.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const createProjectTool: Tool = {
  name: 'kicad_create_project',
  description: 'Create a new KiCad project with schematic and PCB files.',
  inputSchema: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
        description: 'Project name',
      },
      directory: {
        type: 'string',
        description: 'Directory to create project in',
      },
    },
    required: ['name', 'directory'],
  },
};

export const listProjectsTool: Tool = {
  name: 'kicad_list_projects',
  description: 'List KiCad projects in a directory.',
  inputSchema: {
    type: 'object',
    properties: {
      directory: {
        type: 'string',
        description: 'Directory to search',
      },
    },
    required: ['directory'],
  },
};

export const getProjectInfoTool: Tool = {
  name: 'kicad_get_project_info',
  description: 'Get information about a KiCad project.',
  inputSchema: {
    type: 'object',
    properties: {
      project_path: {
        type: 'string',
        description: 'Path to .kicad_pro file or project directory',
      },
    },
    required: ['project_path'],
  },
};

// Schemas
export const CreateProjectParamsSchema = z.object({
  name: z.string().min(1),
  directory: z.string().min(1),
});

export const ListProjectsParamsSchema = z.object({
  directory: z.string().min(1),
});

export const GetProjectInfoParamsSchema = z.object({
  project_path: z.string().min(1),
});

// Handlers
export async function handleCheckInstallation() {
  const available = isKiCadAvailable();
  const paths = detectKiCadPaths();

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        available,
        paths: paths ? {
          cli: paths.cli,
          libraries: paths.libraries,
          userLibraries: paths.userLibraries,
        } : null,
      }, null, 2),
    }],
  };
}

export async function handleCreateProject(args: unknown) {
  const params = CreateProjectParamsSchema.parse(args);
  const projectDir = join(params.directory, params.name);

  // Create project directory
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }

  // Create minimal project file
  const projectFile = join(projectDir, `${params.name}.kicad_pro`);
  const projectContent = JSON.stringify({
    meta: {
      filename: `${params.name}.kicad_pro`,
      version: 1,
    },
    schematic: {
      legacy_lib_dir: '',
      legacy_lib_list: [],
    },
  }, null, 2);
  writeFileSync(projectFile, projectContent);

  // Create minimal schematic file
  const schematicFile = join(projectDir, `${params.name}.kicad_sch`);
  const schematicContent = `(kicad_sch
  (version 20230121)
  (generator "ai-eda-kicad-mcp")
  (uuid "${generateUUID()}")
  (paper "A4")
  (lib_symbols)
  (symbol_instances)
)`;
  writeFileSync(schematicFile, schematicContent);

  // Create minimal PCB file
  const pcbFile = join(projectDir, `${params.name}.kicad_pcb`);
  const pcbContent = `(kicad_pcb
  (version 20230121)
  (generator "ai-eda-kicad-mcp")
  (general
    (thickness 1.6)
  )
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user "B.Adhesive")
    (33 "F.Adhes" user "F.Adhesive")
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user "B.Silkscreen")
    (37 "F.SilkS" user "F.Silkscreen")
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (40 "Dwgs.User" user "User.Drawings")
    (41 "Cmts.User" user "User.Comments")
    (42 "Eco1.User" user "User.Eco1")
    (43 "Eco2.User" user "User.Eco2")
    (44 "Edge.Cuts" user)
    (45 "Margin" user)
    (46 "B.CrtYd" user "B.Courtyard")
    (47 "F.CrtYd" user "F.Courtyard")
    (48 "B.Fab" user)
    (49 "F.Fab" user)
  )
  (setup
    (stackup
      (layer "F.SilkS" (type "Top Silk Screen"))
      (layer "F.Paste" (type "Top Solder Paste"))
      (layer "F.Mask" (type "Top Solder Mask") (thickness 0.01))
      (layer "F.Cu" (type "copper") (thickness 0.035))
      (layer "dielectric 1" (type "core") (thickness 1.51) (material "FR4") (epsilon_r 4.5) (loss_tangent 0.02))
      (layer "B.Cu" (type "copper") (thickness 0.035))
      (layer "B.Mask" (type "Bottom Solder Mask") (thickness 0.01))
      (layer "B.Paste" (type "Bottom Solder Paste"))
      (layer "B.SilkS" (type "Bottom Silk Screen"))
    )
  )
  (net 0 "")
)`;
  writeFileSync(pcbFile, pcbContent);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({
        success: true,
        project: {
          directory: projectDir,
          files: {
            project: projectFile,
            schematic: schematicFile,
            pcb: pcbFile,
          },
        },
      }, null, 2),
    }],
  };
}

export async function handleListProjects(args: unknown) {
  const params = ListProjectsParamsSchema.parse(args);

  if (!existsSync(params.directory)) {
    return {
      content: [{
        type: 'text' as const,
        text: `Directory not found: ${params.directory}`,
      }],
      isError: true,
    };
  }

  const projects: Array<{ name: string; path: string }> = [];

  function findProjects(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.kicad_pro')) {
        projects.push({
          name: basename(entry.name, '.kicad_pro'),
          path: join(dir, entry.name),
        });
      } else if (entry.isDirectory() && !entry.name.startsWith('.')) {
        findProjects(join(dir, entry.name));
      }
    }
  }

  findProjects(params.directory);

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify({ projects }, null, 2),
    }],
  };
}

export async function handleGetProjectInfo(args: unknown) {
  const params = GetProjectInfoParamsSchema.parse(args);
  let projectPath = params.project_path;

  // If directory, look for .kicad_pro file
  if (existsSync(projectPath) && !projectPath.endsWith('.kicad_pro')) {
    const entries = readdirSync(projectPath);
    const proFile = entries.find((f) => f.endsWith('.kicad_pro'));
    if (proFile) {
      projectPath = join(projectPath, proFile);
    }
  }

  if (!existsSync(projectPath)) {
    return {
      content: [{
        type: 'text' as const,
        text: `Project not found: ${projectPath}`,
      }],
      isError: true,
    };
  }

  const projectDir = dirname(projectPath);
  const projectName = basename(projectPath, '.kicad_pro');

  const info = {
    name: projectName,
    directory: projectDir,
    files: {
      project: projectPath,
      schematic: existsSync(join(projectDir, `${projectName}.kicad_sch`))
        ? join(projectDir, `${projectName}.kicad_sch`)
        : null,
      pcb: existsSync(join(projectDir, `${projectName}.kicad_pcb`))
        ? join(projectDir, `${projectName}.kicad_pcb`)
        : null,
    },
  };

  return {
    content: [{
      type: 'text' as const,
      text: JSON.stringify(info, null, 2),
    }],
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
