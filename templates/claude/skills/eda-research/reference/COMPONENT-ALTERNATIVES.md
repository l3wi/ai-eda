# Component Alternatives Guide

How to find equivalent and alternative components for supply chain resilience.

## Why Alternatives Matter

- Parts go out of stock unexpectedly
- Lead times can extend to months
- Single-source components are risky
- Alternatives enable competitive pricing
- Production quantities may require multiple suppliers

## Types of Alternatives

### 1. Drop-In Replacements

**Same pinout, same or better specs.**

Can substitute directly without design changes.

**How to identify:**
- Same package and pinout
- Same or wider voltage range
- Same or higher current capability
- Same or better key specifications
- Compatible with existing external components

**Example:** AMS1117-3.3 alternatives
| Part | Manufacturer | Notes |
|------|--------------|-------|
| AMS1117-3.3 | AMS | Original |
| LM1117-3.3 | TI | Drop-in |
| LD1117S33 | ST | Drop-in |
| SPX1117-3.3 | Exar | Drop-in |

### 2. Pin-Compatible Alternatives

**Same pinout, different specs.**

May require component value changes.

**How to identify:**
- Same package and pinout
- Different internal characteristics
- May need different external components
- Check application circuit differences

**Example:** Different LDOs with SOT-223 pinout
- May have different input/output cap requirements
- May have different enable logic
- May have different dropout voltage

### 3. Functional Alternatives

**Same function, different pinout.**

Requires PCB redesign or dual footprint.

**How to identify:**
- Different package or pinout
- Same functional specifications
- Different application circuit
- May have better availability

**Example:** 3.3V 500mA LDO options
- AMS1117 (SOT-223, specific pinout)
- AP2112K (SOT-23-5, different pinout)
- MIC5504 (SOT-23-5, different pinout)

---

## JLCPCB Basic vs Extended Parts

### Basic Parts

**Advantages:**
- Always in stock at JLCPCB
- No setup fee for assembly
- Lower cost
- Faster turnaround

**When to use:**
- Standard passives (resistors, capacitors)
- Common connectors
- Generic LEDs
- Standard power components

### Extended Parts

**Characteristics:**
- Setup fee (~$3 per unique part)
- May have stock variability
- Broader selection
- Specialty components

**When to use:**
- Specific MCUs
- Specialized ICs
- Less common values
- When Basic alternative doesn't exist

### Strategy

1. **Search Basic first:** `basic_only: true`
2. **Fallback to Extended:** If no suitable Basic part
3. **Document choice:** Note if Basic alternative exists

---

## Finding Alternatives

### Method 1: Parametric Search

Search for components with matching key parameters:

```
Example: Need alternative to AMS1117-3.3

Key parameters:
- Output voltage: 3.3V
- Package: SOT-223
- Current: ≥1A
- Input voltage: 4.5-12V

Search: "LDO 3.3V 1A SOT-223"
```

### Method 2: Cross-Reference Tools

**Manufacturer cross-reference:**
- TI's parametric search has "find similar" feature
- Digi-Key cross-reference tool
- LCSC category browsing

**Search terms:**
- "[PartNumber] alternative"
- "[PartNumber] equivalent"
- "[PartNumber] replacement"

### Method 3: Same Manufacturer Family

Often the same manufacturer has multiple options:

**Example:** TI LDO family
- TPS7A20: Ultra-low noise
- TPS7A02: Ultra-low Iq
- TPS73633: Standard

All are 3.3V LDOs but optimized differently.

### Method 4: Package Family Search

Search by package when pinout is standard:

```
"SOT-223 LDO 3.3V"
"SOT-23-5 LDO 3.3V"
```

---

## What Specs Must Match

### Critical (Must Match)

| Spec | Why |
|------|-----|
| **Output voltage** | Circuit won't work otherwise |
| **Package/pinout** | Physical compatibility |
| **Voltage range** | Must cover your input |
| **Current capability** | Must handle load |

