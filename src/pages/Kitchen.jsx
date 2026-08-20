import { useEffect, useState, useRef, useMemo } from "react";
import { Clock, X, Volume2, VolumeX, ChefHat, Check, AlertTriangle, User, Utensils, Search, Printer } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Badge from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import { printKOT } from "../utils/export";

import useStickyState from "../hooks/useStickyState";
import { useDataCache } from "../context/DataCacheContext";

const COLUMNS = [
  { key: "new",       label: "New Orders",    tone: "border-l-paprika-500",  badgeBg: "bg-paprika-600 text-white",  headerBg: "bg-paprika-500/10 border-paprika-500/20"  },
  { key: "preparing", label: "Preparing",      tone: "border-l-amber-500",   badgeBg: "bg-amber-600 text-white",   headerBg: "bg-amber-500/10 border-amber-500/20"    },
  { key: "ready",     label: "Ready to Serve", tone: "border-l-emerald-500", badgeBg: "bg-emerald-600 text-white", headerBg: "bg-emerald-500/10 border-emerald-500/20" },
  { key: "served",    label: "Served",         tone: "border-l-ink-400",   badgeBg: "bg-ink-600 text-white",   headerBg: "bg-canvas-200 border-canvas-200"   },
];

// Color scheme per station — matches Menu Management's STATION_OPTIONS
const STATION_STYLES = {
  Grill:   { pill: "bg-orange-500/10 text-orange-600 border border-orange-500/20", active: "bg-orange-500 text-white border border-orange-600 shadow-sm" },
  Bar:     { pill: "bg-blue-500/10   text-blue-600   border border-blue-500/20",   active: "bg-blue-500   text-white border border-blue-600   shadow-sm" },
  Dessert: { pill: "bg-pink-500/10   text-pink-600   border border-pink-500/20",   active: "bg-pink-500   text-white border border-pink-600   shadow-sm" },
  Fry:     { pill: "bg-amber-500/10  text-amber-600  border border-amber-500/20",  active: "bg-amber-500  text-white border border-amber-600  shadow-sm" },
};

const KITCHEN_NEXT   = { new: "preparing", preparing: "ready", ready: "served", served: "completed" };
const KITCHEN_LABELS = { new: "Start Preparing", preparing: "Mark Ready", ready: "Mark Served", served: "Complete & Clear" };
const STATIONS = ["All", "Grill", "Bar", "Dessert", "Fry"];

const playKitchenChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playNote = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };
    playNote(587.33, 0, 0.25);  // D5
    playNote(880, 0.15, 0.4);   // A5
  } catch (e) {
    console.warn("Audio not supported", e);
  }
};

const playCancelChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const playNote = (freq, type, startTime, duration, vol) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      gain.gain.setValueAtTime(vol, ctx.currentTime + startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + startTime);
      osc.stop(ctx.currentTime + startTime + duration);
    };
    // A noticeable but high-quality double low tone
    playNote(250, "square", 0, 0.3, 0.05);
    playNote(200, "square", 0.2, 0.4, 0.05);
  } catch (e) {
    console.warn("Audio not supported", e);
  }
};

