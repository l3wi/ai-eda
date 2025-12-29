# Passive Component Selection Guide

Fundamentals of selecting resistors and capacitors.

## Resistors

### Tolerance Selection

| Tolerance | Use Case | Cost |
|-----------|----------|------|
| **5%** | Pull-ups, pull-downs, LED current limit | Lowest |
| **1%** | General purpose, most circuits | Standard |
| **0.5%** | Voltage dividers for feedback | Moderate |
| **0.1%** | Precision measurement, references | Higher |

**Rule of thumb:** Use 1% for everything unless cost-sensitive.

### When Tolerance Matters

| Application | Tolerance Needed | Why |
|-------------|------------------|-----|
| LED current limiting | 5% OK | LED brightness varies more than resistor |
| I2C pull-up | 5% OK | Wide acceptable range |
| Voltage divider (regulation) | 1% or better | Affects output voltage directly |
| Voltage divider (sensing) | 0.5% or better | Measurement accuracy |
| Current sensing | 1% or better | Measurement accuracy |
| Precision amplifier gain | 0.1-0.5% | Gain accuracy |
| RC timing | 1% minimum | Affects timing directly |

### Power Rating Selection

**Rule: Derate by 50%**

```
P_required = V² / R  or  P_required = I² × R

Select rating ≥ 2 × P_required
```

| Package | Power Rating | Notes |
|---------|-------------|-------|
| 0201 | 1/20W (50mW) | Max ~25mW practical |
| 0402 | 1/16W (62mW) | Max ~30mW practical |
| 0603 | 1/10W (100mW) | Max ~50mW practical |
| 0805 | 1/8W (125mW) | Max ~60mW practical |
| 1206 | 1/4W (250mW) | Max ~125mW practical |
| 2512 | 1W | For power applications |

**Example: LED current limit**
```
LED at 3.3V, 10mA, Vf=2V
R = (3.3 - 2) / 0.01 = 130Ω
P = 1.3 × 0.01 = 13mW

0402 (31mW) is sufficient, but 0603 gives margin
```

### Resistor Types

| Type | TCR (ppm/°C) | Use Case |
|------|--------------|----------|
| Thick film | 100-200 | General purpose |
| Thin film | 25-50 | Precision, low noise |
| Metal film | 50-100 | Good balance |
| Wirewound | 20-50 | High power, precision |
| Current sense | Low TCR | Current measurement |

**Recommendation:** Thick film for most applications, thin film for precision.

### Common Applications

#### Pull-Up Resistors

| Interface | Typical Value | Notes |
|-----------|---------------|-------|
| I2C (100kHz) | 4.7kΩ | Standard |
| I2C (400kHz) | 2.2-4.7kΩ | May need lower |
| SPI CS | 10kΩ | Prevent float |
| Reset | 10kΩ | With 100nF cap |
| GPIO input | 10-100kΩ | Prevent float |

#### LED Current Limiting

```
R = (Vsupply - Vf) / I_led

Common Vf values:
- Red: 1.8-2.2V
- Green: 2.0-2.4V
- Blue/White: 3.0-3.4V

Typical currents:
- Indicator: 1-5mA
- Bright: 10-20mA
```

**Quick reference (3.3V supply, 5mA):**
| LED Color | Vf | R Value |
|-----------|-----|---------|
| Red | 2.0V | 270Ω |
| Green | 2.2V | 220Ω |
| Blue | 3.0V | 68Ω |

#### Voltage Dividers

```
Vout = Vin × R2 / (R1 + R2)

For feedback dividers:
- Use 1% tolerance minimum
- Consider divider current (typically 10-100µA)
- Check resistor values in datasheet
```

---

## Capacitors

### Dielectric Types

| Type | Capacitance | Stability | Temperature | Use |
|------|-------------|-----------|-------------|-----|
| **C0G/NP0** | Low (pF-nF) | Excellent | -55 to +125°C | Precision |
| **X7R** | Medium | Good | -55 to +125°C | Decoupling |
| **X5R** | High | Good | -55 to +85°C | Bulk |
| **X6S** | High | Good | -55 to +105°C | High-temp bulk |
| **Y5V** | Very high | Poor | -30 to +85°C | Avoid |

### When to Use Each Type

| Application | Dielectric | Why |
|-------------|------------|-----|
| Decoupling (bypass) | X7R | Good capacitance, stable enough |
| Bulk decoupling | X5R | High capacitance |
| Timing circuits (RC) | C0G | Precise, no drift |
| Crystal load caps | C0G | Precision required |
| PLL loop filter | C0G | Phase noise sensitive |
| ADC reference | C0G | Precision required |
| High-temperature | X7R or X6S | Temperature stability |
| Cost-sensitive bulk | X5R | Cheaper for high values |

### Voltage Derating