### Important (Should Match or Exceed)

| Spec | Why |
|------|-----|
| **Dropout voltage** | Affects minimum input |
| **Quiescent current** | Battery life |
| **Noise** | Analog/RF performance |
| **Thermal capability** | Power dissipation |

### Flexible (Can Differ)

| Spec | Notes |
|------|-------|
| **Manufacturer** | Quality varies but many are equivalent |
| **Price** | Obviously can change |
| **Specific features** | If not used in your design |

---

## Second-Source Strategy

### For Production Designs

1. **Identify 2-3 alternatives** during initial selection
2. **Document all alternatives** in component-selections.md
3. **Verify availability** at target manufacturers
4. **Design for compatibility** (dual footprints if needed)

### Dual Footprint Approach

For critical components, design PCB to accept multiple footprints:

```
Example: SOT-23-5 LDO options
- AP2112K (Pin 3 = EN)
- MIC5504 (Pin 3 = EN)
- XC6206 (Pin 3 = NC)

Design: Make Pin 3 optional (can leave floating or connect)
```

### Documentation Template

```markdown
### Primary: [Part Name] (LCSC: C#####)
- MPN: [Part Number]
- Stock: #### units

### Alternative 1: [Part Name] (LCSC: C#####)
- Drop-in: Yes/No
- Notes: [Any differences]

### Alternative 2: [Part Name] (LCSC: C#####)
- Drop-in: Yes/No
- Notes: [Any differences]
```

---

## Common Alternative Groups

### 3.3V LDOs (SOT-223)

| Part | Manufacturer | Notes |
|------|--------------|-------|
| AMS1117-3.3 | AMS | Common, cheap |
| LM1117-3.3 | TI | Drop-in |
| LD1117S33 | ST | Drop-in |
| NCP1117ST33 | ON Semi | Drop-in |

### 3.3V LDOs (SOT-23-5, Low Current)

| Part | Manufacturer | Notes |
|------|--------------|-------|
| AP2112K-3.3 | Diodes Inc | Low dropout |
| MIC5504-3.3 | Microchip | Tiny |
| XC6206P332 | Torex | Ultra-low Iq |
| ME6211C33 | Nanjing Micro One | Cheap |

### USB-UART Bridges

| Part | Manufacturer | Notes |
|------|--------------|-------|
| CH340G | WCH | Cheapest |
| CH340C | WCH | No crystal needed |
| CP2102 | Silicon Labs | Better drivers |
| FT232RL | FTDI | Most compatible |

### USB ESD Protection

| Part | Manufacturer | Notes |
|------|--------------|-------|
| USBLC6-2SC6 | ST | Common |
| TPD2E001 | TI | Alternative |
| PRTR5V0U2X | Nexperia | Alternative |
| ESD5V0S1B | ST | Single line |

### Common Op-Amps (SOIC-8)

| Part | Manufacturer | Notes |
|------|--------------|-------|
| LM358 | TI/ST/ON | General purpose |
| MCP6002 | Microchip | Rail-to-rail |
| TLV9002 | TI | Rail-to-rail |
| LMV358 | TI | Low voltage |

---

## Passives Alternatives

### Resistors

Resistors are highly interchangeable:
- Match value, tolerance, power rating
- Package must match
- Any major manufacturer is fine
- YAGEO, UniOhm, FH, Walsin are common on JLC

### Capacitors

More care needed:
- Match value, voltage, dielectric type
- Package must match
- Dielectric matters (X7R ≠ X5R ≠ C0G)
- Samsung, Murata, YAGEO common on JLC

**Warning:** Don't substitute Y5V for X7R or X5R!

---

## Checklist Before Substituting

- [ ] Pinout matches (or dual footprint designed)
- [ ] Voltage range covers application
- [ ] Current capability sufficient
- [ ] Critical specs match or exceed
- [ ] External components still valid
- [ ] Available in stock
- [ ] Price acceptable
- [ ] Datasheet reviewed for gotchas