export default function Kitchen() {
  const { getData, cacheTick } = useDataCache();
  const { user } = useAuth();
  const [orders,        setOrders]        = useState([]);
  const [items,         setItems]         = useState([]);
  const [stationFilter, setStationFilter] = useStickyState("All", "kitchen_stationFilter");
  const [soundEnabled,  setSoundEnabled]  = useStickyState(false, "kitchen_soundEnabled");
  const [cancellingId,  setCancellingId]  = useState(null);
  const [searchQuery,   setSearchQuery]   = useStickyState("", "kitchen_searchQuery");

  const [selectedTickets, setSelectedTickets] = useState([]);
  const prevNewOrderIdsRef = useRef(new Set());
  const prevOrdersRef = useRef([]);

  const load = async () => {
    try {
      const [fetchedOrders, fetchedItems] = await Promise.all([
        getData("orders"),
        getData("order_items"),
      ]);
      
      const activeNew = fetchedOrders.filter((o) => o.kitchen_status === "new" && o.status !== "cancelled");
      const currentNewIds = new Set(activeNew.map(o => o.id));
      
      let playNew = false;
      let playCancel = false;

      if (soundEnabled) {
        // 1. Detect truly new orders by comparing ID sets
        for (const id of currentNewIds) {
          if (!prevNewOrderIdsRef.current.has(id)) {
            playNew = true;
            break;
          }
        }
        
        // 2. Detect cancellations by comparing previous raw orders state
        const prevOrders = prevOrdersRef.current;
        for (const prev of prevOrders) {
          if (prev.status !== "cancelled") {
            const current = fetchedOrders.find(o => o.id === prev.id);
            if (current && current.status === "cancelled") {
              playCancel = true;
              break;
            }
          }
        }
        
        if (playCancel) {
          playCancelChime();
        } else if (playNew) {
          playKitchenChime();
        }
      }
      
      prevNewOrderIdsRef.current = currentNewIds;
      prevOrdersRef.current = fetchedOrders || [];
      setOrders(fetchedOrders || []);
      setItems(fetchedItems  || []);
    } catch (err) {
      console.error("Kitchen load error:", err);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [soundEnabled]);

  const itemsFor = (orderId) => items.filter((i) => i.order_id === orderId);

  const moveNext = async (order) => {
    let nextStatus = "";
    if (order.kitchen_status === "new") nextStatus = "preparing";
    else if (order.kitchen_status === "preparing") nextStatus = "ready";
    else if (order.kitchen_status === "ready") nextStatus = "served";
    else if (order.kitchen_status === "served") nextStatus = "completed";
    
    if (nextStatus) {
      await api.updateKitchenStatus(order.id, nextStatus);
      load();
    }
  };

  const cancelKitchen = async (orderId) => {
    if (soundEnabled) playCancelChime();
    await api.updateKitchenStatus(orderId, "cancelled");
    await api.updateOrderStatus(orderId, "cancelled");
    setCancellingId(null);
    load();
  };

  const orderSortKey = (o) => {
    if (o.created_at) {
      const t = new Date(o.created_at).getTime();
      if (!Number.isNaN(t)) return t;
    }
    const idNum = Number(String(o.id).replace(/\D/g, ""));
    return Number.isNaN(idNum) ? 0 : idNum;
  };

  const allKitchenOrders = orders.filter(
    (o) => o.kitchen_status && o.kitchen_status !== "cancelled" && o.status !== "cancelled" && o.status !== "unpaid"
  );
  const sortedKitchenOrders = [...allKitchenOrders].sort((a, b) => orderSortKey(a) - orderSortKey(b));

  // Station + search filtering
  const filteredOrders = useMemo(() => {
    return sortedKitchenOrders.filter((o) => {
      const search = searchQuery.toLowerCase();
      if (search) {
        const hasMatch =
          String(o.id).includes(search) ||
          String(o.table_id || "").includes(search) ||
          String(o.customer || "").toLowerCase().includes(search) ||
          String(o.waiter || "").toLowerCase().includes(search) ||
          itemsFor(o.id).some((it) => it.name.toLowerCase().includes(search));
        if (!hasMatch) return false;
      }
      if (stationFilter !== "All") {
        const hasStationItems = itemsFor(o.id).some((it) => it.station === stationFilter);
        if (!hasStationItems) return false;
      }
      return true;
    });
  }, [sortedKitchenOrders, stationFilter, searchQuery, items]);

  const selectAllNew = () => {
    const newOrderIds = filteredOrders
      .filter((o) => o.kitchen_status === "new" && o.status !== "cancelled")
      .map((o) => o.id);
    if (selectedTickets.length === newOrderIds.length && newOrderIds.length > 0) {
      setSelectedTickets([]);
    } else {
      setSelectedTickets(newOrderIds);
    }
  };

  const elapsedMinutes = (order) => {
    if (!order.created_at) return null;
    return Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  };

  const getUrgencyBadge = (mins) => {
    if (mins === null) return null;
    if (mins >= 20) return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-300 animate-pulse">
        <AlertTriangle size={12} /> {mins}m
      </span>
    );
    if (mins >= 10) return (
      <span className="flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
        <Clock size={12} /> {mins}m
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-canvas-100 text-ink-600 border border-canvas-200">
        <Clock size={12} /> {mins}m
      </span>
    );
  };

  return (
    <div className="w-full px-2 sm:px-4 py-4 space-y-5">
      <PageHeader
        eyebrow="Live Ticket Queue · Auto-refreshing 5s"
        title="Kitchen Display System"
        description="Monitor, prepare, and pass order tickets across kitchen line stations."
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Station Filter Tabs */}
            <span className="text-xs font-semibold text-ink-500 uppercase tracking-wider shrink-0">Station:</span>
            {STATIONS.map((s) => {
              const sc = STATION_STYLES[s];
              const isActive = stationFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setStationFilter(s)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    s === "All"
                      ? isActive
                        ? "bg-ink-900 text-canvas-50 ring-2 ring-ink-900 ring-offset-1"
                        : "bg-white border border-canvas-200 text-ink-700 hover:bg-canvas-100"
                      : isActive
                        ? sc.active
                        : sc.pill + " hover:opacity-90"
                  }`}
                >
                  {s}
                </button>
              );
            })}

            <div className="h-6 w-px bg-canvas-200 mx-0.5" />

            {/* Muted / Audio On Toggle */}
            <button
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                window.localStorage.setItem("kitchen_soundEnabled", JSON.stringify(next));
                if (next) playKitchenChime();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all shadow-sm ${
                soundEnabled
                  ? "bg-paprika-600 text-white border-paprika-600"
                  : "bg-white border-canvas-200 text-ink-600 hover:bg-canvas-100"
              }`}
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
              {soundEnabled ? "Audio On" : "Muted"}
            </button>
          </div>
        }
      />

      {/* Search Bar & Print Selected */}
      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, table, customer, or item…"
            className="w-full pl-9 pr-9 py-2 rounded-xl border border-canvas-200 bg-white text-sm outline-none focus:ring-2 focus:ring-paprika-400/30 focus:border-paprika-400 transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          onClick={selectAllNew}
          className="px-4 py-2 rounded-xl border border-canvas-200 bg-white text-ink-700 font-semibold text-sm hover:bg-canvas-100 transition-all shadow-sm shrink-0 whitespace-nowrap"
        >
          Select All
        </button>

        <button
          onClick={() => {
            const ordersToPrint = filteredOrders.filter(o => selectedTickets.includes(o.id)).map(o => ({
              ...o,
              items: itemsFor(o.id)
            }));
            if (ordersToPrint.length > 0) {
              printKOT(ordersToPrint);
              setSelectedTickets([]);
            }
          }}
          disabled={selectedTickets.length === 0}
          className="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white border border-canvas-200 text-ink-700 hover:bg-canvas-50 shadow-sm"
        >
          <Printer size={15} /> Print KOT ({selectedTickets.length})
        </button>

        <button
          onClick={async () => {
            const ordersToPrint = filteredOrders.filter(o => selectedTickets.includes(o.id)).map(o => ({
              ...o,
              items: itemsFor(o.id)
            }));
            const { printQRLabels } = await import("../utils/export");
            for (const order of ordersToPrint) {
              await printQRLabels(order, order.items, profile);
            }
            setSelectedTickets([]);
          }}
          disabled={selectedTickets.length === 0}
          className="px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-paprika-50 border border-paprika-200 text-paprika-700 hover:bg-paprika-100 shadow-sm"
        >
          <Printer size={15} /> Print Labels ({selectedTickets.length})
        </button>
      </div>

      {/* Main Kanban Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
        {COLUMNS.map((col) => {
          const colOrders = filteredOrders.filter((o) => o.kitchen_status === col.key);
          return (
            <div key={col.key} className="flex flex-col rounded-2xl bg-canvas-50 p-3 border border-canvas-200 min-h-[750px]">
              {/* Column Header */}
              <div className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border ${col.headerBg} mb-3 shadow-xs`}>
                <h3 className="font-bold text-sm text-ink-900 flex items-center gap-2">{col.label}</h3>
                <span className={`text-xs font-mono font-bold rounded-full px-2.5 py-0.5 ${
                  colOrders.length > 0 ? col.badgeBg : "bg-canvas-200 text-ink-500"
                }`}>
                  {colOrders.length}
                </span>
              </div>

              {/* Ticket List */}
              <div className="space-y-3 flex-1">
                {colOrders.map((order) => {
                  const orderItems   = itemsFor(order.id);
                  const elapsed      = elapsedMinutes(order);
                  const isConfirming = cancellingId === order.id;

                  // For station view: show only matching items (but still show the ticket)
                  const visibleItems = stationFilter === "All"
                    ? orderItems
                    : orderItems.filter((it) => it.station === stationFilter);

                  return (
                    <div
                      key={order.id}
                      className={`bg-canvas-100 rounded-xl border-l-4 ${col.tone} border-y border-r border-canvas-200 shadow-sm p-4 transition-all hover:shadow-md flex flex-col`}
                    >
                      {/* Ticket Header */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-canvas-100 mb-3">
                        <div className="flex items-center gap-2">
                          {col.key === "new" && (
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 accent-primary-500 cursor-pointer rounded"
                              checked={selectedTickets.includes(order.id)}
                              onChange={(e) => {
                                if (e.target.checked) setSelectedTickets(prev => [...prev, order.id]);
                                else setSelectedTickets(prev => prev.filter(id => id !== order.id));
                              }}
                            />
                          )}
                          <span className="font-mono text-sm font-extrabold text-ink-900 bg-canvas-100 px-2 py-0.5 rounded">
                            #{order.id}
                          </span>
                        </div>
                        {getUrgencyBadge(elapsed)}
                      </div>

                      {/* Metadata Row: Table / Type / Waiter / Customer */}
                      <div className="flex items-center gap-2 text-xs mb-3 bg-canvas-50 px-2.5 py-1.5 rounded-lg border border-canvas-100 flex-wrap">
                        <span className="font-bold text-ink-900 flex items-center gap-1 shrink-0">
                          <Utensils size={12} className="text-ink-500" />
                          {order.table_id ? `Table ${order.table_id}` : (order.type || "Takeout")}
                        </span>
                        {order.waiter && (
                          <span className="text-ink-500 text-[10px] shrink-0 ml-auto">👤 {order.waiter}</span>
                        )}
                        {order.customer && order.customer !== "Walk-in" && (
                          <span className="text-ink-600 font-medium flex items-center gap-1 truncate max-w-[110px]">
                            <User size={11} /> {order.customer}
                          </span>
                        )}
                      </div>

                      {/* Items List */}
                      <ul className="space-y-2 mb-3">
                        {visibleItems.length > 0 ? (
                          visibleItems.map((it) => {
                            const sc = STATION_STYLES[it.station];
                            return (
                              <li key={it.id} className="rounded-lg border border-canvas-200 bg-canvas-50 overflow-hidden">
                                <div className="flex items-start gap-2.5 p-2">
                                  <div className="h-9 w-9 shrink-0 rounded-md bg-canvas-100 border border-canvas-200 flex items-center justify-center text-lg shadow-2xs">
                                    {it.image?.startsWith?.("data:") ? (
                                      <img src={it.image} className="h-full w-full object-cover rounded-md" alt="" />
                                    ) : (
                                      <span>{it.image || "🍴"}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="text-xs font-bold text-ink-900 leading-snug block truncate">{it.name}</span>
                                      <span className="shrink-0 font-mono font-extrabold text-xs text-canvas-50 bg-ink-900 px-2 py-0.5 rounded-md">
                                        ×{it.qty}
                                      </span>
                                    </div>
                                    {/* Station Badge — linked from Menu Management */}
                                    {it.station && sc && (
                                      <span className={`inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded mt-1 ${sc.pill}`}>
                                        {it.station}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {/* Special Instructions */}
                                {it.notes && (
                                  <div className="text-[11px] font-semibold text-amber-900 bg-amber-50/90 border-t border-amber-200 px-2 py-1.5 flex items-start gap-1">
                                    <span>⚠️</span>
                                    <span className="flex-1">{it.notes}</span>
                                  </div>
                                )}
                              </li>
                            );
                          })
                        ) : orderItems.length > 0 ? (
                          <li className="text-xs text-ink-400 italic px-1 py-1">
                            No items for station "{stationFilter}" in this ticket
                          </li>
                        ) : (
                          <li className="text-xs text-ink-400 italic px-1">
                            {order.items_count || 0} item(s) on ticket
                          </li>
                        )}
                      </ul>

                      {/* Order-Level Note */}
                      {order.order_note && (
                        <div className="mb-4 text-[11px] text-amber-900 bg-amber-100/60 border border-amber-200 rounded-lg p-2 flex items-start gap-1.5 font-medium">
                          <span className="text-xs">📝</span>
                          <span>{order.order_note}</span>
                        </div>
                      )}

                      {/* Action Buttons with Cancel Safeguard */}
                      <div className="pt-2 border-t border-canvas-100">
                        {isConfirming ? (
                          <div className="flex items-center gap-1 bg-red-50 p-1.5 rounded-lg border border-red-200">
                            <span className="text-[11px] font-bold text-red-700 flex-1 pl-1">Cancel this ticket?</span>
                            <button
                              onClick={() => cancelKitchen(order.id)}
                              className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold hover:bg-red-700"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setCancellingId(null)}
                              className="px-2 py-1 bg-white text-ink-600 border border-canvas-200 rounded text-xs font-bold hover:bg-canvas-100"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              onClick={() => moveNext(order)}
                              className="flex-1 text-xs font-bold py-2.5 px-3 rounded-lg bg-paprika-600 text-white hover:bg-paprika-500 hover:border-paprika-400 active:scale-[0.99] transition-all shadow-md shadow-paprika-500/20 flex items-center justify-center gap-1.5 border border-paprika-500"
                            >
                              {KITCHEN_LABELS[col.key]} <Check size={13} />
                            </button>
                            {order.kitchen_status === "new" && (
                              <button
                                onClick={() => setCancellingId(order.id)}
                                className="px-3 py-2.5 rounded-lg bg-white border border-canvas-200 text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center tooltip-trigger"
                                title="Cancel Ticket"
                              >
                                <X size={15} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Empty State */}
                {colOrders.length === 0 && (
                  <div className="text-center py-16 border-2 border-dashed border-canvas-200 rounded-xl flex flex-col items-center justify-center gap-2 text-ink-400 bg-transparent">
                    <ChefHat size={28} className="opacity-30" />
                    <p className="text-xs font-semibold">
                      {searchQuery
                        ? `No tickets matching "${searchQuery}"`
                        : stationFilter !== "All"
                          ? `No ${stationFilter} tickets`
                          : "No active tickets"}
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}