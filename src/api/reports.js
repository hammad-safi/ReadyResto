import api from "./client";

export async function generateReportData(reportType, range) {
  // Fetch all necessary data
  const [orders, orderItems, expenses, inventoryItems, purchaseOrders, suppliers, journalEntries] = await Promise.all([
    api.list("orders"),
    api.list("order_items"),
    api.list("expenses"),
    api.list("inventory"), // assuming entity is inventory or inventory_items. Wait, in client.js it might be inventoryItems. Let's use 'inventory' and handle it if undefined.
    api.list("purchase_orders").catch(() => []), // Provide fallback
    api.list("suppliers").catch(() => []),
    api.list("journal_entries").catch(() => [])
  ]);

  // Apply Date Filtering to time-series data
  const filteredOrders = filterByRange(orders, range);
  const filteredExpenses = filterByRange(expenses, range);
  const filteredPO = filterByRange(purchaseOrders, range);
  const filteredJournal = filterByRange(journalEntries, range);

  // We need filtered order_items. We'll map them from filtered orders.
  // Actually, order_items in mockData are just a pool, but in reality they are linked to orders.
  // Since mockData order_items don't have dates, we will just use all of them for now, 
  // or ideally we'd filter orderItems based on the filteredOrders. 
  // For the mock, we will just use the pool if it's "All Time", otherwise we'll try to extract them from filteredOrders.
  let filteredOrderItems = [];
  filteredOrders.forEach(o => {
    if (o.items && Array.isArray(o.items)) {
      o.items.forEach(i => {
         filteredOrderItems.push({
           name: typeof i === 'string' ? i : i.name,
           category: i.category || 'Food',
           price: i.price || 0,
           qty: i.qty || 1
         });
      });
    }
  });
  
  // If no items were embedded in orders (mock data variance), fallback to raw items pool
  if (filteredOrderItems.length === 0) {
     filteredOrderItems = orderItems;
  }

  switch (reportType) {
    case "Daily Sales":
    case "Monthly Sales":
    case "Annual Sales":
      return generateSalesTrend(filteredOrders, reportType);
    case "Category-wise Sales":
      return generateCategorySales(filteredOrderItems);
    case "Product-wise Sales":
      return generateProductSales(filteredOrderItems);
    case "Waiter Performance":
      return generateWaiterPerformance(filteredOrders);
    case "Expense Report":
      return generateExpenseReport(filteredExpenses);
    case "Cashier Report":
      return generateCashierReport(filteredOrders);
    case "Kitchen Report":
      return generateKitchenReport(filteredOrderItems);
    case "Inventory Report":
      return generateInventoryReport(inventoryItems);
    case "Purchase Report":
      return generatePurchaseReport(filteredPO);
    case "Supplier Report":
      return generateSupplierReport(suppliers);
    case "Profit Report":
      return generateProfitReport(filteredOrders, filteredExpenses, filteredJournal);
    case "Tax Report":
      return generateTaxReport(filteredOrders);
    default:
      return { chartType: "none", data: [] };
  }
}

