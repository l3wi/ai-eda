---
description: Export manufacturing files
argument-hint: [format: jlcpcb|pcbway|oshpark|generic]
allowed-tools: Read, Write, Glob, Bash(zip:*), mcp__kicad-pcb__export_gerber, mcp__kicad-pcb__export_pdf, mcp__kicad-pcb__export_bom, mcp__kicad-pcb__export_position_file, mcp__kicad-pcb__export_3d
---

# Manufacturing Export: $ARGUMENTS

Export files for: **$ARGUMENTS**

## Pre-Export Check

Verify design is ready:
- Check `docs/validation-report.md` exists and shows PASS
- If not validated, suggest running `/eda-check full` first

Read context:
- `@docs/design-constraints.json`
- `@docs/component-selections.md`

## Export by Format

### jlcpcb

JLCPCB-specific export:

**Gerber files:**
- F.Cu, B.Cu (copper)
- F.Mask, B.Mask (soldermask)
- F.SilkS, B.SilkS (silkscreen)
- Edge.Cuts (outline)
- F.Paste, B.Paste (stencil)
- Drill files (PTH, NPTH)

**BOM format:**
```csv
Comment,Designator,Footprint,LCSC Part #
"100nF","C1,C2,C3","0402","C1525"
```

**Position file (CPL):**
```csv
Designator,Mid X,Mid Y,Layer,Rotation
"C1","10.5","20.3","top","0"
```

**Output structure:**
```
production/
├── gerbers/
│   └── [project]-gerbers.zip
├── bom/
│   └── bom-jlcpcb.csv
├── assembly/
│   └── cpl-jlcpcb.csv
└── README.md
```

### pcbway

PCBWay-specific export:

**Gerber files:** Standard naming
**BOM:** Flexible format
**Position:** Optional

### oshpark

OSHPark-specific export:

**Gerber files only** (no assembly service)
- Standard RS-274X format
- Specific layer naming

### generic

Generic export for any manufacturer:

**Gerber files:** Standard RS-274X
**BOM:** Comprehensive CSV with all fields
**Position:** Standard format
**Documentation:** PDF schematic and assembly drawings

## Export Process

1. **Generate Gerbers**
   - Export all copper layers
   - Export soldermask layers
   - Export silkscreen layers
   - Export board outline
   - Generate drill files

2. **Generate BOM**
   - Format per target manufacturer
   - Include LCSC part numbers
   - Verify all components listed

3. **Generate Position File**
   - Component centroids
   - Rotation values
   - Layer assignment

4. **Create Assembly Drawing**
   - PDF of board with placement
   - Reference designators visible

5. **Package Files**
   - Create ZIP for Gerbers
   - Organize folder structure

6. **Generate Manifest**
   - List all files with checksums
   - Include manufacturing notes

## Output

Create `docs/export-manifest.md`:

```markdown
# Export Manifest

Project: [name]
Format: $ARGUMENTS
Generated: [timestamp]

## Files Generated

### Gerbers
| File | Description | Checksum |
|------|-------------|----------|
| project-F_Cu.gbr | Front copper | abc123 |
| ... | ... | ... |

### Assembly
| File | Description |
|------|-------------|
| bom-jlcpcb.csv | Bill of materials |
| cpl-jlcpcb.csv | Component positions |

### Documentation
| File | Description |
|------|-------------|
| schematic.pdf | Full schematic |
| assembly.pdf | Assembly drawing |

## Manufacturing Notes

- Board size: X × Y mm
- Layers: N
- Thickness: 1.6mm
- Surface finish: [HASL/ENIG]
- Soldermask: [color]

## Upload Instructions

### JLCPCB
1. Go to jlcpcb.com
2. Click "Quote Now"
3. Upload gerbers.zip
4. Configure options
5. Add assembly (if needed)
6. Upload BOM and CPL

## Verification Checklist

- [ ] Gerbers open in viewer correctly
- [ ] BOM matches design
- [ ] Position file coordinates correct
- [ ] All files present
```

## Post-Export

After successful export:
- Remind user to verify files in Gerber viewer
- Provide upload instructions for target manufacturer
- Update project stage to "complete"
- Congratulate on completing the design!
