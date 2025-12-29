# Schematic Hierarchy Decision Guide

Quick reference for choosing schematic organization during the schematic phase.

## Decision Tree

```
START
  │
  ├─ Total components >50? ──YES──► Multi-sheet (3+)
  │
  ├─ Distinct functional blocks >3? ──YES──► Multi-sheet (one per block)
  │   (power, MCU, interfaces, sensors, etc.)
  │
  ├─ Reusable circuits? ──YES──► Hierarchical sheets
  │   (same circuit used 2+ times)
  │
  ├─ Team collaboration? ──YES──► Multi-sheet (assign per person)
  │
  ├─ Design will be extended later? ──YES──► Hierarchical sheets
  │
  └─ Simple design, <30 components ──► Single sheet OK
```

## Sheet Count Summary

| Sheets | When to Use | Typical Structure |
|--------|-------------|-------------------|
| **1** | Breakout boards, simple sensors, LED drivers | Everything on one page |
| **2** | Simple MCU + power, small peripherals | Power / Logic |
| **3-4** | Standard MCU projects with interfaces | Power / MCU / Interfaces / I/O |
| **5+** | Complex designs, multi-MCU, many interfaces | One sheet per major function |

## Single Sheet: When It Works

**Good for:**
- Breakout boards
- LED drivers (<10 components)
- Simple sensor boards
- Voltage regulators
- Hobby/learning projects

**Avoid if:**
- More than 30-40 components
- Multiple distinct functions
- Complex power (multiple rails)
- Design will grow later

## Multi-Sheet (Flat): Standard Choice

**Use when:**
- 30-80 components
- 3-5 distinct functional areas
- No repeated subcircuits
- Standard project complexity

**Typical organization:**

```
Project.kicad_sch (root)
├── Power.kicad_sch      # Input, protection, regulators
├── MCU.kicad_sch        # MCU, crystal, reset, programming
├── Interfaces.kicad_sch # USB, UART, SPI, I2C
└── IO.kicad_sch         # Connectors, LEDs, buttons
```

**Sheet naming convention:**
- Use descriptive names (Power, MCU, USB_Interface)
- Avoid generic names (Sheet1, Sheet2)
- Keep names short for net labels

## Hierarchical Sheets: When to Choose

**Use when:**
- Same subcircuit appears 2+ times
- Design for reuse in other projects
- Very complex designs (>100 components)
- Team needs to work on isolated modules

**Example: Multi-channel design**
```
Amplifier.kicad_sch (parent)
├── Power.kicad_sch
├── Input_Stage.kicad_sch
│   └── Preamp.kicad_sch (×4)  ◄── Hierarchical reuse
├── Output_Stage.kicad_sch
│   └── PowerAmp.kicad_sch (×4) ◄── Hierarchical reuse
└── Protection.kicad_sch
```

**Hierarchical sheet pin types:**
| Pin Type | Direction | Usage |
|----------|-----------|-------|
| Input | Into sheet | Signals entering the subcircuit |
| Output | Out of sheet | Signals leaving the subcircuit |
| Bidirectional | Both | I2C SDA/SCL, buses |
| Passive | Neither | Power rails (GND, VCC) |

## Sheet Organization by Project Type

### Simple MCU Project (2-3 sheets)

```
Sheet 1: Power
├── Input connector (USB/barrel jack)
├── Protection (TVS, fuse)
├── Regulator(s)
└── Power indicators

Sheet 2: MCU + Core
├── Microcontroller
├── Crystal/oscillator
├── Reset circuit
├── Programming header
├── Decoupling
└── Debug LEDs

Sheet 3: Peripherals (if needed)
├── Communication (UART, I2C)
├── Sensors
├── Connectors
└── User I/O (buttons, LEDs)
```

### Standard IoT Device (4-5 sheets)

```
Sheet 1: Power
├── Input protection
├── Main regulator
├── Secondary rails (if any)
└── Power sequencing

Sheet 2: MCU
├── MCU + support circuits
├── Crystal
├── Reset
└── Programming

Sheet 3: Wireless
├── WiFi/BLE module
├── Antenna matching
├── RF considerations

Sheet 4: Interfaces
├── USB
├── Sensors
├── External I/O

Sheet 5: Connectors
├── Debug ports
├── User interface
└── Expansion
```

### Complex Mixed-Signal (6+ sheets)

```
Sheet 1: Power Input
Sheet 2: Digital Power Rails
Sheet 3: Analog Power Rails
Sheet 4: Digital Core (MCU)
Sheet 5: High-Speed Interfaces
Sheet 6: Analog Front-End
Sheet 7: Sensors
Sheet 8: Connectors & IO
```

## Inter-Sheet Signal Naming

### Power Rails
Use global power symbols - no explicit net labels needed:
- `VCC_3V3`, `VCC_5V`, `VBAT`, `GND`

### Signals Between Sheets
Use hierarchical labels or global labels:

```
Good: MCU_TX, USB_DP, SPI1_MOSI
Bad:  TX, D+, MOSI (ambiguous)
```

### Bus Connections
Group related signals:

```
SPI1_* (SPI1_MOSI, SPI1_MISO, SPI1_SCK, SPI1_CS)
I2C1_* (I2C1_SDA, I2C1_SCL)
```

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Everything on one sheet | Unreadable, hard to navigate | Split by function |
| Too many tiny sheets | Excessive navigation | Combine related functions |
| Inconsistent sheet naming | Confusion in net labels | Use consistent naming convention |
| Missing sheet pins | Broken inter-sheet connections | Verify all hierarchical labels |
| Power on every sheet | Cluttered, redundant | Centralize in Power sheet |
| Generic sheet names (Sheet1) | No context for navigation | Use descriptive names |

## Sheet Size Selection

| Size | Grid | When to Use |
|------|------|-------------|
| A4 | ~190×277mm | Simple sheets, few components |
| A3 | ~297×420mm | Standard sheets, moderate complexity |
| A2 | ~420×594mm | Dense sheets, many components |

**Default recommendation:** A3 for most sheets

## Quality Checklist

Before finalizing sheet organization:

- [ ] Every sheet has a clear purpose?
- [ ] Related components are together?
- [ ] Signal flow is logical (left→right, top→bottom)?
- [ ] Power distribution is traceable?
- [ ] Sheet count matches complexity?
- [ ] Hierarchical labels match between sheets?
- [ ] No orphan sheets (disconnected)?

## Integration with Upstream Decisions

From `design-constraints.json`:
- **Layer count 2**: Keep schematic simpler, fewer sheets
- **Layer count 4+**: Can support more complex organization
- **Thermal budget**: Group hot components for visibility
- **DFM targets**: Consider assembly complexity when organizing

From `component-selections.md`:
- Number of components guides sheet count
- Functional grouping based on selected parts
- Interface requirements drive sheet organization
