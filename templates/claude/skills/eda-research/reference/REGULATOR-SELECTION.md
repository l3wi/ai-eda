# Regulator Selection Guide

How to select voltage regulators based on architecture decisions.

## Before You Start

Check `design-constraints.json` for:
- Power topology decision (LDO vs buck already determined)
- Input voltage range
- Required output voltage and current
- Thermal budget for this rail
- Assembly method (affects package choice)

## LDO Selection

### When LDO is Appropriate
- Low current (<300mA typical)
- Low Vin-Vout differential (<2V)
- Noise-sensitive loads (analog, RF)
- Simple designs (fewer external components)

### Key Specifications

| Spec | Why It Matters | Typical Range |
|------|----------------|---------------|
| **Dropout voltage** | Minimum Vin-Vout for regulation | 100-500mV |
| **Output current** | Must exceed load + margin | 100mA - 3A |
| **Quiescent current** | Battery life impact | 1µA - 5mA |
| **Output noise** | Analog/RF performance | 10-100 µVrms |
| **PSRR** | Noise rejection from input | 60-80 dB |
| **Load regulation** | Output stability with load change | 0.1-1% |
| **Thermal resistance** | Power dissipation capability | 40-150 °C/W |

### LDO Selection Decision Tree

```
1. Calculate power loss:
   P_loss = (Vin - Vout) × I_load

2. Check thermal:
   If P_loss > 0.8W → Consider buck instead (or larger package)

3. Check dropout:
   If (Vin_min - Vout) < 0.5V → Need low-dropout type

4. Check application:
   - Analog/RF → Prioritize low noise (<30µVrms)
   - Battery → Prioritize low Iq (<5µA)
   - General → Prioritize cost and availability

5. Verify junction temperature:
   Tj = Ta_max + (P_loss × θja)
   Must be < 125°C (with margin, aim for <100°C)
```

### Thermal Validation

**Power dissipation:**
```
P = (Vin - Vout) × I_load

Example: 5V → 3.3V at 200mA
P = (5 - 3.3) × 0.2 = 0.34W
```

**Junction temperature:**
```
Tj = Ta + (P × θja)

Example: SOT-223 (θja ≈ 60°C/W), 40°C ambient
Tj = 40 + (0.34 × 60) = 60.4°C ✓ Safe
```

### Package Selection

| Package | θja (°C/W) | Max Power | Use Case |
|---------|------------|-----------|----------|
| SOT-23 | 200-250 | ~0.3W | Low power |
| SOT-223 | 50-70 | ~1W | General purpose |
| TO-252 (DPAK) | 40-60 | ~1.5W | Higher power |
| QFN/DFN | 30-50 | ~2W | Compact, good thermal |

### Popular LDO Recommendations

| Use Case | Part | Notes |
|----------|------|-------|
| **General 3.3V** | AMS1117-3.3, AP2112K | Cheap, widely available |
| **Low dropout** | AP2112, MIC5504 | <200mV dropout |
| **Low noise (analog)** | TPS7A20, LP5907 | <30µVrms |
| **Ultra-low Iq** | TPS7A02, XC6206 | <1µA for battery |
| **High current** | LD1117, NCP1117 | Up to 1A |

---

## Buck Converter Selection

### When Buck is Appropriate
- Higher current (>300mA)
- Large Vin-Vout differential (>2V)
- Battery life critical (efficiency matters)
- Power dissipation would exceed thermal budget with LDO

### Key Specifications

| Spec | Why It Matters | Typical Range |
|------|----------------|---------------|
| **Input voltage range** | Must cover your input | 3-40V |
| **Output current** | Must exceed load + margin | 0.5-10A |
| **Efficiency** | Power loss, battery life | 80-95% |
| **Switching frequency** | Size vs efficiency trade-off | 500kHz - 2MHz |
| **Output ripple** | Noise on output rail | 10-50mV |
| **External components** | Inductor, capacitors needed | See datasheet |

### Buck Selection Decision Tree

