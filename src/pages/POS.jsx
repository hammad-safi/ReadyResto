



// import { useState, useMemo, useEffect, useCallback, useRef } from "react";
// import {
//   Search, Plus, Minus, Trash2, Pause, Percent, PlayCircle, UserRound, Banknote,
//   CreditCard, Wallet, Split, ChefHat, LayoutGrid, Users, X, Mail, Phone,
//   StickyNote, AlertCircle, RotateCcw, Loader2, Check,
// } from "lucide-react";
// import Button from "../components/ui/Button";
// import Modal from "../components/ui/Modal";
// import Receipt from "../components/pos/Receipt";
// import api from "../api/client";
// import { useAuth } from "../auth/AuthContext";

// const DISCOUNT_REASONS = ["Loyal customer", "Complaint resolution", "Staff meal", "Manager promotion", "Other"];
// const PAYMENT_METHODS = [
//   { key: "Cash", icon: Banknote },
//   { key: "Card", icon: CreditCard },
//   { key: "Wallet", icon: Wallet },
//   { key: "Credit", icon: UserRound },
// ];
// const QUICK_NOTES = ["Extra Spicy 🌶️", "Less Spicy", "No Onions", "No Garlic", "Less Salt", "Extra Sauce"];
// const CASH_ROUND_STEPS = [50, 100, 500, 1000, 5000];
// const ORDER_TYPES = [
//   { key: "Dine-In", icon: LayoutGrid },
//   { key: "Takeaway", icon: Wallet },
//   { key: "Delivery", icon: Split },
//   { key: "Phone", icon: Phone },
// ];

// // Single source of truth for currency formatting — keeps every figure on
// // screen consistent (no more "Rs." in one place and "Rs" in another).
// const fmt = (n) => `Rs ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

// function nextOrderId() {
//   return `ORD-${Date.now().toString().slice(-6)}`;
// }

// export default function POS() {
//   const { user } = useAuth();
//   const [activeCategory, setActiveCategory] = useState("All");
//   const [query, setQuery] = useState("");
//   const [cart, setCart] = useState([]);
//   const [orderType, setOrderType] = useState("Dine-In");
//   const [tableId, setTableId] = useState("");
//   const [allTables, setAllTables] = useState([]);
//   const [tableModalOpen, setTableModalOpen] = useState(false);
//   const [availableTables, setAvailableTables] = useState([]);
//   const [customerName, setCustomerName] = useState("Walk-in");
//   const [orderNote, setOrderNote] = useState("");
//   const [payOpen, setPayOpen] = useState(false);
//   const [discountOpen, setDiscountOpen] = useState(false);
//   const [discount, setDiscount] = useState(0);
//   const [discountReason, setDiscountReason] = useState(DISCOUNT_REASONS[0]);
//   const [menuItems, setMenuItems] = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [orderId, setOrderId] = useState(nextOrderId());
//   const [heldOrders, setHeldOrders] = useState([]);
//   const [profile, setProfile] = useState(null);
//   const [menuLoading, setMenuLoading] = useState(true);
//   const [placingAction, setPlacingAction] = useState(null); // "hold" | "kot" | null — prevents double submits

//   // People state
//   const [customers, setCustomers] = useState([]);
//   const [waiters, setWaiters] = useState([]);
//   const [selectedCustomer, setSelectedCustomer] = useState(null);
//   const [selectedWaiterId, setSelectedWaiterId] = useState("");

//   // Customer search dropdown state
//   const [customerSearch, setCustomerSearch] = useState("");
//   const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
//   const [amountPayingNow, setAmountPayingNow] = useState("");
//   const customerSearchRef = useRef(null);
//   const searchInputRef = useRef(null);

//   // Payment modal state
//   const [payMethod, setPayMethod] = useState("Cash");
//   const [splitMode, setSplitMode] = useState(false);
//   const [splitAmount1, setSplitAmount1] = useState(0);
//   const [splitMethod2, setSplitMethod2] = useState("Card");
//   const [tendered, setTendered] = useState("");
//   const [receiptData, setReceiptData] = useState(null); // { order, items }

//   const refreshTables = useCallback(() => {
//     api.list("tables_floor").then((rows) => {
//       setAllTables(rows);
//       setAvailableTables(rows.filter((t) => t.status === "available"));
//     });
//   }, []);

//   const refreshHeld = useCallback(() => {
//     api.list("orders", { where: { status: "held" } }).then(setHeldOrders);
//   }, []);

//   useEffect(() => {
//     setMenuLoading(true);
//     api.list("menu_items").then((rows) => {
//       setMenuItems(rows);
//       setMenuLoading(false);
//     });
//     api.list("categories").then((rows) => setCategories(rows.map((c) => c.name)));
//     refreshTables();
//     refreshHeld();
//     api.getSetting("restaurant_profile").then(setProfile);
//     api.list("customers").then(setCustomers);
//     api.list("employees", { where: { role: "Waiter" } }).then(setWaiters);
//   }, [refreshTables, refreshHeld]);

//   const filtered = useMemo(() => {
//     return menuItems.filter(
//       (m) =>
//         (activeCategory === "All" || m.category === activeCategory) &&
//         m.name.toLowerCase().includes(query.toLowerCase())
//     );
//   }, [activeCategory, query, menuItems]);

//   // How many of each menu item are currently in the cart, so the grid can
//   // show a live badge instead of forcing the cashier to check the cart panel.
//   const cartQtyById = useMemo(() => {
//     const map = {};
//     cart.forEach((c) => { map[c.id] = c.qty; });
//     return map;
//   }, [cart]);

//   const cartItemCount = cart.reduce((s, c) => s + c.qty, 0);

//   const addToCart = (item) => {
//     if (item.status === "out_of_stock") return;
//     setCart((prev) => {
//       const existing = prev.find((c) => c.id === item.id);
//       if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
//       return [...prev, { ...item, qty: 1, note: "" }];
//     });
//   };

//   const updateQty = (id, delta) => {
//     setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)).filter((c) => c.qty > 0));
//   };

//   const removeItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
//   const setItemNote = (id, note) => setCart((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));

//   const resetOrder = () => {
//     setCart([]);
//     setDiscount(0);
//     setDiscountReason(DISCOUNT_REASONS[0]);
//     setCustomerName("Walk-in");
//     setSelectedCustomer(null);
//     setSelectedWaiterId("");
//     setCustomerSearch("");
//     setAmountPayingNow("");
//     setOrderNote("");
//     setOrderId(nextOrderId());
//     setTableId("");
//     setTendered("");
//     setSplitMode(false);
//     setSplitAmount1(0);
//     refreshTables();
//   };

//   const clearOrder = () => {
//     if (cart.length === 0) return;
//     if (window.confirm("Clear this order? Items in the cart will be removed.")) {
//       resetOrder();
//     }
//   };

//   const taxRate = profile?.taxRate ?? 0;
//   const serviceRate = orderType === "Dine-In" ? (profile?.serviceCharge ?? 0) : 0;

//   const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
//   const discountAmount = Math.round((subtotal * discount) / 100);
//   const taxable = subtotal - discountAmount;
//   const tax = Math.round((taxable * taxRate) / 100);
//   const serviceCharge = Math.round((taxable * serviceRate) / 100);
//   const total = taxable + tax + serviceCharge;
//   const changeDue = tendered !== "" ? Math.max(0, Number(tendered) - total) : 0;
//   const splitAmt1Num = Number(splitAmount1) || 0;
//   const splitRemainder = total - splitAmt1Num;
//   const splitValid = !splitMode || (splitAmt1Num > 0 && splitAmt1Num < total);

//   // Table assignment is a convenience, not a requirement — some venues run
//   // counter service, or seat the guest after the order is already placed.
//   const canSubmitOrder = cart.length > 0;

//   // Quick cash-tendered suggestions: the exact total, plus the next round
//   // note value above it, so cashiers rarely have to type an amount by hand.
//   const cashSuggestions = useMemo(() => {
//     if (total <= 0) return [];
//     const rounded = CASH_ROUND_STEPS.map((step) => Math.ceil(total / step) * step);
//     return [...new Set([total, ...rounded])].sort((a, b) => a - b).slice(0, 4);
//   }, [total]);

//   const buildOrderPayload = (status, kitchenStatus = "new") => ({
//     id: orderId,
//     type: orderType,
//     table_id: orderType === "Dine-In" ? tableId || null : null,
//     customer: selectedCustomer?.name || customerName || "Walk-in",
//     customer_id: selectedCustomer?.id || null,
//     items_count: cart.reduce((s, c) => s + c.qty, 0),
//     total,
//     status,
//     kitchen_status: kitchenStatus,
//     waiter: selectedWaiterId ? waiters.find(w => String(w.id) === String(selectedWaiterId))?.name : "None",
//     waiter_id: selectedWaiterId || null,
//     time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
//     subtotal,
//     discount_percent: discount,
//     discount_reason: discount > 0 ? discountReason : null,
//     tax,
//     service_charge: serviceCharge,
//     order_note: orderNote || null,
//   });

//   // Build items array including image so kitchen can display it
//   const buildItemsPayload = () =>
//     cart.map((c) => ({ menu_item_id: c.id, name: c.name, qty: c.qty, price: c.price, notes: c.note || "", image: c.image || c.img || "" }));

//   const holdOrder = async () => {
//     if (!canSubmitOrder || placingAction) return;
//     setPlacingAction("hold");
//     try {
//       const order = buildOrderPayload("held", "new");
//       await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: `Held order ${order.id}` });
//       resetOrder();
//       refreshHeld();
//     } finally {
//       setPlacingAction(null);
//     }
//   };

//   const sendKOT = async () => {
//     if (!canSubmitOrder || placingAction) return;
//     setPlacingAction("kot");
//     try {
//       const order = buildOrderPayload("new", "new");
//       await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: `KOT sent for order ${order.id}` });
//       resetOrder();
//       refreshHeld();
//     } finally {
//       setPlacingAction(null);
//     }
//   };

//   const resumeOrder = async (held) => {
//     const items = await api.list("order_items", { where: { order_id: held.id } });
//     setOrderId(held.id);
//     setOrderType(held.type);
//     setTableId(held.table_id || "");
//     setCustomerName(held.customer || "Walk-in");
//     setOrderNote(held.order_note || "");
//     setDiscount(held.discount_percent || 0);
//     setDiscountReason(held.discount_reason || DISCOUNT_REASONS[0]);
//     setCart(items.map((it) => ({
//       id: it.menu_item_id, name: it.name, price: it.price, qty: it.qty, note: it.notes || "",
//       img: menuItems.find((m) => m.id === it.menu_item_id)?.image || "🍽️",
//       category: menuItems.find((m) => m.id === it.menu_item_id)?.category || "",
//       status: "available",
//     })));
//   };

