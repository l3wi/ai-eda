# Schematic Review Checklist

Pre-layout validation checklist. Complete before running `/eda-layout`.

## Quick Pre-ERC Checklist

Run through these before KiCad's ERC:

- [ ] All power pins connected (VCC, VDD, GND)
- [ ] No floating inputs
- [ ] All NC pins explicitly marked
- [ ] Power flags on all supplies
- [ ] Net names consistent across sheets

## Detailed Review Sections

### 1. Power Section

#### Input Power
- [ ] Input protection present (TVS, fuse, or both)
- [ ] Reverse polarity protection (if required)
- [ ] Input voltage matches component ratings
- [ ] Bulk capacitor near input connector

#### Voltage Regulators
- [ ] Input/output caps per datasheet (check values)
- [ ] Enable pin connected or tied appropriately
- [ ] Thermal pad connected to GND (if applicable)
- [ ] Output voltage matches rail requirements

#### Power Distribution
- [ ] Each rail clearly named (VCC_3V3, VCC_5V, etc.)
- [ ] Power sequencing considered (if multi-rail)
- [ ] Current budget within regulator limits
- [ ] Soft-start/inrush considered for bulk loads

### 2. Decoupling Validation

Cross-reference with `design-constraints.json` and datasheet requirements:

#### Per-IC Decoupling
| Component | VDD Pins | 100nF Caps | Bulk Cap | VDDA Special |
|-----------|----------|------------|----------|--------------|
| MCU | Count pins | = pin count | 4.7-10µF | 100nF + 1µF |
| Flash | Count pins | = pin count | Optional | N/A |
| PHY | Count pins | = pin count | 10µF | Check datasheet |

- [ ] Every VDD/VCC pin has bypass cap
- [ ] Bulk cap near each IC power input
- [ ] Analog supplies have proper filtering
- [ ] Reference voltages have clean supply

#### Decoupling Placement Notes
For PCB layout, ensure schematic notes:
- Place bypass caps within 1-2mm of pins
- Via to ground plane directly from cap pad
- Bulk caps can be further from IC

### 3. MCU Support Circuits

#### Reset Circuit
- [ ] Reset pin connected (pull-up or supervisor)
- [ ] Reset button if required
- [ ] RC debounce values appropriate
- [ ] Active polarity correct (active-low vs high)

#### Crystal/Oscillator
- [ ] Load capacitors calculated (not guessed)
- [ ] Crystal frequency matches MCU requirements
- [ ] Ground connection for oscillator
- [ ] Layout note: keep traces short

Load cap formula: `CL = 2 * (Cload - Cstray)`
where Cstray ≈ 2-5pF typically

#### Boot Configuration
- [ ] Boot pins defined (pull-up/down)
- [ ] Default boot mode is normal operation
- [ ] Programming mode accessible

#### Programming Interface
- [ ] Debug connector present (SWD, JTAG, etc.)
- [ ] All debug signals connected
- [ ] Reset accessible for programming
- [ ] 3.3V reference for debug probe

### 4. Communication Interfaces

#### USB
- [ ] Series resistors on D+/D- (if required)
- [ ] ESD protection on data lines
- [ ] VBUS detection connected (if used)
- [ ] CC resistors for USB-C (5.1K for device)
- [ ] VBUS protection (TVS, current limit)

#### I2C
- [ ] Pull-ups present (4.7K-10K typical)
- [ ] Pull-up voltage matches highest Vio device
- [ ] Pull-up value appropriate for bus speed
- [ ] Address conflicts checked

#### SPI
- [ ] CS lines have pull-ups (prevent floating)
- [ ] MISO has series resistor (multi-slave)
- [ ] Clock polarity matches all devices

#### UART
- [ ] TX/RX cross-connected correctly
- [ ] Level shifting if voltage mismatch
- [ ] ESD protection on external interfaces

### 5. Interface Protection

For any signal going to external connectors:

