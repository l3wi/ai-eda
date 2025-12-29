---
description: Comprehensive design validation and review
argument-hint: [validation-scope]
allowed-tools: Read, Write, mcp__kicad__*, mcp__lcsc__*, WebSearch
---

# Design Validation Wizard

Validate design scope: **$ARGUMENTS**

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
