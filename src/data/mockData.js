export const salesTrend = [
	{ date: "Mon", sales: 18400, orders: 18 },
	{ date: "Tue", sales: 23100, orders: 24 },
	{ date: "Wed", sales: 19850, orders: 21 },
	{ date: "Thu", sales: 27600, orders: 29 },
	{ date: "Fri", sales: 32400, orders: 35 },
	{ date: "Sat", sales: 38900, orders: 42 },
	{ date: "Sun", sales: 29100, orders: 31 },
];
export const categorySales = [
	{ name: "Main Course", value: 42 },
	{ name: "BBQ & Grill", value: 28 },
	{ name: "Beverages", value: 16 },
	{ name: "Desserts", value: 14 },
];
export const paymentSplit = [
	{ name: "Cash", value: 48 },
	{ name: "Card", value: 32 },
	{ name: "Bank Transfer", value: 20 },
];
export const topItems = [
	{ name: "Chicken Karahi", sold: 86, revenue: 150500 },
	{ name: "Seekh Kebab Platter", sold: 64, revenue: 102400 },
	{ name: "Doodh Patti", sold: 118, revenue: 29500 },
];
export const lowStock = [
	{ name: "Cooking Oil", stock: 8, reorder: 20, unit: "L" },
	{ name: "Basmati Rice", stock: 14, reorder: 25, unit: "kg" },
];
export const tables = [
	{ id: 1, section: "Main Hall", seats: 4, status: "available", order: null },
	{ id: 2, section: "Main Hall", seats: 4, status: "occupied", order: "ORD-1002" },
	{ id: 3, section: "Main Hall", seats: 6, status: "reserved", order: null },
	{ id: 4, section: "Terrace", seats: 2, status: "available", order: null },
	{ id: 5, section: "Terrace", seats: 8, status: "occupied", order: "ORD-1003" },
];
export const menuCategories = ["Main Course", "BBQ & Grill", "Beverages", "Desserts"];
export const menuItems = [
	{ name: "Chicken Karahi", category: "Main Course", price: 1750, cost: 920, status: "available", img: "" },
	{ name: "Mutton Handi", category: "Main Course", price: 2450, cost: 1420, status: "available", img: "" },
	{ name: "Seekh Kebab Platter", category: "BBQ & Grill", price: 1600, cost: 820, status: "available", img: "" },
	{ name: "Malai Boti", category: "BBQ & Grill", price: 1350, cost: 690, status: "available", img: "" },
	{ name: "Doodh Patti", category: "Beverages", price: 250, cost: 70, status: "available", img: "" },
	{ name: "Gulab Jamun", category: "Desserts", price: 450, cost: 180, status: "available", img: "" },
];
export const orders = [
	{ type: "Dine In", table: 2, customer: "Ali Traders", items: 3, total: 4250, status: "preparing", waiter: "Ahmed Raza", time: "12 min ago" },
	{ type: "Takeaway", table: null, customer: "Sana Khan", items: 2, total: 2200, status: "ready", waiter: "Bilal Hussain", time: "18 min ago" },
	{ type: "Dine In", table: 5, customer: "Walk-in Customer", items: 5, total: 6850, status: "served", waiter: "Ahmed Raza", time: "32 min ago" },
	{ type: "Delivery", table: null, customer: "Hamza Ahmed", items: 4, total: 5100, status: "completed", waiter: "Bilal Hussain", time: "1 hour ago" },
];
export const inventoryItems = [
	{ name: "Basmati Rice", category: "Dry Goods", unit: "kg", stock: 14, reorder: 25, cost: 380, status: "low" },
	{ name: "Chicken", category: "Meat", unit: "kg", stock: 42, reorder: 20, cost: 720, status: "in_stock" },
	{ name: "Cooking Oil", category: "Oils", unit: "L", stock: 8, reorder: 20, cost: 610, status: "low" },
	{ name: "Yogurt", category: "Dairy", unit: "kg", stock: 18, reorder: 10, cost: 280, status: "in_stock" },
	{ name: "Soft Drinks", category: "Beverages", unit: "bottle", stock: 96, reorder: 30, cost: 95, status: "in_stock" },
];
export const suppliers = [
	{ name: "Peshawar Fresh Foods", phone: "091-5550199", category: "Meat & Dairy", due: 18500, status: "active" },
	{ name: "Citywide Grocers", phone: "0300-4567890", category: "Dry Goods", due: 7200, status: "active" },
	{ name: "Beverage Hub", phone: "0312-8882211", category: "Beverages", due: 0, status: "active" },
];
export const purchaseOrders = [
	{ supplier: "Peshawar Fresh Foods", total: 42600, status: "received" },
	{ supplier: "Citywide Grocers", total: 18900, status: "pending" },
];
export const customers = [
	{ name: "Ali Traders", phone: "0300-1122334", email: "ali@example.com", visits: 12, points: 860, credit: 0, tier: "Gold" },
	{ name: "Sana Khan", phone: "0315-7788990", email: "sana@example.com", visits: 7, points: 420, credit: 1200, tier: "Silver" },
	{ name: "Hamza Ahmed", phone: "0333-4455667", email: "hamza@example.com", visits: 4, points: 180, credit: 0, tier: "Regular" },
];
export const employees = [];
export const expenses = [
	{ category: "Utilities", amount: 18500, paidBy: "Hammadullah" },
	{ category: "Transport", amount: 6200, paidBy: "Bilal Hussain" },
	{ category: "Maintenance", amount: 9500, paidBy: "Hammadullah" },
];
export const users = [];
export const auditLog = [
	{ time: "Today, 10:42 AM", user: "Hammadullah", module: "POS Billing", action: "Created order ORD-1003" },
	{ time: "Today, 10:15 AM", user: "Bilal Hussain", module: "Inventory", action: "Received purchase order PO-0001" },
	{ time: "Yesterday, 7:30 PM", user: "Ahmed Raza", module: "Kitchen Display", action: "Updated order status" },
];
export const notifications = [
	{ type: "low_stock", text: "Cooking Oil is below its reorder level", time: "10 min ago" },
	{ type: "payment", text: "Peshawar Fresh Foods has Rs. 18,500 due", time: "1 hour ago" },
	{ type: "order", text: "Order ORD-1002 is ready for serving", time: "18 min ago" },
];
