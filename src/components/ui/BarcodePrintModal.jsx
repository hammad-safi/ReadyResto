import React, { useState } from "react";
import Modal from "./Modal";
import Barcode from "react-barcode";
import { Printer, Minus, Plus } from "lucide-react";

export default function BarcodePrintModal({ isOpen, onClose, item }) {
  const [quantity, setQuantity] = useState(1);

  if (!isOpen || !item) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      {/* Configuration Modal - Hidden on print */}
      <Modal open={isOpen} onClose={onClose} title={`Print Labels: ${item.name}`} width="max-w-md" className="print:hidden">
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center bg-canvas-50 p-6 rounded-xl border border-canvas-200">
            {item.barcode ? (
              <Barcode value={item.barcode} width={1.5} height={40} fontSize={14} background="transparent" />
            ) : (
              <p className="text-ink-500 text-sm italic">No barcode available</p>
            )}
            <p className="text-sm font-semibold mt-2 text-ink-900">{item.name}</p>
            <p className="text-xs text-ink-500">Rs. {item.price}</p>
          </div>

          <div>
            <label className="text-xs font-medium text-ink-600 block mb-2">Quantity to Print</label>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-canvas-200 flex items-center justify-center text-ink-600 hover:bg-canvas-50 transition-colors"
              >
                <Minus size={16} />
              </button>
              <input 
                type="number" 
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="flex-1 h-10 border border-canvas-200 bg-white rounded-lg text-center font-semibold text-ink-900 outline-none focus:border-paprika-500 focus:ring-2 focus:ring-paprika-500/20"
              />
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-canvas-200 flex items-center justify-center text-ink-600 hover:bg-canvas-50 transition-colors"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <button
            onClick={handlePrint}
            disabled={!item.barcode}
            className="w-full py-3 bg-paprika-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-paprika-600 disabled:opacity-50 transition-colors"
          >
            <Printer size={18} />
            Print {quantity} Labels
          </button>
        </div>
      </Modal>

      {/* Hidden print container that ONLY shows during print */}
      {isOpen && (
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .barcode-print-container, .barcode-print-container * {
              visibility: visible;
            }
            .barcode-print-container {
              position: absolute;
              left: 0;
              top: 0;
            }
          }
        `}</style>
      )}
      
      {isOpen && (
        <div className="barcode-print-container hidden print:grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 p-4 bg-white absolute inset-0 z-[9999] w-full min-h-screen">
          {Array.from({ length: quantity }).map((_, i) => (
            <div key={i} className="flex flex-col items-center justify-center p-4 border border-gray-300 rounded-lg text-black page-break-inside-avoid">
              {item.barcode && (
                <Barcode value={item.barcode} width={1.2} height={40} fontSize={12} background="transparent" displayValue={true} />
              )}
              <div className="text-center mt-1">
                <p className="font-bold text-sm leading-tight max-w-[120px] truncate">{item.name}</p>
                <p className="text-xs">Rs. {item.price}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
