# PCB Routing Rules

Guidelines for trace routing, widths, and clearances.

## Trace Width Reference

### By Current (1oz copper, 10°C rise, external layer)

| Current | Width | Notes |
|---------|-------|-------|
| 0.3A | 0.25mm | Minimum for signals |
| 0.5A | 0.4mm | Light loads |
| 1.0A | 0.7mm | Moderate loads |
| 2.0A | 1.5mm | Power traces |
| 3.0A | 2.5mm | Heavy loads |
| 5.0A | 4.0mm | Very heavy loads |

**Internal layers:** Reduce capacity by ~50% due to poorer heat dissipation.

### By Signal Type

| Signal Type | Recommended Width |
|-------------|-------------------|
| Digital signals | 0.15-0.25mm |
| Power (< 500mA) | 0.3-0.5mm |
| Power (500mA-2A) | 0.5-1.5mm |
| Power (> 2A) | 1.5mm+ or copper pour |
| High-speed | Per impedance calc |
| Analog sensitive | 0.2-0.3mm |

## Clearance Rules

### Standard Clearances

| Between | Minimum | Recommended |
|---------|---------|-------------|
| Trace to trace | 0.15mm | 0.2mm |
| Trace to pad | 0.15mm | 0.2mm |
| Trace to via | 0.15mm | 0.2mm |
| Trace to board edge | 0.3mm | 0.5mm |
| Via to via | 0.3mm | 0.5mm |

### High Voltage Clearances

| Voltage | Clearance (internal) | Clearance (external) |
|---------|---------------------|---------------------|
| < 50V | 0.15mm | 0.2mm |
| 50-100V | 0.5mm | 1.0mm |
| 100-200V | 1.0mm | 2.0mm |
| > 200V | Per safety standard | Per safety standard |

## Via Specifications

### Standard Vias

| Type | Drill | Pad | Use |
|------|-------|-----|-----|
| Signal | 0.3mm | 0.6mm | Normal signals |
| Power | 0.4mm | 0.8mm | Power connections |
| Thermal | 0.3mm | 0.6mm | Heat dissipation |

### Via Current Capacity

Approximate current per via (1oz copper):
- 0.3mm drill: ~0.5A
- 0.4mm drill: ~0.8A
- 0.5mm drill: ~1.0A

**For higher currents:** Use multiple vias in parallel.

## Impedance Control

### Single-Ended Signals

For 50Ω impedance (typical RF):
```
1.6mm board, 1oz copper, FR4 (εr=4.5):
- Microstrip (outer layer): ~0.3mm trace over ground
- Stripline (inner layer): ~0.15mm trace between grounds
```

### Differential Pairs

For 90Ω differential (USB 2.0):
```
1.6mm board, 1oz copper, FR4:
- Trace width: 0.4mm
- Trace spacing: 0.15mm
- Reference plane: Solid ground directly below
```

For 100Ω differential (USB 3.0, LVDS):
```
Trace width: 0.35mm
Trace spacing: 0.2mm
```

### USB 2.0 Routing Rules

1. 90Ω differential impedance
2. Match D+ and D- lengths within 0.15mm
3. Keep pair tightly coupled
4. Minimize vias (ideally zero)
5. Reference solid ground plane
6. Keep < 50mm total length if possible

## Routing Strategies

### Power Routing

**Preferred approaches:**
1. Copper pour (best for high current)
2. Wide traces with multiple vias
3. Star topology from bulk cap to loads

**Avoid:**
- Long narrow power traces
- Daisy-chaining high-current loads
- Routing power through vias without checking capacity

### Ground Routing

**2-layer board:**
- Bottom layer as ground pour (as complete as possible)
- Use short vias to ground pour
- Avoid splitting ground plane

**4-layer board:**
- Layer 2 as solid ground plane
- All signals reference this plane
- Via stitching at board edges

### Signal Routing Priority

1. **Differential pairs** - Route first, maintain coupling
2. **High-speed clocks** - Short, direct paths
3. **Sensitive analog** - Away from digital, guard traces
4. **General digital** - Can route around others
5. **Non-critical signals** - Fill in remaining

### Routing Order

1. Fixed routes (matched length, impedance controlled)
2. Critical signals (clocks, reset)
3. Bus signals (keep grouped)
4. Power traces
5. Remaining signals
6. Add copper pours last

## Angle Guidelines

| Angle | Use | Notes |
|-------|-----|-------|
| 90° | Avoid | Causes reflections at high speed |
| 45° | Preferred | Good balance |
| Curved | Best | For high-speed, RF |

**When 90° is acceptable:**
- Low-speed signals (< 10MHz)
- Power traces
- Non-critical digital

## Layer Transitions

### Via Placement

**Do:**
- Place vias at trace ends, not middle
- Use via-in-pad for BGA (if supported)
- Add ground vias near signal vias for return current

**Don't:**
- Via in middle of impedance-controlled trace
- Multiple layer changes in high-speed signal
- Via without nearby ground return path

### Return Current Paths

Signal current flows on traces.
Return current flows in adjacent plane.

**Problem:** If signal changes reference plane (e.g., GND to PWR), return current path is broken.

**Solution:**
- Add stitching capacitor between planes at transition
- Or avoid layer changes for critical signals

## Specific Signal Types

### Crystal/Oscillator

```
┌─────────────────────────────────────┐
│                                     │
│    MCU ←──[short]──→ Crystal        │
│                                     │
│    - Keep traces < 5mm              │
│    - Ground guard ring around       │
│    - No other signals crossing      │
│    - Ground plane solid underneath  │
│                                     │
└─────────────────────────────────────┘
```

### I2C Bus

- Pull-up resistors at master end
- Series resistors (33-100Ω) optional for EMI
- Keep total bus capacitance < 400pF
- Trace length reasonable (< 30cm typical)

### SPI Bus

- MOSI, MISO, SCK: Route together
- CS lines: Can route separately
- Consider series termination for long traces
- Clock integrity most critical

### Reset Signal

- Keep short and direct
- Add filter cap at MCU end
- Consider series resistor for ESD
- Route away from noisy signals

## Anti-Patterns to Avoid

1. **Routing under crystals** - Coupling to clock
2. **Splitting ground plane** - Return current issues
3. **Acute angles** - Acid traps in manufacturing
4. **Stubs** - Reflections on high-speed signals
5. **Crossing analog/digital boundary** - Noise coupling
6. **Long parallel traces** - Crosstalk
7. **Via in differential pair** - Impedance discontinuity