//   // Derived customer account values
//   const previousBalance = selectedCustomer ? (selectedCustomer.credit || 0) : 0;
//   const newPurchase = total;
//   const totalAfterSale = previousBalance + newPurchase;
//   const parsedAmountPayingNow = amountPayingNow !== "" ? Number(amountPayingNow) : null;
//   const amountPayingNowValid =
//     parsedAmountPayingNow === null || (parsedAmountPayingNow >= 0 && parsedAmountPayingNow <= totalAfterSale);

//   const paymentConfirmDisabled =
//     !canSubmitOrder ||
//     (payMethod === "Cash" && !splitMode && tendered !== "" && Number(tendered) < total) ||
//     (splitMode && !splitValid) ||
//     (!!selectedCustomer && !amountPayingNowValid);

//   const confirmPayment = async () => {
//     if (paymentConfirmDisabled) return;
//     const paymentDetails = splitMode
//       ? JSON.stringify([{ method: payMethod, amount: splitAmt1Num }, { method: splitMethod2, amount: Math.max(0, splitRemainder) }])
//       : null;
//     // If customer is selected and paying via credit/partial, use amountPayingNow
//     const effectiveTendered = selectedCustomer && parsedAmountPayingNow !== null
//       ? parsedAmountPayingNow
//       : (payMethod === "Cash" && !splitMode && tendered !== "" ? Number(tendered) : total);
//     const effectiveChange = selectedCustomer && parsedAmountPayingNow !== null
//       ? 0
//       : (payMethod === "Cash" && !splitMode ? changeDue : 0);
//     const order = {
//       ...buildOrderPayload("paid", "new"),
//       payment_method: splitMode ? `${payMethod} + ${splitMethod2}` : payMethod,
//       payment_details: paymentDetails,
//       tendered: effectiveTendered,
//       change_due: effectiveChange,
//     };
//     const items = buildItemsPayload();
//     const saved = await api.createOrderWithItems(order, items, { user: user?.name, action: `Checked out order ${order.id}` });
//     setPayOpen(false);
//     setReceiptData({ order: saved, items });
//     resetOrder();
//     refreshHeld();
//   };

//   return (
//     <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 h-full">
//       {/* MENU PANEL */}
//       <div className="min-w-0">
//         {heldOrders.length > 0 && (
//           <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-1">
//             <span className="text-xs font-medium text-ink-500 shrink-0 flex items-center gap-1">
//               <Pause size={12} /> Held ({heldOrders.length}):
//             </span>
//             {heldOrders.map((h) => (
//               <button
//                 key={h.id}
//                 onClick={() => resumeOrder(h)}
//                 title={`Resume ${h.id} — ${h.items_count ?? ""} item(s)`}
//                 className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-saffron-400/15 text-saffron-600 border border-saffron-400/30 hover:bg-saffron-400/25 transition-colors"
//               >
//                 <PlayCircle size={13} /> {h.id} · {fmt(h.total)}
//               </button>
//             ))}
//           </div>
//         )}

//         <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
//           <div className="relative flex-1">
//             <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500" />
//             <input
//               ref={searchInputRef}
//               value={query}
//               onChange={(e) => setQuery(e.target.value)}
//               placeholder="Search menu or scan barcode…"
//               aria-label="Search menu items"
//               className="w-full bg-white border border-canvas-200 rounded-lg pl-9 pr-9 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 focus:border-paprika-400"
//             />
//             {query && (
//               <button
//                 onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}
//                 aria-label="Clear search"
//                 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
//               >
//                 <X size={14} />
//               </button>
//             )}
//           </div>
//         </div>

//         <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
//           {["All", ...categories].map((cat) => (
//             <button
//               key={cat}
//               onClick={() => setActiveCategory(cat)}
//               aria-pressed={activeCategory === cat}
//               className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
//                 activeCategory === cat ? "bg-ink-900 text-white border-ink-900" : "bg-white text-ink-700 border-canvas-200 hover:bg-canvas-100"
//               }`}
//             >
//               {cat}
//             </button>
//           ))}
//         </div>

//         {menuLoading ? (
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <div key={i} className="bg-white border border-canvas-200 rounded-xl2 overflow-hidden animate-pulse">
//                 <div className="aspect-square w-full bg-canvas-100" />
//                 <div className="px-2.5 py-1.5">
//                   <div className="h-2.5 w-3/4 rounded bg-canvas-100 mb-1.5" />
//                   <div className="h-2.5 w-1/3 rounded bg-canvas-100" />
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
//             {filtered.map((item) => {
//               const inCartQty = cartQtyById[item.id] || 0;
//               const outOfStock = item.status === "out_of_stock";
//               const hasPhoto = item.image && item.image.startsWith("data:");
//               return (
//                 <button
//                   key={item.id}
//                   onClick={() => addToCart(item)}
//                   disabled={outOfStock}
//                   aria-label={`Add ${item.name}, ${fmt(item.price)}`}
//                   className={`group relative flex flex-col text-left bg-white border rounded-xl2 overflow-hidden shadow-soft transition-all disabled:hover:translate-y-0 disabled:cursor-not-allowed ${
//                     inCartQty > 0 ? "border-paprika-300 ring-1 ring-paprika-200" : "border-canvas-200"
//                   } hover:shadow-card hover:-translate-y-0.5`}
//                 >
//                   {inCartQty > 0 && (
//                     <span className="absolute top-1.5 right-1.5 z-10 h-5 min-w-5 px-1 rounded-full bg-paprika-500 text-white text-[10px] font-bold flex items-center justify-center shadow-soft">
//                       {inCartQty}
//                     </span>
//                   )}
//                   {/* Square photo — full picture visible, never cropped */}
//                   <div className="relative aspect-square w-full bg-canvas-100 flex items-center justify-center overflow-hidden">
//                     {hasPhoto ? (
//                       <img src={item.image} alt="" className="h-full w-full object-contain" />
//                     ) : (
//                       <span className="text-4xl">{item.image || "🍽️"}</span>
//                     )}
//                     {outOfStock && (
//                       <div className="absolute inset-0 bg-ink-900/55 flex items-center justify-center">
//                         <span className="text-[10px] font-bold tracking-wide text-white uppercase px-2 py-1 rounded-full bg-ink-900/70">
//                           Out of stock
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                   {/* Compact info strip — deliberately thin, roughly 15% of card height */}
//                   <div className="px-2.5 py-1.5 flex flex-col justify-center gap-0.5 bg-white">
//                     <p className="text-xs font-medium text-ink-900 leading-tight truncate">{item.name}</p>
//                     <span className="font-mono text-xs font-semibold text-paprika-600">{fmt(item.price)}</span>
//                   </div>
//                 </button>
//               );
//             })}
//             {filtered.length === 0 && (
//               <div className="col-span-full flex flex-col items-center gap-1 text-center py-16 text-ink-500 text-sm">
//                 <Search size={20} className="text-ink-300 mb-1" />
//                 <p>No menu items match "{query || activeCategory}"</p>
//                 {query && (
//                   <button onClick={() => setQuery("")} className="text-xs font-medium text-paprika-600 hover:underline mt-1">
//                     Clear search
//                   </button>
//                 )}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* CART PANEL */}
//       <div className="bg-white border border-canvas-200 rounded-xl2 shadow-card flex flex-col h-fit xl:h-[calc(100vh-8.5rem)] xl:sticky xl:top-20">
//         <div className="p-4 border-b border-canvas-200 space-y-3">
//           <div className="flex gap-1.5">
//             {ORDER_TYPES.map(({ key: t }) => (
//               <button
//                 key={t}
//                 onClick={() => setOrderType(t)}
//                 aria-pressed={orderType === t}
//                 className={`flex-1 text-xs font-medium py-2 rounded-lg transition-colors ${
//                   orderType === t ? "bg-paprika-500 text-white" : "bg-canvas-100 text-ink-600 hover:bg-canvas-200"
//                 }`}
//               >
//                 {t}
//               </button>
//             ))}
//           </div>
//           <div className="flex items-center justify-between gap-2">
//             <span className="ticket-tag border-ink-300 text-ink-600 shrink-0">{orderId}</span>
//             {orderType === "Dine-In" && (
//               <button
//                 onClick={() => setTableModalOpen(true)}
//                 className={`flex items-center gap-1.5 flex-1 min-w-0 justify-center text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
//                   tableId
//                     ? "border-basil-500 bg-basil-500/10 text-basil-700"
//                     : "border-canvas-200 text-ink-500 hover:bg-canvas-100"
//                 }`}
//               >
//                 <LayoutGrid size={12} />
//                 {tableId ? `Table ${tableId}` : "Select table (optional)…"}
//               </button>
//             )}
//             <button
//               onClick={clearOrder}
//               disabled={cart.length === 0}
//               title="Clear cart and start over"
//               aria-label="Clear cart"
//               className="shrink-0 flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-paprika-600 disabled:opacity-30 disabled:hover:text-ink-500 transition-colors px-1.5 py-1 rounded-lg hover:bg-paprika-50"
//             >
//               <RotateCcw size={13} /> Clear
//             </button>
//           </div>
//           {/* Customer Selector */}
//           <div className="space-y-2">
//             <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider">Customer <span className="font-normal normal-case">(optional)</span></p>

