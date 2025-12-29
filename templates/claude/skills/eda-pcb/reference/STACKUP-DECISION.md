# Stackup Decision Guide

How to arrange PCB layers for optimal signal integrity, power delivery, and manufacturability.

## Quick Reference

| Layer Count | Recommended Stackup | Use Case |
|-------------|---------------------|----------|
| **2** | SIG-SIG | Simple designs, LDO only |
| **4** | SIG-GND-PWR-SIG | Most MCU projects |
| **4 (alt)** | SIG-GND-GND-SIG | Better SI, split power |
| **6** | SIG-GND-SIG-PWR-GND-SIG | High-speed, dense designs |

## Decision Tree

```
Layer count decided?
  │
  ├─ 2-layer
  │    └─► Top/Bottom signal, ground pours where possible
  │
  ├─ 4-layer
  │    │
  │    ├─ Multiple power rails? ──► SIG-GND-PWR-SIG (split power plane)
  │    │
  │    ├─ Single main rail? ──► SIG-GND-GND-SIG (dual ground)
  │    │
  │    └─ USB/Ethernet only? ──► SIG-GND-PWR-SIG (standard)
  │
  └─ 6-layer
       └─► SIG-GND-SIG-PWR-GND-SIG (buried signals)
```

---

## 2-Layer Stackup

### Structure

```
┌─────────────────────────────┐
│ Layer 1: Top Copper (35µm)  │ ← Signals + Components
├─────────────────────────────┤
│ Core: FR4 (1.5mm)           │
├─────────────────────────────┤
│ Layer 2: Bottom Copper (35µm)│ ← Signals + Ground Pour
└─────────────────────────────┘
```

### JLCPCB Standard (1.6mm)

| Layer | Thickness | Material |
|-------|-----------|----------|
| Top copper | 35µm (1oz) | Copper |
| Core | 1.5mm | FR4 |
| Bottom copper | 35µm (1oz) | Copper |
| **Total** | **1.6mm** | |

### Best Practices

- Use ground pour on bottom layer
- Keep signal traces short
- Place decoupling caps on same side as IC
- Route power as wide traces, not thin wires

### Impedance (Approximate)

| Trace Width | Impedance | Use |
|-------------|-----------|-----|
| 0.3mm | ~90Ω | High-Z signals |
| 0.5mm | ~70Ω | General signals |
| 1.0mm | ~50Ω | Power/ground |

**Note:** 2-layer cannot achieve controlled impedance for USB/Ethernet.

---

## 4-Layer Stackup Options

### Option A: SIG-GND-PWR-SIG (Standard)

**Best for:** Most projects, multiple power rails

```
┌───────────────────────────────┐
│ L1: Top Signals (35µm)        │ ← Components, routing
├───────────────────────────────┤
│ Prepreg: 0.2mm                │
├───────────────────────────────┤
│ L2: Ground Plane (35µm)       │ ← Solid GND
├───────────────────────────────┤
│ Core: 1.0mm                   │
├───────────────────────────────┤
│ L3: Power Plane (35µm)        │ ← VCC, can be split
├───────────────────────────────┤
│ Prepreg: 0.2mm                │
├───────────────────────────────┤
│ L4: Bottom Signals (35µm)     │ ← Components, routing
└───────────────────────────────┘
```

**JLCPCB JLC04161H-7628 (1.6mm):**

| Layer | Distance to GND | Notes |
|-------|-----------------|-------|
| L1 (Signal) | 0.21mm | Main routing layer |
| L2 (GND) | - | Reference plane |
| L3 (PWR) | 1.065mm from GND | Can split for multiple rails |
| L4 (Signal) | 0.21mm from PWR | Secondary routing |

**Controlled impedance (this stackup):**

| Type | Width | Gap | Target | Actual |
|------|-------|-----|--------|--------|
| Single-ended | 0.35mm | - | 50Ω | ~50Ω |
| Differential | 0.2mm | 0.15mm | 90Ω | ~90Ω |

### Option B: SIG-GND-GND-SIG (Dual Ground)

**Best for:** Better signal integrity, single power rail

```
┌───────────────────────────────┐
│ L1: Top Signals (35µm)        │ ← All routing references L2
├───────────────────────────────┤
│ Prepreg: 0.2mm                │
├───────────────────────────────┤
│ L2: Ground Plane (35µm)       │ ← Top reference
├───────────────────────────────┤
│ Core: 1.0mm                   │
├───────────────────────────────┤
│ L3: Ground Plane (35µm)       │ ← Bottom reference
├───────────────────────────────┤
│ Prepreg: 0.2mm                │
├───────────────────────────────┤
│ L4: Bottom Signals (35µm)     │ ← All routing references L3
└───────────────────────────────┘
```

**Advantages:**
- Both signal layers have adjacent ground reference
- Better return paths for high-speed signals
- Easier to achieve controlled impedance

**Disadvantages:**
- Power distributed via traces (higher inductance)
- Need more via stitching for power

**When to use:**
- Single main power rail (3.3V only)
- Critical high-speed signals
- EMI-sensitive applications

---

## 6-Layer Stackup

### Standard: SIG-GND-SIG-PWR-GND-SIG

**Best for:** High-speed (DDR, PCIe), dense designs, mixed-signal

