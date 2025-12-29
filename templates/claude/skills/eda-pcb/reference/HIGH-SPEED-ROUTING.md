# High-Speed Routing Guide

Practical routing guidelines for common ESP32/STM32 project interfaces.

## Quick Reference

| Interface | Impedance | Max Length | Key Rules |
|-----------|-----------|------------|-----------|
| USB 2.0 | 90Ω diff | 200mm | Length match ±1mm, no vias |
| SPI (fast) | 50Ω SE | 50mm | Clock has clean return path |
| I2C Std | N/A | 450mm | Pull-ups near master |
| I2C Fast | N/A | 200mm | Lower pull-ups (2.2K) |
| SD Card | 50Ω SE | 100mm | Length match ±3mm |
| Crystal | N/A | 10mm | Guard ring, no routing under |
| WiFi Antenna | 50Ω | 25mm | Keep-out zone required |
| ADC Input | N/A | Short | Isolate from digital |

---

## USB 2.0 Full/High Speed

### Requirements

| Parameter | Requirement |
|-----------|-------------|
| Differential impedance | 90Ω ±10% |
| Length match (D+/D-) | ±1.1mm |
| Total length | <200mm (shorter is better) |
| Layer changes | Avoid (0 ideal) |
| Reference plane | Solid ground |

### Trace Dimensions (4-layer, 0.2mm prepreg)

```
         D+
    ╔═════════════════════╗
    ║                     ║  Width: 0.2mm
    ║   ◄──── 0.15mm ────►║  Gap: 0.15mm
    ║                     ║
    ╚═════════════════════╝
         D-
```

### Layout Checklist

- [ ] Traces tightly coupled (constant gap)
- [ ] Length matched within 1mm
- [ ] No vias in pair
- [ ] 3W spacing to other signals (0.6mm minimum)
- [ ] Continuous ground reference underneath
- [ ] Series resistors (if used) placed symmetrically
- [ ] ESD protection at connector end

### Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Long USB traces | Signal degradation | Keep <100mm |
| Via in differential pair | Impedance discontinuity | Route on single layer |
| Traces separate for components | Coupling breaks | Keep pair together |
| No ground under traces | No reference plane | Route over solid GND |
| Different length D+/D- | Signal skew | Length match carefully |

### USB-C Considerations

USB-C adds CC1/CC2 configuration pins:
- CC1, CC2: Route as regular signals (not impedance controlled)
- Place 5.1kΩ pull-downs for device mode
- Keep CC traces away from USB data pair

---

## SPI Interface

### When Speed Matters

| SPI Clock | Routing Care Level |
|-----------|-------------------|
| <1MHz | None - route anywhere |
| 1-10MHz | Basic - short traces |
| 10-25MHz | Moderate - impedance awareness |
| >25MHz | Critical - full SI treatment |

### High-Speed SPI (>10MHz)

**Critical signal: SCK (clock)**

```
        SCK routing priority:

        MCU ════════════════════════► Peripheral
             │
             └─ Short, direct path
                Clean return path underneath
                No vias if possible
```

### Routing Rules

| Signal | Priority | Notes |
|--------|----------|-------|
| SCK | Highest | Shortest, cleanest path |
| MOSI | High | Route with SCK |
| MISO | High | Route with SCK |
| CS | Medium | Can be longer |

### Length Matching

| Speed | Match Requirement |
|-------|-------------------|
| <10MHz | Not required |
| 10-25MHz | Within 10mm |
| >25MHz | Within 5mm |

### SPI Layout Pattern

```
┌───────────────────────────────────────────┐
│                                           │
│   [MCU]                    [Flash/SD]     │
│     │                          │          │
│     ├──SCK─────────────────────┤          │
│     ├──MOSI────────────────────┤          │
│     ├──MISO────────────────────┤          │
│     └──CS──────────────────────┤          │
│                                           │
│   Keep parallel, similar length           │
│   Ground plane solid underneath           │
│                                           │
└───────────────────────────────────────────┘
```

### Decoupling

Place 100nF decoupling capacitor:
- At peripheral VCC pin
- As close as possible (<3mm)
- Via to ground plane directly under cap

---

## I2C Interface

### Speed Grades

| Mode | Speed | Max Capacitance | Max Length |
|------|-------|-----------------|------------|
| Standard | 100kHz | 400pF | ~450mm |
| Fast | 400kHz | 400pF | ~200mm |
| Fast Plus | 1MHz | 550pF | ~100mm |

### Pull-up Resistor Selection

```
                VCC
                 │
                ┌┴┐
                │ │ Rp
                └┬┘
                 │
    ────────────┬────────────────── SDA/SCL
                │
              Load capacitance
```

| Mode | Typical Rp | Notes |
|------|------------|-------|
| Standard | 4.7kΩ | Most common |
| Fast | 2.2kΩ | Faster rise time |
| Long bus | 1kΩ-2.2kΩ | Overcomes capacitance |
| Short bus | 10kΩ | Lower power |