| Interface | ESD Protection | Current Limit | Level Shift |
|-----------|---------------|---------------|-------------|
| USB | Required | Via controller | N/A |
| External I2C | Recommended | Pull-up | If needed |
| External SPI | Recommended | Series R | If needed |
| GPIO to connector | Required | Series R | If needed |
| UART to header | Recommended | Series R | If needed |

- [ ] All external interfaces have ESD protection
- [ ] Current limiting on exposed outputs
- [ ] Level shifting where voltages differ

### 6. Analog Circuits (if applicable)

- [ ] Analog and digital grounds separate until single point
- [ ] ADC reference properly filtered
- [ ] Analog supplies have additional filtering
- [ ] High-impedance nodes shielded (guard ring note)
- [ ] Anti-aliasing filters present (if needed)

### 7. Test Points and Debug

- [ ] Key power rails have test points
- [ ] Debug signals accessible
- [ ] Critical signals have test points
- [ ] Ground test point(s) present

**Recommended test points:**
- VCC input
- Each regulated rail (VCC_3V3, VCC_1V8, etc.)
- GND
- Key communication buses (optional)

### 8. Unconnected Pins

Review all unconnected pins:

- [ ] NC pins marked with no-connect flag
- [ ] Unused GPIO tied or floating (per datasheet)
- [ ] Reserved pins handled per datasheet
- [ ] No accidental disconnects

**STM32 unused pin handling:**
- Configure as analog input in firmware (lowest power)
- Or connect to GND via 10K (simplest)

### 9. Net Naming Consistency

See `reference/NET-NAMING.md` for conventions.

- [ ] Power nets follow convention (VCC_3V3, GND)
- [ ] SPI buses numbered (SPI1_*, SPI2_*)
- [ ] I2C buses numbered (I2C1_*, I2C2_*)
- [ ] UARTs numbered (UART1_*, UART2_*)
- [ ] No duplicate net names with different meanings
- [ ] No ambiguous names (TX vs UART1_TX)

### 10. Documentation Completeness

- [ ] Title block filled in (project, revision, date)
- [ ] All components have reference designators
- [ ] All components have values
- [ ] Critical values annotated (voltage ratings, tolerances)
- [ ] Non-obvious connections have notes
- [ ] Design rationale for unusual choices

---

## Architecture Validation

Cross-check against `design-constraints.json`:

| Constraint | Schematic Check |
|------------|-----------------|
| `power.topology: ldo` | LDO used, proper in/out caps |
| `power.topology: buck` | Buck converter with proper passive |
| `power.rails[]` | All rails implemented |
| `board.layers: 2` | Simpler power, no split planes needed |
| `board.layers: 4+` | Can have complex power distribution |
| `thermal.budget` | Hot components identified |
| `dfmTargets.assembly` | Component packages match capability |

---

## Pre-Layout Sign-Off

Complete these before `/eda-layout`:

```
[ ] ERC passes (0 errors)
[ ] All sections above reviewed
[ ] Schematic screenshot taken for reference
[ ] BOM generated and reviewed
[ ] design-constraints.json stage updated to "schematic"
[ ] schematic-status.md shows 100% complete
```

---

## Common Mistakes to Catch

| Category | Mistake | Check |
|----------|---------|-------|
| Power | Wrong cap values | Compare to datasheet |
| Power | Missing enable pull | Enable pin floating |
| MCU | Wrong crystal caps | Recalculate CL |
| MCU | Reset not debounced | Add RC or supervisor |
| USB | Missing CC resistors | USB-C won't enumerate |
| USB | No ESD protection | Will fail compliance |
| I2C | Wrong pull-up value | Check bus speed |
| General | Floating inputs | Review all inputs |
| General | Missing test points | Add before layout |

---

## Quick Reference Table

| Check | Priority | Section |
|-------|----------|---------|
| Power pins connected | Critical | 1 |
| Decoupling present | Critical | 2 |
| Reset circuit correct | Critical | 3 |
| USB protection | High | 4, 5 |
| ESD on externals | High | 5 |
| Test points | Medium | 7 |
| Documentation | Medium | 10 |
