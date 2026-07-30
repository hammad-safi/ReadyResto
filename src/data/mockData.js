// Central mock data store — swap for real API/SQLite-via-IPC calls later.

export const salesTrend = [
  { day: "Mon", sales: 42000, orders: 118 },
  { day: "Tue", sales: 38500, orders: 104 },
  { day: "Wed", sales: 51200, orders: 132 },
  { day: "Thu", sales: 47800, orders: 121 },
  { day: "Fri", sales: 68900, orders: 176 },
  { day: "Sat", sales: 81200, orders: 205 },
  { day: "Sun", sales: 73400, orders: 189 },
];

export const categorySales = [
  { name: "Fast Food", value: 34 },
  { name: "BBQ & Grill", value: 26 },
  { name: "Beverages", value: 18 },
  { name: "Desserts", value: 12 },
  { name: "Rice & Karahi", value: 10 },
];

export const paymentSplit = [
  { name: "Cash", value: 52 },
  { name: "Card", value: 31 },
  { name: "Wallet", value: 11 },
  { name: "Credit", value: 6 },
];

export const topItems = [
  { name: "Zinger Burger Combo", qty: 214, revenue: 128400 },
  { name: "Chicken Seekh Kebab (6pc)", qty: 189, revenue: 94500 },
  { name: "Beef Karahi (Half)", qty: 142, revenue: 156200 },
  { name: "Peshawari Chapli Kebab", qty: 133, revenue: 66500 },
  { name: "Kashmiri Chai", qty: 310, revenue: 31000 },
];

export const lowStock = [
  { id: "ING-014", name: "Chicken Boneless", stock: 8, unit: "kg", reorder: 20 },
  { id: "ING-027", name: "Mozzarella Cheese", stock: 3.2, unit: "kg", reorder: 10 },
  { id: "ING-041", name: "Cooking Oil", stock: 14, unit: "ltr", reorder: 25 },
  { id: "ING-052", name: "Coriander (Fresh)", stock: 1.1, unit: "kg", reorder: 5 },
];

export const tables = [
  { id: "T-01", section: "Ground Floor", seats: 4, status: "occupied", order: "ORD-1042", since: "12:14 PM" },
  { id: "T-02", section: "Ground Floor", seats: 2, status: "available", order: null },
  { id: "T-03", section: "Ground Floor", seats: 6, status: "reserved", order: null, time: "1:30 PM" },
  { id: "T-04", section: "Ground Floor", seats: 4, status: "cleaning", order: null },
  { id: "T-05", section: "Rooftop", seats: 4, status: "occupied", order: "ORD-1045", since: "12:40 PM" },
  { id: "T-06", section: "Rooftop", seats: 8, status: "available", order: null },
  { id: "T-07", section: "Rooftop", seats: 2, status: "occupied", order: "ORD-1046", since: "12:55 PM" },
  { id: "T-08", section: "VIP", seats: 10, status: "available", order: null },
];

export const menuCategories = ["Fast Food", "BBQ & Grill", "Rice & Karahi", "Beverages", "Desserts"];

export const menuItems = [
  { id: "M-101", name: "Zinger Burger", category: "Fast Food", price: 650, cost: 240, status: "available", img: "🍔" },
  { id: "M-102", name: "Chicken Wings (6pc)", category: "Fast Food", price: 780, cost: 310, status: "available", img: "🍗" },
  { id: "M-201", name: "Chicken Seekh Kebab", category: "BBQ & Grill", price: 500, cost: 190, status: "available", img: "🍢" },
  { id: "M-202", name: "Beef Chapli Kebab", category: "BBQ & Grill", price: 550, cost: 220, status: "out_of_stock", img: "🥩" },
  { id: "M-301", name: "Beef Karahi (Full)", category: "Rice & Karahi", price: 2400, cost: 980, status: "available", img: "🍲" },
  { id: "M-302", name: "Chicken Biryani", category: "Rice & Karahi", price: 380, cost: 140, status: "available", img: "🍛" },
  { id: "M-401", name: "Kashmiri Chai", category: "Beverages", price: 180, cost: 55, status: "available", img: "🍵" },
  { id: "M-402", name: "Fresh Lime Soda", category: "Beverages", price: 150, cost: 40, status: "available", img: "🥤" },
  { id: "M-501", name: "Gulab Jamun (2pc)", category: "Desserts", price: 220, cost: 70, status: "available", img: "🍮" },
];