```
┌───────────────────────────────┐
│ L1: Top Signals (35µm)        │ ← Components, high-speed
├───────────────────────────────┤
│ Prepreg: 0.1mm                │
├───────────────────────────────┤
│ L2: Ground Plane (35µm)       │ ← Top reference
├───────────────────────────────┤
│ Core: 0.36mm                  │
├───────────────────────────────┤
│ L3: Inner Signal (17µm)       │ ← Buried routing
├───────────────────────────────┤
│ Prepreg: 0.36mm               │
├───────────────────────────────┤
│ L4: Power Plane (17µm)        │ ← VCC rails
├───────────────────────────────┤
│ Core: 0.36mm                  │
├───────────────────────────────┤
│ L5: Ground Plane (35µm)       │ ← Bottom reference
├───────────────────────────────┤
│ Prepreg: 0.1mm                │
├───────────────────────────────┤
│ L6: Bottom Signals (35µm)     │ ← Components, high-speed
└───────────────────────────────┘
```

**Signal routing priority:**

| Layer | Use For | Reference |
|-------|---------|-----------|
| L1 | High-speed, critical | L2 (GND) |
| L3 | Secondary routing | L2 or L4 |
| L6 | High-speed, critical | L5 (GND) |

---

## Stackup Selection Matrix

| Requirement | 2L | 4L-Std | 4L-Dual | 6L |
|-------------|-----|--------|---------|-----|
| USB 2.0 (90Ω diff) | ❌ | ✅ | ✅ | ✅ |
| Ethernet (100Ω diff) | ❌ | ✅ | ✅ | ✅ |
| WiFi/BLE antenna | ⚠️ | ✅ | ✅ | ✅ |
| Buck converter | ❌ | ✅ | ✅ | ✅ |
| Multiple power rails | ⚠️ | ✅ | ⚠️ | ✅ |
| DDR memory | ❌ | ❌ | ❌ | ✅ |
| Dense BGA routing | ❌ | ⚠️ | ⚠️ | ✅ |
| Simple I2C/SPI | ✅ | ✅ | ✅ | ✅ |

Legend: ✅ Good | ⚠️ Possible with care | ❌ Not recommended

---

## Power Plane Splitting

### When to Split

Split power plane only when:
- Multiple voltage rails needed (3.3V + 1.8V + 5V)
- Rails have different current requirements
- Isolation needed (analog vs digital)

### Split Rules

```
GOOD: Clean split with single crossing
┌───────────────┬───────────────┐
│               │               │
│    3.3V       │     5V        │
│               │               │
│      ════════►│◄════════      │  ← Signal crosses once
│               │               │
└───────────────┴───────────────┘

BAD: Multiple crossings, return path broken
┌───────────────┬───────────────┐
│      ════════►│◄═════════►│   │
│    3.3V       │     5V    │   │
│      ◄═══════►│◄══════════    │
│               │               │
└───────────────┴───────────────┘
```

### Best Practices

1. **Keep ground solid** - Never split ground plane
2. **Signals follow power** - Route signals over their own power domain
3. **Bridge at one point** - If crossing domains, cross at single location
4. **Stitch with vias** - Connect split regions through ground

---

## Impedance Reference

### USB 2.0 (90Ω Differential)

**4-layer (0.2mm prepreg to GND):**

| Parameter | Value |
|-----------|-------|
| Trace width | 0.2mm |
| Trace gap | 0.15mm |
| Trace spacing to other signals | 0.3mm (3W) |

### Single-Ended 50Ω

**4-layer (0.2mm prepreg to GND):**

| Parameter | Value |
|-----------|-------|
| Trace width | 0.35mm |

### SPI/I2C (Non-Impedance Controlled)

| Parameter | Recommendation |
|-----------|----------------|
| Trace width | 0.15-0.2mm |
| Max length | 100mm (SPI fast), 300mm (I2C) |

---

## JLCPCB Stackup Options

### 4-Layer Options

| Stackup ID | Total | Prepreg | Core | Notes |
|------------|-------|---------|------|-------|
| JLC04161H-7628 | 1.6mm | 0.21mm | 1.065mm | Standard, good for USB |
| JLC04161H-3313 | 1.6mm | 0.1mm | 1.265mm | Tighter coupling |

### Ordering Notes

- Select "Impedance Control: Yes" if needed
- Specify stackup ID in notes
- Request impedance report for verification
- Standard stackup is cheapest

---

## Integration with Upstream

### From design-constraints.json

Load these values before selecting stackup:

```json
{
  "board": {
    "layers": 4,
    "thickness": 1.6
  },
  "dfmTargets": {
    "manufacturer": "JLCPCB",
    "minTraceWidth": 0.15,
    "minClearance": 0.15,
    "impedanceControl": true
  },
  "interfaces": {
    "usb": true,
    "highSpeedSpi": false
  }
}
```

### Decision Checklist

Before finalizing stackup:

- [ ] Layer count matches constraints?
- [ ] Impedance requirements identified?
- [ ] Power rail count known?
- [ ] High-speed interfaces mapped to layers?
- [ ] Manufacturer stackup available?

---

## Common Mistakes

| Mistake | Why It's a Problem | Fix |
|---------|-------------------|-----|
| Split ground plane | Breaks return paths, causes EMI | Keep ground solid, split power instead |
| Wrong layer order | SIG-PWR-GND-SIG has no reference for L1 | Always GND adjacent to outer signal layers |
| Ignore prepreg thickness | Impedance depends on distance to reference | Use manufacturer's actual stackup |
| Power on outer layer | Poor shielding, noise pickup | Put power on inner layer |
| Mixed references | Signals crossing GND/PWR boundary | Route over consistent reference |

---

## Quick Checklist

Before starting layout:

- [ ] Stackup matches layer count decision
- [ ] Ground plane(s) are solid (no splits)
- [ ] Signal layers have adjacent ground reference
- [ ] Power plane arrangement supports all rails
- [ ] Impedance requirements can be met
- [ ] Manufacturer stackup specified/confirmed