// --- Date Filtering Logic ---
function filterByRange(data, range) {
  if (!data || !Array.isArray(data)) return [];
  if (range === "All Time") return data;

  const now = new Date();
  
  return data.filter(item => {
    // Determine the date of the item
    let itemDate = null;
    if (item.created_at) {
      itemDate = new Date(item.created_at);
    } else if (item.date) {
      // Mock data dates like "Jul 05, 2026"
      itemDate = new Date(item.date);
      if (item.date === "Today") itemDate = new Date();
    } else {
      // If an item has no date, assume it's mock data representing "today"
      itemDate = new Date();
    }

    if (isNaN(itemDate.getTime())) return true; // Keep if we can't parse date

    const isSameDay = itemDate.toDateString() === now.toDateString();
    const isSameMonth = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
    const isSameYear = itemDate.getFullYear() === now.getFullYear();

    if (range === "Today") return isSameDay;
    if (range === "This Week") {
      // Simple week check (within last 7 days)
      const diffTime = Math.abs(now - itemDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return diffDays <= 7;
    }
    if (range === "This Month") return isSameMonth;
    if (range === "This Year") return isSameYear;
    
    return true;
  });
}

// --- Report Generators ---

function generateSalesTrend(orders, type) {
  const dataMap = {};
  
  orders.forEach(o => {
    if (!["paid", "completed", "served"].includes(o.status)) return;
    
    let dateKey = "Unknown";
    const d = o.created_at ? new Date(o.created_at) : new Date();
    
    if (type === "Daily Sales") dateKey = d.toLocaleDateString();
    if (type === "Monthly Sales") dateKey = d.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (type === "Annual Sales") dateKey = d.getFullYear().toString();

    if (!dataMap[dateKey]) dataMap[dateKey] = { label: dateKey, revenue: 0, orders: 0 };
    dataMap[dateKey].revenue += Number(o.total || 0);
    dataMap[dateKey].orders += 1;
  });

  return { chartType: "bar", dataKey: "revenue", secondaryDataKey: "orders", data: Object.values(dataMap) };
}

function generateCategorySales(items) {
  const dataMap = {};
  items.forEach(item => {
    const cat = item.category || "General";
    if (!dataMap[cat]) dataMap[cat] = { label: cat, items_sold: 0 };
    dataMap[cat].items_sold += Number(item.qty || 1);
  });
  return { chartType: "pie", dataKey: "items_sold", data: Object.values(dataMap) };
}

function generateProductSales(items) {
  const dataMap = {};
  items.forEach(item => {
    const name = item.name || "Unknown";
    if (!dataMap[name]) dataMap[name] = { label: name, revenue: 0, qty: 0 };
    dataMap[name].revenue += Number((item.price || 500) * (item.qty || 1));
    dataMap[name].qty += Number(item.qty || 1);
  });
  const sorted = Object.values(dataMap).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  return { chartType: "bar", dataKey: "revenue", data: sorted };
}

function generateWaiterPerformance(orders) {
  const dataMap = {};
  orders.forEach(o => {
    if (!["paid", "completed", "served"].includes(o.status)) return;
    const waiter = o.waiter || "Direct Sale";
    if (!dataMap[waiter]) dataMap[waiter] = { label: waiter, revenue: 0, tables: 0 };
    dataMap[waiter].revenue += Number(o.total || 0);
    dataMap[waiter].tables += 1;
  });
  return { chartType: "bar", dataKey: "revenue", data: Object.values(dataMap) };
}

function generateExpenseReport(expenses) {
  const dataMap = {};
  expenses.forEach(e => {
    const cat = e.category || "Other";
    if (!dataMap[cat]) dataMap[cat] = { label: cat, amount: 0 };
    dataMap[cat].amount += Number(e.amount || 0);
  });
  return { chartType: "bar", dataKey: "amount", data: Object.values(dataMap) };
}

// NEW REPORTS:

function generateCashierReport(orders) {
  const dataMap = {};
  orders.forEach(o => {
    if (!["paid", "completed", "served"].includes(o.status)) return;
    const method = o.payment_method || "Cash";
    if (!dataMap[method]) dataMap[method] = { label: method, collected: 0, transactions: 0 };
    dataMap[method].collected += Number(o.total || 0);
    dataMap[method].transactions += 1;
  });
  return { chartType: "pie", dataKey: "collected", data: Object.values(dataMap) };
}

function generateKitchenReport(items) {
  // How much of each category did the kitchen prepare?
  const dataMap = {};
  items.forEach(item => {
    const cat = item.category || "Kitchen";
    if (!dataMap[cat]) dataMap[cat] = { label: cat, prepared: 0 };
    dataMap[cat].prepared += Number(item.qty || 1);
  });
  return { chartType: "bar", dataKey: "prepared", data: Object.values(dataMap) };
}

function generateInventoryReport(inventory) {
  // Date filter usually doesn't apply to current stock
  if (!inventory || !inventory.length) return { chartType: "none", data: [] };
  
  const mapped = inventory.map(i => ({
    label: i.name,
    stock: Number(i.stock || 0),
    reorder_level: Number(i.reorder || 0),
    status: i.status || "in_stock"
  }));
  
  // We'll chart stock vs reorder level
  return { chartType: "bar", dataKey: "stock", secondaryDataKey: "reorder_level", data: mapped };
}

function generatePurchaseReport(pos) {
  const dataMap = {};
  pos.forEach(p => {
    const status = p.status || "draft";
    if (!dataMap[status]) dataMap[status] = { label: status, amount: 0, count: 0 };
    dataMap[status].amount += Number(p.total || 0);
    dataMap[status].count += 1;
  });
  return { chartType: "pie", dataKey: "amount", data: Object.values(dataMap) };
}

function generateSupplierReport(suppliers) {
  if (!suppliers || !suppliers.length) return { chartType: "none", data: [] };
  const mapped = suppliers.map(s => ({
    label: s.name,
    due_amount: Number(s.due || 0),
    category: s.category || "General"
  }));
  return { chartType: "bar", dataKey: "due_amount", data: mapped.filter(m => m.due_amount > 0) };
}

function generateProfitReport(orders, expenses, journalEntries) {
  let revenue = 0;
  orders.forEach(o => {
    if (["paid", "completed", "served"].includes(o.status)) {
      revenue += Number(o.total || 0) - Number(o.tax || 0) - Number(o.service_charge || 0);
    }
  });

  let totalExp = 0;
  expenses.forEach(e => {
    totalExp += Number(e.amount || 0);
  });

  let cogs = 0;
  if (journalEntries && journalEntries.length > 0) {
    journalEntries.forEach(j => {
      if (j.account_code === '5001') {
        cogs += Number(j.debit || 0) - Number(j.credit || 0);
      }
    });
  } else {
    // Fallback if no journal entries
    cogs = 0;
  }

  const gross = revenue - cogs;
  const net = gross - totalExp;

  const data = [
    { label: "Revenue", amount: revenue },
    { label: "COGS", amount: cogs },
    { label: "Gross Profit", amount: gross },
    { label: "Operating Expenses", amount: totalExp },
    { label: "Net Profit", amount: net }
  ];

  return { chartType: "bar", dataKey: "amount", data };
}

function generateTaxReport(orders) {
  let totalTax = 0;
  let taxableRevenue = 0;

  orders.forEach(o => {
    if (["paid", "completed", "served"].includes(o.status)) {
      const orderTotal = Number(o.total || 0);
      const tax = Number(o.tax || 0);
      totalTax += tax;
      taxableRevenue += orderTotal;
    }
  });

  const data = [
    { label: "Taxable Revenue", value: taxableRevenue },
    { label: "GST Collected", value: totalTax }
  ];

  return { chartType: "pie", dataKey: "value", data };
}
