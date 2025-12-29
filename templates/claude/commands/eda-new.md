---
description: Start a new EDA project with guided specification
argument-hint: [project-name]
allowed-tools: Read, Write, Glob, Bash(mkdir:*)
---

# New EDA Project: $ARGUMENTS

Launch an interactive session to define your electronics project.

## Context Check

First, check if project already exists:
- Look for `docs/project-spec.md`
- Look for `docs/design-constraints.json`

If exists, ask user if they want to:
1. Start fresh (overwrite)
2. Review and update existing spec
3. Cancel

## Interactive Workflow

Guide the user through defining their project by asking questions in this order:

### 1. Project Overview
- What is this board/device intended to do?
- Is this a prototype, hobby project, or production design?
- Any reference designs or existing products to draw from?

### 2. Power Requirements
- How will this be powered? (USB, battery, wall adapter, etc.)
- What voltage rails do you need? (3.3V, 5V, 12V, etc.)
- Estimated power consumption?
- Battery life requirements (if applicable)?

### 3. Processing
- Do you need a microcontroller?
- Any preferred MCU families? (STM32, ESP32, RP2040, etc.)
- Key peripherals needed? (USB, SPI, I2C, ADC, etc.)
- Processing power requirements?

### 4. Connectivity
- Wireless needs? (WiFi, Bluetooth, LoRa, etc.)
- Wired interfaces? (Ethernet, CAN, RS485, etc.)
- USB required? (Device, host, or OTG?)

### 5. User Interface
- Buttons, switches, or encoders?
- LEDs or displays?
- Any audio requirements?

### 6. Sensors and I/O
- What sensors are needed?
- Analog inputs/outputs?
- Digital I/O requirements?

### 7. Physical Constraints
- Target board size?
- Enclosure requirements?
- Mounting hole positions?
- Connector locations?

### 8. Environment and Compliance
- Operating temperature range?
- Indoor or outdoor use?
- Certifications needed? (CE, FCC, etc.)

### 9. Manufacturing
- Target quantity?
- Assembly method? (Hand solder, reflow, turnkey)
- Budget constraints?

## Output

After gathering requirements, create:

1. **`docs/project-spec.md`** - Human-readable specification
2. **`docs/design-constraints.json`** - Machine-readable constraints (see eda-architect skill for schema)

## Project Structure

Also create the project directory structure if it doesn't exist:

```
mkdir -p docs datasheets libraries/symbols libraries/footprints/LCSC.pretty libraries/3dmodels/LCSC.3dshapes production
```

Note: KiCad project files (.kicad_pro, .kicad_sch, .kicad_pcb) are stored in the project root, not in a subdirectory.

## Next Steps

After completion, suggest:
- `/eda-source mcu` - Start sourcing the main microcontroller
- Or `/eda-source power` - Start with power components

Update `design-constraints.json` with `"stage": "research"` when complete.
