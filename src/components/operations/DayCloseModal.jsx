import { useState, useEffect } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { Calculator, DollarSign, CreditCard, Receipt } from "lucide-react";

export default function DayCloseModal({ open, onClose, onComplete }) {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [cashInput, setCashInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      api.getDashboardSummary().then((data) => {
        setSummary({
          totalSales: data.todaySales,
          cashSales: data.todaySales * 0.7, // Simulated
          cardSales: data.todaySales * 0.3, // Simulated
          expenses: data.expensesTotal,
          netCash: (data.todaySales * 0.7) - data.expensesTotal,
          openOrders: data.todayOrders // Simulated open count
        });
      });
    }
  }, [open]);

  const handleCloseDay = async () => {
    setLoading(true);
    await api.closeDay({
      ...summary,
      actualCash: Number(cashInput),
      user: user?.name,
    });
    setLoading(false);
    onClose();
    if (onComplete) onComplete();
  };

  if (!summary) return null;

  const difference = Number(cashInput) - summary.netCash;

  return (
    <Modal open={open} onClose={onClose} title="Close Register & End of Day">
      <div className="space-y-6">
        <p className="text-sm text-ink-600">
          Review today's financial summary before closing the day. Ensure all active orders are settled.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-500">
              <DollarSign size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Cash Sales</span>
            </div>
            <span className="text-xl font-mono font-semibold text-ink-900">Rs. {summary.cashSales.toLocaleString()}</span>
          </div>
          
          <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-500">
              <CreditCard size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Card Sales</span>
            </div>
            <span className="text-xl font-mono font-semibold text-ink-900">Rs. {summary.cardSales.toLocaleString()}</span>
          </div>

          <div className="bg-canvas-50 border border-canvas-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-ink-500">
              <Receipt size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Expenses</span>
            </div>
            <span className="text-xl font-mono font-semibold text-paprika-600">Rs. {summary.expenses.toLocaleString()}</span>
          </div>

          <div className="bg-paprika-50 border border-paprika-200 rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 text-paprika-700">
              <Calculator size={16} />
              <span className="text-xs font-semibold uppercase tracking-wider">Expected Net Cash</span>
            </div>
            <span className="text-xl font-mono font-semibold text-paprika-800">Rs. {summary.netCash.toLocaleString()}</span>
          </div>
        </div>

        <div className="border-t border-canvas-200 pt-6">
          <label className="block text-sm font-semibold text-ink-900 mb-2">Enter Actual Cash in Drawer</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 font-medium">Rs.</span>
            <input
              type="number"
              value={cashInput}
              onChange={(e) => setCashInput(e.target.value)}
              placeholder="0.00"
              className="w-full pl-10 pr-4 py-2 border border-canvas-200 rounded-lg outline-none focus:border-paprika-500 focus:ring-1 focus:ring-paprika-500 text-lg font-mono"
            />
          </div>
          
          {cashInput !== "" && (
            <p className={`text-xs mt-2 font-medium ${difference === 0 ? 'text-basil-600' : 'text-paprika-600'}`}>
              Difference: {difference >= 0 ? '+' : ''}Rs. {difference.toLocaleString()}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-canvas-200 pt-4">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleCloseDay} disabled={loading || cashInput === ""}>
            {loading ? "Closing..." : "Confirm Day Close"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
