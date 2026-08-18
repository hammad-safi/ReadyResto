# Dastarkhwan ERP - Comprehensive Issues Report
**Generated:** 2026-08-17  
**Status:** Critical Issues Identified

---

## Executive Summary

This report documents **23+ critical and high-priority issues** discovered during a comprehensive code review of the Dastarkhwan ERP system. Issues span calculation logic, data persistence, accounting integrity, and business logic validation. **Many issues will cause financial inaccuracies and data corruption.**

---

## SECTION 1: CRITICAL CALCULATION ERRORS

### 1.1 | Tax Calculation Order (POS.jsx, Line ~240)
**Severity:** 🔴 CRITICAL  
**Category:** Financial Calculation  

**Current Code:**
```javascript
const itemTaxable = itemTotal - itemDiscount;
const itemTaxAmount = (itemTaxable * itemTaxRate / 100);
```

**Problem:**
- Tax is calculated AFTER applying discount
- In many jurisdictions, tax should apply to the full amount before discount
- Different accounting standards apply in different regions
- Inconsistent with typical POS implementations

**Affected Files:**
- `src/pages/POS.jsx` (Line 238-240)
- `src/components/pos/CheckoutModal.jsx` (indirect)

**Impact:**
- ❌ Incorrect tax collection
- ❌ Revenue underreported by tax amount
- ❌ Audit failures
- ❌ Regulatory non-compliance

**Recommended Fix:**
```javascript
// Option A: Tax on full amount (most common)
const itemTaxAmount = (itemTotal * itemTaxRate / 100);
const itemAfterDiscount = itemTotal - itemDiscountAmount;
const actualTaxAmount = (itemAfterDiscount * itemTaxRate / 100);

// Option B: Make configurable in settings
const taxCalculationMethod = profile?.taxCalculationMethod || 'after_discount';
const itemTaxAmount = taxCalculationMethod === 'before_discount' 
  ? (itemTotal * itemTaxRate / 100)
  : (itemAfterDiscount * itemTaxRate / 100);
```

**Business Context:**
- Pakistan GST typically applies to the full taxable amount
- Any discount must be documented separately
- Tax authorities require clear breakdown

---

### 1.2 | Service Charge Calculation Base (POS.jsx, Line ~242)
**Severity:** 🔴 CRITICAL  
**Category:** Financial Calculation  

**Current Code:**
```javascript
const serviceCharge = Math.round((taxable * serviceRate) / 100);
```

**Problem:**
- Service charge calculated on `taxable` (subtotal - discount)
- Should be calculated on original subtotal
- Creates incorrect order totals
- Service charge is typically NOT taxable (depends on jurisdiction, but usually not on tax base)

**Example:**
```
Subtotal: 1000
Discount: 100 (10%)
Taxable: 900
Current Service Charge: 900 × 10% = 90  ❌ WRONG
Correct Service Charge: 1000 × 10% = 100  ✓ CORRECT
```

**Affected Files:**
- `src/pages/POS.jsx` (Line 242)
- `src/components/pos/CheckoutModal.jsx` (no direct implementation)

**Impact:**
- 🔴 Customers charged less service charge than configured
- 🔴 Staff tips/service collection reduced
- 🔴 Revenue tracking inaccurate

**Recommended Fix:**
```javascript
// Service charge on original subtotal (before discount)
const serviceCharge = Math.round((subtotal * serviceRate) / 100);

// Order total calculation
const total = (subtotal - discountAmount) + tax + serviceCharge;
```

---

### 1.3 | Total Calculation Order Violation (POS.jsx, Line ~243)
**Severity:** 🔴 CRITICAL  
**Category:** Financial Calculation  

**Current Code:**
```javascript
const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
const discountAmount = Math.round((subtotal * discount) / 100);
const taxable = subtotal - discountAmount;
const tax = Math.round(/*... calculation ...*/);
const serviceCharge = Math.round((taxable * serviceRate) / 100);
const total = taxable + tax + serviceCharge;
```

