# @ai-eda Monorepo Implementation Plan

## Project Overview

Build a comprehensive EDA (Electronic Design Automation) toolkit for Claude Code that enables AI-assisted PCB and schematic design workflows. The toolkit integrates with KiCad, LCSC/EasyEDA component libraries, and provides specialized agents for each phase of the design process.

**Repository**: `@ai-eda` npm organization (secured)
**Runtime**: Bun
**Architecture**: Monorepo with Bun workspaces

---

## Phase 1: Monorepo Scaffolding

### 1.1 Initialize Repository Structure

```
ai-eda/
├── package.json                 # Workspace root
├── bunfig.toml                  # Bun configuration
├── turbo.json                   # Turborepo config (optional, for build orchestration)
├── tsconfig.json                # Base TypeScript config
├── .gitignore
├── .npmrc
├── LICENSE                      # MIT
├── README.md
│
├── packages/
│   ├── toolkit/                 # @ai-eda/toolkit - Main CLI
│   ├── kicad-mcp/              # @ai-eda/kicad-mcp - KiCad MCP server
│   ├── lcsc-mcp/               # @ai-eda/lcsc-mcp - LCSC + EasyEDA MCP server
│   └── common/                  # @ai-eda/common - Shared types/utils
│
├── templates/                   # Template files for project initialization
│   ├── claude/
│   │   ├── commands/
│   │   ├── agents/
│   │   └── skills/
│   ├── project-files/
│   └── claude-md/
│
└── docs/                        # Documentation
    ├── getting-started.md
    ├── commands-reference.md
    └── mcp-api.md
```

### 1.2 Root package.json

```json
{
  "name": "ai-eda",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "bun run --filter '*' build",
    "test": "bun run --filter '*' test",
    "lint": "bun run --filter '*' lint",
    "typecheck": "bun run --filter '*' typecheck",
    "clean": "bun run --filter '*' clean",
    "publish-all": "bun run build && changeset publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0",
    "@types/bun": "latest",
    "typescript": "^5.3.0",
    "prettier": "^3.2.0",
    "eslint": "^8.56.0"
  }
}
```

### 1.3 TypeScript Base Config

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": false,
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
```

---

## Phase 2: @ai-eda/common Package

### 2.1 Purpose
Shared TypeScript types, utilities, and constants used across all packages.

### 2.2 Structure

```
packages/common/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   ├── component.ts      # Component/part types
│   │   ├── kicad.ts          # KiCad-specific types
│   │   ├── lcsc.ts           # LCSC API response types
│   │   ├── easyeda.ts        # EasyEDA format types
│   │   ├── project.ts        # Project structure types
│   │   └── mcp.ts            # MCP protocol types
│   ├── utils/
│   │   ├── index.ts
│   │   ├── file-system.ts    # File operations helpers
│   │   ├── conversion.ts     # Unit conversions (mil/mm/inch)
│   │   ├── validation.ts     # Schema validation helpers
│   │   └── logger.ts         # Consistent logging
│   └── constants/
│       ├── index.ts
│       ├── kicad.ts          # KiCad layer names, defaults
│       ├── footprints.ts     # Standard footprint patterns
│       └── design-rules.ts   # Default DRC rules
```

### 2.3 Key Types to Define

```typescript
// types/component.ts
export interface Component {
  lcscPartNumber: string;        // e.g., "C2040"
  manufacturerPart: string;      // e.g., "STM32F103C8T6"
  manufacturer: string;
  description: string;
  category: string;
  subcategory: string;
  package: string;
  stock: number;
  price: PriceTier[];
  datasheet?: string;
  footprint?: FootprintRef;
  symbol?: SymbolRef;
}

export interface PriceTier {
  quantity: number;
  price: number;
  currency: string;
}

export interface FootprintRef {
  source: 'easyeda' | 'kicad' | 'local';
  id: string;
  localPath?: string;
}

export interface SymbolRef {
  source: 'easyeda' | 'kicad' | 'local';
  id: string;
  localPath?: string;
}

// types/project.ts
export interface EDAProject {
  name: string;
  version: string;
  created: string;
  modified: string;
  constraints: DesignConstraints;
  components: ComponentSelection[];
  status: ProjectStatus;
}

export interface DesignConstraints {
  boardSize?: { width: number; height: number; unit: 'mm' | 'inch' };
  layers: number;
  powerSource: PowerSourceSpec;
  interfaces: InterfaceSpec[];
  environment?: EnvironmentSpec;
  manufacturingClass?: number;  // IPC class 1/2/3
}

export interface ComponentSelection {
  role: string;                  // e.g., "Main MCU", "Power Regulator"
  selected?: Component;
  alternatives?: Component[];
  requirements: string[];
  status: 'pending' | 'selected' | 'placed' | 'routed';
}

// types/kicad.ts
export interface KiCadSymbol {
  name: string;
  library: string;
  pins: PinDefinition[];
  properties: Record<string, string>;
}

export interface KiCadFootprint {
  name: string;
  library: string;
  pads: PadDefinition[];
  layers: string[];
  courtyard: BoundingBox;
  properties: Record<string, string>;
}

export interface KiCadSchematic {
  version: string;
  components: SchematicComponent[];
  wires: Wire[];
  labels: NetLabel[];
  sheets: SchematicSheet[];
}

// types/easyeda.ts
export interface EasyEDAComponent {
  uuid: string;
  lcsc: string;
  title: string;
  description: string;
  symbol: EasyEDASymbol;
  footprint: EasyEDAFootprint;
  attributes: Record<string, string>;
}

export interface EasyEDASymbol {
  // EasyEDA JSON format fields
  docType: string;
  head: object;
  canvas: string;
  shape: string[];
}

export interface EasyEDAFootprint {
  docType: string;
  head: object;
  canvas: string;
  shape: string[];
}
```

### 2.4 package.json

```json
{
  "name": "@ai-eda/common",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./types": {
      "types": "./dist/types/index.d.ts",
      "import": "./dist/types/index.js"
    },
    "./utils": {
      "types": "./dist/utils/index.d.ts",
      "import": "./dist/utils/index.js"
    }
  },
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

---

## Phase 3: @ai-eda/kicad-mcp Package

### 3.1 Purpose
MCP server for KiCad automation. Fork and extend https://github.com/mixelpixx/KiCAD-MCP-Server

### 3.2 Structure

```
packages/kicad-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # MCP server setup
│   ├── tools/
│   │   ├── index.ts
│   │   ├── project.ts        # Project management tools
│   │   ├── schematic.ts      # Schematic manipulation
│   │   ├── pcb.ts            # PCB layout tools
│   │   ├── library.ts        # Library management
│   │   ├── export.ts         # Gerber/BOM/position file export
│   │   ├── drc.ts            # Design rule checking
│   │   └── screenshot.ts     # Visual capture for AI analysis
│   ├── kicad/
│   │   ├── cli.ts            # KiCad CLI wrapper (kicad-cli)
│   │   ├── parser.ts         # .kicad_sch/.kicad_pcb file parsing
│   │   ├── writer.ts         # File writing/modification
│   │   └── python-bridge.ts  # Bridge to KiCad Python API if needed
│   └── utils/
│       ├── process.ts        # Process spawning helpers
│       └── paths.ts          # KiCad installation detection
```

### 3.3 MCP Tools to Implement

Reference the existing KiCad MCP and extend with:

