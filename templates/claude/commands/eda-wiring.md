---
description: Add wires and net labels to connect schematic components
argument-hint: [sheet-number or 'all']
allowed-tools: Read, Write, mcp__kicad__schematic_*, mcp__kicad__analysis_*
---

# Schematic Wiring Wizard

Wire schematic sheet: **$ARGUMENTS**

## Context

@docs/project-spec.md
@docs/design-constraints.json
@docs/component-selections.md
@datasheets/ (read relevant datasheets for pinouts)

## Your Task

### 1. Review Datasheets
For each IC on the sheet:
- Read the datasheet reference circuit
- Note required connections
- Identify critical routing (e.g., oscillator)

### 2. Plan Net Naming Convention
Establish consistent naming:
- Power: VCC_3V3, VCC_5V, GND, VBUS, etc.
- Data buses: SPI_MOSI, I2C_SDA, UART1_TX, etc.
- Signals: MCU_RESET, LED1, BTN1, etc.

### 3. Wire Power Connections
- Connect all power pins with net labels
- Add decoupling caps to power pins
- Connect ground pins
- Verify power sequencing if required

### 4. Wire Signal Connections
For each functional group:
- Add net labels for inter-sheet connections
- Wire local connections directly
- Use net labels to avoid wire crossing
- Keep buses visually grouped

### 5. Check Unconnected Pins
- List any unconnected pins
- Verify they should be unconnected (NC pins)
- Add "no connect" flags where appropriate

### 6. Run ERC
- Execute electrical rules check
- Address any errors
- Document any intentional warnings

## Output

1. Fully wired schematic
2. Update `docs/schematic-status.md`:
   - Wiring complete status
   - ERC results
   - Any manual attention needed

## Net Label Style Guide

```
Power Rails:
  VCC_3V3, VCC_5V, VCC_1V8, VBAT
  GND, GNDA (analog ground)

Communication:
  SPI1_MOSI, SPI1_MISO, SPI1_SCK, SPI1_CS_FLASH
  I2C1_SDA, I2C1_SCL
  UART1_TX, UART1_RX

Control Signals:
  MCU_RESET, PHY_RESET
  BOOT0, BOOT1

GPIO:
  GPIO_PA0, or descriptive: LED_STATUS, BTN_USER
```

After wiring, recommend `/eda-validate` to check design.
