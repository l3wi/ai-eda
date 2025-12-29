# Thermal Budget Planning

Early-stage thermal estimation to identify components needing attention.

## Quick Rules

| Total Power | Action Needed |
|-------------|---------------|
| < 1W | Usually fine, natural convection |
| 1-2W | Monitor, may need copper pour planning |
| 2-5W | Requires thermal planning, copper pours, possibly thermal vias |
| > 5W | Heatsinks or active cooling likely needed |

| Single Component | Action Needed |
|------------------|---------------|
| < 0.3W | No special attention |
| 0.3-0.5W | Ensure adequate copper pour |
| 0.5-1W | Thermal vias + copper pour required |
| > 1W | Exposed pad, heatsink, or active cooling |

## Power Estimation Worksheet

### Step 1: List Power Consumers

| Component Role | Estimated Power (W) |
|----------------|---------------------|
| MCU (active) | ___ |
| WiFi/BLE module | ___ |
| Voltage regulator(s) | ___ |
| Motor driver | ___ |
| LEDs | ___ |
| Sensors | ___ |
| Other: ___ | ___ |
| **Total** | **___** |

### Step 2: Calculate Regulator Dissipation

**LDO Power Dissipation:**
```
P_ldo = (V_in - V_out) × I_load

Example: 5V to 3.3V LDO at 200mA
P = (5 - 3.3) × 0.2 = 0.34W
```

**Buck Converter Dissipation:**
```
P_buck = P_out × (1 - efficiency) / efficiency

Example: 5V→3.3V at 500mA, 85% efficient
P_out = 3.3 × 0.5 = 1.65W
P_buck = 1.65 × (1 - 0.85) / 0.85 = 0.29W
```

### Step 3: Common Component Power

| Component Type | Typical Power Range |
|----------------|---------------------|
| ESP32 (WiFi active) | 0.5-0.8W |
| ESP32 (sleep) | <0.01W |
| nRF52 (BLE active) | 0.05-0.15W |
| STM32 (active, 48MHz) | 0.05-0.15W |
| RP2040 (active) | 0.1-0.2W |
| LDO (idle, no load) | <0.01W |
| Motor driver (standby) | 0.01-0.05W |
| Motor driver (active) | Varies widely |

## Thermal Rule of Thumb

**TI's Back-of-Napkin Rule:**
```
1W dissipated in 1 sq inch of 2oz copper = 100°C rise
```

| Copper Weight | Thermal Rise per Watt |
|---------------|----------------------|
| 1oz | ~125°C / W·in² |
| 2oz | ~100°C / W·in² |

**Example calculation:**
- Component: 0.5W dissipation
- Available copper: 0.5 sq inch
- Copper weight: 1oz
- Rise = 0.5W × 125°C/(W·in²) × (1/0.5 in²) = 125°C

This is too hot! Need more copper area or thermal vias.

## Thermal Via Guidelines

**Single thermal via:** ~100°C/W thermal resistance

**To achieve low resistance:**
- Use 10+ vias in parallel for ~10°C/W
- Place directly under hot component
- Connect to copper pour on opposite layer
- Via diameter: 0.3-0.4mm typical

**Via array example for 1W component:**
```
┌─────────────┐
│ ○ ○ ○ ○ ○  │
│ ○ ○ ○ ○ ○  │  10-15 vias under pad
│ ○ ○ ○ ○ ○  │
└─────────────┘
```

## Cooling Strategy Selection

| Strategy | When to Use | Implementation |
|----------|-------------|----------------|
| **Natural convection** | <2W total, indoor use | Adequate copper pour, some vias |
| **Forced air** | 2-10W, or confined space | Fan, ventilation holes in enclosure |
| **Heatsink** | Single component >1W | Exposed pad, thermal interface material |
| **Active cooling** | >10W or high ambient temp | Fan + heatsink, possibly liquid |

## Architecture Decisions

### 1. Component Selection Impact

| Choice | Thermal Implication |
|--------|---------------------|
| LDO vs Buck | LDO wastes more power as heat at high Vin-Vout |
| Integrated vs discrete | Integrated may have worse thermal path |
| QFN vs QFP | QFN exposed pad better for thermal |
| Module vs chip | Modules may trap heat |

### 2. Board Layout Considerations

Flag these early:
- [ ] High-power components need space for copper pour
- [ ] Thermal vias need via-in-pad or close placement
- [ ] Hot components should not be near temperature-sensitive parts
- [ ] Consider component height for heatsink clearance

### 3. Enclosure Impact

| Enclosure Type | Thermal Factor |
|----------------|----------------|
| Open air | 1.0× (baseline) |
| Ventilated plastic | 1.2-1.5× worse |
| Sealed plastic | 2-3× worse |
| Metal (conductive) | 0.5-0.8× (acts as heatsink) |

## Red Flags to Identify Early

| Situation | Risk | Action |
|-----------|------|--------|
| LDO with Vin-Vout > 3V at >100mA | High dissipation | Consider buck converter |
| Motor driver with no exposed pad | Hard to cool | Select package with thermal pad |
| WiFi + buck regulator in small enclosure | Heat buildup | Plan ventilation or derating |
| Multiple >0.5W components near each other | Hotspot | Spread across board |

## Checklist Before Leaving Architecture

- [ ] Total power estimated
- [ ] Components >0.5W identified
- [ ] Cooling strategy selected
- [ ] Space reserved for copper pours (if needed)
- [ ] Enclosure thermal impact considered