**Problem:**
- Calculation order: Subtotal → Discount → Tax → Service Charge
- Rounding applied at each step creates cumulative errors
- Service charge base changes (should be consistent)
- Receipt and journal entries won't match

**Correct Order Should Be:**
```
1. Subtotal (item prices × quantities)
2. Apply Discount (% on subtotal)
3. Apply Tax (% on discounted subtotal)
4. Apply Service Charge (% on subtotal, BEFORE tax)
5. Final Total = Subtotal - Discount + Tax + ServiceCharge
```

**Affected Files:**
- `src/pages/POS.jsx` (Lines 234-243)
- `src/components/pos/Receipt.jsx` (display logic)
- `src/components/pos/CheckoutModal.jsx` (display logic)

**Impact:**
- 🔴 Order totals will not reconcile with accounting records
- 🔴 Customer disputes on charges
- 🔴 Audit failures

---

### 1.4 | Duplicate Discount Calculation (POS.jsx)
**Severity:** 🟡 HIGH  
**Category:** Calculation Logic  

**Current Code:**
```javascript
// Line 234: Overall discount
const discountAmount = Math.round((subtotal * discount) / 100);

// Line 238-240: Per-item discount (calculated again!)
cart.reduce((sum, c) => {
  const itemTotal = c.price * c.qty;
  const itemDiscount = discount > 0 ? (itemTotal * discount) / 100 : 0;  // ← Recalculated!
  // ...
}, 0)
```

**Problem:**
- Discount calculated twice: once for totals, once for per-item records
- Two different values due to rounding differences
- Creates inconsistencies in order_items records
- Makes reconciliation impossible

**Example:**
```
Cart: [Item1: 100, Item2: 100] = 200 total
Discount: 10%

Overall: 200 × 10% / 100 = 2.0 (rounds to 2)
Per-item: (100 × 10% / 100) + (100 × 10% / 100) = 1 + 1 = 2

Same in this case, but with 3 items and 1/3 discount:
Overall: 300 × 33% / 100 = 99
Per-item: (100 × 33% / 100) × 3 = 33 × 3 = 99 (or 32.67 rounded = 33 each = 99)
```

**Affected Files:**
- `src/pages/POS.jsx` (Lines 234, 238-240)

**Impact:**
- 🟡 Order items won't sum to order total
- 🟡 Accounting discrepancies
- 🟡 Difficult to debug

**Recommended Fix:**
```javascript
// Calculate discount once and distribute
const discountAmount = Math.round((subtotal * discount) / 100);

cart.map((c) => {
  const itemRatio = (c.price * c.qty) / subtotal;
  const itemDiscount = Math.round(discountAmount * itemRatio);
  return { ...c, discount_amount: itemDiscount };
});
```

---

### 1.5 | Profit Report Revenue Calculation (reports.js, Line ~198-200)
**Severity:** 🔴 CRITICAL  
**Category:** Financial Reporting  

**Current Code:**
```javascript
let revenue = 0;
orders.forEach(o => {
  if (["paid", "completed", "served"].includes(o.status)) {
    revenue += Number(o.total || 0) - Number(o.tax || 0) - Number(o.service_charge || 0);
  }
});
```

**Problem:**
- Revenue calculated by REMOVING tax and service charge
- This is fundamentally wrong
- Revenue should INCLUDE all cash collected
- Creates completely incorrect profit calculations

**Correct Principle:**
```
Revenue = Total Cash Collected (including tax) - Returns/Refunds
NOT: Total - Tax - Service Charge
```

**Example:**
```
Order Total: 1000 (includes 100 tax, 50 service)
Reported Revenue: 1000 - 100 - 50 = 850  ❌ WRONG
Actual Revenue: 1000  ✓ CORRECT
```