```typescript
// Core tools from fork:
- create_project
- open_project
- save_project
- get_project_info
- set_board_size
- add_layer
- get_board_info
- place_component
- move_component
- rotate_component
- delete_component
- route_trace
- add_via
- add_zone
- run_drc
- export_gerber
- export_bom
- get_board_2d_view (screenshot)

// Additional tools to implement:
export const additionalTools = {
  // Library Management
  "library:list": "List available symbol/footprint libraries",
  "library:search": "Search for component in libraries",
  "library:add_symbol": "Add symbol to project library",
  "library:add_footprint": "Add footprint to project library",
  "library:import_easyeda": "Import EasyEDA component (calls lcsc-mcp)",
  
  // Schematic Tools
  "schematic:create_sheet": "Create new schematic sheet",
  "schematic:add_net_label": "Add net label at position",
  "schematic:connect_pins": "Connect two component pins",
  "schematic:add_power_symbol": "Add power/ground symbol",
  "schematic:run_erc": "Run electrical rules check",
  "schematic:get_unconnected": "List unconnected pins",
  "schematic:annotate": "Auto-annotate component references",
  "schematic:organize_page": "Reorganize components on page",
  
  // PCB Tools  
  "pcb:set_stackup": "Define layer stackup",
  "pcb:add_mounting_hole": "Add mounting hole",
  "pcb:set_design_rules": "Set DRC rules",
  "pcb:create_zone": "Create copper pour zone",
  "pcb:auto_place": "Auto-place components (basic)",
  "pcb:get_ratsnest": "Get unrouted connections",
  "pcb:check_placement": "Validate component placement",
  
  // Analysis Tools
  "analysis:screenshot": "Capture board/schematic image",
  "analysis:get_statistics": "Get board statistics (trace length, via count, etc)",
  "analysis:check_clearances": "Check specific clearance violations",
  
  // Export Tools
  "export:gerber_zip": "Export Gerbers as ZIP for manufacturing",
  "export:pick_place": "Export pick and place file",
  "export:step": "Export 3D STEP model",
  "export:pdf": "Export schematic/PCB as PDF"
};
```

### 3.4 package.json

```json
{
  "name": "@ai-eda/kicad-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "ai-eda-kicad-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "start": "bun run ./src/index.ts",
    "dev": "bun --watch ./src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@ai-eda/common": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  }
}
```

---

## Phase 4: @ai-eda/lcsc-mcp Package

### 4.1 Purpose
Combined LCSC and EasyEDA MCP server for component sourcing, library fetching, and conversion to KiCad format.

### 4.2 Key References
- https://github.com/uPesy/easyeda2kicad.py - Conversion logic
- https://github.com/Yanndroid/KiCAD-EasyEDA-Parts - Additional reference
- https://github.com/Steffen-W/Import-LIB-KiCad-Plugin - Import patterns

### 4.3 Structure

```
packages/lcsc-mcp/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── server.ts             # MCP server setup
│   ├── tools/
│   │   ├── index.ts
│   │   ├── search.ts         # Component search
│   │   ├── details.ts        # Get component details
│   │   ├── stock.ts          # Stock/pricing info
│   │   ├── datasheet.ts      # Datasheet download
│   │   ├── library.ts        # Fetch symbol/footprint
│   │   └── convert.ts        # Convert to KiCad format
│   ├── api/
│   │   ├── lcsc.ts           # LCSC API client
│   │   ├── easyeda.ts        # EasyEDA API client
│   │   └── types.ts          # API response types
│   ├── converter/
│   │   ├── index.ts
│   │   ├── symbol.ts         # EasyEDA symbol -> KiCad symbol
│   │   ├── footprint.ts      # EasyEDA footprint -> KiCad footprint
│   │   ├── 3dmodel.ts        # 3D model handling
│   │   └── parser.ts         # EasyEDA JSON parsing
│   └── cache/
│       ├── index.ts
│       ├── component-cache.ts # Cache component data
│       └── library-cache.ts   # Cache converted libraries
```

### 4.4 API Integration

```typescript
// api/lcsc.ts
export class LCSCClient {
  private baseUrl = 'https://www.lcsc.com';
  private easyedaApi = 'https://easyeda.com/api';
  
  // Search for components
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  
  // Get component details by LCSC part number
  async getComponent(lcscPartNumber: string): Promise<ComponentDetails>;
  
  // Get current stock and pricing
  async getStock(lcscPartNumber: string): Promise<StockInfo>;
  
  // Get datasheet URL (and optionally download)
  async getDatasheet(lcscPartNumber: string, download?: boolean): Promise<DatasheetResult>;
  
  // Get EasyEDA component UUID from LCSC part number
  async getEasyEDAUuid(lcscPartNumber: string): Promise<string>;
}

// api/easyeda.ts
export class EasyEDAClient {
  private baseUrl = 'https://easyeda.com/api';
  
  // Search EasyEDA component library
  async searchComponents(query: string): Promise<EasyEDASearchResult[]>;
  
  // Get component symbol/footprint data
  async getComponentData(uuid: string): Promise<EasyEDAComponent>;
  
  // Get raw symbol JSON
  async getSymbol(uuid: string): Promise<EasyEDASymbol>;
  
  // Get raw footprint JSON  
  async getFootprint(uuid: string): Promise<EasyEDAFootprint>;
  
  // Get 3D model if available
  async get3DModel(uuid: string): Promise<Model3D | null>;
}
```

### 4.5 Converter Implementation

Port the conversion logic from easyeda2kicad.py to TypeScript:

```typescript
// converter/symbol.ts
export class SymbolConverter {
  /**
   * Convert EasyEDA symbol JSON to KiCad symbol format (.kicad_sym)
   */
  convert(easyedaSymbol: EasyEDASymbol, options: ConversionOptions): KiCadSymbol {
    // Parse EasyEDA shape strings
    // Map pin types and positions
    // Generate KiCad S-expression format
    // Handle unit conversions (EasyEDA uses 10mil grid, KiCad uses mm)
  }
  
  // Parse EasyEDA shape string format
  private parseShapes(shapes: string[]): ParsedShape[];
  
  // Convert pin from EasyEDA to KiCad format
  private convertPin(pin: EasyEDAPin): KiCadPin;
  
  // Generate .kicad_sym file content
  generateFile(symbol: KiCadSymbol): string;
}

// converter/footprint.ts
export class FootprintConverter {
  /**
   * Convert EasyEDA footprint JSON to KiCad footprint format (.kicad_mod)
   */
  convert(easyedaFootprint: EasyEDAFootprint, options: ConversionOptions): KiCadFootprint {
    // Parse pad definitions
    // Convert silkscreen graphics
    // Handle courtyard generation
    // Map layer names
  }
  
  // Convert pad from EasyEDA to KiCad format
  private convertPad(pad: EasyEDAPad): KiCadPad;
  
  // Convert graphic elements (lines, arcs, circles)
  private convertGraphics(shapes: string[]): KiCadGraphic[];
  
  // Generate .kicad_mod file content
  generateFile(footprint: KiCadFootprint): string;
}
```

### 4.6 MCP Tools

