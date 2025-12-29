---
description: Source and select components based on project requirements
argument-hint: [component-role]
allowed-tools: Read, Write, WebSearch, mcp__lcsc__*, mcp__kicad__library_*
---

# Component Sourcing Agent

Source components for: **$ARGUMENTS**

## Context

Read the project specifications:
- @docs/project-spec.md
- @docs/design-constraints.json
- @docs/component-requirements.md

## Your Task

For the specified component role ($ARGUMENTS), you will:

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