**Affected Files:**
- `src/api/reports.js` (Line 198-200)
- `src/pages/Reports.jsx` (uses this function)
- Dashboard profit calculations

**Impact:**
- 🔴🔴 Profit completely understated
- 🔴🔴 Management reports invalid
- 🔴🔴 Tax reporting incorrect
- 🔴🔴 Financial statements false

**Recommended Fix:**
```javascript
let revenue = 0;
let refundedAmount = 0;

orders.forEach(o => {
  if (["paid", "completed", "served"].includes(o.status)) {
    revenue += Number(o.total || 0);
    refundedAmount += Number(o.refunded_total || 0);
  }
});

const netRevenue = revenue - refundedAmount;
```

---

### 1.6 | COGS Calculation in Journal (reports.js, Line ~207)
**Severity:** 🔴 CRITICAL  
**Category:** Accounting  

**Current Code:**
```javascript
journalEntries.forEach(j => {
  if (j.account_code === '5001') {
    cogs += Number(j.debit || 0) - Number(j.credit || 0);
  }
});
```

**Problem:**
- COGS calculation subtracts credits from debits
- But credits (returns/adjustments) should reduce COGS
- Missing proper tracking of COGS per order
- No mechanism to record COGS entries from orders

**Accounting Principle:**
```
COGS (Account 5001) should only have DEBIT entries (normally)
Credits represent returns/adjustments
COGS = Sum of all debits - Sum of all credits
```

**Affected Files:**
- `src/api/reports.js` (Line 207)
- `src/pages/Accounting.jsx` (uses this)

**Impact:**
- 🟡 COGS may be overstated if credits exist
- 🟡 Gross profit calculations incorrect

**Recommended Fix:**
```javascript
let cogs = 0;
journalEntries.forEach(j => {
  if (j.account_code === '5001' || 
      j.account_name?.toLowerCase().includes('cost of goods')) {
    cogs += Math.max(0, Number(j.debit || 0) - Number(j.credit || 0));
  }
});
```

---

### 1.7 | Tax Report Taxable Revenue (reports.js, Line ~226)
**Severity:** 🟡 HIGH  
**Category:** Financial Reporting  

**Current Code:**
```javascript
function generateTaxReport(orders) {
  let totalTax = 0;
  let taxableRevenue = 0;

  orders.forEach(o => {
    if (["paid", "completed", "served"].includes(o.status)) {
      const orderTotal = Number(o.total || 0);
      const tax = Number(o.tax || 0);
      totalTax += tax;
      taxableRevenue += orderTotal;  // ← WRONG
    }
  });

  const data = [
    { label: "Taxable Revenue", value: taxableRevenue },
    { label: "GST Collected", value: totalTax }
  ];
}
```

**Problem:**
- `taxableRevenue` includes the tax amount itself
- Should be `total - tax` (the base that was taxed)
- Tax-to-revenue ratio will be incorrect
- Report to tax authorities will be wrong

**Example:**
```
Order total: 1000 (100 tax, 900 base)
Current report: Taxable = 1000, Tax = 100 → Tax Rate = 10% ✗
Correct report: Taxable = 900, Tax = 100 → Tax Rate = 11.11% ✓
```

**Affected Files:**
- `src/api/reports.js` (Line 226)

**Impact:**
- 🟡 Tax authority reports incorrect
- 🟡 Audit findings

**Recommended Fix:**
```javascript
taxableRevenue += (orderTotal - tax);
```

---

## SECTION 2: CRITICAL DATABASE SCHEMA ISSUES

### 2.1 | Missing `refunded_total` Field
**Severity:** 🔴 CRITICAL  
**Category:** Database Schema  

**Used In:**
- `src/pages/Sales.jsx` (Line ~40)
- `src/pages/POS.jsx` (Line ~208)
- `src/pages/Dashboard.jsx` (Line ~95)
- `src/pages/Accounting.jsx` (Line ~148)
- `src/components/pos/Receipt.jsx` (Line ~27)

