import { useState, useEffect } from "react";
import { useAuth } from "../../auth/AuthContext";
import api from "../../api/client";
import Button from "../ui/Button";
import Modal from "../ui/Modal";
import Badge from "../ui/Badge";
import { Lock, Unlock, Banknote, CreditCard, Wallet, CalendarDays, Receipt } from "lucide-react";

const fmt = (n) => `Rs. ${Math.round(Number(n) || 0).toLocaleString()}`;

export default function ShiftManager() {
  const { user } = useAuth();
  const [currentShift, setCurrentShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const [openModal, setOpenModal] = useState(false);
  const [openingCash, setOpeningCash] = useState("");

  const [closeModal, setCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");

  const [summaryModal, setSummaryModal] = useState(false);
  const [summaryData, setSummaryData] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const active = await api.getCurrentShift(user?.id);
      setCurrentShift(active);

      const past = await api.listShifts();
      setHistory(past || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user?.id]);

  const handleOpenShift = async () => {
    try {
      await api.openShift({
        cashier_id: user?.id,
        cashier_name: user?.name,
        opening_cash: Number(openingCash) || 0,
      });
      setOpenModal(false);
      setOpeningCash("");
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloseShift = async () => {
    try {
      const result = await api.closeShift(currentShift.id, {
        actual_cash: Number(actualCash) || 0,
        notes: closeNotes,
      });
      setCloseModal(false);
      setActualCash("");
      setCloseNotes("");
      setSummaryData(result);
      setSummaryModal(true);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="text-sm text-ink-500 p-4">Loading shift data...</div>;

  return (
    <div className="space-y-6">
      {/* Current Shift Status */}
      <div className="bg-white border border-canvas-200 rounded-xl shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-ink-900">Current Shift</h3>
            <p className="text-sm text-ink-500">Manage your cash drawer and daily sales</p>
          </div>
          <Badge tone={currentShift ? "success" : "neutral"}>
            {currentShift ? "Shift Open" : "Shift Closed"}
          </Badge>
        </div>

        {currentShift ? (
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-canvas-50 p-4 rounded-lg border border-canvas-200">
            <div>
              <p className="text-xs font-bold text-ink-500 uppercase tracking-wider mb-1">Started At</p>
              <p className="text-sm font-medium text-ink-900">
                {new Date(currentShift.opened_at).toLocaleString()}
              </p>
              <p className="text-xs text-ink-500 mt-1">Opening Cash: {fmt(currentShift.opening_cash)}</p>
            </div>
            <Button variant="danger" icon={Lock} onClick={() => setCloseModal(true)}>
              Close Shift
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 bg-canvas-50 rounded-lg border border-dashed border-canvas-200">
            <Unlock size={32} className="text-ink-300 mb-2" />
            <p className="text-sm font-medium text-ink-900 mb-4">No active shift found for you.</p>
            <Button variant="primary" icon={Unlock} onClick={() => setOpenModal(true)}>
              Open New Shift
            </Button>
          </div>
        )}
      </div>

      {/* Shift History */}
      <div className="bg-white border border-canvas-200 rounded-xl shadow-soft p-5 overflow-hidden">
        <h3 className="text-base font-bold text-ink-900 mb-4">Past Shifts</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Date / Time</th>
                <th className="px-4 py-3">Cashier</th>
                <th className="px-4 py-3 text-right">Opening Cash</th>
                <th className="px-4 py-3 text-right">Actual Cash</th>
                <th className="px-4 py-3 text-right">Variance</th>
                <th className="px-4 py-3 rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((s, i) => (
                <tr key={s.id || i} className="border-t border-canvas-100 hover:bg-canvas-50/50 transition-colors">
                  <td className="px-4 py-3 text-ink-900 font-medium">
                    {new Date(s.opened_at).toLocaleDateString()}<br/>
                    <span className="text-xs text-ink-500 font-normal">
                      {new Date(s.opened_at).toLocaleTimeString()} - {s.closed_at ? new Date(s.closed_at).toLocaleTimeString() : 'Now'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-700">{s.cashier_name}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-600">{fmt(s.opening_cash)}</td>
                  <td className="px-4 py-3 text-right font-mono text-ink-900">{s.actual_cash != null ? fmt(s.actual_cash) : '-'}</td>
                  <td className={`px-4 py-3 text-right font-mono font-medium ${s.variance < 0 ? 'text-paprika-600' : s.variance > 0 ? 'text-basil-600' : 'text-ink-500'}`}>
                    {s.variance != null ? fmt(s.variance) : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={s.status === 'open' ? 'success' : 'neutral'}>{s.status}</Badge>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-400">
                    No past shifts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Shift Modal */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title="Open Shift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleOpenShift}>Confirm Opening</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600 mb-4">Enter the starting cash amount in the drawer.</p>
        <div>
          <label className="text-xs font-medium text-ink-600">Opening Cash (Rs.)</label>
          <input
            type="number"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="e.g. 5000"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
          />
        </div>
      </Modal>

      {/* Close Shift Modal */}
      <Modal
        open={closeModal}
        onClose={() => setCloseModal(false)}
        title="Close Shift"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCloseModal(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleCloseShift}>Submit & Close</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600 mb-4">Count the cash in the drawer and enter it below to reconcile.</p>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-ink-600">Actual Cash Count (Rs.)</label>
            <input
              type="number"
              value={actualCash}
              onChange={(e) => setActualCash(e.target.value)}
              placeholder="e.g. 15450"
              className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-paprika-500/30"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Notes / Remarks</label>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Any discrepancies?"
              className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
              rows={3}
            />
          </div>
        </div>
      </Modal>

      {/* Summary Modal */}
      <Modal
        open={summaryModal}
        onClose={() => setSummaryModal(false)}
        title="Shift Summary"
        footer={
          <Button variant="primary" onClick={() => setSummaryModal(false)}>Done</Button>
        }
      >
        {summaryData && (
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-canvas-100">
              <span className="text-sm text-ink-600">Expected Cash</span>
              <span className="text-sm font-mono font-bold text-ink-900">{fmt(summaryData.expectedCash)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-canvas-100">
              <span className="text-sm text-ink-600">Actual Cash Entered</span>
              <span className="text-sm font-mono font-bold text-ink-900">{fmt(summaryData.actual_cash)}</span>
            </div>
            <div className="flex justify-between items-center py-2 bg-canvas-50 px-3 rounded-lg border border-canvas-200">
              <span className="text-sm font-bold text-ink-900">Variance</span>
              <span className={`text-sm font-mono font-bold ${summaryData.variance < 0 ? 'text-paprika-600' : summaryData.variance > 0 ? 'text-basil-600' : 'text-ink-600'}`}>
                {fmt(summaryData.variance)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
