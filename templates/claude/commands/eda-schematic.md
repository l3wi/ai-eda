---
description: Create and populate the schematic with selected components
argument-hint: [schematic-name]
allowed-tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__project_*
---

# Schematic Creator

Create schematic: **$ARGUMENTS**

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
