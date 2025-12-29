# Power Topology Decision Guide

Choosing between LDO, buck converter, or hybrid power architecture.

## Decision Tree

```
INPUT VOLTAGE → OUTPUT VOLTAGE
         │
         ▼
    Vin - Vout < 1V? ──YES──► LDO (low dropout required)
         │
         NO
         │
         ▼
    Load current < 100mA? ──YES──► LDO (simple, low cost)
         │
         NO
         │
         ▼
    Battery powered? ──YES──► Buck (efficiency critical)
         │
         NO
         │
         ▼
    Noise-sensitive load? ──YES──► LDO or Buck+LDO hybrid
    (ADC, RF, audio)
         │
         NO
         │
         ▼
    Calculate: P_loss = (Vin - Vout) × I_load
         │
         ▼
    P_loss > 0.8W? ──YES──► Buck converter
         │
         NO
         │
         ▼
    LDO is fine
```

## Quick Selection Guide

| Condition | Recommendation |
|-----------|----------------|
| Vin - Vout < 1V, any current | LDO (low dropout) |
| < 100mA, not battery | LDO (simpler) |
| 100-500mA, battery | Buck (efficiency) |
| > 500mA, any | Buck (thermal) |
| RF/analog rail | LDO or Buck→LDO |
| USB 5V → 3.3V at < 300mA | Either works |
| 12V → 3.3V at > 50mA | Buck (high Vin-Vout) |

## LDO vs Buck Comparison

| Factor | LDO | Buck Converter |
|--------|-----|----------------|
| **Efficiency** | η = Vout/Vin | 80-95% typical |
| **Noise output** | Very low (µV) | Higher (mV ripple) |
| **Complexity** | 2-3 external parts | 5+ external parts |
| **Cost** | Lower | Higher |
| **EMI** | None | Switching noise |
| **Board space** | Smaller | Larger (inductor) |
| **Heat** | Higher at high current | Lower |

## Efficiency Calculation

### LDO Efficiency
```
η_ldo = Vout / Vin × 100%

Example: 5V → 3.3V
η = 3.3 / 5 = 66%
```

| Vin | Vout | LDO Efficiency |
|-----|------|----------------|
| 5V | 3.3V | 66% |
| 5V | 1.8V | 36% |
| 12V | 3.3V | 28% |
| 12V | 5V | 42% |

### Buck Efficiency
Typical: 80-92% depending on:
- Load current (higher load = better efficiency)
- Switching frequency
- Component quality

## Power Loss & Heat

**LDO Power Dissipation:**
```
P_loss = (Vin - Vout) × I_load

Example: 12V → 3.3V at 200mA
P_loss = (12 - 3.3) × 0.2 = 1.74W  ← Too hot for most LDOs!
```

**Rule: If P_loss > 0.8W, strongly consider buck converter.**

## Hybrid Architecture: Buck + LDO

Best of both worlds for mixed-signal designs.

```
Vin ──► [Buck] ──► Intermediate ──► [LDO] ──► Vout (clean)
         │                              │
      Efficient                    Low noise
```

**Example:**
```
12V ──► [Buck 85%] ──► 5V ──► [LDO 66%] ──► 3.3V
        P = 0.3W           P = 0.1W

        Total: 0.4W vs 1.74W for direct LDO
```

**When to use hybrid:**
- Precision ADC power
- RF module supply
- Audio codec analog supply
- Any circuit sensitive to switching noise

## Common Power Architectures

### USB-Powered Device (5V input)

**Simple (LDO only):**
```
USB 5V ──► [LDO] ──► 3.3V MCU + peripherals
```
Use when: < 300mA total, not battery

**Efficient (Buck):**
```
USB 5V ──► [Buck] ──► 3.3V MCU + peripherals
```
Use when: > 300mA, or power-conscious design

### Battery-Powered (LiPo 3.0-4.2V)

**Single rail:**
```
LiPo ──► [Buck/Boost] ──► 3.3V
```
Buck-boost handles full voltage range

**With analog:**
```
LiPo ──► [Buck] ──► 3.6V ──► [LDO] ──► 3.3V analog
                     │
                     └──► 3.3V digital (direct or LDO)
```

### 12V/24V Industrial

**Must use buck:**
```
12V ──► [Buck] ──► 5V ──► [Buck or LDO] ──► 3.3V
```
Direct 12V→3.3V LDO would waste 72% of power as heat!

## Rail Naming Conventions

| Rail | Typical Use |
|------|-------------|
| VCC_5V, VBUS | USB input, motor drivers |
| VCC_3V3 | MCU, digital logic |
| AVDD, VCC_3V3A | Analog circuits (ADC, audio) |
| VREF | ADC reference (often from LDO) |
| VCC_1V8 | Core voltage for some MCUs |

## Architecture Checklist

Before finalizing power architecture:

- [ ] All voltage rails identified
- [ ] Current for each rail estimated
- [ ] LDO vs Buck decided per rail
- [ ] Noise-sensitive rails identified (need clean power)
- [ ] Total power dissipation calculated
- [ ] Sequencing requirements noted (if any)
- [ ] Battery life impact considered (if applicable)

## Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| LDO for 12V→3.3V at 500mA | 4.35W heat, needs large heatsink | Use buck |
| Buck directly to ADC | Noise in measurements | Add LDO after buck |
| Undersized LDO | Thermal shutdown | Check power rating |
| No input capacitor on buck | Instability, EMI | Add bulk + ceramic caps |
| Shared ground for analog/digital | Noise coupling | Star ground or separate pours |

## Quick Reference: Popular Regulators

### LDO Examples
| Part | Vin | Vout | Current | Notes |
|------|-----|------|---------|-------|
| AMS1117 | 4.75-12V | Fixed/Adj | 1A | Common, cheap |
| AP2112 | 2.5-6V | Fixed | 600mA | Low quiescent |
| TPS7A20 | 1.4-6.5V | Adj | 300mA | Ultra-low noise |
| MIC5504 | 2.5-5.5V | Fixed | 300mA | Tiny SOT-23 |

### Buck Examples
| Part | Vin | Vout | Current | Notes |
|------|-----|------|---------|-------|
| TPS62840 | 1.8-6.5V | Adj | 750mA | Ultra-low quiescent |
| MP2359 | 4.5-24V | Adj | 1.2A | Simple, cheap |
| TPS54331 | 3.5-28V | Adj | 3A | High power |
| AOZ1282 | 4.5-18V | Adj | 2A | Common, integrated FET |