export const orders = [
  { id: "ORD-1042", type: "Dine-In", table: "T-01", customer: "Walk-in", items: 4, total: 2140, status: "preparing", waiter: "Ahmed", time: "12:14 PM" },
  { id: "ORD-1043", type: "Takeaway", table: null, customer: "Sara Khan", items: 2, total: 980, status: "ready", waiter: "Bilal", time: "12:22 PM" },
  { id: "ORD-1044", type: "Delivery", table: null, customer: "Usman Tariq", items: 5, total: 3120, status: "served", waiter: "Hina", time: "12:30 PM" },
  { id: "ORD-1045", type: "Dine-In", table: "T-05", customer: "Walk-in", items: 3, total: 1650, status: "preparing", waiter: "Ahmed", time: "12:40 PM" },
  { id: "ORD-1046", type: "Dine-In", table: "T-07", customer: "Walk-in", items: 2, total: 890, status: "new", waiter: "Bilal", time: "12:55 PM" },
  { id: "ORD-1047", type: "Phone Order", table: null, customer: "Faisal Iqbal", items: 6, total: 4200, status: "cancelled", waiter: "Hina", time: "1:05 PM" },
];

export const kitchenBoard = {
  new: [
    { id: "ORD-1046", table: "T-07", items: ["Zinger Burger x1", "Fresh Lime Soda x2"], time: "1 min", rush: false },
  ],
  preparing: [
    { id: "ORD-1042", table: "T-01", items: ["Beef Karahi (Full)", "Kashmiri Chai x2", "Naan x4"], time: "6 min", rush: true },
    { id: "ORD-1045", table: "T-05", items: ["Chicken Seekh Kebab x2", "Gulab Jamun x1"], time: "3 min", rush: false },
  ],
  ready: [
    { id: "ORD-1043", table: "Takeaway", items: ["Chicken Wings (6pc)", "Fresh Lime Soda"], time: "9 min", rush: false },
  ],
  served: [
    { id: "ORD-1044", table: "Delivery", items: ["Chicken Biryani x2", "Kashmiri Chai x3"], time: "18 min", rush: false },
  ],
};

export const inventoryItems = [
  { id: "ING-001", name: "Chicken Boneless", category: "Meat & Poultry", unit: "kg", stock: 42, reorder: 20, cost: 620, status: "in_stock" },
  { id: "ING-014", name: "Chicken Boneless (Frozen)", category: "Meat & Poultry", unit: "kg", stock: 8, reorder: 20, cost: 580, status: "low" },
  { id: "ING-027", name: "Mozzarella Cheese", category: "Dairy", unit: "kg", stock: 3.2, reorder: 10, cost: 1450, status: "low" },
  { id: "ING-033", name: "Basmati Rice", category: "Dry Goods", unit: "kg", stock: 120, reorder: 40, cost: 320, status: "in_stock" },
  { id: "ING-041", name: "Cooking Oil", category: "Dry Goods", unit: "ltr", stock: 14, reorder: 25, cost: 480, status: "low" },
  { id: "ING-052", name: "Coriander (Fresh)", category: "Vegetables", unit: "kg", stock: 1.1, reorder: 5, cost: 180, status: "critical" },
  { id: "ING-060", name: "Tomatoes", category: "Vegetables", unit: "kg", stock: 0, reorder: 15, cost: 140, status: "critical" },
];

export const suppliers = [
  { id: "SUP-01", name: "Al-Madina Meat Suppliers", phone: "0300-1234567", category: "Meat & Poultry", due: 84500, status: "active" },
  { id: "SUP-02", name: "Fresh Valley Vegetables", phone: "0333-9988776", category: "Vegetables", due: 12300, status: "active" },
  { id: "SUP-03", name: "Khyber Dairy Co.", phone: "0345-1122334", category: "Dairy", due: 0, status: "active" },
  { id: "SUP-04", name: "Metro Dry Goods", phone: "0312-4455667", category: "Dry Goods", due: 45200, status: "blocked" },
];

