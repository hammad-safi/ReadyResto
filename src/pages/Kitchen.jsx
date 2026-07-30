import { useEffect, useState } from "react";
import { Clock, X, Volume2, ChefHat } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const COLUMNS = [
  { key: "new",       label: "New Orders",    tone: "border-slateblue-500", badgeBg: "bg-slateblue-500 text-white" },
  { key: "preparing", label: "Preparing",      tone: "border-saffron-500",   badgeBg: "bg-saffron-500 text-white"   },
  { key: "ready",     label: "Ready to Serve", tone: "border-basil-500",     badgeBg: "bg-basil-500 text-white"     },
  { key: "served",    label: "Served",         tone: "border-ink-400",       badgeBg: "bg-ink-500 text-white"       },
];

const KITCHEN_NEXT = { new: "preparing", preparing: "ready", ready: "served", served: "completed" };
const KITCHEN_LABELS = { new: "Start Preparing →", preparing: "Mark Ready →", ready: "Mark Served →", served: "Finish & Clear ✕" };

export default function Kitchen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [stationFilter, setStationFilter] = useState("All");
  const [soundEnabled, setSoundEnabled] = useState(false);

  const load = () => {
    api.list("orders").then(setOrders);
    api.list("order_items").then(setItems);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, []);

  const itemsFor = (orderId) => items.filter((i) => i.order_id === orderId);

  const moveNext = async (order) => {
    const next = KITCHEN_NEXT[order.kitchen_status];
    if (next) {
      await api.updateKitchenStatus(order.id, next);
      load();
    }
  };

  const cancelKitchen = async (order) => {
    await api.updateKitchenStatus(order.id, "cancelled");
    load();
  };

  // Only kitchen-relevant orders (not fully cancelled or outside kitchen scope)
  const allKitchenOrders = orders.filter(
    (o) => o.kitchen_status && o.kitchen_status !== "cancelled" && o.status !== "cancelled"
  );

  // Apply station filter: when a specific station is selected, only show orders
  // that contain at least one item assigned to that station.
  const kitchenOrders = stationFilter === "All"
    ? allKitchenOrders
    : allKitchenOrders.filter((o) => {
        const orderItems = itemsFor(o.id);
        // If items are loaded, filter by station field; otherwise show all (fallback)
        if (orderItems.length === 0) return true;
        return orderItems.some((it) => it.station === stationFilter);
      });

  const elapsedMinutes = (order) => {
    if (!order.created_at) return null;
    return Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000);
  };

  const urgencyClass = (mins) => {
    if (mins === null) return "text-ink-500";
    if (mins >= 20) return "text-paprika-500 font-bold";
    if (mins >= 10) return "text-saffron-600 font-semibold";
    return "text-ink-500";
  };

  return (
    <div>
      <PageHeader
        eyebrow="Live · auto-refreshing every 6s"
        title="Kitchen Display"
        description="Tickets update as orders move through the line. Items are synced from POS."
        actions={
          <div className="flex gap-2 flex-wrap">
            {["All", "Grill", "Bar", "Dessert", "Fry"].map((s) => (
              <button
                key={s}
                onClick={() => setStationFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  stationFilter === s
                    ? "bg-ink-900 text-white border-ink-900"
                    : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              title={soundEnabled ? "Mute" : "Enable sound"}
              className={`h-8 w-8 flex items-center justify-center rounded-lg border transition-colors ${
                soundEnabled ? "bg-paprika-500 text-white border-paprika-500" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
              }`}
            >
              <Volume2 size={15} />
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colOrders = kitchenOrders.filter((o) => o.kitchen_status === col.key);
          return (
            <div key={col.key}>
              {/* Column header */}
              <div className={`flex items-center justify-between mb-3 px-3 py-2 rounded-xl border-l-4 ${col.tone} bg-white border border-canvas-200 shadow-soft`}>
                <p className="font-display font-semibold text-sm text-ink-900">{col.label}</p>
                <span className={`text-xs font-mono font-bold rounded-full px-2.5 py-0.5 ${
                  colOrders.length > 0 ? col.badgeBg : "bg-canvas-100 text-ink-400"
                }`}>
                  {colOrders.length}
                </span>
              </div>

              <div className="space-y-3">
                {colOrders.map((order) => {
                  const orderItems = itemsFor(order.id);
                  const elapsed = elapsedMinutes(order);
                  return (
                    <div
                      key={order.id}
                      className={`bg-white rounded-xl shadow-soft border-l-4 ${col.tone} border border-canvas-200 p-3.5 transition-all hover:shadow-card`}
                    >
                      {/* Ticket header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-bold text-ink-900 bg-canvas-100 px-2 py-0.5 rounded">
                            {order.id}
                          </span>
                          {col.key === "new" && (
                            <span className="text-[10px] font-semibold bg-slateblue-500/10 text-slateblue-600 px-1.5 py-0.5 rounded-full animate-pulse">
                              NEW
                            </span>
                          )}
                        </div>
                        <span className={`flex items-center gap-0.5 text-[11px] font-mono shrink-0 ${urgencyClass(elapsed)}`}>
                          <Clock size={11} />
                          {elapsed !== null ? `${elapsed}m` : order.time}
                        </span>
                      </div>

                      {/* Table / Type / Customer */}
                      <p className="text-xs font-semibold text-paprika-600 mb-2 truncate">
                        {order.table_id ? `Table ${order.table_id}` : order.type}
                        {order.customer && order.customer !== "Walk-in" && (
                          <span className="text-ink-400 font-normal ml-1">· {order.customer}</span>
                        )}
                      </p>

                      {/* Items list */}
                      <ul className="space-y-2 mb-3">
                        {orderItems.length > 0
                          ? orderItems
                              // When a specific station is selected, visually highlight
                              // matching items and dim non-matching ones.
                              .filter((it) => stationFilter === "All" || it.station === stationFilter || !it.station)
                              .map((it) => (
                              <li key={it.id} className="rounded-lg bg-canvas-50 border border-canvas-200 overflow-hidden">
                                <div className="flex items-center gap-2.5 p-2">
                                  {/* Item image / emoji */}
                                  <div className="h-10 w-10 shrink-0 rounded-md bg-white border border-canvas-200 flex items-center justify-center text-lg overflow-hidden shadow-soft">
                                    {it.image && it.image.startsWith?.("data:")
                                      ? <img src={it.image} className="h-full w-full object-cover" alt="" />
                                      : <span>{it.image || "🍽️"}</span>
                                    }
                                  </div>
                                  {/* Name + station badge */}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-sm font-semibold text-ink-900 leading-tight block truncate">{it.name}</span>
                                    {it.station && (
                                      <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-0.5 ${
                                        it.station === "Grill" ? "bg-orange-100 text-orange-700" :
                                        it.station === "Bar" ? "bg-blue-100 text-blue-700" :
                                        it.station === "Dessert" ? "bg-pink-100 text-pink-700" :
                                        it.station === "Fry" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-canvas-200 text-ink-600"
                                      }`}>{it.station}</span>
                                    )}
                                  </div>
                                  {/* Qty badge */}
                                  <span className="shrink-0 font-mono font-bold text-sm text-white bg-ink-900 min-w-[28px] h-7 flex items-center justify-center rounded-lg px-2">
                                    ×{it.qty}
                                  </span>
                                </div>
                                {/* Per-item special instructions */}
                                {it.notes && (
                                  <div className="flex items-start gap-1.5 px-2.5 pb-2">
                                    <span className="text-base leading-none mt-0.5">🌶️</span>
                                    <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1 flex-1 leading-snug">
                                      {it.notes}
                                    </p>
                                  </div>
                                )}
                              </li>
                            ))
                          : (
                            <li className="text-sm text-ink-400 italic px-1">{order.items_count} item(s)</li>
                          )
                        }
                      </ul>

                      {/* Order-level note */}
                      {order.order_note && (
                        <div className="mb-3 flex items-start gap-1.5 text-[11px] text-ink-700 bg-saffron-50 border border-saffron-200 rounded-lg px-2.5 py-2">
                          <span className="text-base leading-none">📋</span>
                          <span className="font-medium">{order.order_note}</span>
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveNext(order)}
                          className="flex-1 text-xs font-semibold py-2 rounded-lg bg-ink-900 text-white hover:bg-ink-700 transition-colors"
                        >
                          {KITCHEN_LABELS[col.key]}
                        </button>
                        <button
                          onClick={() => cancelKitchen(order)}
                          title="Cancel ticket"
                          className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-400 hover:text-paprika-600 hover:border-paprika-300 transition-colors"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {colOrders.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed border-canvas-200 rounded-xl flex flex-col items-center gap-2 text-ink-400">
                    <ChefHat size={22} className="opacity-40" />
                    <p className="text-xs">No tickets</p>
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

