import { Printer, X } from "lucide-react";
import Button from "../ui/Button";

export default function PurchaseReceipt({ po, items, profile, onClose }) {
  if (!po) return null;

  const handlePrint = () => window.print();

  let splitDetails = null;
  try {
    if (po.payment_details && po.payment_details.startsWith("[")) {
      splitDetails = JSON.parse(po.payment_details);
    }
  } catch (_) {}

  const barcodeStr = `*PO-${String(po.id).padStart(4, "0")}*`;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 print:p-0 print:absolute print:top-0 print:left-0 print:block">
      <link 
        href="https://fonts.googleapis.com/css2?family=Libre+Barcode+39&display=swap" 
        rel="stylesheet"
      />
      
      <div className="absolute inset-0 bg-ink-950/60 print:hidden" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-xl2 shadow-card flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:rounded-none print:w-[80mm] print:max-w-none print:static">
        <div className="flex items-center justify-between px-4 py-3 border-b border-canvas-200 print:hidden shrink-0">
          <h3 className="font-display font-semibold text-ink-900 text-sm">Purchase Invoice — PO-#{String(po.id).padStart(4, "0")}</h3>
          <button onClick={onClose} className="h-8 w-8 rounded-lg flex items-center justify-center text-ink-500 hover:bg-canvas-100">
            <X size={18} />
          </button>
        </div>

        <div id="receipt-print-area" className="overflow-y-auto px-6 py-5 font-mono text-[12px] leading-relaxed text-ink-800">
          <div className="text-center mb-3">
            {profile?.showLogo !== false && (
              <div className="h-10 w-10 rounded-lg bg-ink-900 text-white flex items-center justify-center font-display font-bold text-lg mx-auto mb-2">
                {(profile?.name || "R")[0]}
              </div>
            )}
            <p className="font-display font-bold text-sm text-ink-900">{profile?.name || "Restaurant"}</p>
            {profile?.address && <p className="text-[11px] text-ink-500">{profile.address}</p>}
            {profile?.phone && <p className="text-[11px] text-ink-500">Ph: {profile.phone}</p>}
            <p className="text-[11px] text-ink-900 font-bold uppercase tracking-wider mt-2">Goods Received Invoice</p>
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="space-y-0.5 text-[11px] text-ink-600">
            <div className="flex justify-between">
              <span>PO Number:</span>
              <span className="font-bold">PO-#{String(po.id).padStart(4, "0")}</span>
            </div>
            <div className="flex justify-between">
              <span>Invoice Ref:</span>
              <span className="font-mono">{po.invoice_number || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span>Date:</span>
              <span>{po.date}</span>
            </div>
            <div className="flex justify-between">
              <span>Supplier:</span>
              <span className="font-bold">{po.supplier || "Metro Cash & Carry"}</span>
            </div>
            <div className="flex justify-between">
              <span>Payment Term:</span>
              <span>{po.payment_term || "Cash"}</span>
            </div>
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="space-y-1">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between gap-2">
                <span className="flex-1 truncate">{it.qty} {it.unit} × {it.name}</span>
                <span>Rs. {(it.qty * it.cost).toLocaleString()}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />

          <div className="flex justify-between text-sm font-semibold text-ink-900">
            <span>TOTAL VALUE</span>
            <span>Rs. {Number(po.total || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-ink-700 mt-1">
            <span>Amount Paid:</span>
            <span>Rs. {Number(po.amount_paid_on_receive || 0).toLocaleString()}</span>
          </div>

          <div className="flex justify-between text-paprika-600 mt-0.5">
            <span>Remaining Due:</span>
            <span>Rs. {Math.max(0, Number(po.total || 0) - Number(po.amount_paid_on_receive || 0)).toLocaleString()}</span>
          </div>

          {splitDetails && (
            <div className="pl-2 space-y-0.5 text-ink-600 text-[11px] mt-1 border-l border-dashed border-canvas-300">
              {splitDetails.map((s, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>• {s.method}</span>
                  <span>Rs. {Number(s.amount || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          )}

          {po.special_note && (
            <>
              <div className="border-t border-dashed border-ink-300 my-2" />
              <p className="text-[10px] text-ink-500 italic">Notes: {po.special_note}</p>
            </>
          )}

          <div className="border-t border-dashed border-ink-300 my-3" />
          <div className="text-center py-2">
            <span 
              className="block font-mono text-[42px] tracking-normal select-none leading-none"
              style={{ fontFamily: "'Libre Barcode 39', cursive" }}
            >
              {barcodeStr}
            </span>
            <span className="text-[10px] text-ink-500 font-mono tracking-widest block mt-1">
              {barcodeStr.replace(/\*/g, "")}
            </span>
          </div>

          <div className="border-t border-dashed border-ink-300 my-2" />
          <p className="text-center text-[10px] text-ink-400">Inventory Stock Levels and Supplier Payables updated successfully.</p>
        </div>

        <div className="px-4 py-3 border-t border-canvas-200 flex gap-2 print:hidden shrink-0">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Close</Button>
          <Button variant="primary" icon={Printer} className="flex-1" onClick={handlePrint}>Print Invoice</Button>
        </div>
      </div>
    </div>
  );
}