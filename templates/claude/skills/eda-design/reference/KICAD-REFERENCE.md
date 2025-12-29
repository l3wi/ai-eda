# KiCad MCP Tool Reference

This project uses the [mixelpixx/KiCAD-MCP-Server](https://github.com/mixelpixx/KiCAD-MCP-Server)
for KiCad automation. The server provides 52+ tools for schematic capture, PCB layout, and manufacturing export.

**Requirements:**
- KiCad 9.0+ with Python module installed
- Node.js v18+
- Python: `kicad-skip`, `Pillow`, `cairosvg`, `pydantic`

---

## Schematic Tools

Schematic manipulation is powered by [kicad-skip](https://github.com/psychogenic/kicad-skip).

### create_schematic
Initialize a new schematic file.
```
Parameters:
  - name: Schematic name
  - directory: Target directory
```

### load_schematic
Open an existing schematic document.
```
Parameters:
  - schematic_path: Path to .kicad_sch file
```

### add_schematic_component
Place a symbol in the schematic.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - library: Symbol library name
  - symbol: Symbol name
  - reference: Reference designator (e.g., "R1")
  - position: { x, y } coordinates
  - value: Component value (optional)
```

### add_schematic_wire
Connect component pins with a wire.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - start: { x, y } start coordinates
  - end: { x, y } end coordinates
```

### list_schematic_libraries
List available symbol libraries.
```
Parameters:
  - None
Returns: List of library names and paths
```

### export_schematic_pdf
Generate PDF documentation from schematic.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Output PDF path (optional)
```

---

## PCB Tools

### Board Management

#### create_board / load_board
Create or open a PCB layout.

#### set_board_size
Define board dimensions.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - width: Board width (mm)
  - height: Board height (mm)
```

#### get_board_info
Get board statistics and information.

### Component Placement (10 tools)

#### place_component
Place a component on the PCB.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - reference: Component reference (e.g., "U1")
  - position: { x, y } coordinates (mm)
  - layer: "F.Cu" or "B.Cu"
  - rotation: Angle in degrees (optional)
```

#### move_component
Move an existing component.

#### rotate_component
Rotate a component.

#### delete_component
Remove a component from the board.

### Routing (8 tools)

#### route_trace
Route a trace between two points.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - net: Net name
  - start: { x, y } start point
  - end: { x, y } end point
  - layer: Copper layer
  - width: Trace width (mm)
```

#### add_via
Add a via to change layers.

#### add_zone
Create a copper pour zone.

---

## Export Functions

### export_gerbers
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

### export_drills
Export drill files (Excellon format).
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_dir: Output directory (optional)
```

### export_bom
Export Bill of Materials.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Output file (optional)
```

### export_position
Export pick and place file.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Output file (optional)
```

### export_step
Export 3D STEP model.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Output file (optional)
```

---

## Validation

### run_drc
Run Design Rule Check on PCB.
```
Parameters:
  - pcb_path: Path to .kicad_pcb
  - output_path: Report file (optional)
```

### run_erc
Run Electrical Rule Check on schematic.
```
Parameters:
  - schematic_path: Path to .kicad_sch
  - output_path: Report file (optional)
```

---

## LCSC MCP Tools

These tools are provided by `@ai-eda/lcsc-mcp`.

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
Fetch and convert EasyEDA component library to KiCad format.
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

---

## kicad-skip Python Library

The schematic manipulation is powered by kicad-skip. Example usage:

```python
from skip import Schematic

# Load schematic
schem = Schematic('/path/to/project.kicad_sch')

# Access components by reference
resistor = schem.symbol.R14
resistor.value = "10k"

# Search for symbols by regex
caps = schem.symbol.by_regex("C\\d+")

# Find connected elements
connected = schem.symbol.R1.attached()

# Add new elements
schem.wire.add(start_point, end_point)

# Save changes
schem.write()
```

For more information: https://github.com/psychogenic/kicad-skip
