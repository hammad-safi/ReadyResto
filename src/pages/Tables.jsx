import { useEffect, useState } from "react";
import { Users, Plus } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const STATUS_STYLES = {
  available: "bg-basil-500/10 border-basil-500 text-basil-600",
  occupied: "bg-paprika-500/10 border-paprika-500 text-paprika-600",
  reserved: "bg-saffron-400/15 border-saffron-500 text-saffron-500",
  cleaning: "bg-canvas-200 border-ink-500/30 text-ink-500",
};

export default function Tables() {
  const { user } = useAuth();
  const [tables, setTables] = useState([]);
  const [selected, setSelected] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ id: "", section: "Ground Floor", seats: 4 });

  const load = () => api.list("tables_floor").then(setTables);
  useEffect(() => {
    void load();
  }, []);

  const sections = [...new Set(tables.map((t) => t.section))];

  const setStatus = async (table, status) => {
    await api.update("tables_floor", table.id, { status, order_id: status === "available" ? null : table.order_id }, {
      user: user.name, module: "Table Management", action: `Marked ${table.id} as ${status}`,
    });
    setSelected(null);
    load();
  };

  const addTable = async () => {
    await api.create("tables_floor", { ...form, status: "available", order_id: null }, {
      user: user.name, module: "Table Management", action: `Added table ${form.id}`,
    });
    setAddOpen(false);
    setForm({ id: "", section: "Ground Floor", seats: 4 });
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Live floor"
        title="Table Management"
        description="Tap a table to view actions — new order, merge, split, reserve."
        actions={<Button variant="primary" icon={Plus} onClick={() => setAddOpen(true)}>Add Table</Button>}
      />

      <div className="flex items-center gap-4 mb-6 text-xs text-ink-600 flex-wrap">
        {Object.entries(STATUS_STYLES).map(([k, cls]) => (
          <div key={k} className="flex items-center gap-1.5 capitalize">
            <span className={`h-2.5 w-2.5 rounded-full border ${cls}`} />
            {k}
          </div>
        ))}
      </div>

      {sections.map((section) => (
        <div key={section} className="mb-8">
          <p className="font-display font-semibold text-sm text-ink-900 mb-3">{section}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
            {tables.filter((t) => t.section === section).map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className={`rounded-xl2 border-2 p-4 flex flex-col gap-2 shadow-soft hover:-translate-y-0.5 transition-transform ${STATUS_STYLES[t.status]}`}
              >
                <span className="font-mono font-semibold text-ink-900 text-sm">{t.id}</span>
                <div className="flex items-center gap-1 text-xs text-ink-600">
                  <Users size={12} /> {t.seats} seats
                </div>
                <span className="text-[11px] font-medium capitalize">
                  {t.status === "occupied" ? `Order ${t.order_id || ""}` : t.status}
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `Table ${selected.id}` : ""}>
        {selected && (
          <div className="space-y-2">
            {selected.status === "available" && <Button variant="primary" className="w-full">New Order</Button>}
            {selected.status === "occupied" && (
              <Button variant="primary" className="w-full">View Current Order ({selected.order_id})</Button>
            )}
            <Button variant="secondary" className="w-full">Merge Table</Button>
            <Button variant="secondary" className="w-full">Split Bill</Button>
            <Button variant="secondary" className="w-full">Transfer Table</Button>
            <Button variant="secondary" className="w-full" onClick={() => setStatus(selected, "cleaning")}>Mark as Cleaning</Button>
            <Button variant="secondary" className="w-full" onClick={() => setStatus(selected, "available")}>Mark as Available</Button>
            <Button variant="secondary" className="w-full" onClick={() => setStatus(selected, "reserved")}>Reserve Table</Button>
          </div>
        )}
      </Modal>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Table"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addTable}>Add Table</Button>
          </>
        }
      >
        <label className="text-xs font-medium text-ink-600">Table Number / ID</label>
        <input value={form.id} onChange={(e) => setForm((p) => ({ ...p, id: e.target.value }))} placeholder="e.g. T-09" className="w-full mt-1 mb-3 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
        <label className="text-xs font-medium text-ink-600">Section / Floor</label>
        <input
          value={form.section}
          onChange={(e) => setForm((p) => ({ ...p, section: e.target.value }))}
          placeholder="e.g. Balcony, Rooftop, VIP"
          list="table-sections"
          className="w-full mt-1 mb-3 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none"
        />
        <datalist id="table-sections">
          {[...new Set(["Ground Floor", "Rooftop", "VIP", "Balcony", ...sections])].map((section) => (
            <option key={section} value={section} />
          ))}
        </datalist>
        <label className="text-xs font-medium text-ink-600">Seating Capacity</label>
        <input type="number" value={form.seats} onChange={(e) => setForm((p) => ({ ...p, seats: Number(e.target.value) }))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
      </Modal>
    </div>
  );
}