**Current Database Schema:**
```sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  type TEXT,
  table_id TEXT,
  customer TEXT,
  items_count INTEGER DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'new',
  waiter TEXT,
  time TEXT,
  subtotal REAL DEFAULT 0,
  discount_percent REAL DEFAULT 0,
  discount_reason TEXT,
  tax REAL DEFAULT 0,
  service_charge REAL DEFAULT 0,
  payment_method TEXT,
  payment_details TEXT,
  tendered REAL,
  change_due REAL,
  refunded_total REAL DEFAULT 0,  -- ← MISSING!
  order_note TEXT,
  created_at TEXT
);
```

**Problem:**
- Field used throughout application but not defined in schema
- Database operations will fail silently
- New database instances won't have the field
- Returns won't be tracked properly

**Affected Database Operations:**
```javascript
// Sales.jsx line 40
const todayTotal = orders.reduce((s, o) => 
  s + o.total - (o.refunded_total || 0), 0
);  // ← Will be undefined
```

**Impact:**
- 🔴 SQL errors on database schema creation
- 🔴 `refunded_total` operations fail silently
- 🔴 Sales totals incorrect (counts refunds as new sales)
- 🔴 Returns tracking broken

**Recommended Fix:**
Add to schema in `electron/db.js`:
```sql
refunded_total REAL DEFAULT 0,
```

---

### 2.2 | Missing `cost` Field in order_items Table
**Severity:** 🔴 CRITICAL  
**Category:** Database Schema  

**Used In:**
- `src/pages/POS.jsx` (Line ~237-239)

**Current Code Tries to Store:**
```javascript
const buildItemsPayload = () =>
  cart.map((c) => {
    const cogs = (c.cost || 0) * c.qty;
    return {
      // ... other fields
      cost: c.cost || 0,  // ← Will not be stored!
    };
  });
```

**Current Schema:**
```sql
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER,
  name TEXT,
  qty INTEGER,
  price REAL,
  notes TEXT
  -- ❌ No cost, discount_amount, tax_amount, etc.
);
```

**Problem:**
- Cost per item not stored
- COGS tracking impossible
- Historical cost data lost (item price may change)
- Can't calculate gross profit per order

**Impact:**
- 🔴 COGS calculations impossible
- 🔴 Gross profit unknown
- 🔴 Profitability analysis broken
- 🔴 Reports unreliable

**Recommended Fix:**
```sql
ALTER TABLE order_items ADD COLUMN cost REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN discount_amount REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN tax_amount REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN service_charge_amount REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN net_revenue REAL DEFAULT 0;
ALTER TABLE order_items ADD COLUMN gross_profit REAL DEFAULT 0;
```

---

### 2.3 | Missing `customer_id` Field in orders Table
**Severity:** 🔴 CRITICAL  
**Category:** Database Schema  

**Used In:**
- `src/pages/POS.jsx` (Line ~235)

**Current Code:**
```javascript
const buildOrderPayload = (status, kitchenStatus = "new") => ({
  // ...
  customer_id: selectedCustomer?.id || null,  // ← Won't be stored!
  // ...
});
```

**Problem:**
- Cannot link orders to customers
- Customer analysis impossible
- Customer credit tracking broken
- Customer loyalty/history lost

**Affected Features:**
- Customer sales history
- Customer credit limits
- Customer loyalty rewards
- Customer segmentation

**Impact:**
- 🔴 Customer relationship management broken
- 🔴 Credit tracking impossible
- 🔴 Repeat customer identification impossible

**Recommended Fix:**
```sql
ALTER TABLE orders ADD COLUMN customer_id INTEGER REFERENCES customers(id);
```

---

### 2.4 | Missing Additional Calculation Fields
**Severity:** 🟡 HIGH  
**Category:** Database Schema  