**Ceramic capacitors lose capacitance under DC bias!**

```
Rule: Use capacitor rated for ≥2× operating voltage
```

| Operating Voltage | Minimum Rating |
|-------------------|----------------|
| 3.3V | 6.3V or 10V |
| 5V | 10V or 16V |
| 12V | 25V |
| 24V | 50V |

### ESR Considerations

**ESR (Equivalent Series Resistance) matters for:**
- Regulator output capacitors (stability)
- High-frequency decoupling
- Power supply ripple

| Application | ESR Requirement |
|-------------|-----------------|
| LDO output | Check datasheet! Some need specific range |
| Buck output | Low ESR (<50mΩ) |
| General decoupling | Not critical |

### Package Size Limits

| Package | Max Practical Ceramic |
|---------|----------------------|
| 0201 | 100nF |
| 0402 | 1µF |
| 0603 | 10µF |
| 0805 | 22-47µF |
| 1206 | 100µF |
| 1210 | 100µF+ |

---

## Package Selection

### Size vs Solderability

| Package | Hand Solder | Reflow | Notes |
|---------|-------------|--------|-------|
| 0201 | Very hard | OK | Avoid for prototypes |
| 0402 | Difficult | OK | Fine-pitch |
| 0603 | Moderate | OK | Good balance |
| 0805 | Easy | OK | Recommended for hand |
| 1206 | Easy | OK | Large, high power |

### Recommendations by Assembly Method

| Assembly | Resistors | Capacitors |
|----------|-----------|------------|
| Hand solder | 0805 (0603 min) | 0805 (0603 min) |
| Reflow | 0402-0603 | 0603 |
| Production | 0201-0402 | 0402-0603 |

---

## Value Selection (E-Series)

### Standard Values

Resistors and capacitors come in standard value series:

| Series | Values per Decade | Tolerance |
|--------|-------------------|-----------|
| E6 | 6 (1.0, 1.5, 2.2, 3.3, 4.7, 6.8) | 20% |
| E12 | 12 | 10% |
| E24 | 24 | 5% |
| E48 | 48 | 2% |
| E96 | 96 | 1% |

### Common Values to Stock

**Resistors (1%):**
```
10Ω, 22Ω, 47Ω, 100Ω, 220Ω, 330Ω, 470Ω,
1kΩ, 2.2kΩ, 4.7kΩ, 10kΩ, 22kΩ, 47kΩ, 100kΩ
```

**Capacitors:**
```
10pF, 22pF, 100pF (C0G for crystals)
1nF, 10nF, 100nF, 1µF, 10µF, 100µF (X7R/X5R)
```

---

## Special Applications

### Crystal Load Capacitors

```
CL = (C1 × C2) / (C1 + C2) + Cstray

Where:
- CL = Crystal load capacitance (from datasheet)
- C1, C2 = External capacitors
- Cstray = PCB + IC parasitic (~3-5pF)

For symmetric loading (C1 = C2 = C):
C = 2 × (CL - Cstray)
```

**Example:**
Crystal CL = 12pF, Cstray = 4pF
C = 2 × (12 - 4) = 16pF → Use 15pF (nearest E24)

**Important:** Use C0G capacitors for crystals!

### Current Sense Resistors

**Low value, high power:**
```
V_sense = I × R_sense
P_dissipation = I² × R_sense
```

| Current Range | Typical R_sense | Package |
|---------------|-----------------|---------|
| 0-500mA | 100mΩ | 0603-0805 |
| 0-1A | 50mΩ | 0805-1206 |
| 0-5A | 10mΩ | 2010-2512 |
| 0-10A | 5mΩ | 2512+ |

**Important:** Use low-TCR resistors for accurate current sensing.

### RC Timing Circuits

For accurate timing:
- Use 1% resistors minimum
- Use C0G capacitors
- Temperature drift affects both R and C

```
τ = R × C
f = 1 / (2π × R × C)
```

---

## Quick Selection Tables

### Resistor Quick Reference

| Application | Value Range | Tolerance | Package |
|-------------|-------------|-----------|---------|
| LED limit | 68Ω - 1kΩ | 5% | 0603 |
| Pull-up | 4.7kΩ - 10kΩ | 5% | 0402-0603 |
| Feedback divider | varies | 1% | 0603 |
| Current sense | 5mΩ - 100mΩ | 1% | 0805+ |
| EMI suppression | 22Ω - 47Ω | 5% | 0402 |

### Capacitor Quick Reference

| Application | Value | Dielectric | Voltage |
|-------------|-------|------------|---------|
| Bypass | 100nF | X7R | 16V |
| MCU bulk | 4.7-10µF | X5R | 10V |
| Crystal load | 8-22pF | C0G | 50V |
| LDO output | 1-10µF | X5R | 10V |
| Buck output | 22-100µF | X5R | varies |