### Pull-up Placement

**Best:** Near I2C master (MCU)

```
Good:                           Bad:
[MCU]──Rp──────[Sensor]         [MCU]──────Rp──[Sensor]
       │                                       │
       └─Near MCU                              └─Far from MCU
```

### I2C Layout Rules

1. **Route SDA and SCL together** - Similar capacitance
2. **Keep traces short** - Total bus < specified max
3. **Avoid parallel routing with fast signals** - Crosstalk
4. **Single pull-up set** - Don't stack multiple devices' pull-ups

### Level Shifting

For 3.3V MCU to 5V devices:
- Use bidirectional level shifter (BSS138-based)
- Or I2C-specific buffer (PCA9306)
- Place near voltage boundary

---

## SD Card Interface

### Modes

| Mode | Speed | Impedance Control |
|------|-------|-------------------|
| Default | 25MHz | Not required |
| High Speed | 50MHz | Recommended |
| SDR104 | 208MHz | Required |

### Routing Guidelines (High Speed Mode)

| Parameter | Requirement |
|-----------|-------------|
| Trace impedance | 50Ω ±10% |
| Length match | ±3mm (all data lines) |
| Total length | <100mm |
| CLK routing | Highest priority |

### SD Card Signal Routing

```
┌─────────────────────────────────────┐
│                                     │
│   CMD  ═══════════════════════════  │
│   CLK  ═══════════════════════════  │ ← Route CLK first
│   DAT0 ═══════════════════════════  │
│   DAT1 ═══════════════════════════  │ ← Match DAT0-3
│   DAT2 ═══════════════════════════  │
│   DAT3 ═══════════════════════════  │
│                                     │
│   Keep grouped, similar length      │
│                                     │
└─────────────────────────────────────┘
```

### Decoupling

- 100nF at SD card VDD (close to connector)
- 10µF bulk near connector
- Consider series termination resistors (22Ω) for long traces

---

## WiFi/BLE Antenna (ESP32)

### Antenna Types

| Type | Keep-out | Notes |
|------|----------|-------|
| PCB trace antenna | Large zone | Follow reference design exactly |
| Chip antenna | 10mm zone | Smaller but still important |
| External (U.FL) | Feed line critical | 50Ω controlled |

### PCB Antenna Keep-out

```
┌─────────────────────────────────────────────┐
│                                             │
│                                   ┌───────┐ │
│                                   │       │ │
│   ════════════════════════════════│ ANT   │ │
│   Antenna feed (50Ω)              │       │ │
│                                   └───────┘ │
│                                             │
│   ┌─────────────────────────────────────┐   │
│   │     NO COPPER / NO TRACES           │   │
│   │     (Ground plane removed)          │   │
│   │     Keep-out extends past board     │   │
│   └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

### ESP32 Antenna Rules

1. **Copy reference design** - Antenna geometry is critical
2. **No ground pour** in antenna region
3. **No traces** in keep-out zone
4. **No components** near antenna
5. **Board edge** should extend antenna direction
6. **Metal enclosure** can detune - plan ahead

### RF Feed Line

| Parameter | Value |
|-----------|-------|
| Impedance | 50Ω |
| Width | ~0.4mm (varies with stackup) |
| Length | As short as possible |
| Vias | None |
| Bends | 45° or curved only |

---

## Crystal/Oscillator Layout

### Critical Requirements

| Parameter | Requirement |
|-----------|-------------|
| Trace length | <10mm |
| Ground plane | Solid underneath |
| Guard ring | Recommended |
| Other signals | None crossing/nearby |

### Layout Pattern

```
┌─────────────────────────────────────────┐
│                                         │
│   ┌─────────────────────────────────┐   │
│   │       GUARD RING (GND)          │   │
│   │   ┌─────────────────────────┐   │   │
│   │   │                         │   │   │
│   │   │   ┌───────────────┐     │   │   │
│   │   │   │   CRYSTAL     │     │   │   │
│   │   │   │   ┌───┐       │     │   │   │
│   │   │   │   │ Y │       │     │   │   │
│   │   │   │   └───┘       │     │   │   │
│   │   │   │     │  │      │     │   │   │
│   │   │   │   C1│  │C2    │     │   │   │
│   │   │   │   ══╪══╪══    │     │   │   │
│   │   │   │     │  │      │     │   │   │
│   │   │   └─────┼──┼──────┘     │   │   │
│   │   │         │  │            │   │   │
│   │   │    XIN ─┘  └─ XOUT      │   │   │
│   │   │         │  │            │   │   │
│   │   │       [MCU]             │   │   │
│   │   │                         │   │   │
│   │   └─────────────────────────┘   │   │
│   │                                 │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Load caps close to crystal            │
│   No traces crossing this area          │
│   Ground plane solid underneath         │
│                                         │
└─────────────────────────────────────────┘
```

### Component Placement

1. **Crystal** - As close to MCU as possible
2. **Load capacitors** - Adjacent to crystal pins
3. **Ground** - Short vias from caps to ground plane

### Common Problems

| Problem | Cause | Solution |
|---------|-------|----------|
| Won't start | Load caps wrong | Recalculate or try different values |
| Frequency drift | Temperature | Use TCXO if critical |
| EMI issues | No guard ring | Add ground guard ring |
| Interference | Traces underneath | Clear routing from crystal area |

---

## Display Interfaces

### SPI Display (TFT, e-Paper)

| Signal | Priority | Notes |
|--------|----------|-------|
| SCK | High | Clock integrity |
| MOSI | Medium | Route with SCK |
| DC | Low | Data/Command select |
| CS | Low | Chip select |
| RST | Low | Reset |

**Typical speeds:** 20-80MHz SPI

**Layout:**
- Keep within 100mm
- Decoupling at display connector
- LED backlight power routed separately

### I2C Display (OLED)

- Standard I2C rules apply
- Short traces (display usually close to MCU)
- VCC decoupling at display

### Parallel RGB Display

**Higher complexity - route as bus:**
- Match all data lines
- Clock routing critical
- Consider flex cable for long distances

---

## ADC Input Routing

### Isolation Requirements

```
┌─────────────────────────────────────────┐
│                                         │
│   DIGITAL AREA        │   ANALOG AREA   │
│                       │                 │
│   [MCU Digital]      │   [ADC Input]   │
│   [SPI/I2C]          │   [Sensors]     │
│   [USB]              │   [Analog Sig]  │
│                       │                 │
│   ════════════════════╪═════════════    │
│                       │   Separate      │
│   Ground plane may    │   routing       │
│   continue underneath │   channel       │
│                       │                 │
└─────────────────────────────────────────┘
```

### ADC Layout Rules

1. **Separate from digital** - Physical distance
2. **Filter at ADC input** - RC low-pass
3. **Guard traces** - Ground traces on either side
4. **Short traces** - Minimize noise pickup
5. **Reference decoupling** - VREF needs good decoupling

### Filter Placement

```
    Analog Source ──[R]──┬──[ADC Pin]
                         │
                        ═╧═ C
                         │
                        GND

    R = 100Ω - 1kΩ
    C = 100pF - 1nF
    fc = 1/(2πRC)
