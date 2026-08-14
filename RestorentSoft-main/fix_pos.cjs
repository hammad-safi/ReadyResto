const fs = require('fs');
let code = fs.readFileSync('src/pages/POS.jsx', 'utf8');

const search = '    total,';
const idx = code.indexOf(search);
const endIdx = code.indexOf('  const sendKOT = async () => {');

const replacement = `    total,
    status,
    kitchen_status: kitchenStatus,
    waiter: selectedWaiterId ? waiters.find(w => String(w.id) === String(selectedWaiterId))?.name : "None",
    waiter_id: selectedWaiterId || null,
    time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
    subtotal,
    discount_percent: discount,
    discount_reason: discount > 0 ? discountReason : null,
    tax,
    service_charge: serviceCharge,
    order_note: orderNote || null,
  });

  // Build items array including historical snapshots (cost, tax, discount) for strict accounting
  const buildItemsPayload = () =>
    cart.map((c) => {
      const itemTotal = c.price * c.qty;
      const itemDiscountAmount = discount > 0 ? (itemTotal * discount) / 100 : 0;
      const itemTaxable = itemTotal - itemDiscountAmount;
      const itemTaxRate = c.tax_rate ?? taxRate;
      const itemTaxAmount = (itemTaxable * itemTaxRate) / 100;
      const itemServiceRate = serviceRate;
      const itemServiceAmount = (itemTaxable * itemServiceRate) / 100;
      const cogs = (c.cost || 0) * c.qty;
      const netRevenue = itemTotal - itemDiscountAmount;
      const gp = netRevenue - cogs;

      return {
        menu_item_id: c.id,
        name: c.name,
        qty: c.qty,
        price: c.price,
        cost: c.cost || 0,
        discount_percent: discount,
        discount_amount: itemDiscountAmount,
        tax_rate: itemTaxRate,
        tax_amount: itemTaxAmount,
        service_charge_rate: itemServiceRate,
        service_charge_amount: itemServiceAmount,
        line_total: itemTotal,
        net_revenue: netRevenue,
        cogs: cogs,
        gross_profit: gp,
        notes: c.note || "",
        image: c.image || c.img || ""
      };
    });

  const holdOrder = async () => {
    if (!canSubmitOrder || placingAction) return;
    setPlacingAction("hold");
    try {
      const order = buildOrderPayload("held", "new");
      await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: \`Held order \${order.id}\` });
      resetOrder();
      refreshHeld();
    } finally {
      setPlacingAction(null);
    }
  };

`;

if (idx > 0 && endIdx > idx) {
  const newCode = code.substring(0, idx) + replacement + code.substring(endIdx);
  fs.writeFileSync('src/pages/POS.jsx', newCode);
  console.log('POS.jsx fixed');
} else {
  console.log('Not found');
}