```typescript
export const lcscTools = {
  // Search & Discovery
  "component:search": {
    description: "Search LCSC/EasyEDA for components",
    parameters: {
      query: "string - search query (part number, description, etc)",
      category: "string? - filter by category",
      inStock: "boolean? - only show in-stock items",
      limit: "number? - max results (default 20)"
    },
    returns: "Array of component summaries with LCSC part numbers"
  },
  
  "component:details": {
    description: "Get detailed info for a specific component",
    parameters: {
      lcscPartNumber: "string - e.g., 'C2040'"
    },
    returns: "Full component details including specs, stock, pricing"
  },
  
  "component:stock": {
    description: "Get current stock levels and pricing tiers",
    parameters: {
      lcscPartNumber: "string or string[] - one or more part numbers"
    },
    returns: "Stock quantities and price breaks"
  },
  
  // Datasheet Management
  "datasheet:get": {
    description: "Get datasheet URL for component",
    parameters: {
      lcscPartNumber: "string"
    },
    returns: "Datasheet URL"
  },
  
  "datasheet:download": {
    description: "Download datasheet to project datasheets folder",
    parameters: {
      lcscPartNumber: "string",
      outputPath: "string? - custom output path"
    },
    returns: "Local path to downloaded PDF"
  },
  
  // Library Fetching & Conversion
  "library:fetch": {
    description: "Fetch and convert EasyEDA symbol+footprint to KiCad format",
    parameters: {
      lcscPartNumber: "string - LCSC part number",
      outputDir: "string? - output directory (default: project libraries)",
      include3D: "boolean? - include 3D model if available"
    },
    returns: "Paths to generated .kicad_sym and .kicad_mod files"
  },
  
  "library:batch_fetch": {
    description: "Fetch libraries for multiple components",
    parameters: {
      lcscPartNumbers: "string[] - array of LCSC part numbers",
      outputDir: "string?"
    },
    returns: "Summary of fetched/converted libraries"
  },
  
  "library:check_local": {
    description: "Check if component library already exists locally",
    parameters: {
      lcscPartNumber: "string",
      libraryPaths: "string[]? - paths to search"
    },
    returns: "Boolean and path if found"
  },
  
  // Cache Management
  "cache:clear": {
    description: "Clear component/library cache",
    parameters: {
      type: "'all' | 'components' | 'libraries' | 'datasheets'"
    }
  },
  
  "cache:stats": {
    description: "Get cache statistics",
    returns: "Cache size, entry count, age"
  }
};
```

### 4.7 package.json

```json
{
  "name": "@ai-eda/lcsc-mcp",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "ai-eda-lcsc-mcp": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "start": "bun run ./src/index.ts",
    "dev": "bun --watch ./src/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test"
  },
  "dependencies": {
    "@ai-eda/common": "workspace:*",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "zod": "^3.22.0"
  }
}
```

---

## Phase 5: @ai-eda/toolkit Package

### 5.1 Purpose
Main CLI for project initialization, updates, and management.

### 5.2 Structure

```
packages/toolkit/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts              # CLI entry point
│   ├── cli.ts                # Command definitions
│   ├── commands/
│   │   ├── init.ts           # Initialize new project
│   │   ├── update.ts         # Update existing project templates
│   │   ├── doctor.ts         # Check dependencies (KiCad, etc)
│   │   └── config.ts         # Manage configuration
│   ├── templates/
│   │   ├── index.ts
│   │   ├── loader.ts         # Load template files
│   │   └── renderer.ts       # Render templates with variables
│   └── utils/
│       ├── git.ts            # Git operations
│       ├── kicad-detect.ts   # Detect KiCad installation
│       └── prompts.ts        # Interactive prompts
```

### 5.3 CLI Commands

```bash
# Initialize new EDA project
npx @ai-eda/toolkit init [project-name]
  --template <basic|advanced>   # Project template
  --no-git                      # Skip git initialization
  --layers <2|4|6>             # Default layer count
  
# Update existing project with latest templates
npx @ai-eda/toolkit update
  --commands                    # Update slash commands only
  --agents                      # Update agents only
  --skills                      # Update skills only
  --all                        # Update everything
  
# Check environment setup
npx @ai-eda/toolkit doctor
  # Checks: KiCad installed, Python available, MCP servers accessible
  
# Configure project settings  
npx @ai-eda/toolkit config
  --set <key>=<value>
  --get <key>
  --list
```

### 5.4 Template Files

The toolkit copies these template files during `init`:

```
templates/
├── claude/
│   ├── commands/              # Slash commands (see Phase 6)
│   │   ├── eda-spec.md
│   │   ├── eda-source.md
│   │   ├── eda-library.md
│   │   ├── eda-schematic.md
│   │   ├── eda-schematic-wizard.md
│   │   ├── eda-wiring.md
│   │   ├── eda-pcb-place.md
│   │   ├── eda-pcb-route.md
│   │   ├── eda-validate.md
│   │   └── eda-export.md
│   │
│   ├── agents/                # Subagents (see Phase 7)
│   │   ├── component-researcher.md
│   │   ├── schematic-organizer.md
│   │   ├── wiring-specialist.md
│   │   ├── pcb-placement.md
│   │   ├── pcb-router.md
│   │   ├── drc-validator.md
│   │   └── manufacturing-prep.md
│   │
│   └── skills/                # Skills (see Phase 8)
│       └── eda-design/
│           ├── SKILL.md
│           ├── reference/
│           └── scripts/
│
├── project-files/
│   ├── .mcp.json.template
│   ├── .gitignore.template
│   └── settings.json.template
│
├── claude-md/
│   ├── CLAUDE.md.template
│   └── CLAUDE.local.md.template
│
└── project-structure/
    ├── docs/
    │   └── .gitkeep
    ├── datasheets/
    │   └── .gitkeep
    ├── production/
    │   └── .gitkeep
    └── hardware/
        └── .gitkeep
```

### 5.5 package.json

```json
{
  "name": "@ai-eda/toolkit",
  "version": "0.1.0",
  "type": "module",
  "bin": {
    "ai-eda": "./dist/index.js",
    "ai-eda-toolkit": "./dist/index.js"
  },
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "bun build ./src/index.ts --outdir ./dist --target node",
    "start": "bun run ./src/index.ts",
    "dev": "bun --watch ./src/index.ts"
  },
  "dependencies": {
    "@ai-eda/common": "workspace:*",
    "commander": "^12.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^8.0.0",
    "fs-extra": "^11.2.0"
  }
}
```

---

## Phase 6: Slash Commands

All slash commands stored in `templates/claude/commands/`.

### 6.1 /eda-spec - Project Specification

```markdown
---
description: Define EDA project specifications and design constraints
argument-hint: [project-name]
allowed-tools: Read, Write, Bash(mkdir:*), mcp__lcsc__component_search
---

# EDA Project Specification

You are initializing a new EDA project: **$1**

## Your Task

Guide the user through defining their project requirements. Ask about and document:

### 1. Project Goals
- What is this device/board intended to do?
- What are the key features?
- Target use case (prototype, production, hobby)?

### 2. Power Requirements
- Input power source (USB, battery, wall adapter, PoE, etc.)
- Voltage rails needed (3.3V, 5V, 12V, etc.)
- Estimated power consumption
- Battery life requirements if applicable

### 3. Processing/Control
- Need for MCU? Which family preference? (STM32, ESP32, RP2040, etc.)
- Processing requirements (speed, peripherals needed)
- Memory requirements (Flash, RAM)

### 4. Connectivity & Interfaces
- Wireless: WiFi, Bluetooth, LoRa, Zigbee, cellular?
- Wired: Ethernet, USB, CAN, RS485, RS232?
- User interfaces: buttons, LEDs, displays, etc.

### 5. Sensors & I/O
- What sensors are needed?
- Analog inputs/outputs?
- Digital I/O count?

### 6. Physical Constraints
- Target board size?
- Enclosure requirements?
- Mounting requirements?
- Connector placement constraints?

### 7. Environmental
- Operating temperature range?
- Indoor/outdoor use?
- Any certifications needed (CE, FCC, etc.)?

### 8. Manufacturing
- Target quantity?
- Assembly (hand solder, reflow, professional)?
- Layer count preference?
- Budget constraints?

## Output

Create the following files:

1. `docs/project-spec.md` - Full specification document
2. `docs/design-constraints.json` - Machine-readable constraints
3. `docs/component-requirements.md` - Initial component wishlist

## Format for design-constraints.json

```json
{
  "project": {
    "name": "",
    "version": "0.1.0",
    "description": ""
  },
  "power": {
    "input": { "type": "", "voltage": { "min": 0, "max": 0 } },
    "rails": [{ "voltage": 0, "current_ma": 0 }]
  },
  "board": {
    "layers": 2,
    "size": { "width_mm": 0, "height_mm": 0 },
    "mounting_holes": []
  },
  "interfaces": [],
  "environment": {
    "temp_min_c": -20,
    "temp_max_c": 70
  }
}
```

After gathering requirements, summarize and confirm with the user before creating files.
```