```

---

## Return Path Planning

### Why It Matters

```
Signal current:      ═══════════════════►
                         Trace
Return current:      ◄═══════════════════
                      Ground plane
```

Signal integrity depends on return current having a clear path.

### Return Path Rules

1. **Solid ground plane** - No splits under signal traces
2. **Via placement** - Ground via near signal via
3. **Layer transitions** - Add stitching capacitor if crossing planes
4. **High-speed signals** - Single layer preferred

### Problem: Split Ground

```
BAD: Signal crosses ground split
┌─────────────────────────────────────┐
│                                     │
│   GND_A        ║        GND_B       │
│                ║                    │
│   Signal ══════╬══════►             │
│                ║  No return path!   │
│                ║                    │
└─────────────────────────────────────┘

GOOD: Signal stays over continuous ground
┌─────────────────────────────────────┐
│                                     │
│   Signal ════════════════►          │
│                                     │
│   ────────GND (solid)───────────    │
│                                     │
└─────────────────────────────────────┘
```

---

## When NOT to Worry

### These Usually Don't Need SI Treatment

| Interface | Why |
|-----------|-----|
| I2C <400kHz | Slow edges, forgiving |
| SPI <1MHz | Very slow |
| UART <115200 | Low frequency |
| GPIO control | Static or slow |
| LED PWM | Slow edges |
| Button inputs | DC/very slow |

### Rule of Thumb

```
If signal frequency < 10MHz and trace < 50mm:
    → Basic routing is fine

If signal frequency > 10MHz OR trace > 50mm:
    → Consider SI guidelines

If signal frequency > 50MHz:
    → SI treatment required
```

---

## Integration with design-constraints.json

### Extract Interface Requirements

```json
{
  "interfaces": {
    "usb": {
      "speed": "full",
      "impedance": 90
    },
    "spi": {
      "maxClock": 20,
      "devices": ["flash", "display"]
    },
    "i2c": {
      "speed": "fast",
      "pullups": 2200
    },
    "wireless": {
      "type": "esp32",
      "antenna": "pcb"
    }
  }
}
```

### Routing Checklist

Before starting routing:

- [ ] High-speed interfaces identified?
- [ ] Impedance requirements known?
- [ ] Length match requirements listed?
- [ ] Antenna keep-out defined?
- [ ] ADC isolation planned?

---

## Quick Checklist

Before routing sign-off:

- [ ] USB traces matched, 90Ω, no vias
- [ ] SPI clock has clean return path
- [ ] I2C pull-ups placed near master
- [ ] Crystal area clear, guarded
- [ ] Antenna keep-out respected
- [ ] ADC inputs isolated from digital
- [ ] All high-speed traces over solid ground
- [ ] No traces crossing ground splits
