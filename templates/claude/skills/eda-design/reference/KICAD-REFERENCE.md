# KiCad MCP Tool Reference

## Project Management

### kicad_check_installation
Check if KiCad is installed and available.
```
Returns: { available: boolean, paths: {...} }
```

### kicad_create_project
Create a new KiCad project.
```
Parameters:
  - name: Project name
  - directory: Parent directory

Creates:
  - .kicad_pro (project file)
  - .kicad_sch (schematic)
  - .kicad_pcb (PCB layout)
```

### kicad_list_projects
List KiCad projects in a directory.
```
Parameters:
  - directory: Directory to search
```

### kicad_get_project_info
Get information about a project.
```
Parameters:
  - project_path: Path to .kicad_pro or project directory
```

## Export Functions

### kicad_export_gerbers
Export Gerber files for manufacturing.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_dir: Output directory (optional)

Generates:
  - F.Cu, B.Cu (copper layers)
  - F.Mask, B.Mask (solder mask)
  - F.SilkS, B.SilkS (silkscreen)
  - Edge.Cuts (board outline)
```

### kicad_export_drills
Export drill files.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_dir: Output directory (optional)
```

### kicad_export_bom
Export Bill of Materials.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Output file (optional)
```

### kicad_export_position
Export pick and place file.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Output file (optional)
```

### kicad_export_step
Export 3D STEP model.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Output file (optional)
```

### kicad_export_schematic_pdf
Export schematic as PDF.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Output file (optional)
```

## Validation

### kicad_run_drc
Run Design Rule Check.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Report file (optional)
```

### kicad_run_erc
Run Electrical Rule Check.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Report file (optional)
```

## LCSC MCP Tools

### component_search
Search LCSC for components.
```
Parameters:
  - query: Search string
  - limit: Max results (default: 10)
  - in_stock: Only in-stock (optional)
```

### component_get
Get detailed component info.
```
Parameters:
  - lcsc_id: LCSC part number (e.g., "C2040")
```

### library_fetch
Fetch and convert component library.
```
Parameters:
  - lcsc_id: LCSC part number
  - output_dir: Output directory (optional)
  - include_3d: Include 3D model (optional)
```

### library_get_symbol
Get KiCad symbol for component.
```
Parameters:
  - lcsc_id: LCSC part number
```

### library_get_footprint
Get KiCad footprint for component.
```
Parameters:
  - lcsc_id: LCSC part number
```