export const purchaseOrders = [
  { id: "PO-2201", supplier: "Al-Madina Meat Suppliers", date: "Jul 08, 2026", total: 68500, status: "received" },
  { id: "PO-2202", supplier: "Fresh Valley Vegetables", date: "Jul 09, 2026", total: 22400, status: "sent" },
  { id: "PO-2203", supplier: "Metro Dry Goods", date: "Jul 10, 2026", total: 51200, status: "draft" },
  { id: "PO-2204", supplier: "Khyber Dairy Co.", date: "Jul 11, 2026", total: 18900, status: "received" },
];

export const customers = [
  { id: "CUS-001", name: "Sara Khan", phone: "0301-2223344", email: "sara.khan@gmail.com", visits: 24, points: 1280, credit: 0, tier: "Gold" },
  { id: "CUS-002", name: "Usman Tariq", phone: "0322-5566778", email: "usman.tariq@gmail.com", visits: 11, points: 540, credit: 0, tier: "Silver" },
  { id: "CUS-003", name: "Faisal Iqbal", phone: "0345-9988001", email: "faisal.iqbal@hotmail.com", visits: 6, points: 180, credit: 3200, tier: "Silver" },
  { id: "CUS-004", name: "Ayesha Noor", phone: "0333-1230984", email: "ayesha.noor@yahoo.com", visits: 42, points: 3450, credit: 0, tier: "Platinum" },
];

export const employees = [
  { id: "EMP-01", name: "Ahmed Raza", role: "Waiter", phone: "0301-1112223", status: "active", joined: "Jan 2025" },
  { id: "EMP-02", name: "Bilal Hussain", role: "Cashier", phone: "0322-3334445", status: "active", joined: "Mar 2025" },
  { id: "EMP-03", name: "Hina Aslam", role: "Waiter", phone: "0345-5556667", status: "on_leave", joined: "May 2025" },
  { id: "EMP-04", name: "Chef Imran", role: "Chef", phone: "0312-7778889", status: "active", joined: "Nov 2024" },
];

export const expenses = [
  { id: "EXP-501", category: "Electricity", amount: 42000, date: "Jul 05, 2026", paidBy: "Owner" },
  { id: "EXP-502", category: "Gas", amount: 18500, date: "Jul 06, 2026", paidBy: "Manager" },
  { id: "EXP-503", category: "Maintenance", amount: 7200, date: "Jul 08, 2026", paidBy: "Manager" },
  { id: "EXP-504", category: "Salaries", amount: 285000, date: "Jul 01, 2026", paidBy: "Owner" },
];

export const users = [
  { id: "USR-01", name: "Hammadullah", role: "Owner", pin: "••••", status: "active", lastLogin: "Today, 9:02 AM" },
  { id: "USR-02", name: "Bilal Hussain", role: "Cashier", pin: "••••", status: "active", lastLogin: "Today, 11:40 AM" },
  { id: "USR-03", name: "Ahmed Raza", role: "Waiter", pin: "••••", status: "active", lastLogin: "Today, 11:52 AM" },
  { id: "USR-04", name: "Chef Imran", role: "Kitchen Staff", pin: "••••", status: "active", lastLogin: "Today, 10:15 AM" },
];

export const auditLog = [
  { time: "12:41 PM", user: "Bilal Hussain", module: "POS Billing", action: "Applied 10% discount on ORD-1042" },
  { time: "12:20 PM", user: "Ahmed Raza", module: "Table Management", action: "Marked T-03 as Reserved" },
  { time: "11:58 AM", user: "Hammadullah", module: "Inventory", action: "Adjusted stock for Cooking Oil (-4 ltr, wastage)" },
  { time: "11:30 AM", user: "Chef Imran", module: "Kitchen Display", action: "Marked ORD-1039 as Served" },
];

export const notifications = [
  { id: 1, type: "low_stock", text: "Coriander (Fresh) is below reorder level", time: "5 min ago" },
  { id: 2, type: "expiry", text: "Mozzarella Cheese batch #B-220 expires in 2 days", time: "42 min ago" },
  { id: 3, type: "payment", text: "Metro Dry Goods payment of Rs. 45,200 is overdue", time: "2 hr ago" },
  { id: 4, type: "system", text: "Daily closing reminder — Z-Report not yet generated", time: "3 hr ago" },
];
