# PCB Manufacturer Specifications

Capabilities and requirements for common PCB manufacturers.

## JLCPCB

### Standard Capabilities

| Parameter | Standard | Advanced |
|-----------|----------|----------|
| Min trace width | 0.127mm (5mil) | 0.09mm (3.5mil) |
| Min trace spacing | 0.127mm (5mil) | 0.09mm (3.5mil) |
| Min via drill | 0.3mm | 0.2mm |
| Min via pad | 0.5mm | 0.4mm |
| Min annular ring | 0.13mm | 0.075mm |
| Min hole-to-hole | 0.5mm | 0.5mm |
| Layers | 1-16 | 1-20 |
| Board thickness | 0.4-2.4mm | 0.4-3.2mm |
| Copper weight | 1-2oz | 0.5-6oz |
| Max board size | 400×500mm | - |
| Min board size | 10×10mm | - |

### Materials

| Material | Options |
|----------|---------|
| Base | FR4 (standard), Aluminum, Rogers |
| Soldermask | Green, Black, White, Red, Blue, Yellow |
| Silkscreen | White, Black |
| Surface finish | HASL, Lead-free HASL, ENIG, OSP |

### Assembly (SMT)

| Parameter | Specification |
|-----------|---------------|
| Min component | 0201 |
| Max component | 55×55mm |
| BGA | Yes (with constraints) |
| Fine pitch | 0.4mm and above |
| Parts library | Basic + Extended |

### File Requirements

**Gerbers (RS-274X):**
- F.Cu, B.Cu (copper layers)
- F.Mask, B.Mask (soldermask)
- F.SilkS, B.SilkS (silkscreen)
- Edge.Cuts (board outline)
- F.Paste, B.Paste (stencil)

**Drill (Excellon):**
- Single file or PTH/NPTH separated
- Metric or imperial units

**Assembly:**
- BOM: Comment, Designator, Footprint, LCSC Part#
- CPL: Designator, Mid X, Mid Y, Layer, Rotation

### Pricing Notes

- Green soldermask cheapest
- 1.6mm thickness cheapest
- 2-layer cheapest
- 1oz copper cheapest
- Basic parts: Lower assembly fee
- Extended parts: +$3 per unique part type

---

## PCBWay

### Standard Capabilities

| Parameter | Specification |
|-----------|---------------|
| Min trace width | 0.1mm (4mil) |
| Min trace spacing | 0.1mm (4mil) |
| Min via drill | 0.2mm |
| Min via pad | 0.4mm |
| Min annular ring | 0.1mm |
| Layers | 1-14 |
| Board thickness | 0.4-3.2mm |
| Max board size | 500×1100mm |

### Specialty Options

- Flex PCB
- Rigid-Flex PCB
- HDI (High Density Interconnect)
- Aluminum PCB
- RF/Microwave PCB

### Assembly

| Parameter | Specification |
|-----------|---------------|
| Min component | 01005 |
| BGA | Yes |
| Through-hole | Yes |
| Mixed assembly | Yes |

### File Requirements

- Standard Gerber format
- BOM (Excel or CSV)
- Assembly drawings helpful

---

## OSHPark

### Standard Capabilities

| Parameter | Specification |
|-----------|---------------|
| Min trace width | 0.127mm (5mil) |
| Min trace spacing | 0.127mm (5mil) |
| Min via drill | 0.254mm (10mil) |
| Layers | 2, 4, 6 |
| Board thickness | 1.6mm (2-layer), 0.8mm (4-layer) |
| Copper weight | 1oz outer, 0.5oz inner |
| Surface finish | ENIG |
| Soldermask | Purple (signature color) |

### Unique Features

- No setup fee
- Panelized with other orders
- Includes shipping (US)
- High quality finish

### Limitations

- No assembly service
- Limited board options
- Purple soldermask only
- Lead time ~2 weeks

### File Requirements

- KiCad native files accepted
- Or standard Gerber
- Board outline required

---

## Design Rules Summary

### Conservative (Works Everywhere)

```
Trace width:    0.2mm (8mil)
Trace spacing:  0.2mm (8mil)
Via drill:      0.3mm
Via pad:        0.6mm
Annular ring:   0.15mm
Hole-to-hole:   0.5mm
Hole-to-trace:  0.3mm
```

### Standard (JLCPCB/PCBWay)

```
Trace width:    0.15mm (6mil)
Trace spacing:  0.15mm (6mil)
Via drill:      0.3mm
Via pad:        0.55mm
Annular ring:   0.125mm
Hole-to-hole:   0.5mm
Hole-to-trace:  0.254mm
```

### Aggressive (Check Manufacturer)

```
Trace width:    0.1mm (4mil)
Trace spacing:  0.1mm (4mil)
Via drill:      0.2mm
Via pad:        0.4mm
Annular ring:   0.1mm
```

---

## Layer Stack Recommendations

### 2-Layer

```
Layer 1: Signal + Power traces
Layer 2: Ground pour (as solid as possible)

Thickness: 1.6mm standard
Copper: 1oz both sides
```

### 4-Layer

```
Layer 1: Signal (primary routing)
Layer 2: Ground (solid plane)
Layer 3: Power (solid or partial plane)
Layer 4: Signal (secondary routing)

Standard stackup (JLCPCB):
- Core: 1.2mm
- Prepreg: 0.2mm each side
- Total: 1.6mm
```

### 6-Layer

```
Layer 1: Signal
Layer 2: Ground
Layer 3: Signal/Power
Layer 4: Signal/Power
Layer 5: Power
Layer 6: Signal

Good for high-speed designs
Better signal integrity
Higher cost
```

---

## Cost Optimization

### Lower Cost Options

1. **2-layer instead of 4-layer** - Significant savings
2. **Green soldermask** - Standard, cheapest
3. **1.6mm thickness** - Standard, cheapest
4. **HASL finish** - Cheaper than ENIG
5. **Standard via sizes** - No premium
6. **Panelize small boards** - Lower per-board cost
7. **Use basic parts (JLCPCB)** - Lower assembly fee

### Higher Cost Triggers

1. **Non-standard thickness** - Extra processing
2. **Non-green soldermask** - Extra charge
3. **ENIG finish** - Gold is expensive
4. **Small vias (< 0.3mm)** - Advanced processing
5. **High layer count** - More materials/processing
6. **Impedance control** - Requires testing
7. **Blind/buried vias** - Complex manufacturing

---

## Pre-Order Checklist

Before ordering from any manufacturer:

- [ ] Design rules match manufacturer capabilities
- [ ] All DRC errors resolved
- [ ] Gerbers generated and verified
- [ ] Drill file complete
- [ ] Board outline closed path
- [ ] BOM matches design (if assembly)
- [ ] Position file accurate (if assembly)
- [ ] Components in stock (if assembly)
- [ ] Special requirements noted (controlled impedance, etc.)