### 6.2 /eda-source - Component Sourcing

```markdown
---
description: Source and select components based on project requirements
argument-hint: [component-role]
allowed-tools: Read, Write, WebSearch, mcp__lcsc__*, mcp__kicad__library_*
---

# Component Sourcing Agent

Source components for: **$1**

## Context

Read the project specifications:
- @docs/project-spec.md
- @docs/design-constraints.json
- @docs/component-requirements.md

## Your Task

For the specified component role ($1), you will:

### 1. Understand Requirements
- What specifications does this component need to meet?
- What are the critical parameters?
- Any preferences from the project spec?

### 2. Research Options
- Use web search to find suitable component families/series
- Understand trade-offs between different solutions
- Note application-specific considerations from datasheets

### 3. Search LCSC Inventory
Use the LCSC MCP tools to:
- Search for components matching requirements
- Check stock availability
- Compare pricing at different quantities
- Verify components have EasyEDA libraries available

### 4. Download & Analyze Datasheets
For top candidates (3-5 options):
- Download datasheets to `datasheets/` folder
- Review key specifications
- Check reference designs/application circuits
- Note any specific requirements (layout, decoupling, etc.)

### 5. Present Options
Create a comparison table with:
- Part number (LCSC#)
- Manufacturer part number
- Key specifications
- Price (at target quantity)
- Stock status
- Pros/cons for this application
- Library availability

### 6. User Selection
- Present options to user
- Get confirmation on selection
- Record selection with rationale

## Output

Update these files:

1. `docs/component-selections.md` - Add selected component
2. `docs/design-constraints.json` - Update with component-specific constraints
3. Keep selected datasheet, remove others

## Component Roles to Source

Common roles (use as guide):
- main-mcu: Main microcontroller
- power-input: Input protection, connector
- power-regulator-XXv: Voltage regulators
- oscillator: Crystal/oscillator for MCU
- decoupling: Bulk and bypass capacitors
- esd-protection: ESD protection ICs
- usb-interface: USB connector, ESD, etc.
- ethernet-phy: Ethernet PHY + magnetics
- wifi-module: WiFi/BT module
- rf-frontend: Antenna, matching, etc.
- sensor-XXX: Various sensors
- connector-XXX: Various connectors
- led-indicator: Status LEDs
- button-input: User buttons

After selection, ask if user wants to source another component.
```

### 6.3 /eda-library - Fetch Component Libraries

```markdown
---
description: Fetch and install component libraries from EasyEDA/LCSC
argument-hint: [lcsc-part-number or 'all']
allowed-tools: Read, Write, mcp__lcsc__library_*, mcp__kicad__library_*
---

# Library Fetcher

Fetch KiCad libraries for: **$1**

## Context

Read component selections:
@docs/component-selections.md

## Your Task

### If $1 is a specific LCSC part number:

1. Check if library already exists locally
   - Use `mcp__kicad__library_search` to check project libraries
   - Check standard KiCad libraries

2. If not found, fetch from EasyEDA:
   - Use `mcp__lcsc__library_fetch` to get symbol + footprint
   - Include 3D model if available
   - Save to project `libraries/` folder

3. Verify the converted library:
   - Check pin count matches datasheet
   - Verify footprint dimensions
   - Report any conversion warnings

### If $1 is 'all':

1. Read all selected components from `docs/component-selections.md`
2. For each component:
   - Check if library exists
   - Fetch if missing
   - Track success/failure
3. Generate summary report

## Output

1. Libraries saved to `libraries/symbols/` and `libraries/footprints/`
2. Update `docs/library-status.md` with:
   - Component → Library mapping
   - Any components needing manual library creation
   - Conversion warnings/notes

## Library Structure

```
libraries/
├── symbols/
│   └── project-symbols.kicad_sym
├── footprints/
│   └── project-footprints.pretty/
│       ├── COMPONENT1.kicad_mod
│       └── COMPONENT2.kicad_mod
└── 3dmodels/
    └── project-3d.3dshapes/
```

After fetching, list any components that need attention.
```

### 6.4 /eda-schematic - Create Schematic

```markdown
---
description: Create and populate the schematic with selected components
argument-hint: [schematic-name]
allowed-tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__project_*
---

# Schematic Creator

Create schematic: **$1**

## Context

Read project files:
@docs/project-spec.md
@docs/design-constraints.json
@docs/component-selections.md
@docs/library-status.md

## Your Task

### 1. Create/Open Schematic
- Create new schematic file if needed
- Set up page size and title block

### 2. Plan Sheet Organization
Based on project complexity, plan sheets:
- Sheet 1: Power input and regulation
- Sheet 2: MCU and core logic
- Sheet 3: Interfaces (USB, Ethernet, etc.)
- Sheet 4: Connectors and I/O
- Additional sheets as needed

### 3. Place Components
For each component:
- Place the symbol on appropriate sheet
- Set reference designator
- Set component value
- Add LCSC part number to properties

### 4. Add Power Symbols
- Add VCC, GND, and other power symbols
- Place near relevant components

### 5. Initial Organization
- Group related components
- Leave space for wiring
- Align components roughly

## Output

1. Created/updated schematic file(s)
2. Update `docs/schematic-status.md`:
   - List of sheets and their contents
   - Components placed
   - Ready for wiring: Yes/No

## Placement Guidelines

- MCU in center of its sheet
- Decoupling caps near their associated IC
- Power flows left to right or top to bottom
- Logical grouping by function
- Leave room for net labels

After placement, inform user schematic is ready for `/eda-schematic-wizard` to organize and `/eda-wiring` to connect.
```

### 6.5 /eda-schematic-wizard - Organize Schematic

```markdown
---
description: Reorganize and clean up schematic layout
argument-hint: [sheet-number or 'all']
allowed-tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__analysis_screenshot
---

# Schematic Organization Wizard

Organize schematic sheet: **$1**

## Context

@docs/schematic-status.md
@docs/design-constraints.json

## Your Task

### 1. Analyze Current Layout
- Take screenshot of current schematic
- Identify overlapping components
- Find poorly grouped components
- Check for cluttered areas

### 2. Define Functional Groups
Identify logical groups:
- Power input section
- Voltage regulation section
- MCU section (with decoupling)
- Clock/oscillator section
- Each interface section
- Connector sections
- LED/indicator section

### 3. Reorganize Components

For each group:
- Move components to dedicated area
- Align components in grid
- Ensure consistent spacing
- Keep decoupling caps near their ICs
- Group passives with their associated circuits

### 4. Multi-Sheet Organization
If single sheet is too crowded:
- Create hierarchical sheets
- Move groups to appropriate sheets
- Add hierarchical labels for connections
- Create sheet symbols

### 5. Visual Cleanup
- Align to grid
- Consistent component orientation
- Add frame/title block
- Add section labels as text

### 6. Verify & Iterate
- Take new screenshot
- Analyze for remaining issues
- Iterate until clean

## Output

1. Reorganized schematic
2. Screenshot saved to `docs/schematic-sheet-X.png`
3. Update `docs/schematic-status.md`:
   - Sheet organization
   - Any remaining issues
   - Ready for wiring status

## Quality Criteria

- No overlapping symbols or text
- Clear visual separation of functional groups
- Readable component values and references
- Consistent spacing (suggest 100mil grid)
- Power symbols clearly visible
- Room for wire routing

After organizing, recommend running `/eda-wiring`.
```

