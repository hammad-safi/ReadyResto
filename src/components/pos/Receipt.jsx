import { Printer, X, Download } from "lucide-react";
import Button from "../ui/Button";

// A single receipt, rendered both on-screen (in a modal) and via window.print().
// `order` matches the orders table row; `items` matches order_items rows;
// `profile` is the restaurant_profile settings object (name/address/logo/footer/tax).
export default function Receipt({ order, items, profile, onClose, refundLines = [] }) {
  if (!order) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:absolute print:top-0 print:left-0 print:block">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity print:hidden" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-[rgb(var(--surface-card))] border border-canvas-200 print:border-none print:bg-white rounded-xl2 shadow-card flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none print:w-[80mm] print:max-w-none print:static">
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-200 print:hidden shrink-0">
          <h3 className="font-display font-semibold text-ink-900 text-sm">Receipt — {order.id}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-canvas-100">
            <X size={18} />
          </button>
        </div>

        <div id="receipt-print-area" className="overflow-y-auto px-6 py-5 font-mono text-[12px] leading-relaxed text-ink-800">
          <div className="text-center mb-3">
            {profile?.showLogo !== false && (
              profile?.logo ? (
                <img src={profile.logo} alt="logo" className="h-12 mx-auto mb-2 object-contain" />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-paprika-500 text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-2">
                  {(profile?.name || "R")[0]}
                </div>
              )
            )}
            <p className="font-display font-bold text-sm text-ink-900">{profile?.name || "Restaurant"}</p>
            {profile?.tagline && <p className="text-[10px] text-ink-500 italic mb-0.5">{profile.tagline}</p>}
            {profile?.address && <p className="text-[11px] text-ink-500">{profile.address}</p>}
            {profile?.phone && <p className="text-[11px] text-ink-500">Ph: {profile.phone}</p>}
            {profile?.ntn && <p className="text-[10px] text-ink-400 font-mono">NTN: {profile.ntn}</p>}
            {profile?.showOwnerInfo && profile?.ownerName && (
              <p className="text-[10px] text-ink-500 mt-1 pt-0.5 border-t border-dotted border-ink-200">
                Proprietor: {profile.ownerName} {profile.ownerPhone ? `· ${profile.ownerPhone}` : ""}
              </p>
            )}
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

          {order.payment_method && (() => {
            let splitDetails = null;
            try {
              if (order.payment_details && order.payment_details.startsWith("[")) {
                splitDetails = JSON.parse(order.payment_details);
              }
            } catch (_) {}

            return (
              <>
                <div className="border-t border-dashed border-ink-300 my-2" />
                <div className="flex justify-between"><span>Paid via</span><span>{splitDetails ? "Split Payment" : order.payment_method}</span></div>
                {splitDetails ? (
                  <div className="pl-2 space-y-0.5 text-ink-600 text-[11px] mt-1 border-l border-dashed border-canvas-300">
                    {splitDetails.map((s, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {s.method}</span>
                        <span>Rs. {Number(s.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {order.tendered != null && <div className="flex justify-between"><span>Tendered</span><span>Rs. {Number(order.tendered).toLocaleString()}</span></div>}
                    {order.change_due != null && order.change_due > 0 && <div className="flex justify-between"><span>Change</span><span>Rs. {Number(order.change_due).toLocaleString()}</span></div>}
                  </>
                )}
              </>
            );
          })()}

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
