# Common DRC/ERC Issues and Solutions

Frequently encountered problems and how to fix them.

## ERC (Electrical Rules Check) Issues

### Power Pin Not Driven

**Error:** "Pin X power input is not driven"

**Cause:** Power pin not connected to a power net or power symbol.

**Solutions:**
1. Add power symbol (VCC, GND) connected to the net
2. Add power flag if net is driven externally
3. Verify wire is actually connected (zoom in to check)

```
Before:                 After:
                         VCC
                          │
  U1.VCC ──              U1.VCC ──┴──
           (unconnected)          (connected to power)
```

### Unconnected Pin

**Warning:** "Pin X is unconnected"

**Cause:** Pin has no wire or net label attached.

**Solutions:**
1. Connect the pin if it should be connected
2. Add "No Connect" flag if intentionally unused
3. Check if wire endpoint doesn't reach pin

### Conflicting Power Pins

**Error:** "Pin X output conflicts with Pin Y output"

**Cause:** Two output drivers connected to the same net.

**Solutions:**
1. Check if nets should be separate
2. Verify one isn't actually an input
3. Add appropriate buffer/isolation if intentional

### Different Net Labels Same Wire

**Warning:** "Labels X and Y are connected but different"

**Cause:** Multiple different net labels on the same wire.

**Solutions:**
1. Remove duplicate labels
2. Verify intended connectivity
3. Use single consistent label

### Duplicate Reference Designator

**Error:** "Duplicate reference designator U1"

**Cause:** Two components have the same reference.

**Solutions:**
1. Re-annotate schematic
2. Manually fix duplicate
3. Check for copy/paste errors

---

## DRC (Design Rules Check) Issues

### Clearance Violation

**Error:** "Clearance violation: X.XXmm (minimum Y.YYmm)"

**Cause:** Copper features too close together.

**Solutions:**
1. Move traces/components apart
2. Reduce trace width if appropriate
3. Reroute to avoid tight areas
4. Adjust design rules if manufacturer allows

### Track Width Violation

**Error:** "Track width X.XXmm is less than minimum Y.YYmm"

**Cause:** Trace narrower than design rule allows.

**Solutions:**
1. Widen the trace
2. Reroute to allow more space
3. Check if design rule is appropriate

### Drill Too Small

**Error:** "Drill size X.XXmm is less than minimum Y.YYmm"

**Cause:** Via or hole drill smaller than manufacturer capability.

**Solutions:**
1. Increase via drill size
2. Use manufacturer's minimum via specification
3. Consider different manufacturer if needed

### Annular Ring Too Small

**Error:** "Annular ring X.XXmm is less than minimum Y.YYmm"

**Cause:** Pad ring around drill hole too thin.

**Solutions:**
1. Increase pad size
2. Reduce drill size
3. Update via definition

### Unconnected Items

**Error:** "Unconnected items on net X"

**Cause:** Ratsnest shows unrouted connections.

**Solutions:**
1. Route the missing connections
2. Check if net should be split
3. Verify schematic connectivity

### Silk Over Pad

**Warning:** "Silkscreen over exposed copper"

**Cause:** Silkscreen text/graphics overlapping pads.

**Solutions:**
1. Move silkscreen elements
2. Resize reference designator text
3. Remove unnecessary silkscreen

### Missing Courtyard

**Warning:** "Footprint X has no courtyard"

**Cause:** Component footprint missing courtyard outline.

**Solutions:**
1. Add courtyard to footprint
2. Disable check if not required
3. Use library footprint with courtyard

### Courtyards Overlap

**Error:** "Courtyards of X and Y overlap"

**Cause:** Components placed too close together.

**Solutions:**
1. Move components apart
2. Verify intended placement (stacked components OK)
3. Check courtyard sizes are appropriate

### Via/Pad Inside Keepout

**Error:** "Via inside keepout zone"

**Cause:** Via placed in a keepout area.

**Solutions:**
1. Move via outside keepout
2. Review if keepout is necessary
3. Route around the keepout area

---

## Layout-Specific Issues

### Thermal Relief Spoke Too Thin

**Warning:** "Thermal relief spoke width below minimum"

**Cause:** Connection to pour zone too narrow.

**Solutions:**
1. Increase thermal relief spoke width in zone settings
2. Ensure adequate current path

### Copper Island

**Warning:** "Isolated copper island detected"

**Cause:** Copper pour fragment not connected to anything.

**Solutions:**
1. Remove the island (change zone settings)
2. Connect with via if intentional
3. Delete manually if necessary

### Missing Net Connection

**Error:** "Net X not connected"

**Cause:** Component pin not connected to its net.

**Solutions:**
1. Route the connection
2. Add via to make connection
3. Check for broken traces

### Zone Fill Issues

**Error:** "Zone fill incomplete"

**Cause:** Zone cannot fill properly due to DRC violations.

**Solutions:**
1. Refill zones after fixing other DRC
2. Check zone settings
3. Verify zone outline is closed

---

## Footprint Issues

### Wrong Footprint

**Symptom:** Component doesn't match schematic symbol.

**Solutions:**
1. Update footprint assignment in schematic
2. Swap footprint in PCB (if field update doesn't work)
3. Verify pin mapping

### Incorrect Pad Sizes

**Symptom:** Pads don't match datasheet.

**Solutions:**
1. Use manufacturer footprint library
2. Update footprint from datasheet
3. Verify IPC standards compliance

### Missing Thermal Pad

**Symptom:** QFN/DFN center pad not connected.

**Solutions:**
1. Add center pad to footprint
2. Connect to appropriate net (usually GND)
3. Add thermal vias

---

## Component Availability Issues

### Out of Stock

**Issue:** Component shows 0 stock on LCSC.

**Solutions:**
1. Select alternative component
2. Check other suppliers
3. Wait for restock (check lead time)
4. Redesign with available component

### Lifecycle Warning

**Issue:** Component marked NRND or obsolete.

**Solutions:**
1. Find replacement part
2. Stock up if design is short-term
3. Redesign with current component

### Extended Part (JLCPCB)

**Issue:** Part not in basic library.

**Solutions:**
1. Accept additional assembly fee (~$3 per unique part)
2. Find basic part alternative
3. Plan for hand assembly of extended parts

---

## Quick Fix Guide

| Issue | Quick Check |
|-------|------------|
| ERC power error | Add power symbol or flag |
| Unconnected pin | Add no-connect flag if intentional |
| Clearance violation | Zoom in, move traces apart |
| Track too narrow | Widen or reroute |
| Via too small | Use standard 0.3mm drill |
| Silk on pad | Move text, reduce size |
| Unrouted net | Complete routing |
| Component spacing | Move apart per courtyard |

## Prevention Tips

1. **Set design rules first** - Configure DRC before layout
2. **Run DRC often** - Catch issues early
3. **Use library footprints** - Verified and tested
4. **Check datasheets** - Verify critical dimensions
5. **Review before manufacture** - Final human check