//             {selectedCustomer ? (
//               /* Selected Customer Card */
//               <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-start gap-2">
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-ink-900 leading-tight">{selectedCustomer.name}</p>
//                   <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
//                     {selectedCustomer.phone && (
//                       <span className="flex items-center gap-0.5 text-[11px] text-ink-500">
//                         <Phone size={9} /> {selectedCustomer.phone}
//                       </span>
//                     )}
//                     {selectedCustomer.email && (
//                       <span className="flex items-center gap-0.5 text-[11px] text-ink-500 truncate">
//                         <Mail size={9} /> {selectedCustomer.email}
//                       </span>
//                     )}
//                   </div>
//                 </div>
//                 <button
//                   onClick={() => { setSelectedCustomer(null); setCustomerName("Walk-in"); setCustomerSearch(""); setAmountPayingNow(""); }}
//                   aria-label="Remove customer"
//                   className="text-red-400 hover:text-red-600 transition-colors shrink-0 mt-0.5"
//                 >
//                   <X size={14} />
//                 </button>
//               </div>
//             ) : (
//               /* Customer Search Dropdown */
//               <div className="relative" ref={customerSearchRef}>
//                 <UserRound size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
//                 <input
//                   type="text"
//                   value={customerSearch}
//                   onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); }}
//                   onFocus={() => setCustomerDropdownOpen(true)}
//                   onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 180)}
//                   placeholder="Search by name or phone…"
//                   aria-label="Search customers"
//                   className="w-full text-xs border border-canvas-200 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-paprika-500/30"
//                 />
//                 {customerDropdownOpen && (
//                   <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-canvas-200 rounded-xl shadow-card max-h-44 overflow-y-auto">
//                     {customers
//                       .filter(c => {
//                         const q = customerSearch.toLowerCase();
//                         return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
//                       })
//                       .map(c => (
//                         <button
//                           key={c.id}
//                           onMouseDown={() => {
//                             setSelectedCustomer(c);
//                             setCustomerName(c.name);
//                             setCustomerSearch(c.name);
//                             setCustomerDropdownOpen(false);
//                             setAmountPayingNow("");
//                           }}
//                           className="w-full text-left px-3 py-2 hover:bg-canvas-50 border-b border-canvas-100 last:border-0 transition-colors"
//                         >
//                           <p className="text-xs font-semibold text-ink-900">{c.name}</p>
//                           <p className="text-[10px] text-ink-400">{c.phone}{c.credit > 0 ? ` · ${fmt(c.credit)} credit` : ""}</p>
//                         </button>
//                       ))}
//                     {customers.filter(c => { const q = customerSearch.toLowerCase(); return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q); }).length === 0 && (
//                       <p className="px-3 py-3 text-xs text-ink-400 text-center">No customers found</p>
//                     )}
//                   </div>
//                 )}
//               </div>
//             )}

//             {/* Customer Account Section */}
//             {selectedCustomer && (
//               <div className="rounded-xl border border-canvas-200 bg-canvas-50 overflow-hidden">
//                 <div className="px-3 py-2 border-b border-canvas-200">
//                   <p className="text-[9px] font-bold text-ink-400 uppercase tracking-widest">Customer Account</p>
//                 </div>
//                 <div className="px-3 py-2 space-y-1.5">
//                   <div className="flex justify-between items-center text-xs">
//                     <span className="text-ink-500">Previous Balance:</span>
//                     <span className={`font-mono font-semibold ${previousBalance > 0 ? "text-paprika-600" : "text-ink-700"}`}>
//                       {fmt(previousBalance)}
//                     </span>
//                   </div>
//                   <div className="flex justify-between items-center text-xs">
//                     <span className="text-ink-500">New Purchase:</span>
//                     <span className="font-mono font-semibold text-ink-700">+{fmt(newPurchase)}</span>
//                   </div>
//                   <div className="flex justify-between items-center text-xs pt-1 border-t border-canvas-200">
//                     <span className="font-semibold text-ink-900">Total After Sale:</span>
//                     <span className={`font-mono font-bold text-sm ${totalAfterSale > 0 ? "text-paprika-600" : "text-ink-900"}`}>
//                       {fmt(totalAfterSale)}
//                     </span>
//                   </div>
//                   <div className="pt-1">
//                     <label className="text-[10px] font-medium text-ink-500">Amount Paying Now (Rs)</label>
//                     <input
//                       type="number"
//                       min={0}
//                       max={totalAfterSale}
//                       value={amountPayingNow}
//                       onChange={(e) => setAmountPayingNow(e.target.value)}
//                       placeholder="Enter amount"
//                       className={`mt-1 w-full text-xs border rounded-lg px-3 py-1.5 outline-none focus:ring-2 ${
//                         parsedAmountPayingNow !== null && !amountPayingNowValid
//                           ? "border-paprika-400 focus:ring-paprika-500/30"
//                           : "border-canvas-200 focus:ring-paprika-500/30"
//                       }`}
//                     />
//                     {parsedAmountPayingNow !== null && !amountPayingNowValid && (
//                       <p className="flex items-center gap-1 text-[10px] text-paprika-600 mt-1">
//                         <AlertCircle size={10} /> Enter an amount between {fmt(0)} and {fmt(totalAfterSale)}
//                       </p>
//                     )}
//                     {amountPayingNowValid && amountPayingNow !== "" && Number(amountPayingNow) < totalAfterSale && (
//                       <p className="text-[10px] text-saffron-600 mt-1">
//                         {fmt(totalAfterSale - Number(amountPayingNow))} will be added to credit balance
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>
//           {orderType === "Dine-In" && (
//             <div className="relative">
//               <Users size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
//               <select
//                 value={selectedWaiterId}
//                 onChange={(e) => setSelectedWaiterId(e.target.value)}
//                 aria-label="Assign waiter"
//                 className="w-full text-xs border border-canvas-200 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-paprika-500/30 appearance-none bg-white"
//               >
//                 <option value="">Assign waiter…</option>
//                 {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
//               </select>
//             </div>
//           )}
//           <div className="relative">
//             <StickyNote size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
//             <input
//               type="text"
//               value={orderNote}
//               onChange={(e) => setOrderNote(e.target.value)}
//               placeholder="Order note (e.g. rush order, allergy)…"
//               aria-label="Order note"
//               className="w-full text-xs border border-canvas-200 rounded-lg pl-7 pr-2 py-1.5 outline-none focus:ring-2 focus:ring-paprika-500/30"
//             />
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px] max-h-[40vh] xl:max-h-none">
//           {cart.length === 0 && (
//             <div className="h-full flex flex-col items-center justify-center text-center py-10 text-ink-500">
//               <div className="h-10 w-10 rounded-full bg-canvas-100 flex items-center justify-center mb-2">
//                 <Plus size={16} className="text-ink-400" />
//               </div>
//               <p className="text-sm font-medium">Cart is empty</p>
//               <p className="text-xs mt-1">Tap a menu item to add it</p>
//             </div>
//           )}
//           {cart.map((item) => (
//             <div key={item.id} className="bg-canvas-50 rounded-xl p-3 border border-canvas-200">
//               {/* Item row */}
//               <div className="flex items-start gap-3">
//                 {/* Thumbnail */}
//                 <div className="h-11 w-11 rounded-lg bg-white border border-canvas-200 flex items-center justify-center text-xl shrink-0 overflow-hidden shadow-soft">
//                   {(item.image || item.img) && (item.image || item.img).startsWith?.("data:")
//                     ? <img src={item.image || item.img} className="h-full w-full object-cover" alt="" />
//                     : <span>{item.image || item.img || "🍽️"}</span>
//                   }
//                 </div>
//                 {/* Name + controls */}
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center justify-between gap-2">
//                     <p className="text-sm font-semibold text-ink-900 truncate">{item.name}</p>
//                     <button
//                       onClick={() => removeItem(item.id)}
//                       aria-label={`Remove ${item.name}`}
//                       className="text-ink-400 hover:text-paprika-600 shrink-0 transition-colors"
//                     >
//                       <Trash2 size={13} />
//                     </button>
//                   </div>
//                   <div className="flex items-center justify-between mt-1.5">
//                     <div className="flex items-center gap-1.5 bg-white border border-canvas-200 rounded-lg px-1.5 py-1 shadow-soft">
//                       <button
//                         onClick={() => updateQty(item.id, -1)}
//                         aria-label={`Decrease ${item.name} quantity`}
//                         className="h-6 w-6 flex items-center justify-center text-ink-600 hover:text-paprika-600 transition-colors"
//                       >
//                         <Minus size={12} />
//                       </button>
//                       <span className="text-xs font-mono font-bold w-5 text-center text-ink-900">{item.qty}</span>
//                       <button
//                         onClick={() => updateQty(item.id, 1)}
//                         aria-label={`Increase ${item.name} quantity`}
//                         className="h-6 w-6 flex items-center justify-center text-ink-600 hover:text-paprika-600 transition-colors"
//                       >
//                         <Plus size={12} />
//                       </button>
//                     </div>
//                     <span className="font-mono text-sm font-semibold text-ink-800">{fmt(item.price * item.qty)}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Special Instructions section */}
//               <div className="mt-2.5">
//                 {/* Quick-tap chips */}
//                 <div className="flex flex-wrap gap-1 mb-1.5">
//                   {QUICK_NOTES.map((chip) => {
//                     const baseChip = chip.replace(" 🌶️", "");
//                     const active = (item.note || "").split(", ").includes(baseChip);
//                     return (
//                       <button
//                         key={chip}
//                         type="button"
//                         onClick={() => {
//                           const cur = item.note || "";
//                           const parts = cur.split(", ").filter(Boolean);
//                           const idx = parts.indexOf(baseChip);
//                           if (idx >= 0) parts.splice(idx, 1); else parts.push(baseChip);
//                           setItemNote(item.id, parts.join(", "));
//                         }}
//                         aria-pressed={active}
//                         className={`text-[10px] font-medium px-2 py-0.5 rounded-full border transition-all ${
//                           active
//                             ? "bg-paprika-500 text-white border-paprika-500"
//                             : "bg-white text-ink-600 border-canvas-200 hover:border-paprika-300 hover:text-paprika-600"
//                         }`}
//                       >
//                         {chip}
//                       </button>
//                     );
//                   })}
//                 </div>
//                 {/* Free-text instructions input */}
//                 <input
//                   type="text"
//                   value={item.note || ""}
//                   onChange={(e) => setItemNote(item.id, e.target.value)}
//                   placeholder="Special instructions (e.g. no onions, extra spicy)…"
//                   aria-label={`Special instructions for ${item.name}`}
//                   className={`w-full text-xs px-2.5 py-1.5 rounded-lg border outline-none transition-all focus:ring-2 focus:ring-paprika-500/30 ${
//                     item.note ? "border-paprika-300 bg-paprika-50 text-paprika-800 placeholder:text-paprika-400" : "border-canvas-200 bg-white text-ink-700"
//                   }`}
//                 />
//               </div>
//             </div>
//           ))}
//         </div>

