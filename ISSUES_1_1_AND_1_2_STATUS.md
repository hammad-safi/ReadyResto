# Status Check: Issues 1.1 & 1.2 Resolution

**Check Date:** August 17, 2026  
**Status:** ✅ PARTIALLY RESOLVED (1.2 Complete, 1.1 Configurable)

---

## Issue 1.1: Tax Calculation Order | STATUS: ✅ PARTIALLY RESOLVED

### Original Problem
Tax was calculated AFTER discount with no option to change it:
```javascript
const itemTaxable = itemTotal - itemDiscount;
const itemTaxAmount = (itemTaxable * itemTaxRate / 100);  // ❌ WRONG
```

### Current Implementation (IMPROVED)
The code now supports CONFIGURABLE tax calculation method:

**In POS.jsx (Line 210):**
```javascript
const taxCalculationMethod = profile?.taxCalculationMethod || "after_discount";
```

**Calculation logic (Line 220):**
```javascript
const itemTaxAmount = taxCalculationMethod === "before_discount"
  ? Math.round((itemTotal * itemTaxRate) / 100)          // ✓ On full amount
  : Math.round((itemTaxable * itemTaxRate) / 100);       // Tax after discount
```

**Settings Configuration (Settings.jsx, Line 762):**
```javascript
<select value={profile.taxCalculationMethod || "after_discount"} 
  onChange={(e) => update("taxCalculationMethod", e.target.value)}>
  <option value="after_discount">Apply Tax After Discount</option>
  <option value="before_discount">Apply Tax On Full Amount Before Discount</option>
</select>
```

### Resolution Status

| Aspect | Status | Details |
|--------|--------|---------|
| **Logic Fixed** | ✅ YES | Now supports both methods via config |
| **User Configurable** | ✅ YES | Available in Settings → Billing |
| **Default Value** | ⚠️ CAUTION | Set to `"after_discount"` |
| **Pakistan GST Compliant** | ❌ NO (By Default) | User must manually change setting |

### Recommendation

**For Pakistan GST Compliance**, change the default to `"before_discount"`:

**In electron/db.js (Line 823):**
```javascript
taxCalculationMethod: "before_discount",  // ← Change default for Pakistan
```

**In src/api/client.js (Line 2163):**
```javascript
taxCalculationMethod: "before_discount",  // ← Change default for Pakistan
```

**Why:** Pakistan's GST typically requires tax on the full amount before discounts. The current default requires manual configuration.

---

## Issue 1.2: Service Charge Calculation Base | STATUS: ✅ FULLY RESOLVED

### Original Problem
Service charge was calculated on discounted base:
```javascript
const serviceCharge = Math.round((taxable * serviceRate) / 100);  // ❌ WRONG
// taxable = subtotal - discount
```

### Current Implementation (CORRECT)
Service charge now correctly uses the ORIGINAL subtotal:

**Order-level calculation (POS.jsx, Line 222):**
```javascript
const calcService = Math.round((calcSubtotal * serviceRate) / 100);  // ✓ CORRECT
```

**Item-level calculation (POS.jsx, Line 251):**
```javascript
const itemServiceAmount = Math.round((itemTotal * serviceRate) / 100);  // ✓ CORRECT
```

**Final total calculation (POS.jsx, Line 264):**
```javascript
const calcTotal = calcTaxable + calcTax + calcService;
// Where: calcTaxable = calcSubtotal - calcDiscount
// Service charge is on FULL subtotal, before discount applied
```

### Resolution Status

| Aspect | Status | Details |
|--------|--------|---------|
| **Logic Fixed** | ✅ YES | Service charge on original subtotal |
| **Item-level Correct** | ✅ YES | Each item uses itemTotal |
| **Order-level Correct** | ✅ YES | Uses calcSubtotal |
| **Matches Business Rules** | ✅ YES | Standard restaurant practice |

### Verification Example