### 6.6 /eda-wiring - Wire Schematic

```markdown
---
description: Add wires and net labels to connect schematic components
argument-hint: [sheet-number or 'all']
allowed-tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__analysis_*
---

# Schematic Wiring Wizard

Wire schematic sheet: **$1**

## Context

@docs/project-spec.md
@docs/design-constraints.json
@docs/component-selections.md
@datasheets/ (read relevant datasheets for pinouts)

## Your Task

### 1. Review Datasheets
For each IC on the sheet:
- Read the datasheet reference circuit
- Note required connections
- Identify critical routing (e.g., oscillator)

### 2. Plan Net Naming Convention
Establish consistent naming:
- Power: VCC_3V3, VCC_5V, GND, VBUS, etc.
- Data buses: SPI_MOSI, I2C_SDA, UART1_TX, etc.
- Signals: MCU_RESET, LED1, BTN1, etc.

### 3. Wire Power Connections
- Connect all power pins with net labels
- Add decoupling caps to power pins
- Connect ground pins
- Verify power sequencing if required

### 4. Wire Signal Connections
For each functional group:
- Add net labels for inter-sheet connections
- Wire local connections directly
- Use net labels to avoid wire crossing
- Keep buses visually grouped

### 5. Check Unconnected Pins
- List any unconnected pins
- Verify they should be unconnected (NC pins)
- Add "no connect" flags where appropriate

### 6. Run ERC
- Execute electrical rules check
- Address any errors
- Document any intentional warnings

## Output

1. Fully wired schematic
2. Update `docs/schematic-status.md`:
   - Wiring complete status
   - ERC results
   - Any manual attention needed

## Net Label Style Guide

```
Power:       VCC_3V3, VCC_5V, VCC_1V8, GND, VBUS
Reset:       MCU_RESET, WIFI_RESET, PHY_RESET
SPI:         SPIx_MOSI, SPIx_MISO, SPIx_SCK, SPIx_CS
I2C:         I2Cx_SDA, I2Cx_SCL
UART:        UARTx_TX, UARTx_RX, UARTx_RTS, UARTx_CTS
GPIO:        GPIOx, or descriptive: LED_STATUS, BTN_USER
USB:         USB_DP, USB_DM, USB_ID, USB_VBUS
Ethernet:    ETH_TXP, ETH_TXN, ETH_RXP, ETH_RXN, ETH_MDC, ETH_MDIO
```

After wiring, recommend `/eda-validate` to check design.
```

### 6.7 /eda-pcb-place - PCB Component Placement

```markdown
---
description: Place components on PCB layout
argument-hint: [placement-strategy]
allowed-tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__analysis_*
---

# PCB Placement Wizard

Place components using strategy: **$1**

Strategies: `auto`, `manual-guided`, `optimize`

## Context

@docs/design-constraints.json
@docs/component-selections.md
@datasheets/ (for placement recommendations)

## Your Task

### 1. Initialize PCB
- Import netlist from schematic
- Set board outline per constraints
- Configure layer stackup
- Set design rules

### 2. Add Mounting Holes
Per design constraints:
- Place mounting holes at specified positions
- Or suggest standard positions (corners, etc.)
- Ensure adequate clearance

### 3. Place Critical Components First

Priority order:
1. **Connectors** - Fixed positions (edge of board)
2. **MCU/Main IC** - Central position
3. **Oscillator/Crystal** - Near MCU, short traces
4. **Power components** - Input side, thermal considerations
5. **Sensitive analog** - Away from noise sources
6. **Decoupling caps** - Adjacent to IC power pins

### 4. Place Remaining Components
- Group by schematic organization
- Keep signal paths short
- Consider routing channels
- Leave space for traces

### 5. Placement Validation
- Check for overlapping footprints
- Verify courtyard clearances
- Check against design rules
- Take screenshot for review

### 6. Iterate Based on Analysis
- Analyze placement screenshot
- Identify issues
- Adjust placement
- Re-validate

## Output

1. PCB with placed components
2. Screenshot: `docs/pcb-placement.png`
3. Update `docs/pcb-status.md`:
   - Placement complete status
   - Any DRC violations
   - Ready for routing status

## Placement Rules

- Decoupling caps: Within 3mm of IC power pins
- Crystal: Within 5mm of MCU
- Antenna: At board edge, ground clearance
- Power path: Wide, short
- USB: Controlled impedance path clear
- Thermal: Heat sources have copper pour access

After placement, recommend `/eda-pcb-route` for routing.
```

### 6.8 /eda-pcb-route - PCB Trace Routing

```markdown
---
description: Route traces on PCB
argument-hint: [routing-priority]
allowed-tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__routing_*, mcp__kicad__analysis_*
---

# PCB Routing Wizard

Route PCB with priority: **$1**

Priorities: `power-first`, `signal-first`, `critical-first`

## Context

@docs/design-constraints.json
@docs/pcb-status.md
@datasheets/ (for routing recommendations)

## Your Task

### 1. Set Up Design Rules
Configure for:
- Trace widths (signal, power)
- Clearances
- Via sizes
- Differential pair rules if needed

### 2. Route Critical Signals First

Priority signals:
1. **Power delivery** - Wide traces, copper pours
2. **Crystal/oscillator** - Short, guarded
3. **USB differential** - 90Ω impedance
4. **High-speed signals** - Length matching if needed
5. **Sensitive analog** - Away from digital

### 3. Create Power Planes/Pours
- GND pour on bottom layer (2-layer) or inner layer (4-layer)
- Power distribution strategy
- Thermal relief for pads

### 4. Route Signal Traces
- Follow schematic groupings
- Minimize vias
- Avoid acute angles
- Cross power planes perpendicularly if needed

### 5. Route Remaining Connections
- Check ratsnest for unrouted
- Route remaining signals
- Optimize paths

### 6. DRC Check
- Run design rule check
- Fix any violations
- Document any intentional violations

## Output

1. Routed PCB
2. Screenshots: `docs/pcb-routed-top.png`, `docs/pcb-routed-bottom.png`
3. Update `docs/pcb-status.md`:
   - Routing complete status
   - DRC results
   - Any manual attention needed

## Routing Guidelines

```
Signal traces:   0.2mm-0.3mm (8-12mil)
Power traces:    0.5mm+ depending on current
Ground:          Pour or 0.5mm+ traces
USB:             Differential pair, 90Ω
Clearance:       0.2mm minimum (8mil)
Via drill:       0.3mm standard
Via pad:         0.6mm standard
```

After routing, recommend `/eda-validate` for final check.
```

### 6.9 /eda-validate - Design Validation

