# Decoupling Capacitor Strategy

Practical guide for selecting and placing decoupling capacitors.

## Why Decoupling Matters

- ICs draw current in bursts (digital switching)
- Without local energy storage, voltage droops
- Power plane inductance limits current delivery speed
- Capacitors provide local energy reservoir

## Standard Rules

### Per-Pin Decoupling (Bypass Capacitors)

**Rule: 100nF ceramic per VCC/VDD pin**

| Spec | Recommendation |
|------|----------------|
| Value | 100nF (0.1µF) |
| Dielectric | X7R or X5R |
| Voltage | 2× rail voltage minimum |
| Package | 0402 or 0603 |
| Placement | As close to pin as possible |

**Why 100nF?**
- Self-resonant frequency ~5-10MHz (covers most digital switching)
- Good balance of capacitance and ESL
- Industry standard, widely available

### Bulk Decoupling

**Rule: Larger capacitors near power input**

| Rail Current | Bulk Capacitor | Package |
|--------------|----------------|---------|
| < 100mA | 10µF | 0603/0805 |
| 100-500mA | 22-47µF | 0805/1206 |
| 500mA - 1A | 100µF | 1206 or electrolytic |
| > 1A | 100-470µF | Electrolytic or multiple ceramic |

**Placement:**
- Near regulator output
- Before current splits to multiple ICs
- Lower frequency filtering (ripple, transients)

---

## Component-Specific Requirements

### Microcontrollers

**General rule: 100nF per VDD pin + bulk**

#### STM32F1/F4 Series (LQFP-64/100)
```
Per VDD pin:    100nF × (number of VDD pins)
Bulk:           4.7-10µF ceramic
VDDA:           100nF + 1µF (dedicated analog supply)
VBAT:           100nF (if using backup domain)
VREF (if used): 100nF + 10nF (lower value for HF filtering)
```

**STM32F103C8T6 (48-pin) example:**
- 3× 100nF on VDD pins
- 1× 4.7µF bulk
- 1× 100nF + 1µF on VDDA

#### ESP32 / ESP32-C3 Modules
```
Input:          2× 10µF ceramic (3.3V input)
Near module:    100nF ceramic
EN pin:         10µF (if using RC delay)
```

Modules have internal decoupling - external is for input filtering.

#### RP2040
```
DVDD (1.1V core): 100nF × 2 + 10µF bulk
IOVDD (3.3V):     100nF × 3
USB (VUSB):       10µF
ADC (ADC_AVDD):   100nF (if using ADC)
```

#### ATmega328P
```
VCC:    100nF + 10µF
AVCC:   100nF
AREF:   100nF (if using external reference)
```

### Voltage Regulators

#### LDO Output
```
Output cap:     Per datasheet (typically 1-10µF)
ESR:            Check stability requirements!
Type:           Ceramic X5R/X7R usually OK
```

**Warning:** Some older LDOs require specific ESR range. Check datasheet!

#### Buck Converter Output
```
Output cap:     Per datasheet (typically 22-100µF)
ESR:            Low ESR critical for ripple
Type:           Ceramic X5R/X7R, multiple in parallel
```

### Communication Interfaces

#### USB
```
VBUS input:     4.7-10µF ceramic
Near PHY:       100nF
Ferrite:        May need ferrite bead on VBUS
```

#### Ethernet PHY
```
Core supply:    Multiple 100nF
Analog supply:  100nF + 10µF
Near magnetics: 100nF
```

#### Oscillators/Crystals
```
Near OSC supply: 100nF ceramic
```

---

## Dielectric Selection

### Ceramic Capacitor Types

| Type | Temp Range | Capacitance Drift | Use Case |
|------|------------|-------------------|----------|
| **C0G/NP0** | -55 to +125°C | ±30ppm/°C | Precision, timing, filters |
| **X7R** | -55 to +125°C | ±15% | General decoupling |
| **X5R** | -55 to +85°C | ±15% | High capacitance |
| **Y5V** | -30 to +85°C | +22/-82% | Avoid - too unstable |