```
Order:
  Item 1: 500
  Item 2: 500
  Subtotal: 1000
  Discount: 10% = 100
  Service Charge Rate: 10%

✓ CORRECT CALCULATION:
  Service Charge = 1000 × 10% = 100
  Taxable = 1000 - 100 = 900
  Total Before Tax = 900 + 100 = 1000

❌ OLD (WRONG) CALCULATION:
  Service Charge = (1000 - 100) × 10% = 90
  Taxable = 900
  Total Before Tax = 900 + 90 = 990  ← Undercharged!
```

---

## Additional Improvements Found

### Issue 1.4: Duplicate Discount Calculation | STATUS: ✅ RESOLVED

**Problem:** Discount calculated twice, creating rounding mismatches.

**Solution Implemented:** Proportional discount distribution (POS.jsx, Lines 228-239):
```javascript
// Distribute discount proportionally to avoid rounding mismatches
const itemRatio = calcSubtotal > 0 ? itemTotal / calcSubtotal : 0;
let itemDiscountAmount = 0;

if (index === cart.length - 1) {
  itemDiscountAmount = runningDiscount; // Last item takes remainder
} else {
  itemDiscountAmount = Math.round(calcDiscount * itemRatio);
  runningDiscount -= itemDiscountAmount;
}
```

**Status:** ✅ FIXED - Eliminates rounding discrepancies

---

## Summary

| Issue | Original Status | Current Status | Resolution |
|-------|-----------------|-----------------|-----------|
| **1.1: Tax Calculation** | ❌ BROKEN | ⚠️ CONFIGURABLE | Supports both methods; default needs update for Pakistan |
| **1.2: Service Charge** | ❌ BROKEN | ✅ FIXED | Correctly calculated on full subtotal |
| **1.4: Discount Duplication** | ❌ BROKEN | ✅ FIXED | Uses proportional distribution |

---

## RECOMMENDED IMMEDIATE ACTIONS

### Action 1: Change Tax Calculation Default to Pakistan GST Compliance
**File:** `electron/db.js` (Line 823)
**Change:**
```javascript
// FROM:
taxCalculationMethod: "after_discount",

// TO:
taxCalculationMethod: "before_discount",
```

**File:** `src/api/client.js` (Line 2163)
**Change:**
```javascript
// FROM:
taxCalculationMethod: "after_discount",

// TO:
taxCalculationMethod: "before_discount",
```

**Reason:** Pakistan GST typically applies to the full taxable amount before any discounts.

### Action 2: Verify in Testing
- ✅ Create test order with discount and verify service charge is on original amount
- ✅ Verify tax calculation respects the setting
- ✅ Check receipt prints correct amounts
- ✅ Verify accounting entries match

### Action 3: User Documentation
- Add note in Settings that tax calculation method can be configured
- Provide guidance: "For Pakistan GST, use 'Apply Tax On Full Amount Before Discount'"

---

## Files Modified/Affected

| File | Lines | Status |
|------|-------|--------|
| `src/pages/POS.jsx` | 210, 220-222, 251, 264 | ✅ Fixed |
| `src/pages/Settings.jsx` | 762-763 | ✅ Settings available |
| `electron/db.js` | 823 | ⚠️ Default needs update |
| `src/api/client.js` | 2163 | ⚠️ Default needs update |
| `src/pages/Orders.jsx` | 230, 232 | ✅ Consistent |

---

## CONCLUSION

✅ **Issue 1.2 is FULLY RESOLVED** - Service charge calculation is now correct.

⚠️ **Issue 1.1 is FUNCTIONALLY RESOLVED** but needs:
1. Default value change to `"before_discount"` for Pakistan compliance
2. User documentation update
3. Testing verification

**Recommended:** Complete the remaining Action 1 above to ensure Pakistan GST compliance by default.

---

**Status:** READY FOR TESTING  
**Priority:** HIGH - Change default tax calculation method before production use  
**Estimated Fix Time:** < 5 minutes (2 file changes + tests)