//         <div className="p-4 border-t border-canvas-200 space-y-2">
//           <div className="flex gap-2">
//             <Button
//               variant="secondary" size="sm" icon={placingAction === "hold" ? Loader2 : Pause} className="flex-1"
//               disabled={!canSubmitOrder || !!placingAction} onClick={holdOrder}
//               title="Park this order to resume later"
//             >
//               Hold
//             </Button>
//             <Button
//               variant="secondary" size="sm" icon={placingAction === "kot" ? Loader2 : ChefHat} className="flex-1"
//               disabled={!canSubmitOrder || !!placingAction} onClick={sendKOT}
//               title="Send order to kitchen without payment"
//             >
//               KOT
//             </Button>
//             <Button
//               variant="secondary" size="sm" icon={Percent} className="flex-1 relative" onClick={() => setDiscountOpen(true)}
//               title="Apply a discount to this order"
//             >
//               Discount
//               {discount > 0 && (
//                 <span className="absolute -top-1.5 -right-1.5 h-4 min-w-4 px-1 rounded-full bg-basil-500 text-white text-[9px] font-bold flex items-center justify-center">
//                   {discount}%
//                 </span>
//               )}
//             </Button>
//           </div>
//           <div className="space-y-1 pt-2">
//             <div className="flex justify-between text-xs text-ink-500">
//               <span>Subtotal · {cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span>
//               <span className="font-mono">{fmt(subtotal)}</span>
//             </div>
//             {discount > 0 && (
//               <div className="flex justify-between text-xs text-basil-600">
//                 <span>Discount ({discount}% · {discountReason})</span>
//                 <span className="font-mono">- {fmt(discountAmount)}</span>
//               </div>
//             )}
//             {taxRate > 0 && (
//               <div className="flex justify-between text-xs text-ink-500">
//                 <span>Tax ({taxRate}%)</span>
//                 <span className="font-mono">{fmt(tax)}</span>
//               </div>
//             )}
//             {serviceCharge > 0 && (
//               <div className="flex justify-between text-xs text-ink-500">
//                 <span>Service charge ({serviceRate}%)</span>
//                 <span className="font-mono">{fmt(serviceCharge)}</span>
//               </div>
//             )}
//             <div className="flex justify-between text-base font-semibold text-ink-900 pt-1 border-t border-canvas-100 mt-1">
//               <span>Total</span>
//               <span className="font-mono">{fmt(total)}</span>
//             </div>
//           </div>
//           <Button
//             variant="primary"
//             size="lg"
//             className="w-full mt-1"
//             disabled={!canSubmitOrder}
//             onClick={() => { setPayMethod("Cash"); setTendered(""); setSplitMode(false); setSplitAmount1(0); setPayOpen(true); }}
//           >
//             {cart.length === 0 ? "Add items to charge" : `Charge ${fmt(total)}`}
//           </Button>
//         </div>
//       </div>

//       {/* DISCOUNT MODAL */}
//       <Modal open={discountOpen} onClose={() => setDiscountOpen(false)} title="Apply Discount"
//         footer={
//           <>
//             <Button variant="secondary" onClick={() => setDiscountOpen(false)}>Cancel</Button>
//             <Button variant="primary" onClick={() => setDiscountOpen(false)}>Apply</Button>
//           </>
//         }
//       >
//         <div className="grid grid-cols-5 gap-2 mb-4">
//           {[0, 5, 10, 15, 20].map((d) => (
//             <button
//               key={d}
//               onClick={() => setDiscount(d)}
//               className={`py-2 rounded-lg text-sm font-medium border transition-colors ${
//                 discount === d ? "bg-paprika-500 text-white border-paprika-500" : "border-canvas-200 hover:bg-canvas-100"
//               }`}
//             >
//               {d === 0 ? "None" : `${d}%`}
//             </button>
//           ))}
//         </div>
//         <label className="text-xs font-medium text-ink-600">Custom percentage</label>
//         <input
//           type="number"
//           min={0}
//           max={100}
//           value={discount}
//           onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
//           className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
//         />
//         {discount > 0 && (
//           <p className="text-xs text-ink-500 mt-1.5">
//             Discount amount: <span className="font-mono font-semibold text-basil-600">{fmt((subtotal * discount) / 100)}</span>
//           </p>
//         )}
//         <label className="text-xs font-medium text-ink-600 mt-3 block">Reason</label>
//         <select
//           value={discountReason}
//           onChange={(e) => setDiscountReason(e.target.value)}
//           disabled={discount === 0}
//           className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none disabled:opacity-50 disabled:bg-canvas-50"
//         >
//           {DISCOUNT_REASONS.map((r) => <option key={r}>{r}</option>)}
//         </select>
//       </Modal>

//       {/* PAYMENT MODAL */}
//       <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Checkout"
//         footer={
//           <>
//             <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
//             <Button variant="primary" onClick={confirmPayment} disabled={paymentConfirmDisabled}>
//               <Check size={15} className="mr-1 inline" /> Confirm & Print Receipt
//             </Button>
//           </>
//         }
//       >
//         <div className="grid grid-cols-4 gap-2 mb-3">
//           {PAYMENT_METHODS.map((m) => (
//             <button
//               key={m.key}
//               onClick={() => setPayMethod(m.key)}
//               aria-pressed={payMethod === m.key}
//               className={`flex flex-col items-center gap-1 py-3 rounded-lg border text-xs font-medium transition-colors ${
//                 payMethod === m.key ? "border-paprika-500 text-paprika-600 bg-paprika-50" : "border-canvas-200 hover:bg-canvas-100"
//               }`}
//             >
//               <m.icon size={16} /> {m.key}
//             </button>
//           ))}
//         </div>

//         <button
//           onClick={() => { setSplitMode((s) => !s); setSplitAmount1(0); }}
//           className={`w-full flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-lg border mb-3 transition-colors ${
//             splitMode ? "border-slateblue-500 text-slateblue-500 bg-slateblue-500/5" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
//           }`}
//         >
//           <Split size={13} /> {splitMode ? "Cancel split payment" : "Split payment across two methods"}
//         </button>

//         {splitMode ? (
//           <div className="space-y-2 mb-3">
//             <div className="flex items-center gap-2">
//               <span className="text-xs w-20 text-ink-600 shrink-0">{payMethod}</span>
//               <input
//                 type="number"
//                 value={splitAmount1}
//                 onChange={(e) => setSplitAmount1(e.target.value)}
//                 className="flex-1 border border-canvas-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
//                 placeholder="Amount"
//               />
//             </div>
//             <div className="flex items-center gap-2">
//               <select
//                 value={splitMethod2}
//                 onChange={(e) => setSplitMethod2(e.target.value)}
//                 className="text-xs w-20 shrink-0 border border-canvas-200 rounded-lg py-1.5 outline-none"
//               >
//                 {PAYMENT_METHODS.filter((m) => m.key !== payMethod).map((m) => <option key={m.key} value={m.key}>{m.key}</option>)}
//               </select>
//               <div className="flex-1 border border-canvas-200 rounded-lg px-3 py-1.5 text-sm bg-canvas-100 text-ink-600 font-mono">
//                 {fmt(Math.max(0, splitRemainder))}
//               </div>
//             </div>
//             {!splitValid && (
//               <p className="flex items-center gap-1 text-[11px] text-paprika-600">
//                 <AlertCircle size={11} /> Enter a first-method amount greater than {fmt(0)} and less than {fmt(total)}
//               </p>
//             )}
//           </div>
//         ) : (
//           payMethod === "Cash" && (
//             <>
//               <label className="text-xs font-medium text-ink-600">Cash tendered</label>
//               <input
//                 type="number"
//                 value={tendered}
//                 onChange={(e) => setTendered(e.target.value)}
//                 placeholder={`${fmt(total)}`}
//                 className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
//               />
//               {cashSuggestions.length > 0 && (
//                 <div className="flex flex-wrap gap-1.5 mt-2">
//                   {cashSuggestions.map((amt) => (
//                     <button
//                       key={amt}
//                       onClick={() => setTendered(String(amt))}
//                       className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border transition-colors ${
//                         Number(tendered) === amt
//                           ? "bg-paprika-500 text-white border-paprika-500"
//                           : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
//                       }`}
//                     >
//                       {amt === total ? `Exact ${fmt(amt)}` : fmt(amt)}
//                     </button>
//                   ))}
//                 </div>
//               )}
//               {tendered !== "" && Number(tendered) >= total && (
//                 <div className="flex justify-between text-sm mt-2 text-basil-600">
//                   <span>Change due</span>
//                   <span className="font-mono font-semibold">{fmt(changeDue)}</span>
//                 </div>
//               )}
//               {tendered !== "" && Number(tendered) < total && (
//                 <p className="flex items-center gap-1 text-xs text-paprika-600 mt-1.5">
//                   <AlertCircle size={11} /> Tendered amount is less than the total due
//                 </p>
//               )}
//             </>
//           )
//         )}

//         <div className="flex justify-between text-sm mt-4 pt-3 border-t border-canvas-200">
//           <span className="text-ink-500">Total due</span>
//           <span className="font-mono font-semibold">{fmt(total)}</span>
//         </div>
//       </Modal>