**Fields Used But Not Stored:**
From `src/pages/POS.jsx` line 237:
```javascript
return {
  menu_item_id: c.id,
  name: c.name,
  qty: c.qty,
  price: c.price,
  cost: c.cost || 0,                        // ❌ NOT IN SCHEMA
  station: c.station || "Grill",
  discount_percent: discount,
  discount_amount: itemDiscountAmount,      // ❌ NOT IN SCHEMA
  tax_rate: itemTaxRate,                    // ❌ NOT IN SCHEMA
  tax_amount: itemTaxAmount,                // ❌ NOT IN SCHEMA
  service_charge_rate: itemServiceRate,     // ❌ NOT IN SCHEMA
  service_charge_amount: itemServiceAmount, // ❌ NOT IN SCHEMA
  line_total: itemTotal,
  net_revenue: netRevenue,                  // ❌ NOT IN SCHEMA
  cogs: cogs,                               // ❌ NOT IN SCHEMA
  gross_profit: gp,                         // ❌ NOT IN SCHEMA
  notes: c.note || "",
  image: c.image || c.img || ""
};
```

**Impact:**
- 🟡 Item-level calculations lost
- 🟡 Cannot audit individual item profitability
- 🟡 Price history not available

---

### 2.5 | Missing kitchen_status Field in orders
**Severity:** 🟡 HIGH  
**Category:** Database Schema  

**Used In:**
- `src/pages/POS.jsx` (Line ~223)
- `src/pages/Sales.jsx` (Line ~344)

**Current Code:**
```javascript
const buildOrderPayload = (status, kitchenStatus = "new") => ({
  // ...
  kitchen_status: kitchenStatus,  // ← Won't be stored!
  // ...
});
```

**Problem:**
- Kitchen display won't work properly
- Order routing to kitchen stations broken
- No way to track preparation status

**Impact:**
- 🟡 Kitchen workflow management broken
- 🟡 Order timing analysis impossible

---

## SECTION 3: CRITICAL BUSINESS LOGIC ISSUES

### 3.1 | Customer Credit Not Updated After Sale
**Severity:** 🔴 CRITICAL  
**Category:** Business Logic  

**Current Code Analysis:**

In `src/components/pos/CheckoutModal.jsx`:
```javascript
const previousBalance = selectedCustomer 
  ? (selectedCustomer.credit || 0) 
  : 0;
const newPurchase = total;
const totalAfterSale = previousBalance + newPurchase;

const handleConfirm = () => {
  // ... validates amount paying now ...
  onConfirm({
    // ... payment details ...
    customer: selectedCustomer,
    amountPayingNow: parsedAmountPayingNow,
  });
};
```

**Problem:**
- Display shows updated balance: `totalAfterSale`
- But **NOWHERE** in the code does it update the customer record
- `selectedCustomer.credit` remains unchanged in database
- Customer credit tracking is completely broken

**Expected Flow:**
```
1. Customer balance before: 500
2. New sale: 1000
3. Amount paid now: 500
4. Amount on credit: 500
5. New balance should be: 500 + 500 = 1000

But code does NOT update the customers table!
```

**Affected Files:**
- `src/components/pos/CheckoutModal.jsx`
- `src/pages/POS.jsx`
- `src/pages/Sales.jsx`

**Impact:**
- 🔴🔴 Customer credit accumulation broken
- 🔴🔴 Customer account balance inaccurate
- 🔴🔴 Accounts receivable wrong
- 🔴🔴 Financial reporting invalid

**Recommended Fix:**

Add to `src/pages/POS.jsx` after order confirmation:
```javascript
const submitOrder = async (checkoutData) => {
  // ... create order ...
  
  // Update customer credit if this is a credit sale
  if (selectedCustomer && checkoutData.amountPayingNow !== null) {
    const amountNotPaid = total - checkoutData.amountPayingNow;
    if (amountNotPaid > 0) {
      await api.update("customers", selectedCustomer.id, {
        credit: Number(selectedCustomer.credit || 0) + amountNotPaid,
        total_billed: Number(selectedCustomer.total_billed || 0) + total,
        total_paid: Number(selectedCustomer.total_paid || 0) + checkoutData.amountPayingNow,
      });
    }
  }
};
```

