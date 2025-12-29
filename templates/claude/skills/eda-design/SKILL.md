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
- `mcp__lcsc__component_get` - Get specifications
- `mcp__lcsc__library_fetch` - Get KiCad libraries

## KiCad Operations

### Project Management
- `mcp__kicad__create_project` - Create new project
- `mcp__kicad__get_project_info` - Get project info

### Export
- `mcp__kicad__export_gerbers` - Export Gerbers
- `mcp__kicad__export_bom` - Export BOM
- `mcp__kicad__export_position` - Export pick and place

### Validation
- `mcp__kicad__run_drc` - Run design rule check
- `mcp__kicad__run_erc` - Run electrical rule check

## Design Guidelines

### Schematic Best Practices
- One major function per sheet
- Power flows top to bottom
- Signals flow left to right
- Consistent net naming
- Proper decoupling on all ICs

### PCB Layout Guidelines
- Place critical components first
- Keep bypass caps close to ICs
- Crystal within 5mm of MCU
- Ground pours for EMI
- Avoid 90° trace corners

### DFM Requirements (JLCPCB)
- Min trace: 0.127mm (5mil)
- Min space: 0.127mm (5mil)
- Min via: 0.3mm drill
- Min annular ring: 0.13mm

## Manufacturing

Supported manufacturers:
- JLCPCB (with LCSC parts integration)
- PCBWay
- OSHPark

Export formats available via `/eda-export [format]`