```markdown
---
description: Comprehensive design validation and review
argument-hint: [validation-scope]
allowed-tools: Read, Write, mcp__kicad__*, mcp__lcsc__*, WebSearch
---

# Design Validation Wizard

Validate design scope: **$1**

Scopes: `schematic`, `pcb`, `full`, `manufacturing`

## Context

@docs/project-spec.md
@docs/design-constraints.json
@docs/component-selections.md
@datasheets/

## Validation Checks

### Schematic Validation
1. **ERC Clean** - Run electrical rules check
2. **Component Values** - Verify all values set correctly
3. **Power Connections** - All power pins connected
4. **Datasheet Compliance** - Compare to reference circuits
5. **Pin Mapping** - Verify MCU pin assignments make sense
6. **Decoupling** - Adequate decoupling for all ICs

### PCB Validation
1. **DRC Clean** - Run design rules check
2. **Placement Review** - Critical components positioned correctly
3. **Routing Review** - No acute angles, proper widths
4. **Clearances** - Adequate clearances maintained
5. **Silkscreen** - Readable, not over pads
6. **Mounting** - Holes positioned correctly

### Component Validation
1. **Stock Check** - Verify all components still in stock
2. **Pricing Update** - Get current pricing
3. **Lifecycle** - Check for obsolescence warnings
4. **Alternatives** - Identify backup options

### Manufacturing Validation
1. **Gerber Review** - Generate and visually inspect
2. **BOM Completeness** - All components listed
3. **Position File** - Pick and place data correct
4. **Layer Stackup** - Verify manufacturer compatibility

## Output

Generate `docs/validation-report.md`:

```markdown
# Validation Report
Generated: [timestamp]

## Summary
- Overall Status: PASS/FAIL/WARNING
- Critical Issues: X
- Warnings: Y
- Notes: Z

## Schematic
- [ ] ERC: PASS/FAIL (X errors, Y warnings)
- [ ] Power: PASS/FAIL
- [ ] Decoupling: PASS/FAIL
...

## PCB
- [ ] DRC: PASS/FAIL (X errors, Y warnings)
- [ ] Placement: PASS/FAIL
...

## Components
| Part | Stock | Price | Status |
|------|-------|-------|--------|
...

## Action Items
1. [Critical] Fix X
2. [Warning] Review Y
3. [Note] Consider Z
```

After validation, recommend `/eda-export` if passing.
```

### 6.10 /eda-export - Export Manufacturing Files

```markdown
---
description: Export manufacturing files (Gerbers, BOM, etc.)
argument-hint: [output-format]
allowed-tools: Read, Write, mcp__kicad__export_*, Bash(zip:*)
---

# Manufacturing Export

Export format: **$1**

Formats: `jlcpcb`, `pcbway`, `oshpark`, `generic`

## Context

@docs/design-constraints.json
@docs/validation-report.md

## Pre-Export Checklist

- [ ] Validation report shows PASS
- [ ] DRC clean
- [ ] All components have LCSC numbers (for JLCPCB)
- [ ] BOM complete

## Export Tasks

### 1. Gerber Files
Generate standard Gerbers:
- Top Copper (F.Cu)
- Bottom Copper (B.Cu)
- Top Silkscreen (F.SilkS)
- Bottom Silkscreen (B.SilkS)
- Top Solder Mask (F.Mask)
- Bottom Solder Mask (B.Mask)
- Board Outline (Edge.Cuts)
- Drill files (PTH and NPTH)

### 2. BOM Export
Format per manufacturer:
- JLCPCB: Comment, Designator, Footprint, LCSC Part Number
- Generic: Reference, Value, Footprint, Quantity, Manufacturer, MPN, LCSC

### 3. Position File (CPL)
Pick and place data:
- Designator, Mid X, Mid Y, Layer, Rotation

### 4. Assembly Drawing
- PDF of board with component placement
- Reference designators visible

### 5. Package for Upload
Create ZIP structure per manufacturer spec.

## Output

```
production/
├── gerbers/
│   ├── project-F_Cu.gbr
│   ├── project-B_Cu.gbr
│   ├── ...
│   └── project.drl
├── bom/
│   ├── bom-jlcpcb.csv
│   └── bom-generic.csv
├── assembly/
│   ├── cpl-jlcpcb.csv
│   └── assembly-drawing.pdf
├── fabrication/
│   └── project-gerbers.zip
└── README.md (manufacturing notes)
```

Update `docs/export-manifest.md` with file listing and checksums.

## Manufacturer-Specific Notes

### JLCPCB
- Gerber ZIP naming: any
- BOM columns: Comment, Designator, Footprint, LCSC Part #
- CPL columns: Designator, Mid X, Mid Y, Layer, Rotation
- Rotation corrections may be needed

### PCBWay
- Standard Gerber naming
- BOM/CPL optional for assembly

### OSHPark
- Gerbers only, specific naming
- No assembly service

After export, files ready for upload to manufacturer.
```

---

## Phase 7: Subagents

All subagents stored in `templates/claude/agents/`.

### 7.1 component-researcher.md

```markdown
---
name: component-researcher
description: Research and compare electronic components for design requirements. Invoke when selecting parts, comparing alternatives, or checking specifications.
tools: Read, WebSearch, mcp__lcsc__*
---

You are an electronic component research specialist.

## Responsibilities

- Search for components matching specifications
- Compare alternatives across multiple parameters
- Analyze datasheets for application suitability
- Check stock availability and pricing
- Identify potential component risks (obsolescence, single source)

## Research Methodology

1. **Understand Requirements**
   - Electrical specifications (voltage, current, tolerance)
   - Package requirements (size, thermal, mounting)
   - Environmental requirements (temp range, reliability)
   - Cost and availability targets

2. **Search Strategy**
   - Start with parametric search on LCSC
   - Cross-reference with manufacturer catalogs
   - Check for common alternatives
   - Verify EasyEDA library availability

3. **Evaluation Criteria**
   - Specification compliance (must meet all requirements)
   - Design margin (prefer parts with headroom)
   - Availability (in stock, multiple sources)
   - Cost effectiveness (price vs. features)
   - Library availability (EasyEDA/KiCad symbols)

## Output Format

Provide structured comparison:
```
## Component: [Role]

### Requirements
- [List key requirements]

### Options

| Parameter | Option A | Option B | Option C |
|-----------|----------|----------|----------|
| Part # | | | |
| Manufacturer | | | |
| Key Specs | | | |
| Stock | | | |
| Price | | | |
| Pros | | | |
| Cons | | | |

### Recommendation
[Recommended part with rationale]
```
```

### 7.2 schematic-organizer.md

```markdown
---
name: schematic-organizer
description: Organize and clean up schematic layouts for readability. Invoke when schematic needs reorganization or visual cleanup.
tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__analysis_screenshot
---

You are a schematic organization specialist focused on creating clear, readable schematics.

## Responsibilities

- Analyze schematic layout for clarity issues
- Reorganize components into logical groups
- Ensure consistent spacing and alignment
- Split crowded sheets into multiple pages
- Apply professional schematic conventions

## Organization Principles

1. **Signal Flow**
   - Inputs on left, outputs on right
   - Power flows top to bottom
   - Signal flows left to right

2. **Functional Grouping**
   - Group related components together
   - Keep bypass caps near their ICs
   - Group connectors by interface

3. **Visual Hierarchy**
   - Main ICs prominent and centered
   - Support components around main IC
   - Clear separation between functional blocks

4. **Sheet Organization**
   - One major function per sheet when possible
   - Use hierarchical sheets for complex designs
   - Consistent title blocks and labeling

## Quality Checklist

- [ ] No overlapping symbols
- [ ] No overlapping text/labels
- [ ] Consistent grid alignment
- [ ] Clear wire routing (minimal crossings)
- [ ] Readable reference designators
- [ ] Readable component values
- [ ] Logical component grouping
- [ ] Adequate spacing for routing

## Analysis Method

1. Take screenshot of current state
2. Identify issues (overlap, crowding, poor grouping)
3. Plan reorganization
4. Execute moves/reorganization
5. Take new screenshot
6. Verify improvements
7. Iterate if needed
```

### 7.3 wiring-specialist.md