---

### 3.2 | No Journal Entries Created for Transactions
**Severity:** 🔴 CRITICAL  
**Category:** Accounting Integrity  

**Problem:**
- Orders are created with tax, discount, and service charge
- BUT no corresponding journal entries are created
- This violates double-entry bookkeeping principles
- Balance sheet will not balance

**Missing Journal Entries Should Include:**

For a 1000 order with 100 tax, 50 service, 50 discount:
```sql
-- Should create these journal entries:
-- 1. Debit: Cash in Drawer (1000)
--    Credit: Food Sales Revenue (900)

-- 2. Debit: Tax Payable (100)
--    Credit: Tax Collected (if separate account)

-- 3. If service charge is payable to staff:
--    Debit: Service Charge Payable (50)
--    Credit: Liability

-- 4. If discount is an expense:
--    Debit: Discount Expense (50)
--    Credit: Revenue

-- None of these are created!
```

**Affected Modules:**
- POS order creation
- Sales returns/refunds
- Adjustments
- Accounting module

**Impact:**
- 🔴🔴 Double-entry bookkeeping violated
- 🔴🔴 Balance sheet won't balance
- 🔴🔴 General ledger incorrect
- 🔴🔴 Financial statements invalid

**Recommended Fix:**

Create accounting helper:
```javascript
// src/api/accounting.js
export async function createOrderJournalEntries(order, items) {
  const entries = [];
  
  // Revenue entry
  entries.push({
    date: new Date().toISOString(),
    reference_type: 'order',
    reference_id: order.id,
    account_code: '1001', // Cash in Drawer
    debit: order.total,
    credit: 0,
  });
  
  // Sales revenue
  const netRevenue = order.subtotal - order.discount_percent * order.subtotal / 100;
  entries.push({
    date: new Date().toISOString(),
    reference_type: 'order',
    reference_id: order.id,
    account_code: '4001', // Sales Revenue
    debit: 0,
    credit: netRevenue,
  });
  
  // Tax entry
  if (order.tax > 0) {
    entries.push({
      date: new Date().toISOString(),
      reference_type: 'order',
      reference_id: order.id,
      account_code: '2002', // Tax Payable
      debit: 0,
      credit: order.tax,
    });
  }
  
  // ... more entries ...
  
  return Promise.all(entries.map(e => api.create('journal_entries', e)));
}
```

Call from POS:
```javascript
await createOrderJournalEntries(order, items);
```

---

### 3.3 | No Discount Validation (0-100%)
**Severity:** 🟡 HIGH  
**Category:** Data Validation  

**Current Code:**
```javascript
// src/pages/POS.jsx - no validation
<input 
  type="number"
  value={discount}
  onChange={(e) => setDiscount(Number(e.target.value))}
  // ← Can enter -50, 150, 1000!
/>
```

**Problem:**
- User can enter discount > 100%
- Creates negative order totals
- Creates negative tax bases
- Database validation missing

**Possible Results:**
```
Subtotal: 1000
Discount: 150%
Discount Amount: 1500
Taxable: 1000 - 1500 = -500  ❌
```

**Impact:**
- 🟡 Negative order totals
- 🟡 Calculation errors
- 🟡 Customer disputes

**Recommended Fix:**
```javascript
const setDiscount = (value) => {
  const bounded = Math.max(0, Math.min(100, Number(value) || 0));
  setDiscount(bounded);
};
```

---

### 3.4 | No Service Charge Rate Bounds
**Severity:** 🟡 HIGH  
**Category:** Data Validation  

**Problem:**
- Profile can have invalid tax/service charge rates
- No validation against rate >= 0 and <= 100
- Can create impossible calculations

