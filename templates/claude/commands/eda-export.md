---
description: Export manufacturing files (Gerbers, BOM, etc.)
argument-hint: [output-format]
allowed-tools: Read, Write, mcp__kicad__export_*, Bash(zip:*)
---

# Manufacturing Export

Export format: **$ARGUMENTS**

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
