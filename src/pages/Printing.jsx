import { useState } from "react";
import { Printer as PrinterIcon, Loader2 } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import { printReport } from "../../src/utils/export";

const TEMPLATES = ["Thermal Receipt", "Kitchen Ticket", "Purchase Invoice", "Expense Report", "Sales Report", "Barcode Label", "QR Label"];
const PRINTERS = [
  { role: "Cashier Printer", name: "EPSON TM-T82 (USB)" },
  { role: "Kitchen Printer — Grill", name: "XPrinter XP-58 (Network)" },
  { role: "Kitchen Printer — Bar", name: "XPrinter XP-58 (Network)" },
];

export default function Printing() {
  const [printingId, setPrintingId] = useState(null);

  const handleTestPrint = (role) => {
    setPrintingId(role);
    setTimeout(() => {
      printReport(); // trigger native window.print()
      setPrintingId(null);
    }, 800);
  };

  return (
    <div>
      <PageHeader eyebrow="System" title="Printing" description="Assign printers and manage document templates." />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5">
          <p className="font-display font-semibold text-ink-900 mb-4">Connected Printers</p>
          <div className="space-y-3">
            {PRINTERS.map((p) => {
              const isPrinting = printingId === p.role;
              return (
                <div key={p.role} className="flex items-center justify-between border border-canvas-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-canvas-100 flex items-center justify-center text-ink-600">
                      <PrinterIcon size={16} className={isPrinting ? "animate-bounce" : ""} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink-900">{p.role}</p>
                      <p className="text-xs text-ink-500">{p.name}</p>
                    </div>
                  </div>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => handleTestPrint(p.role)}
                    disabled={isPrinting}
                  >
                    {isPrinting ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Printing</span> : "Test Print"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5">
          <p className="font-display font-semibold text-ink-900 mb-4">Print Templates</p>
          <div className="space-y-2">
            {TEMPLATES.map((t) => (
              <div key={t} className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-canvas-50">
                <span className="text-sm text-ink-800">{t}</span>
                <div className="flex gap-2">
                  <button className="text-xs font-medium text-ink-600 hover:text-paprika-600">Preview</button>
                  <button className="text-xs font-medium text-paprika-600">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hidden print area for test receipt */}
      {printingId && (
        <div id="receipt-print-area" className="absolute top-[-9999px] left-[-9999px] print:top-0 print:left-0 font-mono text-[12px] leading-relaxed text-black">
          <div className="text-center mb-3">
            <h2 className="font-bold text-sm">DASTARKHWAN ERP</h2>
            <p className="text-[11px] italic mb-0.5">--- TEST PRINT ---</p>
            <p className="text-[11px]">Printer: {printingId}</p>
          </div>
          <div className="border-t border-dashed border-black my-2" />
          <div className="flex justify-between">
            <span>Status:</span>
            <span>Online</span>
          </div>
          <div className="flex justify-between">
            <span>Interface:</span>
            <span>USB/Network Connection</span>
          </div>
          <div className="border-t border-dashed border-black my-2" />
          <div className="text-center mt-3 text-[10px]">
            <p>Print test succeeded!</p>
            <p>{new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
}