**Recommended Fix:**
```javascript
const profile = api.getSetting("restaurant_profile");

// Validate:
const taxRate = Math.max(0, Math.min(100, Number(profile?.taxRate) || 0));
const serviceRate = Math.max(0, Math.min(100, Number(profile?.serviceCharge) || 0));
```

---

### 3.5 | Split Payment Rounding Tolerance Too Loose
**Severity:** 🟡 HIGH  
**Category:** Calculation  

**Current Code (CheckoutModal.jsx, Line 75):**
```javascript
const splitValid = !splitMode || (
  splits.length > 0 && 
  splits.every(s => s.amount !== "" && Number(s.amount) > 0) && 
  Math.abs(remainingToAllocate) < 0.01  // ← Tolerance of 1 cent!
);
```

**Problem:**
- Allows off-by-penny errors to pass validation
- Transactions won't balance
- Multiple rounding errors compound

**Example:**
```
Total: 100.00
Split 1: 50.001
Split 2: 49.999
Remaining: 0.000
Passes validation but cents don't add up perfectly
```

**Recommended Fix:**
```javascript
const splitValid = !splitMode || (
  splits.length > 0 && 
  splits.every(s => s.amount !== "" && Number(s.amount) > 0) && 
  Math.round(remainingToAllocate * 100) === 0  // No rounding tolerance
);
```

---

### 3.6 | Customer Credit Can Go Infinitely Negative
**Severity:** 🟡 HIGH  
**Category:** Business Logic  

**Current Code (CheckoutModal.jsx, Line 74):**
```javascript
const amountPayingNowValid =
  parsedAmountPayingNow === null || 
  (parsedAmountPayingNow >= 0 && parsedAmountPayingNow <= totalAfterSale);
```

**Problem:**
- `totalAfterSale = previousBalance + newPurchase`
- If customer owes 5000, `previousBalance = -5000`
- After buying 1000: `totalAfterSale = -4000`
- Validation allows 0 payment (customer credit becomes more negative)
- No credit limit enforcement

**Example:**
```
Customer owes: 5000 (credit = -5000)
New purchase: 1000
Total after sale: -4000
Validation allows: Paying 0 (minimum)
New credit: -5000 - 1000 = -6000

No limits!
```

**Recommended Fix:**
```javascript
const maxCreditLimit = profile?.maxCustomerCredit || 50000;
const creditAlreadyUsed = Math.max(0, -previousBalance);
const availableCredit = maxCreditLimit - creditAlreadyUsed;

const amountPayingNowValid =
  parsedAmountPayingNow === null || 
  (parsedAmountPayingNow >= Math.min(newPurchase, availableCredit) &&
   parsedAmountPayingNow <= totalAfterSale);
```

---

## SECTION 4: DATA INTEGRITY ISSUES

### 4.1 | Inventory Stock Status Not Auto-Calculated
**Severity:** 🟡 HIGH  
**Category:** Data Integrity  

**Problem:**
- Status field (`in_stock`, `low`, `critical`) depends on comparing stock vs reorder level
- No logic to auto-calculate status
- Status must be manually updated
- Inventory alerts won't work

**Used In:**
- Dashboard low stock display
- Inventory alerts

**Recommended Fix:**

Add status calculation:
```javascript
// After any stock change
const calculateStatus = (currentStock, reorderLevel, minStock) => {
  if (currentStock <= 0) return 'critical';
  if (currentStock <= minStock) return 'critical';
  if (currentStock <= reorderLevel) return 'low';
  return 'in_stock';
};
```

Call on every inventory update:
```javascript
const newStatus = calculateStatus(item.stock, item.reorder, item.min_stock);
await api.update('inventory_items', item.id, { status: newStatus });
```

---

### 4.2 | Missing Error Handling in API Calls
**Severity:** 🟡 HIGH  
**Category:** Reliability  

