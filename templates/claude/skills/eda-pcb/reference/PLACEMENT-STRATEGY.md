# Component Placement Strategy

Guidelines for placing components on PCB.

## Placement Priority

### 1. Fixed Position Components
These determine the rest of the layout:

**Connectors**
- USB: Board edge, accessible
- Power input: Board edge, away from sensitive circuits
- Programming header: Accessible for debugging
- I/O connectors: Based on enclosure requirements

**Mounting Holes**
- Corners for rectangular boards
- Match enclosure requirements
- Minimum 3mm from board edge
- Consider component clearance around holes

### 2. Critical Components

**MCU/Main Processor**
- Central location (signals radiate out)
- Consider pin orientation vs. peripheral locations
- Leave space for decoupling cap array
- Orient for easiest routing to peripherals

**Crystal/Oscillator**
- Within 5mm of MCU clock pins
- Ground guard ring if possible
- Away from high-speed signals
- Short, matched length traces

**Voltage Regulators**
- Near power input
- Consider thermal dissipation
- Input caps close to input pin
- Output caps close to output pin
- Allow copper pour for heat spreading

### 3. Support Components

**Decoupling Capacitors**
- As close to IC power pins as possible
- Ideally on same layer as IC
- Vias directly to ground plane
- Array pattern for multi-cap decoupling

**ESD Protection**
- Near connectors they protect
- Short path to protected signals
- Direct ground connection

### 4. Remaining Components

**Group by function:**
- Power section together
- Analog section together
- Digital section together
- Communication interfaces together

## Placement Rules by Component Type

### Capacitors

| Type | Placement Rule |
|------|----------------|
| Bulk input | Near power input connector |
| Bulk output | Near regulator output |
| Bypass/decoupling | < 3mm from IC power pin |
| Analog filter | Near analog IC |

### Resistors

| Type | Placement Rule |
|------|----------------|
| Pull-up/down | Near the IC using the signal |
| Current sense | In the current path |
| LED resistor | Near LED or driver |
| Termination | At end of transmission line |

### Inductors

- Keep away from sensitive analog
- Consider magnetic field coupling
- Orient perpendicular if multiple inductors nearby
- Allow space for EMI

### LEDs

- Visible from intended viewing angle
- Consider light pipe if enclosed
- Group indicator LEDs together

## Distance Guidelines

### Critical Distances

| Requirement | Maximum Distance |
|-------------|-----------------|
| Crystal to MCU | 5mm |
| Decoupling to IC | 3mm |
| USB ESD to connector | 10mm |
| Antenna to matching | 5mm |

### Recommended Clearances

| Item | Minimum Clearance |
|------|-------------------|
| Mounting hole to component | 2mm |
| Board edge to component | 1mm (0.5mm for connectors) |
| High voltage to low voltage | Per safety requirements |
| Antenna keep-out | Per antenna datasheet |

## Thermal Considerations

### Heat Sources
- Voltage regulators (especially LDOs)
- Power MOSFETs
- High-current paths
- Processors under load

### Thermal Management
1. Place heat sources near board edge
2. Allow copper pour connection
3. Use thermal vias under hot components
4. Consider airflow direction
5. Keep temperature-sensitive components away from heat

### Thermal Via Pattern
```
┌─────────────────┐
│  ○   ○   ○   ○  │
│                 │
│  ○   ┌───┐  ○   │
│      │PAD│      │  Component thermal pad
│  ○   └───┘  ○   │
│                 │
│  ○   ○   ○   ○  │
└─────────────────┘

Vias: 0.3mm drill, 0.6mm pad
Pattern: Grid under thermal pad
Connect to: Ground plane or dedicated copper pour
```

## Orientation Guidelines

### ICs
- Pin 1 consistent direction (all top-left, or all marked corner same way)
- Consider routing when choosing orientation
- Text readable from one or two directions only

### Passives
- Consistent orientation (all horizontal or vertical within a group)
- Easier for pick-and-place
- Easier visual inspection

### Polarized Components
- Mark polarity clearly in silkscreen
- Consider common mistake orientations
- Group similar components with same orientation

### Connectors
- Headers: Pin 1 marked, consistent location
- USB: Match enclosure cutout
- Power: Protected from accidental shorts

## Placement Patterns

### Decoupling Cap Array (MCU)
```
         VCC bus
           │
    ┌──────┼──────┐
    │  C1  │  C2  │
    │  ▪   │  ▪   │   10µF + 100nF per group
    └──────┼──────┘
           │
    ┌──────┼──────┐
    │      │      │
    │    ┌─┴─┐    │
    │    │MCU│    │   IC centered
    │    └─┬─┘    │
    │      │      │
    └──────┼──────┘
           │
    GND plane (vias)
```

### Power Supply Section
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌────┐    ┌────┐    ┌────┐    ┌────┐  │
│  │Cin │    │REG │    │Cout│    │Load│  │
│  └────┘    └────┘    └────┘    └────┘  │
│                                         │
│  Power flows left to right              │
│  Wide traces for current path           │
│  Ground pour underneath                 │
└─────────────────────────────────────────┘
```

### USB Section
```
┌─────────────────────────────────────────┐
│                                         │
│  ┌──────┐    ┌─────┐    ┌─────────────┐│
│  │USB-C │────│ ESD │────│ MCU/Bridge  ││
│  │ CONN │    │     │    │             ││
│  └──────┘    └─────┘    └─────────────┘│
│                                         │
│  Short path, matched diff pairs         │
│  ESD close to connector                 │
└─────────────────────────────────────────┘
```

## Common Mistakes

1. **Crystal too far from MCU** - Clock integrity issues
2. **Decoupling caps far from pins** - Ineffective filtering
3. **Heat sources near sensitive analog** - Thermal drift
4. **No room for rework** - Can't fix problems
5. **Ignoring connector accessibility** - Can't plug in cables
6. **Random component orientation** - Hard to assemble, inspect
7. **Antenna blocked by ground** - Poor RF performance