//       {/* VISUAL TABLE SELECTOR MODAL */}
//       <Modal
//         open={tableModalOpen}
//         onClose={() => setTableModalOpen(false)}
//         title="Select a Table"
//         width="max-w-2xl"
//       >
//         <div className="space-y-5">
//           <div className="flex items-center gap-3 text-[10px] text-ink-500 -mt-1">
//             <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-basil-500" /> Available</span>
//             <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-paprika-500" /> Occupied</span>
//             <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-saffron-500" /> Reserved</span>
//           </div>
//           {[...new Set(allTables.map((t) => t.section))].map((section) => (
//             <div key={section}>
//               <p className="text-xs font-semibold text-ink-500 uppercase tracking-wider mb-2">{section}</p>
//               <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
//                 {allTables.filter((t) => t.section === section).map((t) => {
//                   const isAvailable = t.status === "available";
//                   const isSelected = tableId === t.id;
//                   return (
//                     <button
//                       key={t.id}
//                       disabled={!isAvailable}
//                       onClick={() => { setTableId(t.id); setTableModalOpen(false); }}
//                       title={isAvailable ? `Seat ${t.seats} · Table ${t.id}` : `Table ${t.id} is ${t.status}`}
//                       className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
//                         isSelected
//                           ? "border-basil-500 bg-basil-500/10 shadow-md"
//                           : isAvailable
//                           ? "border-canvas-200 hover:border-basil-400 hover:bg-basil-50 hover:shadow-sm cursor-pointer"
//                           : "border-canvas-100 bg-canvas-50 opacity-50 cursor-not-allowed"
//                       }`}
//                     >
//                       {isSelected && (
//                         <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-basil-500 flex items-center justify-center">
//                           <Check size={10} className="text-white" strokeWidth={3} />
//                         </span>
//                       )}
//                       <span className="font-mono font-bold text-sm text-ink-900">{t.id}</span>
//                       <span className="flex items-center gap-0.5 text-[10px] text-ink-500">
//                         <Users size={9} />{t.seats}
//                       </span>
//                       <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full ${
//                         t.status === "available" ? "text-basil-600 bg-basil-100"
//                         : t.status === "occupied" ? "text-paprika-600 bg-paprika-100"
//                         : t.status === "reserved" ? "text-saffron-600 bg-saffron-100"
//                         : "text-ink-500 bg-canvas-100"
//                       }`}>{t.status}</span>
//                     </button>
//                   );
//                 })}
//               </div>
//             </div>
//           ))}
//           {allTables.length === 0 && (
//             <p className="text-center text-sm text-ink-400 py-8">No tables have been set up yet.</p>
//           )}
//           {tableId && (
//             <div className="flex justify-end pt-2 border-t border-canvas-100">
//               <button
//                 onClick={() => { setTableId(""); setTableModalOpen(false); }}
//                 className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-paprika-600 transition-colors"
//               >
//                 <X size={12} /> Clear selection
//               </button>
//             </div>
//           )}
//         </div>
//       </Modal>

//       {receiptData && (
//         <Receipt
//           order={receiptData.order}
//           items={receiptData.items}
//           profile={profile}
//           onClose={() => setReceiptData(null)}
//         />
//       )}
//     </div>
//   );
// }

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Plus, Minus, Trash2, Pause, Percent, PauseCircle, UserRound, Banknote,
  CreditCard, Wallet, Split, ChefHat, LayoutGrid, Users, X, Mail, Phone,
  StickyNote, AlertCircle, RotateCcw, Loader2, Check, Zap,
} from "lucide-react";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Receipt from "../components/pos/Receipt";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const DISCOUNT_REASONS = ["Loyal customer", "Complaint resolution", "Staff meal", "Manager promotion", "Other"];
const PAYMENT_METHODS = [
  { key: "Cash", icon: Banknote },
  { key: "Card", icon: CreditCard },
  { key: "Wallet", icon: Wallet },
  { key: "Credit", icon: UserRound },
];
const QUICK_NOTES = ["Extra Spicy 🌶️", "Less Spicy", "No Onions", "No Garlic", "Less Salt", "Extra Sauce"];
const CASH_ROUND_STEPS = [50, 100, 500, 1000, 5000];
const ORDER_TYPES = [
  { key: "Dine-In", icon: LayoutGrid },
  { key: "Takeaway", icon: Wallet },
  { key: "Delivery", icon: Split },
  { key: "Phone", icon: Phone },
];

// Single source of truth for currency formatting — "Rs. 1,450" everywhere,
// matching the reference design's price typography.
const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

function nextOrderId() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

