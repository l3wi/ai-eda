# EMI/EMC Considerations

Electromagnetic interference and compatibility guidelines.

## EMI Basics

### Sources of EMI
- High-speed clocks (MCU, crystals)
- Switching power supplies
- Digital signals with fast edges
- RF transmitters
- Motor drives

### Victims of EMI
- Analog circuits
- ADC inputs
- RF receivers
- Sensitive sensors
- Communication interfaces

## Ground Plane Design

### Solid Ground Plane (Preferred)

```
┌─────────────────────────────────────────┐
│  Signal Layer                           │
├─────────────────────────────────────────┤
│  ████████████████████████████████████   │
│  ██████ SOLID GROUND PLANE █████████   │
│  ████████████████████████████████████   │
├─────────────────────────────────────────┤
│  Signal/Power Layer                     │
└─────────────────────────────────────────┘

Benefits:
- Low impedance return path
- Shielding between layers
- Heat spreading
```

### Avoid Plane Splits

**Bad:**
```
████████│      │████████
████████│ GAP  │████████
████████│      │████████
    Signal crosses gap → EMI
```

**If split necessary:**
- Don't route signals across the gap
- Add stitching capacitors at gap edges
- Keep sensitive signals away from split area

### Ground Stitching Vias

Add vias around board perimeter and near:
- Connectors
- High-speed signals
- Sensitive circuits
- Board edges

```
○ ○ ○ ○ ○ ○ ○ ○ ○
○                 ○
○    Circuit      ○
○                 ○
○ ○ ○ ○ ○ ○ ○ ○ ○

Spacing: 1/10 wavelength of highest frequency
Typical: 5-10mm for < 1GHz signals
```

## Signal Integrity

### Rise Time and EMI

Faster edges = More harmonics = More EMI

| Rise Time | Highest Significant Frequency |
|-----------|------------------------------|
| 10ns | ~35 MHz |
| 5ns | ~70 MHz |
| 1ns | ~350 MHz |
| 100ps | ~3.5 GHz |

### Controlled Impedance

For signals > 50MHz or long traces:
- Calculate required trace geometry
- Use PCB stackup calculator
- Route over solid reference plane
- Maintain consistent impedance

### Length Matching

For parallel buses (DDR, LVDS):
- Match lengths within timing budget
- Use serpentine routing if needed
- Keep serpentines gentle (large radius)

## Power Supply Noise

### Decoupling Strategy

```
Power Input → Bulk Cap → Local Bulk → Bypass Caps → IC
              (100µF)    (10µF)       (100nF)

Each stage filters different frequencies:
- Bulk: Low frequency (< 100kHz)
- Local: Mid frequency (100kHz - 1MHz)
- Bypass: High frequency (> 1MHz)
```

### Capacitor Placement

**Critical:** Place bypass caps as close as possible to IC power pins.

```
     VCC
      │
      ╔═══════════════╗
      ║      IC       ║
      ║               ║
      ║ VCC ──┬─ GND  ║
      ╚═══════╪═══════╝
              │
             ═╧═ 100nF (< 3mm from pin)
              │
             GND via (< 1mm from cap)
```

### Power Plane Noise

**Issue:** Fast switching creates voltage ripple on power planes.

**Solutions:**
1. Multiple decoupling caps distributed across plane
2. Low-ESR capacitors
3. Separate analog and digital power domains
4. Ferrite beads between domains

## Shielding and Isolation

### Guard Traces

Surround sensitive signals with grounded traces:

```
GND ─────────────────────────────────
    ─────────────────────────────────
     Sensitive signal
    ─────────────────────────────────
GND ─────────────────────────────────
```

**Use for:**
- High-impedance analog inputs
- Reference voltages
- Clock signals

### Physical Separation

Keep apart:
- Digital and analog sections
- Noisy and sensitive circuits
- RF and baseband
- High-current and low-current paths

Typical separation: 5-10mm minimum

### Copper Pours as Shields

```
┌─────────────────────────────────────┐
│  ████████████████████████████████   │
│  ██  Sensitive Analog Section  ██   │
│  ██                            ██   │
│  ██   [Surrounded by GND]      ██   │
│  ██                            ██   │
│  ████████████████████████████████   │
└─────────────────────────────────────┘
```

## Connectors and I/O

### ESD Protection Placement

```
External → ESD → Protected Circuit
Connector   │
            └──→ Short path to ground

Rules:
- ESD device as close to connector as possible
- Short, wide ground connection
- Route protected signal after ESD
```

### Filtering

For signals entering/leaving the board:

```
External ──[FB]──┬──[ESD]──→ Internal
                 │
                ═╧═ Cap
                 │
                GND

FB = Ferrite bead
Cap = Filter capacitor (100pF - 10nF)
```

### Cable Shield Connection

**For shielded cables:**
1. Connect shield to chassis ground
2. Or connect through capacitor to avoid ground loops
3. 360° connection preferred over pigtail

## PCB Stack-up for EMI

### 2-Layer (Limited EMI control)

```
Layer 1: Signals + Power (with ground pour)
Layer 2: Ground pour (as solid as possible)
```

**Limitations:**
- No continuous return path
- Limited shielding
- Suitable for low-frequency designs

### 4-Layer (Good EMI control)

```
Layer 1: Signals
Layer 2: Ground (solid)
Layer 3: Power
Layer 4: Signals
```

**Benefits:**
- Solid reference plane for signals
- Better shielding between layers
- Lower power distribution impedance

### 6-Layer (Excellent EMI control)

```
Layer 1: Signals
Layer 2: Ground
Layer 3: Signals
Layer 4: Signals
Layer 5: Power
Layer 6: Signals (+ Ground)
```

## Specific Problem Areas

### Switching Regulators

**Hot loop:** Input cap → Switch → Inductor → Output cap → GND → Input cap

```
Minimize this loop area:
┌────────────────┐
│ Keep tight!    │
│  ┌──┐    ┌──┐ │
│  │SW│────│ L│──┼──→ Out
│  └┬─┘    └──┘ │
│   │           │
│  ═╧═ Cin     ═╧═ Cout
│   │           │
│   └─────┬─────┘
│        GND
└────────────────┘
```

### Crystal Oscillators

**EMI source:** Sharp clock edges radiate

**Mitigation:**
- Short traces (< 5mm)
- Guard ring around crystal
- Ground plane solid underneath
- Don't route signals near crystal

### USB

**EMI concerns:**
- Common mode noise on D+/D-
- Cable acts as antenna

**Mitigation:**
- Common mode choke near connector
- ESD with integrated CM filtering
- Proper impedance matching
- Shield connection to ground

## EMI Checklist

Before layout completion:

- [ ] Ground plane as solid as possible
- [ ] No signals crossing plane splits
- [ ] Decoupling caps placed correctly
- [ ] High-speed signals over solid reference
- [ ] Ground stitching vias in place
- [ ] ESD protection at I/O connectors
- [ ] Power supply hot loops minimized
- [ ] Crystal isolated with guard ring
- [ ] Analog/digital sections separated
- [ ] No long parallel traces (crosstalk)
