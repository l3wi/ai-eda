# Schematic Symbol Organization

Guidelines for organizing components on schematic sheets.

## General Principles

### Signal Flow
- **Inputs on left** → **Outputs on right**
- **Power at top** → **Ground at bottom**
- Follow natural signal flow through the circuit

### Visual Hierarchy
1. Main IC in center of functional block
2. Support components around it
3. Connectors at sheet edges
4. Power symbols at top, ground at bottom

### Spacing
- Leave room for wires between components
- Group related components with visual separation
- Align components on a grid

## Sheet Organization by Function

### Power Sheet

```
┌────────────────────────────────────────────────────┐
│                    POWER INPUT                      │
│  ┌─────┐    ┌─────┐    ┌─────┐                     │
│  │CONN │───►│FUSE │───►│PROT │                     │
│  └─────┘    └─────┘    └─────┘                     │
│                           │                         │
│              ┌────────────┼────────────┐           │
│              ▼            ▼            ▼           │
│         ┌────────┐   ┌────────┐   ┌────────┐      │
│         │REG 5V  │   │REG 3V3 │   │REG 1V8 │      │
│         └────────┘   └────────┘   └────────┘      │
│              │            │            │           │
│         [caps]       [caps]       [caps]           │
│              │            │            │           │
│         VCC_5V       VCC_3V3      VCC_1V8          │
└────────────────────────────────────────────────────┘
```

**Key elements:**
- Input connector at top-left
- Protection circuits inline
- Regulators in parallel
- Output rails clearly labeled
- Bulk caps near regulators

### MCU Sheet

```
┌────────────────────────────────────────────────────┐
│  VCC_3V3                                           │
│     │                                              │
│  [decoupling caps array]                           │
│     │                                              │
│     ▼                                              │
│  ┌──────────────────────────────────────────┐     │
│  │                                          │     │
│  │              MCU                         │     │
│  │                                          │     │
│  │  PWR    CLOCK    GPIO    COMM    DEBUG  │     │
│  └──┬────────┬────────┬────────┬────────┬──┘     │
│     │        │        │        │        │         │
│     │     ┌──┴──┐     │        │        │         │
│     │     │XTAL │     │        │        │         │
│     │     └─────┘     │        │        │         │
│     │                 │        │        │         │
│    GND          [to other   [to comm  [debug      │
│                  sheets]    sheets]   header]     │
└────────────────────────────────────────────────────┘
```

**Key elements:**
- MCU centered
- Decoupling caps in array above MCU
- Crystal close to MCU
- GPIO grouped by function
- Net labels for inter-sheet connections

### Interface Sheet (USB Example)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│  ┌─────────┐     ┌───────┐     ┌─────────┐       │
│  │USB CONN │────►│ESD    │────►│USB-UART │       │
│  │         │     │PROT   │     │BRIDGE   │       │
│  └─────────┘     └───────┘     └────┬────┘       │
│                                      │            │
│                                 UART1_TX          │
│                                 UART1_RX          │
│                                      │            │
│                              [to MCU sheet]       │
└────────────────────────────────────────────────────┘
```

## Component Grouping Patterns

### Decoupling Capacitor Array
Place all decoupling caps for an IC together:

```
         VCC
          │
    ┌─────┼─────┬─────┬─────┐
    │     │     │     │     │
   ═╧═   ═╧═   ═╧═   ═╧═   ═╧═
   10µ   100n  100n  100n  100n
    │     │     │     │     │
    └─────┴─────┴─────┴─────┴────GND
```

### Voltage Regulator Block
Standard regulator subcircuit:

```
    VIN ──┬──────┬────────────────┬── VOUT
          │      │                │
         ═╧═    ┌┴┐              ═╧═
         Cin    │ │REG           Cout
          │     └┬┘               │
          │      │                │
    GND ──┴──────┴────────────────┴──
```

### Pull-up/Pull-down Resistor Array

```
    VCC
     │
    ┌┴┐ ┌┴┐ ┌┴┐ ┌┴┐
    │ │ │ │ │ │ │ │  R_pullup
    └┬┘ └┬┘ └┬┘ └┬┘
     │   │   │   │
    SDA SCL INT RST
```

## Sheet Hierarchy

### Flat Design (Simple)
All components on one sheet. Good for:
- Simple designs (< 20 components)
- Quick prototypes
- Learning

### Hierarchical Design (Complex)
Multiple sheets with hierarchy. Good for:
- Complex designs (> 50 components)
- Reusable blocks
- Team collaboration

**Example hierarchy:**
```
main.kicad_sch
├── power.kicad_sch
├── mcu.kicad_sch
├── communication.kicad_sch
│   ├── usb.kicad_sch
│   ├── ethernet.kicad_sch
│   └── wifi.kicad_sch
└── io.kicad_sch
```

## Sheet Templates

### Title Block Information
Every sheet should include:
- Project name
- Sheet title
- Revision
- Date
- Author

### Standard Sheet Sizes
| Size | Dimensions | Use |
|------|------------|-----|
| A4 | 297×210mm | Simple designs |
| A3 | 420×297mm | Medium designs |
| A2 | 594×420mm | Complex sheets |

## Common Mistakes to Avoid

### Overcrowding
**Bad:** Components crammed together with no space for wires
**Good:** Adequate spacing, clear signal paths

### Crossing Wires
**Bad:** Many wire crossings creating visual confusion
**Good:** Use net labels to avoid crossing

### Inconsistent Orientation
**Bad:** Similar components rotated randomly
**Good:** All resistors horizontal, all caps vertical (or vice versa)

### Missing Power Connections
**Bad:** Power pins not visibly connected
**Good:** Clear power/ground connections with symbols

### Poor Grouping
**Bad:** Related components scattered across sheet
**Good:** Functional groups visually separated

## Quick Checklist

Before considering a sheet complete:

- [ ] Signal flow is clear (left to right)
- [ ] Power flows top to bottom
- [ ] All decoupling caps near their ICs
- [ ] No unnecessary wire crossings
- [ ] Net labels used for inter-sheet connections
- [ ] Component values visible
- [ ] Reference designators readable
- [ ] Power symbols clearly placed
- [ ] Adequate spacing for routing
