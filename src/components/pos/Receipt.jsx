import { useEffect } from "react";
import { Printer, X } from "lucide-react";
import Button from "../ui/Button";
import Barcode from "react-barcode";

// A single receipt, rendered both on-screen (in a modal) and via window.print().
// `order` matches the orders table row; `items` matches order_items rows;
// `profile` is the restaurant_profile settings object (name/address/logo/footer/tax).
export default function Receipt({ order, items, profile, onClose, refundLines = [] }) {
  if (!order) return null;

  const handlePrint = () => window.print();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Create simple payload for QR Code
  const qrPayload = `Inv: ${order.id}\nAmt: Rs. ${order.total}\nDate: ${order.time}`;

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

        <div id="receipt-print-area" className="overflow-y-auto px-6 py-5 bg-white font-mono text-[11px] leading-relaxed text-ink-900 print:p-2 print:text-black">
          <div className="text-center mb-3">
            {profile?.showLogo !== false && (
              profile?.logo ? (
                <img src={profile.logo} alt="logo" className="h-10 mx-auto mb-1.5 object-contain" />
              ) : (
                <div className="h-8 w-8 rounded-lg bg-paprika-500 text-white flex items-center justify-center font-display font-bold text-sm mx-auto mb-1.5">
                  {(profile?.name || "R")[0]}
                </div>
              )
            )}
            <p className="font-display font-bold text-xs text-ink-900 print:text-black">{profile?.name || "Restaurant Name"}</p>
            {profile?.tagline && <p className="text-[9px] text-ink-500 italic mb-0.5 print:text-black">{profile.tagline}</p>}
            {profile?.address && <p className="text-[10px] text-ink-500 print:text-black">{profile.address}</p>}
            {profile?.phone && <p className="text-[10px] text-ink-500 print:text-black">Ph: {profile.phone}</p>}
            {profile?.ntn && <p className="text-[9px] text-ink-400 print:text-black">NTN: {profile.ntn}</p>}
            {profile?.showOwnerInfo && profile?.ownerName && (
              <p className="text-[9px] text-ink-500 mt-1 pt-0.5 border-t border-dotted border-ink-200 print:text-black print:border-black">
                Proprietor: {profile.ownerName}
              </p>
            )}
          </div>

          <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />
          <div className="flex justify-between text-[10px] text-ink-600 print:text-black">
            <span>{order.id}</span>
            <span>{order.time}</span>
          </div>
          <div className="flex justify-between text-[10px] text-ink-600 print:text-black">
            <span>{order.type}{order.table_id ? ` · Table ${order.table_id}` : ""}</span>
            <span>{profile?.showCashierName !== false ? `Cashier: ${order.waiter || "System"}` : ""}</span>
          </div>

          <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />
          <div className="space-y-1">
            {(() => {
              const mainItems = items.filter(it => true);
              const regularItems = mainItems.filter(it => it.is_deal !== 1);
              const dealItems = mainItems.filter(it => it.is_deal === 1);

              return (
                <>
                  {/* Regular items */}
                  {regularItems.map((it) => (
                    <div key={it.id || it.menu_item_id} className="flex flex-col">
                      <div className="flex justify-between">
                        <span className="flex-1 pr-2 truncate">
                          {it.qty} × {it.name}
                          {it.station && <span className="text-[8px] text-ink-400 print:text-gray-500 ml-1">({it.station})</span>}
                        </span>
                        <span>Rs. {(it.qty * it.price).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}

                  {/* Deal items */}
                  {dealItems.length > 0 && (
                    <>
                      <div className="border-t border-dotted border-ink-200 my-1 print:border-gray-400" />
                      {dealItems.map((it) => {
                        const subs = it.sub_items || [];
                        return (
                          <div key={it.id || it.menu_item_id} className="flex flex-col">
                            <div className="flex justify-between">
                              <span className="flex-1 pr-2 truncate font-bold">
                                <span className="text-[8px] bg-ink-800 text-white px-1 py-px rounded mr-1 print:bg-black print:text-white">DEAL</span>
                                {it.qty} × {it.name}
                              </span>
                              <span className="font-bold">Rs. {(it.qty * it.price).toLocaleString()}</span>
                            </div>
                            {subs.length > 0 && (
                              <div className="pl-3 mt-0.5 mb-1 border-l border-dashed border-ink-200 ml-1 print:border-gray-400">
                                {subs.map((sub, idx) => (
                                  <div key={idx} className="text-[9px] text-ink-500 print:text-black leading-relaxed">
                                    {idx < subs.length - 1 ? '├─' : '└─'} {sub.qty || 1} × {sub.name}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </>
              );
            })()}
          </div>

          <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />

          {/* Subtotals & Taxes */}
          <div className="flex justify-between text-[10px]"><span>Subtotal</span><span>Rs. {Number(order.subtotal ?? order.total).toLocaleString()}</span></div>
          {order.discount_percent > 0 && (
            <div className="flex justify-between text-[10px] text-ink-600 print:text-black">
              <span>Disc ({order.discount_percent}%)</span>
              <span>- Rs. {Math.round((order.subtotal * order.discount_percent) / 100).toLocaleString()}</span>
            </div>
          )}
          {order.tax > 0 && <div className="flex justify-between text-[10px]"><span>Tax</span><span>Rs. {Number(order.tax).toLocaleString()}</span></div>}
          {order.service_charge > 0 && <div className="flex justify-between text-[10px]"><span>Service Charge</span><span>Rs. {Number(order.service_charge).toLocaleString()}</span></div>}

          <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />

          <div className="flex justify-between font-bold text-xs">
            <span>TOTAL</span>
            <span>Rs. {Number(order.total).toLocaleString()}</span>
          </div>

          {/* Payment Method */}
          {order.payment_method && (() => {
            let splitDetails = null;
            try {
              if (order.payment_details && order.payment_details.startsWith("[")) {
                splitDetails = JSON.parse(order.payment_details);
              }
            } catch (_) {}

            return (
              <>
                <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />
                <div className="flex justify-between text-[10px]"><span>Paid via</span><span>{splitDetails ? "Split Payment" : order.payment_method}</span></div>
                {splitDetails ? (
                  <div className="pl-2 space-y-0.5 text-ink-600 text-[9px] mt-1 border-l border-dashed border-canvas-300 print:text-black print:border-black">
                    {splitDetails.map((s, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>• {s.method}</span>
                        <span>Rs. {Number(s.amount || 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    {order.tendered != null && <div className="flex justify-between text-[10px]"><span>Tendered</span><span>Rs. {Number(order.tendered).toLocaleString()}</span></div>}
                    {order.change_due != null && order.change_due > 0 && <div className="flex justify-between text-[10px]"><span>Change</span><span>Rs. {Number(order.change_due).toLocaleString()}</span></div>}
                  </>
                )}
              </>
            );
          })()}

          {/* Refund Lines */}
          {refundLines.length > 0 && (
            <>
              <div className="border-t border-dashed border-ink-300 my-1.5 print:border-black" />
              <p className="font-semibold text-[10px] mb-1">Returns / Adjustments</p>
              {refundLines.map((r) => (
                <div key={r.id} className="flex justify-between text-[10px]">
                  <span>{r.kind === "adjustment" ? "Adj." : "Return"} · {r.time}</span>
                  <span>- Rs. {Number(r.amount).toLocaleString()}</span>
                </div>
              ))}
            </>
          )}

          <div className="border-t border-dashed border-ink-300 my-2 print:border-black" />
          
          {profile?.showQrCode !== false && (
            <div className="flex justify-center mb-3 mix-blend-multiply opacity-80">
              <Barcode 
                value={order.id.replace("ORD-", "")} 
                width={1.5}
                height={40}
                displayValue={false}
                margin={0}
              />
            </div>
          )}

          <p className="text-center text-[10px] text-ink-500 print:text-black">
            {profile?.receiptFooter !== undefined ? profile.receiptFooter : "Thank you for dining with us!"}
          </p>
        </div>

        <div className="px-4 py-3 border-t border-canvas-200 flex gap-2 print:hidden shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={Printer} className="flex-1" onClick={handlePrint}>Print Receipt</Button>
        </div>
      </div>
    </div>
  );
}
