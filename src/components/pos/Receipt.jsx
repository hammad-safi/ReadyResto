import { Printer, X, Download } from "lucide-react";
import Button from "../ui/Button";

// A single receipt, rendered both on-screen (in a modal) and via window.print().
// `order` matches the orders table row; `items` matches order_items rows;
// `profile` is the restaurant_profile settings object (name/address/logo/footer/tax).
export default function Receipt({ order, items, profile, onClose, refundLines = [] }) {
  if (!order) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:static print:block">
      <div className="absolute inset-0 bg-ink-950/60 print:hidden" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-xl2 shadow-card flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none print:w-[80mm] print:max-w-none">
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-200 print:hidden shrink-0">
          <h3 className="font-display font-semibold text-ink-900 text-sm">Receipt — {order.id}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-canvas-100">
            <X size={18} />
          </button>
        </div>

        <div id="receipt-print-area" className="overflow-y-auto px-6 py-5 font-mono text-[12px] leading-relaxed text-ink-800">
          <div className="text-center mb-3">
            {profile?.logo ? (
              <img src={profile.logo} alt="logo" className="h-12 mx-auto mb-2 object-contain" />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-paprika-500 text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-2">
                {(profile?.name || "R")[0]}
              </div>
            )}
            <p className="font-display font-semibold text-sm text-ink-900">{profile?.name || "Restaurant"}</p>
            {profile?.address && <p className="text-[11px] text-ink-500">{profile.address}</p>}
            {profile?.phone && <p className="text-[11px] text-ink-500">{profile.phone}</p>}
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="flex justify-between text-[11px] text-ink-600">
            <span>{order.id}</span>
            <span>{order.time}</span>
          </div>
          <div className="flex justify-between text-[11px] text-ink-600">
            <span>{order.type}{order.table_id ? ` · Table ${order.table_id}` : ""}</span>
            <span>{order.waiter}</span>
          </div>
          <div className="flex justify-between text-[11px] text-ink-600">
            <span>Customer</span>
            <span>{order.customer || "Walk-in"}</span>
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="space-y-1">
            {items.map((it) => (
              <div key={it.id || it.menu_item_id} className="flex justify-between gap-2">
                <span className="flex-1 truncate">{it.qty} × {it.name}</span>
                <span>Rs. {(it.qty * it.price).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="flex justify-between"><span>Subtotal</span><span>Rs. {Number(order.subtotal ?? order.total).toLocaleString()}</span></div>
          {order.discount_percent > 0 && (
            <div className="flex justify-between text-basil-600">
              <span>Discount ({order.discount_percent}%{order.discount_reason ? ` · ${order.discount_reason}` : ""})</span>
              <span>- Rs. {Math.round((order.subtotal * order.discount_percent) / 100).toLocaleString()}</span>
            </div>
          )}
          {order.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>Rs. {Number(order.tax).toLocaleString()}</span></div>}
          {order.service_charge > 0 && <div className="flex justify-between"><span>Service Charge</span><span>Rs. {Number(order.service_charge).toLocaleString()}</span></div>}

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="flex justify-between text-sm font-semibold text-ink-900">
            <span>TOTAL</span>
            <span>Rs. {Number(order.total).toLocaleString()}</span>
          </div>

          {order.payment_method && (
            <>
              <div className="border-t border-dashed border-ink-300 my-2" />
              <div className="flex justify-between"><span>Paid via</span><span>{order.payment_method}</span></div>
              {order.tendered != null && <div className="flex justify-between"><span>Tendered</span><span>Rs. {Number(order.tendered).toLocaleString()}</span></div>}
              {order.change_due != null && order.change_due > 0 && <div className="flex justify-between"><span>Change</span><span>Rs. {Number(order.change_due).toLocaleString()}</span></div>}
            </>
          )}

          {refundLines.length > 0 && (
            <>
              <div className="border-t border-dashed border-ink-300 my-2" />
              <p className="font-semibold text-paprika-600 mb-1">Returns / Adjustments</p>
              {refundLines.map((r) => (
                <div key={r.id} className="flex justify-between text-paprika-600">
                  <span>{r.kind === "adjustment" ? "Adj." : "Return"} · {r.time}</span>
                  <span>- Rs. {Number(r.amount).toLocaleString()}</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t border-dashed border-ink-300 my-3" />
          <p className="text-center text-[11px] text-ink-500">{profile?.receiptFooter || "Thank you for dining with us!"}</p>
        </div>

        <div className="px-4 py-3 border-t border-canvas-200 flex gap-2 print:hidden shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={Printer} className="flex-1" onClick={handlePrint}>Print Receipt</Button>
        </div>
      </div>
    </div>
  );
}
