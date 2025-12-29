# Pre-Manufacturing Validation Checklist

Complete checklist for design review before ordering PCBs.

## Schematic Review

### Power

- [ ] All power pins connected to appropriate rails
- [ ] Ground connections complete
- [ ] Power-on sequence correct (if required)
- [ ] Voltage levels match component requirements
- [ ] Current capacity adequate for loads
- [ ] Reverse polarity protection included
- [ ] Overvoltage protection included (if needed)

### Decoupling

- [ ] Every IC has bypass capacitor(s)
- [ ] Bulk capacitors at power input
- [ ] Capacitor values per datasheet recommendations
- [ ] Analog ICs have separate filtering

### Reset and Boot

- [ ] Reset circuit matches MCU requirements
- [ ] Boot mode pins configured correctly
- [ ] Power-on reset timing adequate
- [ ] External reset button (if required)

### Clocking

- [ ] Crystal/oscillator frequency correct
- [ ] Load capacitor values calculated
- [ ] Clock distribution clean
- [ ] PLL configuration valid

### Communication Interfaces

- [ ] I2C pull-ups present and sized correctly
- [ ] SPI chip selects active level correct
- [ ] UART TX/RX correctly crossed
- [ ] USB termination and ESD present
- [ ] CAN termination included

### Protection

- [ ] ESD protection at external interfaces
- [ ] TVS diodes at power inputs
- [ ] Current limiting where needed
- [ ] Fuses/PTCs for overcurrent protection

### Connectors

- [ ] Pin assignments match intended cables
- [ ] Keying/polarity prevention adequate
- [ ] Mounting strength sufficient

### References

- [ ] Voltage references stable and filtered
- [ ] ADC references appropriate for resolution
- [ ] Reference circuits match datasheet

---

## PCB Layout Review

### Board Setup

- [ ] Board dimensions match enclosure
- [ ] Mounting holes positioned correctly
- [ ] Board thickness appropriate
- [ ] Layer count sufficient
- [ ] Copper weight adequate for current

### Design Rules

- [ ] Rules match manufacturer capability
- [ ] Trace width meets minimum
- [ ] Clearances meet minimum
- [ ] Via sizes meet minimum
- [ ] Annular ring meets minimum

### Component Placement

- [ ] Critical components placed first (connectors, MCU)
- [ ] Crystal within 5mm of MCU
- [ ] Decoupling caps within 3mm of IC pins
- [ ] Heat-generating components have thermal relief
- [ ] Sensitive circuits away from noise sources
- [ ] Connectors accessible at board edges
- [ ] Components oriented consistently
- [ ] Adequate spacing for rework

### Routing

- [ ] All nets routed (no ratsnest remaining)
- [ ] Power traces adequate width for current
- [ ] Ground plane solid (minimal cuts)
- [ ] High-speed signals over solid reference
- [ ] Differential pairs length matched
- [ ] Impedance-controlled traces correct width
- [ ] No traces under crystals/oscillators
- [ ] No acute angles (use 45° or curves)

### Power Distribution

- [ ] Power planes/pours connected properly
- [ ] Adequate via count for current
- [ ] Decoupling cap vias short and direct
- [ ] Star-ground topology (if analog)
- [ ] No ground plane splits under sensitive signals

### Signal Integrity

- [ ] USB pairs routed as differential
- [ ] Clock signals short and direct
- [ ] Analog signals away from digital noise
- [ ] Guard traces where needed
- [ ] Via count minimized on critical signals

### EMI Considerations

- [ ] Ground stitching vias at board edges
- [ ] No slots in ground plane
- [ ] High-speed loops minimized
- [ ] Shielding provided where needed

### Copper Pours

- [ ] Ground pour on bottom layer (2-layer)
- [ ] Thermal relief on pads
- [ ] No isolated copper islands
- [ ] Pour connected to net correctly

### Silkscreen

- [ ] Reference designators readable
- [ ] No silkscreen on pads
- [ ] Polarity marks present
- [ ] Pin 1 indicators visible
- [ ] Board name and version included
- [ ] Test points labeled

### Soldermask

- [ ] Pad exposure correct
- [ ] Via tenting where needed
- [ ] Test points exposed
- [ ] Thermal pad coverage appropriate

---

## Component Verification

### Availability

- [ ] All components in stock at supplier
- [ ] Quantities available match order needs
- [ ] Lead times acceptable
- [ ] Alternative sources identified

### Lifecycle

- [ ] No components marked obsolete
- [ ] No NRND (Not Recommended for New Design)
- [ ] Long-term availability acceptable

### Specifications

- [ ] Voltage ratings match design
- [ ] Current ratings match design
- [ ] Temperature ratings match application
- [ ] Package matches footprint

### Libraries

- [ ] All components have KiCad libraries
- [ ] Footprints verified against datasheets
- [ ] 3D models present (optional but helpful)

---

## Manufacturing Files

### Gerbers

- [ ] All required layers generated
- [ ] Board outline on Edge.Cuts layer
- [ ] Drill file generated
- [ ] Files open correctly in viewer
- [ ] No missing features

### Bill of Materials

- [ ] All components listed
- [ ] Reference designators match schematic
- [ ] Values correct
- [ ] Part numbers (LCSC) included
- [ ] Quantities correct

### Position File

- [ ] All SMD components included
- [ ] Coordinates correct (verify in viewer)
- [ ] Rotations correct
- [ ] Layer assignments correct

### Assembly Drawing

- [ ] Component placement visible
- [ ] Polarity marks visible
- [ ] First article inspection reference

---

## Final Checks

### DRC/ERC

- [ ] All DRC errors resolved
- [ ] All ERC errors resolved
- [ ] Warnings reviewed and documented
- [ ] Intentional violations documented

### Visual Inspection

- [ ] 2D board view looks correct
- [ ] 3D model (if available) looks correct
- [ ] No obvious issues visible

### Documentation

- [ ] Schematic PDF generated
- [ ] Assembly drawings generated
- [ ] Design notes complete
- [ ] Version/revision tracked

---

## Sign-off

### Ready for Manufacturing When:

- [ ] All checklist items above verified
- [ ] Design review completed by second person (if available)
- [ ] All DRC/ERC clean
- [ ] Components available
- [ ] Manufacturing files generated and verified
- [ ] Budget approved

### Final Approval

```
Project: _________________
Version: _________________
Date: ___________________
Reviewed by: _____________
Approved by: _____________
```

---

## Quick Reference

### Minimum Requirements (JLCPCB Standard)

| Parameter | Value |
|-----------|-------|
| Trace width | ≥ 0.127mm |
| Trace spacing | ≥ 0.127mm |
| Via drill | ≥ 0.3mm |
| Via pad | ≥ 0.5mm |
| Annular ring | ≥ 0.13mm |
| Board edge clearance | ≥ 0.3mm |

### Recommended Values

| Parameter | Value |
|-----------|-------|
| Signal trace | 0.15-0.2mm |
| Power trace | 0.3-1.0mm |
| Via drill | 0.3mm |
| Via pad | 0.6mm |
| Clearance | 0.2mm |