export default function POS() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("Dine-In");
  const [tableId, setTableId] = useState("");
  const [allTables, setAllTables] = useState([]);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [customerName, setCustomerName] = useState("Walk-in");
  const [orderNote, setOrderNote] = useState("");
  const [payOpen, setPayOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountReason, setDiscountReason] = useState(DISCOUNT_REASONS[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orderId, setOrderId] = useState(nextOrderId());
  const [heldOrders, setHeldOrders] = useState([]);
  const [heldPanelOpen, setHeldPanelOpen] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [placingAction, setPlacingAction] = useState(null); // "hold" | "kot" | null — prevents double submits

  // People state
  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState("");

  // Customer search dropdown state
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [amountPayingNow, setAmountPayingNow] = useState("");
  const customerSearchRef = useRef(null);
  const searchInputRef = useRef(null);

  // Payment modal state
  const [payMethod, setPayMethod] = useState("Cash");
  const [splitMode, setSplitMode] = useState(false);
  const [splitAmount1, setSplitAmount1] = useState(0);
  const [splitMethod2, setSplitMethod2] = useState("Card");
  const [tendered, setTendered] = useState("");
  const [receiptData, setReceiptData] = useState(null); // { order, items }

  const refreshTables = useCallback(() => {
    api.list("tables_floor").then((rows) => {
      setAllTables(rows);
      setAvailableTables(rows.filter((t) => t.status === "available"));
    });
  }, []);

  const refreshHeld = useCallback(() => {
    api.list("orders", { where: { status: "held" } }).then(setHeldOrders);
  }, []);

  useEffect(() => {
    setMenuLoading(true);
    api.list("menu_items").then((rows) => {
      setMenuItems(rows);
      setMenuLoading(false);
    });
    api.list("categories").then((rows) => setCategories(rows.map((c) => c.name)));
    refreshTables();
    refreshHeld();
    api.getSetting("restaurant_profile").then(setProfile);
    api.list("customers").then(setCustomers);
    api.list("employees", { where: { role: "Waiter" } }).then(setWaiters);
  }, [refreshTables, refreshHeld]);

  const filtered = useMemo(() => {
    return menuItems.filter(
      (m) =>
        (activeCategory === "All" || m.category === activeCategory) &&
        m.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [activeCategory, query, menuItems]);

  // How many of each menu item are currently in the cart, so the grid can
  // show a live "N IN CART" badge instead of forcing a check of the cart panel.
  const cartQtyById = useMemo(() => {
    const map = {};
    cart.forEach((c) => { map[c.id] = c.qty; });
    return map;
  }, [cart]);

  const cartItemCount = cart.reduce((s, c) => s + c.qty, 0);

  const addToCart = (item) => {
    if (item.status === "out_of_stock") return;
    setCart((prev) => {
      const existing = prev.find((c) => c.id === item.id);
      if (existing) return prev.map((c) => (c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { ...item, qty: 1, note: "" }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c)).filter((c) => c.qty > 0));
  };

  const removeItem = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const setItemNote = (id, note) => setCart((prev) => prev.map((c) => (c.id === id ? { ...c, note } : c)));

  const resetOrder = () => {
    setCart([]);
    setDiscount(0);
    setDiscountReason(DISCOUNT_REASONS[0]);
    setCustomerName("Walk-in");
    setSelectedCustomer(null);
    setSelectedWaiterId("");
    setCustomerSearch("");
    setAmountPayingNow("");
    setOrderNote("");
    setOrderId(nextOrderId());
    setTableId("");
    setTendered("");
    setSplitMode(false);
    setSplitAmount1(0);
    refreshTables();
  };

  const clearOrder = () => {
    if (cart.length === 0) return;
    if (window.confirm("Clear this order? Items in the cart will be removed.")) {
      resetOrder();
    }
  };

  const taxRate = profile?.taxRate ?? 0;
  const serviceRate = orderType === "Dine-In" ? (profile?.serviceCharge ?? 0) : 0;

  const subtotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const discountAmount = Math.round((subtotal * discount) / 100);
  const taxable = subtotal - discountAmount;
  const tax = Math.round((taxable * taxRate) / 100);
  const serviceCharge = Math.round((taxable * serviceRate) / 100);
  const total = taxable + tax + serviceCharge;
  const changeDue = tendered !== "" ? Math.max(0, Number(tendered) - total) : 0;
  const splitAmt1Num = Number(splitAmount1) || 0;
  const splitRemainder = total - splitAmt1Num;
  const splitValid = !splitMode || (splitAmt1Num > 0 && splitAmt1Num < total);

  // Table assignment is a convenience, not a requirement — some venues run
  // counter service, or seat the guest after the order is already placed.
  const canSubmitOrder = cart.length > 0;

  // Quick cash-tendered suggestions: the exact total, plus the next round
  // note value above it, so cashiers rarely have to type an amount by hand.
  const cashSuggestions = useMemo(() => {
    if (total <= 0) return [];
    const rounded = CASH_ROUND_STEPS.map((step) => Math.ceil(total / step) * step);
    return [...new Set([total, ...rounded])].sort((a, b) => a - b).slice(0, 4);
  }, [total]);

  const buildOrderPayload = (status, kitchenStatus = "new") => ({
    id: orderId,
    type: orderType,
    table_id: orderType === "Dine-In" ? tableId || null : null,
    customer: selectedCustomer?.name || customerName || "Walk-in",
    customer_id: selectedCustomer?.id || null,
    items_count: cart.reduce((s, c) => s + c.qty, 0),
    total,
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

  // Build items array including image so kitchen can display it
  const buildItemsPayload = () =>
    cart.map((c) => ({ menu_item_id: c.id, name: c.name, qty: c.qty, price: c.price, notes: c.note || "", image: c.image || c.img || "" }));

  const holdOrder = async () => {
    if (!canSubmitOrder || placingAction) return;
    setPlacingAction("hold");
    try {
      const order = buildOrderPayload("held", "new");
      await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: `Held order ${order.id}` });
      resetOrder();
      refreshHeld();
    } finally {
      setPlacingAction(null);
    }
  };

  const sendKOT = async () => {
    if (!canSubmitOrder || placingAction) return;
    setPlacingAction("kot");
    try {
      const order = buildOrderPayload("new", "new");
      await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: `KOT sent for order ${order.id}` });
      resetOrder();
      refreshHeld();
    } finally {
      setPlacingAction(null);
    }
  };

  const resumeOrder = async (held) => {
    const items = await api.list("order_items", { where: { order_id: held.id } });
    setOrderId(held.id);
    setOrderType(held.type);
    setTableId(held.table_id || "");
    setCustomerName(held.customer || "Walk-in");
    setOrderNote(held.order_note || "");
    setDiscount(held.discount_percent || 0);
    setDiscountReason(held.discount_reason || DISCOUNT_REASONS[0]);
    setCart(items.map((it) => ({
      id: it.menu_item_id, name: it.name, price: it.price, qty: it.qty, note: it.notes || "",
      img: menuItems.find((m) => m.id === it.menu_item_id)?.image || "🍽️",
      category: menuItems.find((m) => m.id === it.menu_item_id)?.category || "",
      status: "available",
    })));
    setHeldPanelOpen(false);
  };

  // Derived customer account values
  const previousBalance = selectedCustomer ? (selectedCustomer.credit || 0) : 0;
  const newPurchase = total;
  const totalAfterSale = previousBalance + newPurchase;
  const parsedAmountPayingNow = amountPayingNow !== "" ? Number(amountPayingNow) : null;
  const amountPayingNowValid =
    parsedAmountPayingNow === null || (parsedAmountPayingNow >= 0 && parsedAmountPayingNow <= totalAfterSale);

  const paymentConfirmDisabled =
    !canSubmitOrder ||
    (payMethod === "Cash" && !splitMode && tendered !== "" && Number(tendered) < total) ||
    (splitMode && !splitValid) ||
    (!!selectedCustomer && !amountPayingNowValid);

  const confirmPayment = async () => {
    if (paymentConfirmDisabled) return;
    const paymentDetails = splitMode
      ? JSON.stringify([{ method: payMethod, amount: splitAmt1Num }, { method: splitMethod2, amount: Math.max(0, splitRemainder) }])
      : null;
    // If customer is selected and paying via credit/partial, use amountPayingNow
    const effectiveTendered = selectedCustomer && parsedAmountPayingNow !== null
      ? parsedAmountPayingNow
      : (payMethod === "Cash" && !splitMode && tendered !== "" ? Number(tendered) : total);
    const effectiveChange = selectedCustomer && parsedAmountPayingNow !== null
      ? 0
      : (payMethod === "Cash" && !splitMode ? changeDue : 0);
    const order = {
      ...buildOrderPayload("paid", "new"),
      payment_method: splitMode ? `${payMethod} + ${splitMethod2}` : payMethod,
      payment_details: paymentDetails,
      tendered: effectiveTendered,
      change_due: effectiveChange,
    };
    const items = buildItemsPayload();
    const saved = await api.createOrderWithItems(order, items, { user: user?.name, action: `Checked out order ${order.id}` });
    setPayOpen(false);
    setReceiptData({ order: saved, items });
    resetOrder();
    refreshHeld();
  };

  return (
    <div className="relative grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 h-full">
      {/* MENU PANEL */}
      <div className="min-w-0">
        {/* BRAND ROW + HELD ORDERS PILL */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap size={26} className="text-paprika-500" fill="currentColor" />
            <span className="text-2xl font-bold tracking-tight text-paprika-600">Counter</span>
          </div>
          {heldOrders.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setHeldPanelOpen((o) => !o)}
                className="flex items-center gap-1.5 bg-slateblue-500/10 text-slateblue-600 px-4 py-2 rounded-full border border-slateblue-500/20 hover:bg-slateblue-500/15 transition-colors"
              >
                <PauseCircle size={16} />
                <span className="font-bold text-xs">{heldOrders.length} Held Order{heldOrders.length === 1 ? "" : "s"}</span>
              </button>
              {heldPanelOpen && (
                <div className="absolute z-20 right-0 top-full mt-2 w-64 bg-white border border-canvas-200 rounded-xl shadow-card p-2 max-h-64 overflow-y-auto">
                  {heldOrders.map((h) => (
                    <button
                      key={h.id}
                      onClick={() => resumeOrder(h)}
                      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-left hover:bg-canvas-50 transition-colors"
                    >
                      <span className="text-xs font-bold text-ink-900">{h.id}</span>
                      <span className="text-xs font-mono text-ink-500">{fmt(h.total)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu or scan barcode…"
              aria-label="Search menu items"
              className="w-full bg-white border border-canvas-200 rounded-xl pl-11 pr-9 py-3 text-sm shadow-soft outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
            />
            {query && (
              <button
                onClick={() => { setQuery(""); searchInputRef.current?.focus(); }}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-1">
          {["All", ...categories].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              aria-pressed={activeCategory === cat}
              className={`shrink-0 px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "bg-paprika-500 text-white shadow-md shadow-paprika-500/20"
                  : "bg-canvas-200 text-ink-900 hover:bg-canvas-300"
              }`}
            >
              {cat === "All" ? "All Items" : cat}
            </button>
          ))}
        </div>

        {menuLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-canvas-200 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-square w-full bg-canvas-100" />
                <div className="p-3">
                  <div className="h-2.5 w-3/4 rounded bg-canvas-100 mb-1.5" />
                  <div className="h-2.5 w-1/3 rounded bg-canvas-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-3">
            {filtered.map((item) => {
              const inCartQty = cartQtyById[item.id] || 0;
              const outOfStock = item.status === "out_of_stock";
              const hasPhoto = item.image && item.image.startsWith("data:");
              return (
                <button
                  key={item.id}
                  onClick={() => addToCart(item)}
                  disabled={outOfStock}
                  aria-label={`Add ${item.name}, ${fmt(item.price)}`}
                  className="group relative text-left bg-white rounded-xl overflow-hidden shadow-soft border border-canvas-200 hover:shadow-card hover:-translate-y-1 transition-all disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                >
                  {/* Square photo, cropped to fill — matches the reference card */}
                  <div className="aspect-square w-full relative bg-canvas-100 overflow-hidden">
                    {hasPhoto ? (
                      <img src={item.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-4xl">{item.image || "🍽️"}</span>
                    )}
                    {!outOfStock && (
                      <div className="absolute inset-0 bg-paprika-500/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="bg-paprika-500 text-white p-2.5 rounded-full shadow-xl scale-75 group-hover:scale-100 transition-transform">
                          <Plus size={20} />
                        </span>
                      </div>
                    )}
                    {inCartQty > 0 && (
                      <span className="absolute top-2 right-2 bg-paprika-500 text-white text-[10px] font-extrabold px-2 py-1 rounded shadow-lg ring-2 ring-white">
                        {inCartQty} IN CART
                      </span>
                    )}
                    {outOfStock && (
                      <div className="absolute inset-0 bg-ink-900/55 flex items-center justify-center">
                        <span className="text-[10px] font-bold tracking-wide text-white uppercase px-2 py-1 rounded-full bg-ink-900/70">
                          Out of stock
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-ink-900 truncate">{item.name}</h3>
                    <p className="font-mono text-sm font-semibold text-paprika-600 mt-0.5">{fmt(item.price)}</p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-1 text-center py-16 text-ink-500 text-sm">
                <Search size={20} className="text-ink-300 mb-1" />
                <p>No menu items match "{query || activeCategory}"</p>
                {query && (
                  <button onClick={() => setQuery("")} className="text-xs font-medium text-paprika-600 hover:underline mt-1">
                    Clear search
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* CART PANEL — Desktop sidebar (md+) */}
     {/* CART PANEL — Fully Responsive Desktop/POS Sidebar */}
<div className="hidden md:flex flex-col w-full bg-white border border-canvas-200 rounded-2xl shadow-card overflow-hidden h-[calc(100vh-6rem)] max-h-[900px] min-h-[580px] md:sticky md:top-20">
  
  {/* 1. TOP HEADER & CUSTOMER / TABLE SELECTORS */}
  <div className="p-3.5 sm:p-4 border-b border-canvas-200 bg-canvas-50/50 space-y-2.5 shrink-0">
    <div className="grid grid-cols-4 gap-1.5">
      {ORDER_TYPES.map(({ key: t }) => (
        <button
          key={t}
          onClick={() => setOrderType(t)}
          aria-pressed={orderType === t}
          className={`py-2 rounded-lg text-[11px] font-bold transition-all ${
            orderType === t
              ? "bg-paprika-500 text-white shadow-md shadow-paprika-500/20"
              : "bg-canvas-200 text-ink-900 hover:bg-canvas-300"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    <div className="flex gap-2">
      {orderType === "Dine-In" ? (
        <button
          onClick={() => setTableModalOpen(true)}
          className={`flex-[1.5] min-w-0 flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border transition-colors ${
            tableId
              ? "border-basil-500 bg-basil-500/10 text-basil-700"
              : "border-canvas-200 bg-canvas-50 text-ink-500 hover:bg-canvas-100"
          }`}
        >
          <LayoutGrid size={15} />
          <span className="truncate">{tableId ? `Table ${tableId}` : "Select table (optional)…"}</span>
        </button>
      ) : (
        <div className="flex-[1.5]" />
      )}
      <div className="flex-1 bg-canvas-50 border border-canvas-200 rounded-xl px-3 py-2 flex items-center justify-between min-w-0">
        <span className="text-[10px] font-bold text-ink-500 uppercase truncate">{orderId}</span>
        <button
          onClick={clearOrder}
          disabled={cart.length === 0}
          title="Clear cart and start over"
          aria-label="Clear cart"
          className="shrink-0 text-ink-400 hover:text-paprika-600 disabled:opacity-30 disabled:hover:text-ink-400 transition-colors"
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>

    {/* Customer Selector */}
    <div className="space-y-2">
      {selectedCustomer ? (
        /* Selected Customer Card */
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-2.5 flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-ink-900 leading-tight">{selectedCustomer.name}</p>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {selectedCustomer.phone && (
                <span className="flex items-center gap-0.5 text-[10px] text-ink-500">
                  <Phone size={9} /> {selectedCustomer.phone}
                </span>
              )}
              {selectedCustomer.email && (
                <span className="flex items-center gap-0.5 text-[10px] text-ink-500 truncate">
                  <Mail size={9} /> {selectedCustomer.email}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => { setSelectedCustomer(null); setCustomerName("Walk-in"); setCustomerSearch(""); setAmountPayingNow(""); }}
            aria-label="Remove customer"
            className="text-red-400 hover:text-red-600 transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Customer Search Dropdown */
        <div className="relative" ref={customerSearchRef}>
          <UserRound size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={customerSearch}
            onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdownOpen(true); }}
            onFocus={() => setCustomerDropdownOpen(true)}
            onBlur={() => setTimeout(() => setCustomerDropdownOpen(false), 180)}
            placeholder="Search customer name or phone…"
            aria-label="Search customers"
            className="w-full text-xs font-medium border border-canvas-200 bg-canvas-50 rounded-xl pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
          />
          {customerDropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-canvas-200 rounded-xl shadow-card max-h-44 overflow-y-auto">
              {customers
                .filter(c => {
                  const q = customerSearch.toLowerCase();
                  return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q) || c.email?.toLowerCase().includes(q);
                })
                .map(c => (
                  <button
                    key={c.id}
                    onMouseDown={() => {
                      setSelectedCustomer(c);
                      setCustomerName(c.name);
                      setCustomerSearch(c.name);
                      setCustomerDropdownOpen(false);
                      setAmountPayingNow("");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-canvas-50 border-b border-canvas-100 last:border-0 transition-colors"
                  >
                    <p className="text-xs font-semibold text-ink-900">{c.name}</p>
                    <p className="text-[10px] text-ink-400">{c.phone}{c.credit > 0 ? ` · ${fmt(c.credit)} credit` : ""}</p>
                  </button>
                ))}
              {customers.filter(c => { const q = customerSearch.toLowerCase(); return !q || c.name?.toLowerCase().includes(q) || c.phone?.includes(q); }).length === 0 && (
                <p className="px-3 py-3 text-xs text-ink-400 text-center">No customers found</p>
              )}
            </div>
          )}
        </div>
      )}

      {orderType === "Dine-In" && (
        <div className="relative">
          <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <select
            value={selectedWaiterId}
            onChange={(e) => setSelectedWaiterId(e.target.value)}
            aria-label="Assign waiter"
            className="w-full text-xs font-medium border border-canvas-200 bg-canvas-50 rounded-xl pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 appearance-none transition-all"
          >
            <option value="">Assign waiter…</option>
            {waiters.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
      )}

      <div className="relative">
        <StickyNote size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          type="text"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Order note (e.g. rush order, allergy)…"
          aria-label="Order note"
          className="w-full text-xs font-medium border border-canvas-200 bg-canvas-50 rounded-xl pl-9 pr-2 py-2 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
        />
      </div>

      {/* Customer Account / Wallet Section */}
      {selectedCustomer && (
        <div className="rounded-xl border border-canvas-200 bg-canvas-100/40 overflow-hidden">
          <div className="px-3 py-2 flex items-center justify-between border-b border-canvas-200/70">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 bg-white rounded-lg flex items-center justify-center shadow-soft shrink-0">
                <Wallet size={14} className="text-paprika-500" />
              </div>
              <div>
                <p className="text-[8px] text-ink-500 uppercase font-extrabold tracking-widest">Previous Balance</p>
                <p className={`text-xs font-mono font-bold ${previousBalance > 0 ? "text-paprika-600" : "text-ink-900"}`}>
                  {fmt(previousBalance)}
                </p>
              </div>
            </div>
          </div>
          <div className="px-3 py-1.5 space-y-1">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-ink-500">New Purchase:</span>
              <span className="font-mono font-semibold text-ink-700">+{fmt(newPurchase)}</span>
            </div>
            <div className="flex justify-between items-center text-[11px] pt-1 border-t border-dashed border-canvas-300">
              <span className="font-bold text-ink-900">Total After Sale:</span>
              <span className={`font-mono font-bold text-xs ${totalAfterSale > 0 ? "text-paprika-600" : "text-ink-900"}`}>
                {fmt(totalAfterSale)}
              </span>
            </div>
            <div className="pt-1">
              <label className="text-[9px] font-bold text-ink-500 uppercase tracking-wide">Amount Paying Now</label>
              <input
                type="number"
                min={0}
                max={totalAfterSale}
                value={amountPayingNow}
                onChange={(e) => setAmountPayingNow(e.target.value)}
                placeholder="Enter amount"
                className={`mt-0.5 w-full text-xs font-mono border rounded-lg px-2.5 py-1 outline-none focus:ring-2 focus:ring-paprika-500/20 transition-all ${
                  parsedAmountPayingNow !== null && !amountPayingNowValid ? "border-paprika-400" : "border-canvas-200"
                }`}
              />
              {parsedAmountPayingNow !== null && !amountPayingNowValid && (
                <p className="flex items-center gap-1 text-[9px] text-paprika-600 mt-0.5">
                  <AlertCircle size={9} /> Enter between {fmt(0)} and {fmt(totalAfterSale)}
                </p>
              )}
              {amountPayingNowValid && amountPayingNow !== "" && Number(amountPayingNow) < totalAfterSale && (
                <p className="text-[9px] text-saffron-600 mt-0.5">
                  {fmt(totalAfterSale - Number(amountPayingNow))} added to credit balance
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  </div>

  {/* 2. MIDDLE AREA — CART ITEMS (Flex-1 + overflow-y-auto + min-h-0) */}
  <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-2.5 min-h-0">
    {cart.length === 0 && (
      <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center py-6 text-ink-400">
        <div className="h-12 w-12 rounded-full bg-canvas-100 flex items-center justify-center mb-2">
          <Plus size={20} className="text-ink-400" />
        </div>
        <p className="font-bold text-xs uppercase tracking-widest text-ink-700">Cart is empty</p>
        <p className="text-[11px] mt-0.5 text-ink-400">Tap a menu item to add it</p>
      </div>
    )}

    {cart.map((item) => {
      const selectedChips = (item.note || "").split(", ").filter(Boolean);
      return (
        <div key={item.id} className="relative group bg-white rounded-xl p-2.5 border border-canvas-200 shadow-soft hover:border-paprika-300 transition-all">
          <button
            onClick={() => removeItem(item.id)}
            aria-label={`Remove ${item.name}`}
            className="absolute -right-2 -top-2 bg-paprika-600 text-white w-5 h-5 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:scale-110 active:scale-95"
          >
            <Trash2 size={11} />
          </button>

          <div className="flex justify-between items-start gap-2 mb-2">
            <div className="flex gap-2.5 min-w-0">
              <div className="h-11 w-11 rounded-lg bg-canvas-100 flex items-center justify-center text-lg shrink-0 overflow-hidden ring-1 ring-canvas-200 shadow-soft">
                {(item.image || item.img) && (item.image || item.img).startsWith?.("data:")
                  ? <img src={item.image || item.img} className="h-full w-full object-cover" alt="" />
                  : <span>{item.image || item.img || "🍽️"}</span>
                }
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs leading-snug text-ink-900 truncate">{item.name}</h4>
                <p className="text-paprika-600 font-mono font-bold text-xs mt-0.5">{fmt(item.price)}</p>
              </div>
            </div>

            <div className="flex items-center bg-canvas-100 rounded-lg p-0.5 border border-canvas-200 shrink-0">
              <button
                onClick={() => updateQty(item.id, -1)}
                aria-label={`Decrease ${item.name} quantity`}
                className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-soft rounded transition-all"
              >
                <Minus size={12} />
              </button>
              <span className="w-6 text-center font-mono font-bold text-xs text-ink-900">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, 1)}
                aria-label={`Increase ${item.name} quantity`}
                className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-soft rounded transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
          </div>

          {/* Active Modifiers */}
          {selectedChips.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {selectedChips.map((chip) => (
                <button
                  key={chip}
                  onClick={() => setItemNote(item.id, selectedChips.filter((c) => c !== chip).join(", "))}
                  className="flex items-center gap-1 px-1.5 py-0.5 bg-paprika-50 text-paprika-600 rounded-full text-[9px] font-bold border border-paprika-100 hover:bg-paprika-100 transition-colors"
                >
                  <span>{chip}</span>
                  <X size={10} />
                </button>
              ))}
            </div>
          )}

          {/* Quick Modifier Options */}
          <div className="grid grid-cols-3 gap-1 mb-1.5">
            {QUICK_NOTES.filter((chip) => !selectedChips.includes(chip.replace(" 🌶️", ""))).slice(0, 3).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setItemNote(item.id, [...selectedChips, chip.replace(" 🌶️", "")].join(", "))}
                className="text-[8px] font-bold py-1 border border-canvas-200 rounded-md hover:bg-paprika-50 hover:text-paprika-600 hover:border-paprika-300 transition-all uppercase truncate px-0.5"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Item Note Input */}
          <div className="relative">
            <StickyNote size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              value={item.note || ""}
              onChange={(e) => setItemNote(item.id, e.target.value)}
              placeholder="Special instructions…"
              aria-label={`Special instructions for ${item.name}`}
              className="w-full text-[10px] bg-canvas-50/50 border border-canvas-200 rounded-md pl-6 pr-2 py-1 outline-none focus:ring-1 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all placeholder:text-ink-400/70"
            />
          </div>
        </div>
      );
    })}
  </div>

  {/* 3. BOTTOM FOOTER — TOTALS & ACTIONS (shrink-0) */}
  <div className="border-t border-canvas-200 bg-canvas-50/80 p-3.5 sm:p-4 shrink-0">
    <div className="grid grid-cols-3 gap-2 mb-3">
      <button
        onClick={holdOrder}
        disabled={!canSubmitOrder || !!placingAction}
        title="Park this order to resume later"
        className="flex flex-col items-center justify-center py-2 bg-white border border-canvas-200 rounded-xl hover:shadow-sm hover:border-paprika-300 transition-all group disabled:opacity-40"
      >
        {placingAction === "hold" ? <Loader2 size={16} className="animate-spin text-paprika-500" /> : <Pause size={16} className="text-ink-600 group-hover:text-paprika-600 transition-colors" />}
        <span className="text-[9px] font-extrabold mt-0.5 uppercase tracking-wider text-ink-600 group-hover:text-paprika-600">Hold</span>
      </button>

      <button
        onClick={sendKOT}
        disabled={!canSubmitOrder || !!placingAction}
        title="Send order to kitchen without payment"
        className="flex flex-col items-center justify-center py-2 bg-white border border-canvas-200 rounded-xl hover:shadow-sm hover:border-paprika-300 transition-all group disabled:opacity-40"
      >
        {placingAction === "kot" ? <Loader2 size={16} className="animate-spin text-paprika-500" /> : <ChefHat size={16} className="text-ink-600 group-hover:text-paprika-600 transition-colors" />}
        <span className="text-[9px] font-extrabold mt-0.5 uppercase tracking-wider text-ink-600 group-hover:text-paprika-600">KOT</span>
      </button>

      <button
        onClick={() => setDiscountOpen(true)}
        title="Apply a discount to this order"
        className="relative flex flex-col items-center justify-center py-2 bg-white border border-canvas-200 rounded-xl hover:shadow-sm hover:border-paprika-300 transition-all group"
      >
        <Percent size={16} className="text-ink-600 group-hover:text-paprika-600 transition-colors" />
        <span className="text-[9px] font-extrabold mt-0.5 uppercase tracking-wider text-ink-600 group-hover:text-paprika-600">Discount</span>
        {discount > 0 && (
          <span className="absolute -top-1 -right-1 h-3.5 min-w-[14px] px-1 rounded-full bg-basil-500 text-white text-[8px] font-bold flex items-center justify-center">
            {discount}%
          </span>
        )}
      </button>
    </div>

    <div className="space-y-1.5 mb-3 px-0.5">
      <div className="flex justify-between items-center text-ink-500 text-xs">
        <span>Subtotal · {cartItemCount} item{cartItemCount === 1 ? "" : "s"}</span>
        <span className="font-mono font-bold text-ink-800">{fmt(subtotal)}</span>
      </div>
      {discount > 0 && (
        <div className="flex justify-between items-center text-basil-600 text-xs">
          <span>Discount ({discount}% · {discountReason})</span>
          <span className="font-mono font-bold">- {fmt(discountAmount)}</span>
        </div>
      )}
      {taxRate > 0 && (
        <div className="flex justify-between items-center text-ink-500 text-xs">
          <span>Tax ({taxRate}%)</span>
          <span className="font-mono font-bold">{fmt(tax)}</span>
        </div>
      )}
      {serviceCharge > 0 && (
        <div className="flex justify-between items-center text-ink-500 text-xs">
          <span>Service Charge ({serviceRate}%)</span>
          <span className="font-mono font-bold">{fmt(serviceCharge)}</span>
        </div>
      )}
      <div className="flex justify-between items-end pt-2 mt-1 border-t border-dashed border-canvas-300">
        <span className="text-base font-bold tracking-tight text-ink-900">Total</span>
        <span className="text-xl font-mono font-bold text-paprika-600 tracking-tight">{fmt(total)}</span>
      </div>
    </div>

    <button
      onClick={() => { setPayMethod("Cash"); setTendered(""); setSplitMode(false); setSplitAmount1(0); setPayOpen(true); }}
      disabled={!canSubmitOrder}
      className="w-full bg-paprika-500 text-white py-3 rounded-xl shadow-lg shadow-paprika-500/20 text-base font-bold flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:hover:brightness-100"
    >
      <Banknote size={20} />
      {cart.length === 0 ? "Add items to charge" : `Charge ${fmt(total)}`}
    </button>
  </div>
</div>

      {/* DISCOUNT MODAL */}
      <Modal open={discountOpen} onClose={() => setDiscountOpen(false)} title="Apply Discount"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDiscountOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => setDiscountOpen(false)}>Apply</Button>
          </>
        }
      >
        <div className="grid grid-cols-5 gap-2 mb-4">
          {[0, 5, 10, 15, 20].map((d) => (
            <button
              key={d}
              onClick={() => setDiscount(d)}
              className={`py-2 rounded-lg text-sm font-bold border transition-colors ${
                discount === d ? "bg-paprika-500 text-white border-paprika-500 shadow-md shadow-paprika-500/20" : "border-canvas-200 hover:bg-canvas-100"
              }`}
            >
              {d === 0 ? "None" : `${d}%`}
            </button>
          ))}
        </div>
        <label className="text-xs font-bold text-ink-600 uppercase tracking-wide">Custom percentage</label>
        <input
          type="number"
          min={0}
          max={100}
          value={discount}
          onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
          className="w-full mt-1 border border-canvas-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
        />
        {discount > 0 && (
          <p className="text-xs text-ink-500 mt-1.5">
            Discount amount: <span className="font-mono font-bold text-basil-600">{fmt((subtotal * discount) / 100)}</span>
          </p>
        )}
        <label className="text-xs font-bold text-ink-600 uppercase tracking-wide mt-4 block">Reason</label>
        <select
          value={discountReason}
          onChange={(e) => setDiscountReason(e.target.value)}
          disabled={discount === 0}
          className="w-full mt-1 border border-canvas-200 rounded-xl px-3 py-2.5 text-sm outline-none disabled:opacity-50 disabled:bg-canvas-50"
        >
          {DISCOUNT_REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </Modal>

      {/* PAYMENT MODAL */}
      <Modal open={payOpen} onClose={() => setPayOpen(false)} title="Checkout"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmPayment} disabled={paymentConfirmDisabled}>
              <Check size={15} className="mr-1 inline" /> Confirm & Print Receipt
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-4 gap-2 mb-3">
          {PAYMENT_METHODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setPayMethod(m.key)}
              aria-pressed={payMethod === m.key}
              className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-bold transition-colors ${
                payMethod === m.key ? "border-paprika-500 text-paprika-600 bg-paprika-50" : "border-canvas-200 hover:bg-canvas-100"
              }`}
            >
              <m.icon size={18} /> {m.key}
            </button>
          ))}
        </div>

        <button
          onClick={() => { setSplitMode((s) => !s); setSplitAmount1(0); }}
          className={`w-full flex items-center justify-center gap-1.5 text-xs font-bold py-2.5 rounded-xl border mb-3 transition-colors ${
            splitMode ? "border-slateblue-500 text-slateblue-500 bg-slateblue-500/5" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
          }`}
        >
          <Split size={13} /> {splitMode ? "Cancel split payment" : "Split payment across two methods"}
        </button>

        {splitMode ? (
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold w-20 text-ink-600 shrink-0">{payMethod}</span>
              <input
                type="number"
                value={splitAmount1}
                onChange={(e) => setSplitAmount1(e.target.value)}
                className="flex-1 border border-canvas-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20"
                placeholder="Amount"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={splitMethod2}
                onChange={(e) => setSplitMethod2(e.target.value)}
                className="text-xs font-bold w-20 shrink-0 border border-canvas-200 rounded-xl py-2 outline-none"
              >
                {PAYMENT_METHODS.filter((m) => m.key !== payMethod).map((m) => <option key={m.key} value={m.key}>{m.key}</option>)}
              </select>
              <div className="flex-1 border border-canvas-200 rounded-xl px-3 py-2 text-sm bg-canvas-100 text-ink-600 font-mono font-bold">
                {fmt(Math.max(0, splitRemainder))}
              </div>
            </div>
            {!splitValid && (
              <p className="flex items-center gap-1 text-[11px] text-paprika-600">
                <AlertCircle size={11} /> Enter a first-method amount greater than {fmt(0)} and less than {fmt(total)}
              </p>
            )}
          </div>
        ) : (
          payMethod === "Cash" && (
            <>
              <label className="text-xs font-bold text-ink-600 uppercase tracking-wide">Cash tendered</label>
              <input
                type="number"
                value={tendered}
                onChange={(e) => setTendered(e.target.value)}
                placeholder={`${fmt(total)}`}
                className="w-full mt-1 border border-canvas-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all"
              />
              {cashSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {cashSuggestions.map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setTendered(String(amt))}
                      className={`text-xs font-mono font-bold px-3 py-1.5 rounded-full border transition-colors ${
                        Number(tendered) === amt
                          ? "bg-paprika-500 text-white border-paprika-500"
                          : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
                      }`}
                    >
                      {amt === total ? `Exact ${fmt(amt)}` : fmt(amt)}
                    </button>
                  ))}
                </div>
              )}
              {tendered !== "" && Number(tendered) >= total && (
                <div className="flex justify-between text-sm mt-2 text-basil-600">
                  <span>Change due</span>
                  <span className="font-mono font-bold">{fmt(changeDue)}</span>
                </div>
              )}
              {tendered !== "" && Number(tendered) < total && (
                <p className="flex items-center gap-1 text-xs text-paprika-600 mt-1.5">
                  <AlertCircle size={11} /> Tendered amount is less than the total due
                </p>
              )}
            </>
          )
        )}

        <div className="flex justify-between text-sm mt-4 pt-3 border-t-2 border-dashed border-canvas-300">
          <span className="text-ink-500">Total due</span>
          <span className="font-mono font-bold">{fmt(total)}</span>
        </div>
      </Modal>

      {/* VISUAL TABLE SELECTOR MODAL */}
      <Modal
        open={tableModalOpen}
        onClose={() => setTableModalOpen(false)}
        title="Select a Table"
        width="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="flex items-center gap-3 text-[10px] text-ink-500 -mt-1">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-basil-500" /> Available</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-paprika-500" /> Occupied</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-saffron-500" /> Reserved</span>
          </div>
          {[...new Set(allTables.map((t) => t.section))].map((section) => (
            <div key={section}>
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-2">{section}</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {allTables.filter((t) => t.section === section).map((t) => {
                  const isAvailable = t.status === "available";
                  const isSelected = tableId === t.id;
                  return (
                    <button
                      key={t.id}
                      disabled={!isAvailable}
                      onClick={() => { setTableId(t.id); setTableModalOpen(false); }}
                      title={isAvailable ? `Seat ${t.seats} · Table ${t.id}` : `Table ${t.id} is ${t.status}`}
                      className={`relative rounded-xl border-2 p-3 flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? "border-basil-500 bg-basil-500/10 shadow-md"
                          : isAvailable
                          ? "border-canvas-200 hover:border-basil-400 hover:bg-basil-50 hover:shadow-sm cursor-pointer"
                          : "border-canvas-100 bg-canvas-50 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-basil-500 flex items-center justify-center">
                          <Check size={10} className="text-white" strokeWidth={3} />
                        </span>
                      )}
                      <span className="font-mono font-bold text-sm text-ink-900">{t.id}</span>
                      <span className="flex items-center gap-0.5 text-[10px] text-ink-500">
                        <Users size={9} />{t.seats}
                      </span>
                      <span className={`text-[10px] font-semibold capitalize px-1.5 py-0.5 rounded-full ${
                        t.status === "available" ? "text-basil-600 bg-basil-100"
                        : t.status === "occupied" ? "text-paprika-600 bg-paprika-100"
                        : t.status === "reserved" ? "text-saffron-600 bg-saffron-100"
                        : "text-ink-500 bg-canvas-100"
                      }`}>{t.status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {allTables.length === 0 && (
            <p className="text-center text-sm text-ink-400 py-8">No tables have been set up yet.</p>
          )}
          {tableId && (
            <div className="flex justify-end pt-2 border-t border-canvas-100">
              <button
                onClick={() => { setTableId(""); setTableModalOpen(false); }}
                className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-paprika-600 transition-colors"
              >
                <X size={12} /> Clear selection
              </button>
            </div>
          )}
        </div>
      </Modal>

      {receiptData && (
        <Receipt
          order={receiptData.order}
          items={receiptData.items}
          profile={profile}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}