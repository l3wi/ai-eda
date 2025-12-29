---
description: Define EDA project specifications and design constraints
argument-hint: [project-name]
allowed-tools: Read, Write, Bash(mkdir:*), mcp__lcsc__component_search
---

# EDA Project Specification

You are initializing a new EDA project: **$ARGUMENTS**

## Your Task

Guide the user through defining their project requirements. Ask about and document:

### 1. Project Goals
- What is this device/board intended to do?
- What are the key features?
- Target use case (prototype, production, hobby)?

### 2. Power Requirements
- Input power source (USB, battery, wall adapter, PoE, etc.)
- Voltage rails needed (3.3V, 5V, 12V, etc.)
- Estimated power consumption
- Battery life requirements if applicable

### 3. Processing/Control
- Need for MCU? Which family preference? (STM32, ESP32, RP2040, etc.)
- Processing requirements (speed, peripherals needed)
- Memory requirements (Flash, RAM)

### 4. Connectivity & Interfaces
- Wireless: WiFi, Bluetooth, LoRa, Zigbee, cellular?
- Wired: Ethernet, USB, CAN, RS485, RS232?
- User interfaces: buttons, LEDs, displays, etc.

### 5. Sensors & I/O
- What sensors are needed?
- Analog inputs/outputs?
- Digital I/O count?

### 6. Physical Constraints
- Target board size?
- Enclosure requirements?
- Mounting requirements?
- Connector placement constraints?

### 7. Environmental
- Operating temperature range?
- Indoor/outdoor use?
- Any certifications needed (CE, FCC, etc.)?

### 8. Manufacturing
- Target quantity?
- Assembly (hand solder, reflow, professional)?
- Layer count preference?
- Budget constraints?

## Output

Create the following files:

1. `docs/project-spec.md` - Full specification document
2. `docs/design-constraints.json` - Machine-readable constraints
3. `docs/component-requirements.md` - Initial component wishlist

## Format for design-constraints.json

```json
{
  "project": {
    "name": "",
    "version": "0.1.0",
    "description": ""
  },
  "power": {
    "input": { "type": "", "voltage": { "min": 0, "max": 0 } },
    "rails": [{ "voltage": 0, "current_ma": 0 }]
  },
  "board": {
    "layers": 2,
    "size": { "width_mm": 0, "height_mm": 0 },
    "mounting_holes": []
  },
  "interfaces": [],
  "environment": {
    "temp_min_c": -20,
    "temp_max_c": 70
  }
}
```

After gathering requirements, summarize and confirm with the user before creating files.
