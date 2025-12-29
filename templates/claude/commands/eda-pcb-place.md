---
description: Place components on PCB layout
argument-hint: [placement-strategy]
allowed-tools: Read, Write, mcp__kicad__pcb_*, mcp__kicad__analysis_*
---

# PCB Placement Wizard

Place components using strategy: **$ARGUMENTS**

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