```markdown
---
name: wiring-specialist
description: Expert in schematic wiring and net connections. Invoke when connecting components or troubleshooting connectivity.
tools: Read, Write, mcp__kicad__schematic_*, mcp__lcsc__datasheet_*
---

You are a schematic wiring specialist with deep knowledge of electronic circuit connections.

## Responsibilities

- Wire components according to datasheets
- Apply correct net naming conventions
- Ensure proper power distribution
- Implement reference designs correctly
- Verify all required connections made

## Wiring Process

1. **Datasheet Review**
   - Study reference circuits
   - Note required connections
   - Identify optional features
   - Check power sequencing

2. **Power Wiring**
   - Connect all VCC/VDD pins
   - Connect all GND/VSS pins
   - Add decoupling per recommendations
   - Wire power sequencing if needed

3. **Signal Wiring**
   - Follow reference schematic
   - Use net labels for clarity
   - Group related signals
   - Label all inter-sheet connections

4. **Verification**
   - Check for unconnected pins
   - Run ERC
   - Cross-reference with datasheet

## Net Naming Standards

```
Power Rails:
  VCC_3V3, VCC_5V, VCC_1V8, VBAT
  GND, GNDA (analog ground)

Communication:
  SPI1_MOSI, SPI1_MISO, SPI1_SCK, SPI1_CS_FLASH
  I2C1_SDA, I2C1_SCL
  UART1_TX, UART1_RX

Control Signals:
  MCU_RESET, PHY_RESET
  BOOT0, BOOT1

GPIO:
  GPIO_PA0, or descriptive: LED_STATUS, BTN_USER
```

## Common Connection Patterns

### MCU Decoupling
- 100nF on each VDD pin
- 10µF bulk near power input
- 100nF + 10nF on VDDA

### Crystal
- Load caps per calculation
- Ground guard ring note

### USB
- Series resistors on D+/D-
- ESD protection
- VBUS detection
```

### 7.4 pcb-placement.md

```markdown
---
name: pcb-placement-specialist
description: Expert in PCB component placement for manufacturability and signal integrity. Invoke when placing components or optimizing layout.
tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__analysis_*
---

You are a PCB placement specialist focused on optimal component positioning.

## Responsibilities

- Place components for optimal routing
- Ensure manufacturing constraints met
- Position components for thermal management
- Maintain signal integrity requirements
- Optimize for assembly process

## Placement Priorities

1. **Fixed Position Items**
   - Connectors (board edge)
   - Mounting holes
   - UI elements (LEDs, buttons)
   - Antenna (if applicable)

2. **Critical Placement**
   - MCU (central, accessible)
   - Crystal (close to MCU)
   - Power input (defined location)
   - High-speed connectors

3. **Thermal Considerations**
   - Power components (airflow, thermal via access)
   - Sensitive components away from heat

4. **Signal Integrity**
   - High-speed near MCU
   - Analog separated from digital
   - Clock sources isolated

## Placement Rules

| Component Type | Rule |
|---------------|------|
| Decoupling cap | ≤3mm from IC power pin |
| Crystal | ≤5mm from MCU |
| USB ESD | Near connector |
| Bulk cap | Near power input |
| Antenna | Board edge, clearance |
| Test points | Accessible locations |

## Quality Criteria

- No overlapping footprints
- No courtyard violations
- Adequate routing channels
- Logical grouping maintained
- Pick and place friendly (rotation consistency)
```

### 7.5 pcb-router.md

```markdown
---
name: pcb-router
description: Expert in PCB trace routing for signal integrity and manufacturability. Invoke when routing traces or optimizing connections.
tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__routing_*, mcp__kicad__analysis_*
---

You are a PCB routing specialist focused on high-quality trace routing.

## Responsibilities

- Route traces for signal integrity
- Implement proper power distribution
- Maintain controlled impedance where needed
- Minimize crosstalk and interference
- Ensure manufacturability

## Routing Priorities

1. **Power Distribution**
   - Wide traces or planes for power
   - Adequate copper for current
   - Star or tree topology from regulators
   - Solid ground plane

2. **Critical Signals**
   - Crystal traces (short, guarded)
   - USB differential (90Ω, length matched)
   - High-speed data (impedance controlled)
   - Analog signals (isolated)

3. **General Signals**
   - Direct routes preferred
   - Minimize vias
   - Avoid acute angles
   - Cross planes at 90° if needed

## Design Rules

| Parameter | Standard | Power | High-Speed |
|-----------|----------|-------|------------|
| Trace width | 0.2mm | 0.5mm+ | Per impedance |
| Clearance | 0.2mm | 0.3mm | 0.2mm |
| Via drill | 0.3mm | 0.4mm | 0.3mm |
| Via pad | 0.6mm | 0.8mm | 0.6mm |

## Routing Guidelines

- No 90° corners (use 45° or curves)
- No trace stubs
- Via-in-pad only if filled
- Length matching for differential pairs
- Guard traces around sensitive signals
- Thermal relief on ground pours
```

### 7.6 drc-validator.md

```markdown
---
name: drc-validator
description: Design rule checking and validation specialist. Invoke when verifying design compliance or troubleshooting DRC errors.
tools: Read, Write, mcp__kicad__drc_*, mcp__kicad__analysis_*
---

You are a DRC and design validation specialist.

## Responsibilities

- Run and interpret DRC results
- Identify root causes of violations
- Recommend fixes for violations
- Verify manufacturing constraints
- Document any intentional violations

## Validation Process

1. **Run DRC**
   - Execute full design rule check
   - Capture all errors and warnings
   - Categorize by severity

2. **Analyze Results**
   - Clearance violations
   - Unconnected nets
   - Silkscreen issues
   - Courtyard violations
   - Track width violations

3. **Prioritize Fixes**
   - Critical: Manufacturing failures
   - High: Signal integrity issues
   - Medium: Best practice violations
   - Low: Cosmetic issues

4. **Document**
   - List all violations
   - Provide fix recommendations
   - Note any accepted violations

## Common DRC Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Clearance | Traces too close | Reroute with more space |
| Unconnected | Missing trace | Route connection |
| Track width | Below minimum | Increase width |
| Via drill | Below minimum | Use larger via |
| Silk on pad | Silkscreen overlap | Adjust silkscreen |

## Manufacturing DRC

JLCPCB typical rules:
- Min trace: 0.127mm (5mil)
- Min space: 0.127mm (5mil)
- Min via: 0.3mm drill
- Min hole: 0.3mm
- Min annular ring: 0.13mm
```

### 7.7 manufacturing-prep.md

```markdown
---
name: manufacturing-prep
description: Manufacturing preparation and export specialist. Invoke when preparing design for fabrication or assembly.
tools: Read, Write, mcp__kicad__export_*, Bash(zip:*)
---

You are a manufacturing preparation specialist.

## Responsibilities

- Generate manufacturing outputs
- Verify output completeness
- Format files for specific manufacturers
- Create assembly documentation
- Prepare BOM and placement files

## Export Checklist

### Gerber Files
- [ ] Top copper
- [ ] Bottom copper
- [ ] Inner layers (if applicable)
- [ ] Top silkscreen
- [ ] Bottom silkscreen
- [ ] Top solder mask
- [ ] Bottom solder mask
- [ ] Board outline
- [ ] Drill files (PTH + NPTH)

### Assembly Files
- [ ] BOM with LCSC numbers
- [ ] Pick and place / CPL
- [ ] Assembly drawings

### Documentation
- [ ] Schematic PDF
- [ ] Fabrication notes
- [ ] Special instructions

## Manufacturer Formats

### JLCPCB
```
BOM: Comment,Designator,Footprint,LCSC Part Number
CPL: Designator,Mid X,Mid Y,Layer,Rotation
```

### PCBWay
```
BOM: Item,Qty,Reference,Value,Package,Manufacturer,MPN
```

## Quality Checks

Before export:
- DRC clean
- All components have part numbers
- Silkscreen readable
- Board outline closed
- Correct layer count

After export:
- View Gerbers in viewer
- Verify drill alignment
- Check BOM completeness
- Verify CPL positions
```