### Selection Guide

| Application | Recommended |
|-------------|-------------|
| General decoupling | X7R or X5R |
| High-temperature | X7R |
| High capacitance (>10µF) | X5R |
| Timing circuits (RC) | C0G |
| Crystal load caps | C0G |
| PLL loop filter | C0G |
| ADC reference | C0G |
| Noise filtering | X7R |

### DC Bias Effect (Ceramic Capacitors)

**Warning:** Ceramic capacitors lose capacitance at higher DC voltage!

| Rated Voltage | Actual Cap at 50% Vrated |
|---------------|--------------------------|
| 6.3V cap at 3.3V | ~70-80% of rated |
| 10V cap at 5V | ~80-90% of rated |
| 16V cap at 5V | ~90-95% of rated |

**Rule: Use 2× voltage rating minimum**

Example: For 5V rail, use 10V or 16V rated capacitors.

---

## Package Size Selection

### Capacitance vs Package

| Package | Max Practical Value | Notes |
|---------|--------------------|----|
| 0201 | 100nF | Very small, machine only |
| 0402 | 1µF | Standard for modern designs |
| 0603 | 10µF | Good balance |
| 0805 | 22-47µF | Easy hand soldering |
| 1206 | 100µF | High capacitance |

### Recommended Defaults

| Application | Package | Why |
|-------------|---------|-----|
| Prototype/hand solder | 0603/0805 | Easy to solder |
| Production, space-constrained | 0402 | Compact |
| High current bulk | 0805/1206 | Higher capacitance |

---

## Placement Guidelines

### Priority Order

1. **Closest to IC** - Bypass capacitors (100nF)
2. **Near power input** - Bulk capacitors
3. **Via placement** - Connect to ground plane

### Layout Tips

```
GOOD:
[IC Pin] ──── [Cap] ──── [Via to GND]
         <1mm

BAD:
[IC Pin] ──────────── [Cap] ──── [Via to GND]
              5mm+
```

- Minimize trace length between IC and cap
- Place cap on same layer as IC if possible
- Via directly from cap pad to ground plane
- Multiple vias for bulk capacitors

---

## Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Wrong dielectric | Capacitance drift | Use X7R/X5R for decoupling |
| Voltage rating too low | Loss of capacitance, failure | Use 2× rating |
| Caps too far from IC | Increased inductance | Place within 1mm |
| Missing bulk caps | Voltage droop on transients | Add near regulator |
| Same value everywhere | Not optimized | Match to IC requirements |
| Y5V dielectric | Huge capacitance variation | Never use for decoupling |

---

## BOM Planning

### Typical Quantities per Design

| Component | Typical Quantity | Notes |
|-----------|-----------------|-------|
| 100nF 0402/0603 | 10-30 | Per power pin |
| 10µF 0805 | 3-10 | Bulk decoupling |
| 1µF 0402/0603 | 5-10 | Intermediate |
| 4.7µF 0603 | 2-5 | MCU bulk |

### Recommended Stock Values

Keep these on hand:
- 100nF 0603 X7R 16V (most common)
- 1µF 0603 X7R 10V
- 10µF 0805 X5R 10V
- 4.7µF 0603 X5R 10V
- 100pF 0603 C0G 50V (timing, filters)

---

## Quick Reference

### By IC Type

| IC Type | Bypass | Bulk | Special |
|---------|--------|------|---------|
| MCU (general) | 100nF × pins | 4.7-10µF | VDDA: +1µF |
| LDO | - | Per datasheet | Check ESR |
| Buck | - | 22-100µF | Low ESR |
| USB PHY | 100nF | 10µF | Ferrite on VBUS |
| Op-amp | 100nF | 10µF | Both rails |
| ADC | 100nF | 10µF | C0G for ref |

### Capacitor Quick Math

**Voltage rating:** Target = 2 × Operating voltage
**ESR requirement:** Check datasheet for min/max
**Quantity:** Start with datasheet, add 20% margin
