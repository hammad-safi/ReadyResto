import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Search, Plus, Minus, Trash2, Pause, Percent, PauseCircle, UserRound, Banknote,
  CreditCard, Wallet, Split, ChefHat, LayoutGrid, Users, X, Mail, Phone,
  StickyNote, AlertCircle, RotateCcw, Loader2, Check, Zap,
} from "lucide-react";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Receipt from "../components/pos/Receipt";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import CheckoutModal from "../components/pos/CheckoutModal";
import { printKOT } from "../utils/export";
import useStickyState from "../hooks/useStickyState";
import { playWhatsAppSound } from "../utils/soundHelper";

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

const ITEM_CARD_WIDTH = "150px";
const itemGridStyle = {
  gridTemplateColumns: `repeat(auto-fill, minmax(${ITEM_CARD_WIDTH}, ${ITEM_CARD_WIDTH}))`,
};

const fmt = (n) => `Rs. ${Math.max(0, Math.round(Number(n) || 0)).toLocaleString()}`;

function nextOrderId() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

export default function POS() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useStickyState("All", "pos_activeCategory");
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [query, setQuery] = useStickyState(searchParamVal, "pos_query");

  useEffect(() => {
    setQuery(searchParamVal);
  }, [searchParamVal]);

  const [cart, setCart] = useStickyState([], "pos_cart");
  const [orderType, setOrderType] = useStickyState("Dine-In", "pos_orderType");
  const [tableId, setTableId] = useStickyState("", "pos_tableId");
  const [allTables, setAllTables] = useState([]);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [availableTables, setAvailableTables] = useState([]);
  const [customerName, setCustomerName] = useStickyState("Walk-in", "pos_customerName");
  const [orderNote, setOrderNote] = useStickyState("", "pos_orderNote");
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
  const [currentShift, setCurrentShift] = useState(null);
  const [menuLoading, setMenuLoading] = useState(true);
  const [placingAction, setPlacingAction] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [waiters, setWaiters] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useStickyState(null, "pos_selectedCustomer");
  const [selectedWaiterId, setSelectedWaiterId] = useStickyState("", "pos_selectedWaiterId");

  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [amountPayingNow, setAmountPayingNow] = useState("");
  const customerSearchRef = useRef(null);

  const [addCustMode, setAddCustMode] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustAddress, setNewCustAddress] = useState("");
  const [newCustOpening, setNewCustOpening] = useState("");
  const [savingCust, setSavingCust] = useState(false);
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
      const uniqueCats = Array.from(new Set(rows.map(item => item.category).filter(Boolean)));
      setCategories(uniqueCats);
      setMenuLoading(false);
    });
    refreshTables();
    refreshHeld();
    api.getSetting("restaurant_profile").then(setProfile);
    api.list("customers").then(setCustomers);
    api.list("employees", { where: { role: "Waiter" } }).then(setWaiters);
    if (user?.id) {
      api.getCurrentShift(user.id).then(setCurrentShift);
    }
  }, [refreshTables, refreshHeld, user?.id]);

  useEffect(() => {
    const resumeId = localStorage.getItem("active_pos_order_id");
    if (resumeId && menuItems.length > 0) {
      api.get("orders", resumeId).then((ord) => {
        if (ord) {
          void resumeOrder(ord);
        }
        localStorage.removeItem("active_pos_order_id");
      });
    }
  }, [menuItems]);

  const filtered = useMemo(() => {
    return menuItems.filter(
      (m) =>
        (activeCategory === "All" || m.category === activeCategory) &&
        (m.name.toLowerCase().includes(query.toLowerCase()) || (m.barcode && m.barcode.toLowerCase().includes(query.toLowerCase())))
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
  const tax = Math.round(cart.reduce((sum, c) => {
    const itemTotal = c.price * c.qty;
    const itemDiscount = discount > 0 ? (itemTotal * discount) / 100 : 0;
    const itemTaxable = itemTotal - itemDiscount;
    const itemTaxRate = Number(taxRate) || 0;
    return sum + (itemTaxable * itemTaxRate / 100);
  }, 0));
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
    shift_id: currentShift?.id || null,
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

  // Build items array including historical snapshots (cost, tax, discount) for strict accounting
  const buildItemsPayload = () =>
    cart.map((c) => {
      const itemTotal = c.price * c.qty;
      const itemDiscountAmount = discount > 0 ? (itemTotal * discount) / 100 : 0;
      const itemTaxable = itemTotal - itemDiscountAmount;
      const itemTaxRate = Number(taxRate) || 0;
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
        station: c.station || "Grill",
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
    playWhatsAppSound();
    setPlacingAction("hold");
    try {
      const order = buildOrderPayload("held", "new");
      await api.createOrderWithItems(order, buildItemsPayload(), { user: user?.name, action: `Held order ${order.id}` });
      resetOrder();
      refreshHeld();
    } catch (err) {
      alert(err.message || "Failed to hold order");
    } finally {
      setPlacingAction(null);
    }
  };

  const sendKOT = async () => {
    if (!canSubmitOrder || placingAction) return;
    setPlacingAction("kot");
    try {
      const order = buildOrderPayload("new", "new");
      const items = buildItemsPayload();
      await api.createOrderWithItems(order, items, { user: user?.name, action: `KOT sent for order ${order.id}` });
      if (profile?.autoPrintKOT) {
        printKOT({ ...order, table: order.table_id, items });
      }
      resetOrder();
      refreshHeld();
    } catch (err) {
      alert(err.message || "Failed to send KOT");
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

  const confirmPayment = async ({
    paymentMethod,
    paymentDetails,
    tendered: effectiveTendered,
    changeDue: effectiveChange,
    customer: chosenCustomer,
  }) => {
    const heldOrderObj = heldOrders.find((h) => h.id === orderId);
    const paymentKitchenStatus = heldOrderObj ? (heldOrderObj.kitchen_status || "new") : "new";
    const order = {
      ...buildOrderPayload("paid", paymentKitchenStatus),
      customer: chosenCustomer ? chosenCustomer.name : (selectedCustomer ? selectedCustomer.name : customerName || "Walk-in"),
      customer_id: chosenCustomer ? chosenCustomer.id : (selectedCustomer ? selectedCustomer.id : null),
      payment_method: paymentMethod,
      payment_details: paymentDetails,
      tendered: effectiveTendered,
      change_due: effectiveChange,
    };
    const items = buildItemsPayload();
    try {
      const saved = await api.createOrderWithItems(order, items, { user: user?.name, action: `Checked out order ${order.id}` });
      setPayOpen(false);
      setReceiptData({ order: saved, items });
      resetOrder();
      refreshHeld();
    } catch (err) {
      alert(err.message || "Failed to checkout order");
    }
  };

  // Save a newly created customer from the checkout form
  const saveNewCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return;
    setSavingCust(true);
    try {
      const newC = await api.create("customers", {
        name: newCustName.trim(),
        phone: newCustPhone.trim(),
        email: newCustEmail.trim() || "",
        address: newCustAddress.trim() || "",
        credit: newCustOpening !== "" ? Number(newCustOpening) : 0,
        visits: 0, points: 0, total_billed: 0, total_paid: 0, tier: "Silver",
      });
      const freshList = await api.list("customers");
      setCustomers(freshList);
      setSelectedCustomer(newC);
      setCustomerName(newC.name);
      setCustomerSearch(newC.name);
      setAddCustMode(false);
      setNewCustName(""); setNewCustPhone(""); setNewCustEmail("");
      setNewCustAddress(""); setNewCustOpening("");
    } finally {
      setSavingCust(false);
    }
  };

  return (
    <div className="relative grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5 h-full">
      {/* MENU PANEL */}
      <div className="min-w-0">
        {!currentShift && (
          <div className="mb-4 bg-saffron-50 border border-saffron-200 text-saffron-800 px-4 py-2 rounded-xl text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            You don't have an open shift. Please open a shift in Accounting to track cash accurately.
          </div>
        )}
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

        {/*
          Fixed-size responsive grid: cards are locked at ITEM_CARD_WIDTH
          (see itemGridStyle above) and auto-fill just adds more columns
          as the container gets wider — cards themselves never stretch.
        */}
        {menuLoading ? (
          <div className="grid gap-3" style={itemGridStyle}>
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
          <div className="grid gap-3" style={itemGridStyle}>
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
                        <span className="status-badge status-danger p-2.5 rounded-full shadow-xl scale-75 group-hover:scale-100 transition-transform border-none">
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

      {/* CART PANEL — Fully Responsive Desktop/POS Sidebar */}
      <div className="flex flex-col w-full bg-white border border-canvas-200 rounded-2xl shadow-lg overflow-hidden h-[calc(100vh-2rem)] md:h-[calc(100vh-6rem)] max-h-[920px] min-h-[600px] xl:sticky xl:top-6 order-1 xl:order-2 select-none">

  {/* 1. TOP HEADER & ORDER CONTEXT SELECTORS */}
  <div className="p-3.5 sm:p-4 2xl:p-5 border-b border-canvas-200 bg-canvas-50/60 space-y-3 shrink-0">

    {/* Order Type Selector Grid */}
    <div className="grid grid-cols-4 gap-1.5 p-1 bg-canvas-200/50 rounded-xl">
      {ORDER_TYPES.map(({ key: t }) => (
        <button
          key={t}
          type="button"
          onClick={() => setOrderType(t)}
          aria-pressed={orderType === t}
          className={`py-2 2xl:py-2.5 rounded-lg text-xs 2xl:text-sm font-bold transition-all active:scale-[0.98] ${
            orderType === t
              ? "bg-paprika-500 text-white shadow-sm shadow-paprika-500/30"
              : "text-ink-600 hover:text-ink-900 hover:bg-white/60"
          }`}
        >
          {t}
        </button>
      ))}
    </div>

    {/* Secondary Info Controls (Table / Order Ref) */}
    <div className="grid grid-cols-12 gap-2">
      {orderType === "Dine-In" && (
        <button
          type="button"
          onClick={() => setTableModalOpen(true)}
          className={`col-span-7 flex items-center justify-between gap-2 text-xs 2xl:text-sm font-semibold px-3 py-2.5 rounded-xl border transition-all active:scale-[0.99] ${
            tableId
              ? "border-basil-500/50 bg-basil-50 text-basil-700 shadow-sm"
              : "border-canvas-200 bg-white text-ink-500 hover:border-canvas-300 hover:bg-canvas-100/50"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <LayoutGrid size={16} className={tableId ? "text-basil-600" : "text-ink-400"} />
            <span className="truncate">{tableId ? `Table ${tableId}` : "Select Table..."}</span>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold text-basil-600 bg-basil-100 px-1.5 py-0.5 rounded">
            {tableId ? "Change" : "Add"}
          </span>
        </button>
      )}

      <div
        className={`${
          orderType === "Dine-In" ? "col-span-5" : "col-span-12"
        } bg-white border border-canvas-200 rounded-xl px-3 py-2 flex items-center justify-between min-w-0 shadow-sm`}
      >
        <div className="min-w-0">
          <p className="text-[9px] uppercase font-extrabold text-ink-400 tracking-wider">Order Ref</p>
          <p className="text-xs 2xl:text-sm font-mono font-bold text-ink-900 truncate">{orderId}</p>
        </div>
        <button
          type="button"
          onClick={clearOrder}
          disabled={cart.length === 0}
          title="Clear cart and start over"
          aria-label="Clear cart"
          className="p-1.5 rounded-lg text-ink-400 hover:text-paprika-600 hover:bg-paprika-50 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-ink-400 transition-colors"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </div>

    {/* Metadata & Modifiers Inputs */}
    <div className="space-y-2">
      {/* Selected Customer Card */}
      {selectedCustomer && (
        <div className="bg-blue-50/80 border border-blue-200/80 rounded-xl p-2.5 flex items-center justify-between gap-2 shadow-sm">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="text-xs 2xl:text-sm font-bold text-ink-900 truncate">{selectedCustomer.name}</p>
              {selectedCustomer.credit > 0 && (
                <span className="text-[9px] bg-paprika-100 text-paprika-700 px-1.5 py-0.2 rounded font-mono font-bold shrink-0">
                  {fmt(selectedCustomer.credit)} due
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-[10px] 2xl:text-xs text-ink-500">
              {selectedCustomer.phone && (
                <span className="flex items-center gap-1">
                  <Phone size={10} className="text-ink-400" /> {selectedCustomer.phone}
                </span>
              )}
              {selectedCustomer.email && (
                <span className="flex items-center gap-1 truncate">
                  <Mail size={10} className="text-ink-400" /> {selectedCustomer.email}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSelectedCustomer(null);
              setCustomerName("Walk-in");
              setCustomerSearch("");
              setAmountPayingNow("");
            }}
            aria-label="Remove customer"
            className="p-1 rounded-lg text-ink-400 hover:text-paprika-600 hover:bg-white transition-colors shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Waiter Selection for Dine-in */}
      {orderType === "Dine-In" && (
        <div className="relative">
          <Users size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <select
            value={selectedWaiterId}
            onChange={(e) => setSelectedWaiterId(e.target.value)}
            aria-label="Assign waiter"
            className="w-full text-xs 2xl:text-sm font-medium border border-canvas-200 bg-white rounded-xl pl-9 pr-8 py-2 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 appearance-none transition-all shadow-sm cursor-pointer"
          >
            <option value="">Assign Waiter...</option>
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-ink-400" />
        </div>
      )}

      {/* Special Kitchen Order Note */}
      <div className="relative">
        <StickyNote size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
        <input
          type="text"
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Add order note (e.g. Allergy, Rush, VIP)..."
          aria-label="Order note"
          className="w-full text-xs 2xl:text-sm font-medium border border-canvas-200 bg-white rounded-xl pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all shadow-sm placeholder:text-ink-300"
        />
      </div>
    </div>
  </div>

  {/* 2. MIDDLE AREA — CART ITEMS */}
  <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 2xl:p-5 space-y-2.5 min-h-0 bg-canvas-50/30">
    {cart.length === 0 ? (
      <div className="h-full min-h-[220px] flex flex-col items-center justify-center text-center p-6 text-ink-400 border-2 border-dashed border-canvas-200 rounded-xl">
        <div className="h-14 w-14 rounded-2xl bg-canvas-100 flex items-center justify-center mb-3 text-ink-300 shadow-inner">
          <Plus size={24} />
        </div>
        <p className="font-extrabold text-xs 2xl:text-sm uppercase tracking-wider text-ink-600">Cart is empty</p>
        <p className="text-xs text-ink-400 mt-1">Tap items on the menu to add them to this order</p>
      </div>
    ) : (
      cart.map((item) => {
        const selectedChips = (item.note || "").split(", ").filter(Boolean);
        return (
          <div
            key={item.id}
            className="group relative bg-white rounded-xl p-3 border border-canvas-200 shadow-sm hover:border-paprika-300 transition-all space-y-2"
          >
            {/* Top row: Item image, details & main Qty Controls */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-12 w-12 rounded-lg bg-canvas-100 flex items-center justify-center text-xl shrink-0 overflow-hidden border border-canvas-200 shadow-inner">
                  {(item.image || item.img) && (item.image || item.img).startsWith?.("data:") ? (
                    <img src={item.image || item.img} className="h-full w-full object-cover" alt="" />
                  ) : (
                    <span>{item.image || item.img || "🍽️"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs 2xl:text-sm text-ink-900 truncate leading-snug">{item.name}</h4>
                  <p className="text-paprika-600 font-mono font-bold text-xs 2xl:text-sm mt-0.5">{fmt(item.price)}</p>
                </div>
              </div>

              {/* Quantity Counter Control */}
              <div className="flex items-center bg-canvas-100 rounded-lg p-1 border border-canvas-200 shrink-0">
                <button
                  type="button"
                  onClick={() => updateQty(item.id, -1)}
                  aria-label={`Decrease ${item.name} quantity`}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-ink-700 shadow-sm hover:bg-paprika-50 hover:text-paprika-600 active:scale-95 transition-all"
                >
                  <Minus size={13} />
                </button>
                <span className="w-8 text-center font-mono font-bold text-xs 2xl:text-sm text-ink-900">{item.qty}</span>
                <button
                  type="button"
                  onClick={() => updateQty(item.id, 1)}
                  aria-label={`Increase ${item.name} quantity`}
                  className="w-7 h-7 flex items-center justify-center bg-white rounded-md text-ink-700 shadow-sm hover:bg-paprika-50 hover:text-paprika-600 active:scale-95 transition-all"
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>

            {/* Active Selected Modifiers */}
            {selectedChips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selectedChips.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setItemNote(item.id, selectedChips.filter((c) => c !== chip).join(", "))}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-paprika-50 text-paprika-700 rounded-md text-[10px] font-bold border border-paprika-200/60 hover:bg-paprika-100 transition-colors"
                  >
                    <span>{chip}</span>
                    <X size={10} className="text-paprika-500" />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Modifiers Ribbon & Remove Action */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-canvas-100">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                {QUICK_NOTES.filter((chip) => !selectedChips.includes(chip.replace(" 🌶️", "")))
                  .slice(0, 3)
                  .map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setItemNote(item.id, [...selectedChips, chip.replace(" 🌶️", "")].join(", "))}
                      className="text-[9px] font-semibold px-2 py-1 bg-canvas-50 text-ink-600 border border-canvas-200 rounded-md hover:bg-paprika-50 hover:text-paprika-600 hover:border-paprika-300 transition-all whitespace-nowrap"
                    >
                      +{chip}
                    </button>
                  ))}
              </div>

              {/* Explicit Item Removal */}
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name}`}
                className="flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-md transition-colors shrink-0 ml-auto"
              >
                <Trash2 size={12} />
                <span>Remove</span>
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>

  {/* 3. BOTTOM FOOTER — TOTALS & POS ACTIONS */}
  <div className="border-t border-canvas-200 bg-white p-3.5 sm:p-4 2xl:p-5 shrink-0 space-y-3 shadow-lg">

    {/* Quick POS Operations: Hold, KOT, Discount */}
    <div className="grid grid-cols-3 gap-2">
      <button
        type="button"
        onClick={holdOrder}
        disabled={!canSubmitOrder || !!placingAction}
        title="Park this order to resume later"
        className="flex flex-col items-center justify-center py-2 bg-canvas-50 border border-canvas-200 rounded-xl hover:bg-canvas-100 active:scale-[0.98] transition-all disabled:opacity-40"
      >
        {placingAction === "hold" ? (
          <Loader2 size={16} className="animate-spin text-paprika-500" />
        ) : (
          <Pause size={16} className="text-ink-700" />
        )}
        <span className="text-[10px] font-extrabold mt-1 uppercase tracking-wider text-ink-700">Hold</span>
      </button>

      {/* KOT card disabled for now */}
      {false && (
        <button
          type="button"
          onClick={sendKOT}
          disabled={!canSubmitOrder || !!placingAction}
          title="Send order directly to kitchen printer"
          className="flex flex-col items-center justify-center py-2 bg-canvas-50 border border-canvas-200 rounded-xl hover:bg-canvas-100 active:scale-[0.98] transition-all disabled:opacity-40"
        >
          {placingAction === "kot" ? (
            <Loader2 size={16} className="animate-spin text-paprika-500" />
          ) : (
            <ChefHat size={16} className="text-ink-700" />
          )}
          <span className="text-[10px] font-extrabold mt-1 uppercase tracking-wider text-ink-700">Send KOT</span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setDiscountOpen(true)}
        title="Apply discount or promo code"
        className="relative flex flex-col items-center justify-center py-2 bg-canvas-50 border border-canvas-200 rounded-xl hover:bg-canvas-100 active:scale-[0.98] transition-all"
      >
        <Percent size={16} className="text-ink-700" />
        <span className="text-[10px] font-extrabold mt-1 uppercase tracking-wider text-ink-700">Discount</span>
        {discount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-basil-500 text-white text-[9px] font-extrabold flex items-center justify-center shadow-sm">
            {discount}%
          </span>
        )}
      </button>
    </div>

    {/* Financial Calculation Breakdown */}
    <div className="bg-canvas-50/60 rounded-xl p-3 border border-canvas-200/80 space-y-1.5 font-medium">
      <div className="flex justify-between items-center text-xs text-ink-500">
        <span>Subtotal ({cartItemCount} items)</span>
        <span className="font-mono font-bold text-ink-800">{fmt(subtotal)}</span>
      </div>

      {discount > 0 && (
        <div className="flex justify-between items-center text-xs text-basil-600">
          <span>Discount ({discount}% {discountReason ? `· ${discountReason}` : ""})</span>
          <span className="font-mono font-bold">- {fmt(discountAmount)}</span>
        </div>
      )}

      {taxRate > 0 && (
        <div className="flex justify-between items-center text-xs text-ink-500">
          <span>Tax ({taxRate}%)</span>
          <span className="font-mono font-bold">{fmt(tax)}</span>
        </div>
      )}

      {serviceCharge > 0 && (
        <div className="flex justify-between items-center text-xs text-ink-500">
          <span>Service ({serviceRate}%)</span>
          <span className="font-mono font-bold">{fmt(serviceCharge)}</span>
        </div>
      )}

      <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-dashed border-canvas-300">
        <span className="text-base font-bold text-ink-900 tracking-tight">Total Amount</span>
        <span className="text-2xl font-mono font-extrabold text-paprika-600 tracking-tight">{fmt(total)}</span>
      </div>
    </div>

    {/* Primary Charge CTA */}
    <button
      type="button"
      onClick={() => {
        setPayMethod("Cash");
        setTendered("");
        setSplitMode(false);
        setSplitAmount1(0);
        setPayOpen(true);
      }}
      disabled={!canSubmitOrder}
      className="w-full bg-paprika-500 text-white py-3.5 rounded-xl shadow-lg shadow-paprika-500/25 text-base 2xl:text-lg font-extrabold flex items-center justify-center gap-2 hover:bg-paprika-600 active:scale-[0.99] transition-all disabled:opacity-40 disabled:hover:bg-paprika-500 disabled:shadow-none"
    >
      <Banknote size={22} />
      <span>{cart.length === 0 ? "Add items to charge" : `Charge ${fmt(total)}`}</span>
    </button>
  </div>
</div>

      {/* DISCOUNT MODAL */}
     <Modal
  open={discountOpen}
  onClose={() => setDiscountOpen(false)}
  title="Apply Discount"
  footer={
    <div className="flex items-center justify-between w-full gap-2 pt-2 border-t border-canvas-200">
      <Button
        variant="secondary"
        onClick={() => {
          setDiscount(0);
          setDiscountReason("");
          setDiscountOpen(false);
        }}
        className="w-full sm:w-auto text-xs 2xl:text-sm font-bold"
      >
        Reset & Close
      </Button>
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button
          variant="secondary"
          onClick={() => setDiscountOpen(false)}
          className="flex-1 sm:flex-none text-xs 2xl:text-sm font-bold"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => setDiscountOpen(false)}
          className="flex-1 sm:flex-none bg-paprika-500 hover:bg-paprika-600 text-white text-xs 2xl:text-sm font-bold shadow-md shadow-paprika-500/20"
        >
          Apply Discount
        </Button>
      </div>
    </div>
  }
>
  <div className="space-y-4 select-none">
    {/* 1. Quick Percentage Preset Chips */}
    <div>
      <label className="text-[10px] 2xl:text-xs font-extrabold text-ink-500 uppercase tracking-wider mb-2 block">
        Quick Presets
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[0, 5, 10, 15, 20, 25].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDiscount(d)}
            className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold border transition-all active:scale-95 ${
              discount === d
                ? "bg-paprika-500 text-white border-paprika-500 shadow-md shadow-paprika-500/20"
                : "border-canvas-200 bg-canvas-50/50 text-ink-800 hover:bg-canvas-100 hover:border-canvas-300"
            }`}
          >
            {d === 0 ? "None" : `${d}%`}
          </button>
        ))}
      </div>
    </div>

    {/* 2. Custom Percentage Input */}
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] 2xl:text-xs font-extrabold text-ink-500 uppercase tracking-wider">
          Custom Percentage
        </label>
        {discount > 0 && (
          <button
            type="button"
            onClick={() => setDiscount(0)}
            className="text-[10px] font-bold text-paprika-600 hover:underline"
          >
            Clear
          </button>
        )}
      </div>
      <div className="relative flex items-center">
        <input
          type="number"
          min={0}
          max={100}
          value={discount || ""}
          onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
          placeholder="0"
          className="w-full border border-canvas-200 bg-white rounded-xl pl-3 pr-8 py-2.5 text-sm font-mono font-bold text-ink-900 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 transition-all shadow-sm placeholder:text-ink-300"
        />
        <span className="absolute right-3 font-mono font-bold text-ink-400 text-sm pointer-events-none">
          %
        </span>
      </div>
    </div>

    {/* Live Savings Calculation Summary */}
    {discount > 0 && (
      <div className="bg-basil-50/80 border border-basil-200/70 rounded-xl p-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-basil-800">Calculated Savings:</span>
        <span className="font-mono font-extrabold text-sm text-basil-700">
          - {fmt((subtotal * discount) / 100)}
        </span>
      </div>
    )}

    {/* 3. Discount Reason Selector */}
    <div>
      <label className="text-[10px] 2xl:text-xs font-extrabold text-ink-500 uppercase tracking-wider mb-1 block">
        Reason for Discount
      </label>
      <div className="relative">
        <select
          value={discountReason}
          onChange={(e) => setDiscountReason(e.target.value)}
          disabled={discount === 0}
          className="w-full text-xs sm:text-sm font-medium border border-canvas-200 bg-white rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-paprika-500/20 focus:border-paprika-400 disabled:opacity-40 disabled:bg-canvas-50 appearance-none transition-all shadow-sm cursor-pointer"
        >
          <option value="" disabled>Select reason...</option>
          {DISCOUNT_REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l-4 border-r-4 border-t-4 border-transparent border-t-ink-400" />
      </div>
    </div>
  </div>
</Modal>

      {/* PAYMENT MODAL */}
      <CheckoutModal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        total={total}
        initialCustomer={selectedCustomer}
        onConfirm={confirmPayment}
      />

      {/* VISUAL TABLE SELECTOR MODAL */}
   <Modal
  open={tableModalOpen}
  onClose={() => setTableModalOpen(false)}
  title="Select Table"
  width="max-w-2xl"
  footer={
    <div className="flex items-center justify-between w-full pt-2 border-t border-canvas-200">
      <div>
        {tableId && (
          <button
            type="button"
            onClick={() => setTableId("")}
            className="flex items-center gap-1.5 text-xs font-bold text-paprika-600 hover:text-paprika-700 transition-colors"
          >
            <X size={14} /> Clear Selection
          </button>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          onClick={() => setTableModalOpen(false)}
          className="text-xs 2xl:text-sm font-bold"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={() => setTableModalOpen(false)}
          disabled={!tableId}
          className="bg-basil-600 hover:bg-basil-700 text-white text-xs 2xl:text-sm font-bold shadow-md shadow-basil-600/20 disabled:opacity-50"
        >
          Confirm Table
        </Button>
      </div>
    </div>
  }
>
  <div className="space-y-4 select-none">
    {/* Status Legend Bar */}
    <div className="flex items-center justify-between bg-canvas-50/70 p-2.5 rounded-xl border border-canvas-200 text-xs">
      <div className="flex items-center gap-4 text-[11px] font-semibold text-ink-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-basil-500 ring-2 ring-basil-100" /> Available
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-paprika-500 ring-2 ring-paprika-100" /> Occupied
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-saffron-500 ring-2 ring-saffron-100" /> Reserved
        </span>
      </div>
      {tableId && (
        <span className="text-[11px] font-mono font-bold text-basil-700 bg-basil-100 px-2 py-0.5 rounded-md">
          Selected: T-{tableId}
        </span>
      )}
    </div>

    {/* Section Iteration */}
    {[...new Set(allTables.map((t) => t.section))].map((section) => (
      <div key={section} className="space-y-2">
        <p className="text-[10px] 2xl:text-xs font-extrabold text-ink-500 uppercase tracking-wider">
          {section}
        </p>

        {/* Responsive Touch-Optimized Table Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {allTables
            .filter((t) => t.section === section)
            .map((t) => {
              const isAvailable = t.status === "available";
              const isSelected = tableId === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => {
                    setTableId(t.id);
                  }}
                  title={
                    isAvailable
                      ? `Seat ${t.seats} · Table ${t.id}`
                      : `Table ${t.id} is ${t.status}`
                  }
                  className={`relative rounded-2xl border-2 p-3 flex flex-col items-center justify-between gap-1.5 transition-all active:scale-95 ${
                    isSelected
                      ? "border-basil-500 bg-basil-50/80 shadow-md ring-2 ring-basil-500/20"
                      : isAvailable
                      ? "border-canvas-200 bg-white hover:border-basil-400 hover:bg-basil-50/30 hover:shadow-sm cursor-pointer"
                      : "border-canvas-100 bg-canvas-50 opacity-50 cursor-not-allowed"
                  }`}
                >
                  {/* Active Selection Checkmark Badge */}
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-basil-600 text-white flex items-center justify-center shadow-sm">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}

                  {/* Table Label */}
                  <span className="font-mono font-black text-base text-ink-900 leading-none pt-1">
                    {t.id}
                  </span>

                  {/* Seat Capacity Indicator */}
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-ink-500">
                    <Users size={11} className="text-ink-400" />
                    {t.seats}
                  </span>

                  {/* Status Tag */}
                  <span
                    className={`text-[10px] font-bold capitalize px-2 py-0.5 rounded-full ${
                      t.status === "available"
                        ? "text-basil-700 bg-basil-100"
                        : t.status === "occupied"
                        ? "text-paprika-700 bg-paprika-100"
                        : t.status === "reserved"
                        ? "text-saffron-700 bg-saffron-100"
                        : "text-ink-500 bg-canvas-200"
                    }`}
                  >
                    {t.status}
                  </span>
                </button>
              );
            })}
        </div>
      </div>
    ))}

    {/* Empty State */}
    {allTables.length === 0 && (
      <div className="text-center py-10 bg-canvas-50/50 rounded-2xl border border-dashed border-canvas-200">
        <p className="text-sm font-bold text-ink-600">No tables configured</p>
        <p className="text-xs text-ink-400 mt-1">Please set up restaurant tables in settings.</p>
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