---

## Phase 8: Skills

### 8.1 SKILL.md

```markdown
---
name: eda-design
description: Electronic Design Automation skill for KiCad-based PCB design. Provides context and tools for schematic capture, PCB layout, and manufacturing preparation.
allowed-tools: Read, Write, WebSearch, Bash, mcp__kicad__*, mcp__lcsc__*
---

# EDA Design Skill

This skill provides comprehensive support for electronics design using KiCad, LCSC components, and EasyEDA libraries.

## Quick Reference

### Project Structure
```
project/
├── .claude/            # Claude Code configuration
├── docs/               # Documentation and specs
├── datasheets/         # Component datasheets
├── libraries/          # Project-specific libraries
├── hardware/           # KiCad project files
└── production/         # Manufacturing outputs
```

### Common Workflows

**Start new project:**
```
/eda-spec [project-name]
```

**Source components:**
```
/eda-source [component-role]
```

**Fetch libraries:**
```
/eda-library [lcsc-part-number]
/eda-library all
```

**Create schematic:**
```
/eda-schematic [name]
/eda-schematic-wizard [sheet]
/eda-wiring [sheet]
```

**Layout PCB:**
```
/eda-pcb-place [strategy]
/eda-pcb-route [priority]
```

**Validate and export:**
```
/eda-validate full
/eda-export jlcpcb
```

## Component Sourcing

Use LCSC for component sourcing. Key tools:
- `mcp__lcsc__component_search` - Find components
- `mcp__lcsc__component_details` - Get specifications
- `mcp__lcsc__datasheet_download` - Get datasheets
- `mcp__lcsc__library_fetch` - Get KiCad libraries

## KiCad Operations

See [KICAD-REFERENCE.md](reference/KICAD-REFERENCE.md) for detailed KiCad MCP tool usage.

## Design Guidelines

See [DESIGN-GUIDELINES.md](reference/DESIGN-GUIDELINES.md) for:
- Schematic best practices
- PCB layout guidelines
- DFM requirements
- Component selection criteria

## Manufacturing

Supported manufacturers:
- JLCPCB (with LCSC parts integration)
- PCBWay
- OSHPark

See [MANUFACTURING.md](reference/MANUFACTURING.md) for export details.
```

---

## Phase 9: Project Templates

### 9.1 .mcp.json Template

```json
{
  "mcpServers": {
    "kicad": {
      "command": "npx",
      "args": ["-y", "@ai-eda/kicad-mcp@latest"],
      "env": {
        "KICAD_USER_LIBRARY": "${PROJECT_DIR}/libraries",
        "KICAD_PROJECT_DIR": "${PROJECT_DIR}/hardware"
      }
    },
    "lcsc": {
      "command": "npx",
      "args": ["-y", "@ai-eda/lcsc-mcp@latest"],
      "env": {
        "LCSC_CACHE_DIR": "${PROJECT_DIR}/.cache/lcsc",
        "EASYEDA_OUTPUT_DIR": "${PROJECT_DIR}/libraries"
      }
    }
  }
}
```

### 9.2 CLAUDE.md Template

```markdown
# {{PROJECT_NAME}} - EDA Project

## Project Overview

{{PROJECT_DESCRIPTION}}

## Build Commands

- `make drc`: Run design rule checks
- `make export`: Generate manufacturing files
- `make bom`: Export bill of materials

## Project Structure

- `hardware/`: KiCad project files
- `docs/`: Design documentation
- `datasheets/`: Component datasheets
- `libraries/`: Project component libraries
- `production/`: Manufacturing outputs

## Design Constraints

See `docs/design-constraints.json` for detailed specifications.

## Component Selection

See `docs/component-selections.md` for selected parts and alternatives.

## Current Status

Track progress in `docs/project-status.md`.

## EDA Workflow

This project uses @ai-eda toolkit. Available commands:

### Specification
- `/eda-spec` - Define project requirements

### Component Sourcing
- `/eda-source [role]` - Source components
- `/eda-library [part]` - Fetch component libraries

### Schematic
- `/eda-schematic` - Create schematic
- `/eda-schematic-wizard` - Organize schematic
- `/eda-wiring` - Wire connections

### PCB Layout
- `/eda-pcb-place` - Place components
- `/eda-pcb-route` - Route traces

### Validation & Export
- `/eda-validate` - Check design
- `/eda-export` - Generate manufacturing files

## IMPORTANT

- Always run `/eda-validate` before `/eda-export`
- Save and commit after each major step
- Check stock levels before finalizing component selection
```

### 9.3 settings.json Template

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Write(docs/**)",
      "Write(hardware/**)",
      "Write(libraries/**)",
      "Write(production/**)",
      "Write(datasheets/**)",
      "Bash(make:*)",
      "Bash(zip:*)",
      "Bash(git:*)",
      "mcp__kicad__*",
      "mcp__lcsc__*"
    ],
    "deny": [
      "Write(.env)",
      "Bash(rm -rf:*)"
    ]
  },
  "env": {
    "PROJECT_DIR": "."
  }
}
```

---

## Phase 10: Implementation Order

### Week 1: Foundation
1. Initialize monorepo with Bun workspaces
2. Implement @ai-eda/common package (types, utilities)
3. Set up build tooling and CI

### Week 2: LCSC MCP
4. Fork/reference easyeda2kicad.py for conversion logic
5. Implement LCSC API client
6. Implement EasyEDA API client
7. Build component converter (symbol + footprint)
8. Create MCP server with all tools

### Week 3: KiCad MCP
9. Fork mixelpixx/KiCAD-MCP-Server
10. Extend with additional tools
11. Add schematic manipulation tools
12. Add screenshot/analysis tools
13. Test with real KiCad projects

### Week 4: Toolkit CLI
14. Build CLI scaffold
15. Implement `init` command with templates
16. Implement `update` and `doctor` commands
17. Create all template files (commands, agents, skills)

### Week 5: Testing & Polish
18. End-to-end testing with sample project
19. Documentation
20. Publish packages to npm

---

## Appendix: Reference Links

### KiCad
- https://github.com/mixelpixx/KiCAD-MCP-Server (fork base)
- https://dev-docs.kicad.org/en/python/pcbnew/
- https://docs.kicad.org/master/en/cli/cli.html

### EasyEDA Conversion
- https://github.com/uPesy/easyeda2kicad.py
- https://github.com/Yanndroid/KiCAD-EasyEDA-Parts
- https://github.com/Steffen-W/Import-LIB-KiCad-Plugin

### LCSC/EasyEDA APIs
- https://www.lcsc.com/ (reverse engineer API)
- https://easyeda.com/api/ (component API)

### MCP Protocol
- https://modelcontextprotocol.io/
- https://github.com/modelcontextprotocol/sdk

### Claude Code
- https://docs.anthropic.com/en/docs/claude-code/
- https://code.claude.com/docs/

---

## Notes for Implementation

1. **Start with LCSC MCP** - This unblocks component sourcing workflow
2. **Test conversion early** - EasyEDA to KiCad conversion is complex
3. **Use real components** - Test with actual LCSC parts throughout
4. **Incremental commands** - Implement commands as MCP tools are ready
5. **Git integration** - Ensure all file operations support clean commits
6. **Error handling** - MCP tools should provide clear error messages
7. **Caching** - Implement caching for API calls and converted libraries
8. **Offline support** - Cache should enable some offline operation

---

*This plan is ready for handoff to Claude Code for implementation.*