```
1. Verify buck is needed:
   - P_loss with LDO > 0.8W? → Yes, use buck
   - Battery with Vin-Vout > 1V? → Yes, use buck

2. Determine current requirement:
   - Add 20% margin to max load
   - Consider inrush current

3. Select switching frequency:
   - Higher freq → Smaller inductor but more switching loss
   - 500kHz-1MHz is good general choice

4. Check efficiency at your load:
   - Look at efficiency curves in datasheet
   - Light-load efficiency matters for battery

5. Select external components:
   - Inductor: Follow datasheet recommendation
   - Capacitors: Ceramic + bulk as specified
```

### External Component Selection

**Inductor:**
- Value: Per datasheet (typically 2.2-10µH)
- Current rating: 1.3× I_out_max
- DCR: Lower is better (less loss)
- Shielded preferred (less EMI)

**Input capacitors:**
- Ceramic: 10-22µF, X5R/X7R
- Place close to VIN pin
- Voltage rating: 2× Vin

**Output capacitors:**
- Ceramic: 22-47µF, X5R/X7R
- Low ESR critical for stability
- Check datasheet for minimum

### Popular Buck Recommendations

| Use Case | Part | Notes |
|----------|------|-------|
| **General 3.3V/5V** | MP1584, AOZ1282 | Simple, cheap |
| **Low Iq (battery)** | TPS62840, RT6150 | <1µA Iq |
| **High current** | TPS54331, LM2596 | 3A+ output |
| **Small footprint** | TPS62088, MP2161 | Integrated inductor option |
| **Wide input** | LM5164, TPS54560 | Up to 60V input |

---

## Hybrid Power (Buck + LDO)

### When to Use

Use buck followed by LDO when:
- Large Vin-Vout ratio (buck for efficiency)
- Noise-sensitive load (LDO for clean output)
- Mixed analog/digital design
- RF circuits requiring clean supply

### Architecture

```
Vin ──► [Buck] ──► Intermediate ──► [LDO] ──► Vout (clean)
         │                              │
      Efficient                    Low noise
```

**Example: 12V → 3.3V analog rail**
```
12V ──► [Buck 85%] ──► 4.0V ──► [LDO] ──► 3.3V AVDD
         Loss: 0.3W              Loss: 0.07W

vs Direct LDO:
12V ──► [LDO 28%] ──► 3.3V AVDD
         Loss: 1.74W  ← Too hot!
```

### Intermediate Voltage Selection

Set buck output 0.5-1V above LDO output:
- Allows LDO headroom
- Minimizes LDO power dissipation
- Typical: 4V intermediate for 3.3V output

---

## Selection Checklist

Before confirming regulator selection:

- [ ] Output voltage matches rail requirement
- [ ] Output current exceeds load + 20% margin
- [ ] Dropout voltage OK at minimum input
- [ ] Power dissipation within thermal budget
- [ ] Package suitable for assembly method
- [ ] Quiescent current acceptable (if battery)
- [ ] Noise acceptable for load type
- [ ] External components available on JLC
- [ ] Datasheet application circuit reviewed

---

## Quick Reference Tables

### 5V → 3.3V at various currents

| Current | Recommendation | P_loss | Notes |
|---------|----------------|--------|-------|
| <100mA | LDO (AMS1117) | 0.17W | Simple, cheap |
| 100-300mA | LDO or Buck | 0.3-0.5W | Either works |
| 300-500mA | Buck preferred | 0.5-0.8W | LDO gets warm |
| >500mA | Buck required | >0.8W | LDO too hot |

### 12V → 3.3V at various currents

| Current | Recommendation | P_loss (LDO) | Notes |
|---------|----------------|--------------|-------|
| <50mA | LDO possible | 0.44W | Small package OK |
| 50-100mA | Buck recommended | 0.87W | LDO needs heatsink |
| >100mA | Buck required | >0.87W | LDO impractical |

### Battery (3.0-4.2V) → 3.3V

| Current | Recommendation | Notes |
|---------|----------------|-------|
| <10mA | LDO (low Iq) | XC6206, TPS7A02 |
| 10-100mA | Buck (efficiency) | TPS62840 |
| >100mA | Buck required | Consider battery life |