**Examples:**
```javascript
// Sales.jsx - Line ~80
const load = () => {
  api.list("orders", { orderBy: "created_at DESC" }).then((rows) => 
    setOrders(rows.filter((o) => ["paid", "served", "completed"].includes(o.status)))
  );
  // No .catch() handler!
};

// POS.jsx - Line ~150+
api.list("menu_items").then((rows) => {
  setMenuItems(rows);  // Fails silently if API error
});
```

**Problem:**
- Network errors, database failures silently fail
- UI state becomes inconsistent
- No error logging for debugging

**Recommended Fix:**
```javascript
const load = async () => {
  try {
    const orders = await api.list("orders", { orderBy: "created_at DESC" });
    setOrders(orders.filter((o) => ["paid", "served", "completed"].includes(o.status)));
  } catch (error) {
    console.error('Failed to load orders:', error);
    setError('Failed to load orders. Please try again.');
  }
};
```

---

## SECTION 5: REPORT GENERATION ISSUES

### 5.1 | Sales Trend Missing Refund Deduction
**Severity:** 🟡 HIGH  
**Category:** Reports  

**Current Code (reports.js, Line ~130):**
```javascript
dataMap[dateKey].revenue += Number(o.total || 0);  // ← Includes refunds!
```

**Should Be:**
```javascript
const refunded = Number(o.refunded_total || 0);
const netRevenue = Number(o.total || 0) - refunded;
dataMap[dateKey].revenue += netRevenue;
```

---

### 5.2 | Waiter Performance Missing Refunds
**Severity:** 🟡 HIGH  
**Category:** Reports  

**Current Code (reports.js, Line ~165):**
```javascript
dataMap[waiter].revenue += Number(o.total || 0);  // ← Should subtract refunds
```

---

### 5.3 | Profit Report Calculation Completely Wrong
**Severity:** 🔴 CRITICAL  
**Category:** Reports  

**Already detailed in Section 1.5**

---

## SECTION 6: SUMMARY & RECOMMENDATIONS

### Critical Issues (Must Fix Immediately)
1. ✅ Tax calculation order (Section 1.1)
2. ✅ Service charge calculation base (Section 1.2)
3. ✅ Profit report revenue formula (Section 1.5)
4. ✅ Customer credit not updated (Section 3.1)
5. ✅ Missing journal entries (Section 3.2)
6. ✅ Database schema missing fields (Section 2.1-2.4)

### High Priority Issues (This Week)
1. Discount validation bounds
2. Service charge rate bounds
3. API error handling
4. Inventory status auto-calculation
5. Split payment rounding

### Medium Priority Issues (This Sprint)
1. Discount calculation duplication
2. Report refund deductions
3. Customer credit limits
4. Additional database fields

---

## IMPLEMENTATION PRIORITY

### Phase 1: Financial Accuracy (Days 1-2)
- Fix tax calculation order
- Fix service charge base
- Fix profit report revenue
- Add journal entry creation
- Fix database schema

### Phase 2: Data Integrity (Days 3-4)
- Customer credit update
- Inventory status calculation
- Discount bounds validation
- Service charge rate bounds

### Phase 3: Reports Accuracy (Days 5-6)
- Refund deduction in reports
- Tax report recalculation
- COGS tracking

### Phase 4: Error Handling (Days 7+)
- API error handling
- User feedback
- Logging and monitoring

---

## CONCLUSION

The system has **23+ identified issues**, with **6 CRITICAL** issues that violate basic financial accounting principles. Many issues will cause:

- ❌ Incorrect profit calculations
- ❌ Accounting records not balanced
- ❌ Tax reporting errors
- ❌ Customer account corruption
- ❌ Audit failures

**Immediate action required before production use.**

---

**Report Prepared:** August 17, 2026  
**Review Type:** Comprehensive Code Review  
**Status:** Issues Documented - Ready for Remediation
