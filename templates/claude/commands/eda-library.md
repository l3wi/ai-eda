---
description: Fetch and install component libraries from EasyEDA/LCSC
argument-hint: [lcsc-part-number or 'all']
allowed-tools: Read, Write, mcp__lcsc__library_*, mcp__kicad__library_*
---

# Library Fetcher

Fetch KiCad libraries for: **$ARGUMENTS**

## Context

Read component selections:
@docs/component-selections.md

## Your Task

### If $ARGUMENTS is a specific LCSC part number:

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

### If $ARGUMENTS is 'all':

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
