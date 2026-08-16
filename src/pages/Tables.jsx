import { useEffect, useState } from "react";
import { Users, Plus, Merge, ArrowRightLeft, Trash2, ExternalLink, Brush, CheckCircle, Calendar, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const STATUS_STYLES = {
  available: "bg-basil-500/5 border-basil-500/30 hover:border-basil-500 text-basil-700 hover:bg-basil-500/10",
  occupied: "bg-paprika-500/5 border-paprika-500/30 hover:border-paprika-500 text-paprika-700 hover:bg-paprika-500/10",
  reserved: "bg-saffron-400/10 border-saffron-500/30 hover:border-saffron-500 text-saffron-600 hover:bg-saffron-400/15",
  cleaning: "bg-canvas-100 border-ink-500/20 hover:border-ink-500/40 text-ink-600 hover:bg-canvas-200/50",
};

function nextOrderId() {
  return `ORD-${Date.now().toString().slice(-6)}`;
}

export default function Tables() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [activeModal, setActiveModal] = useState("main"); // "main" | "new_order" | "merge" | "transfer"
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  
  // New Order / Merge / Transfer states
  const [seatsToOccupy, setSeatsToOccupy] = useState(1);
  const [targetTableId, setTargetTableId] = useState("");
  const [targetSeats, setTargetSeats] = useState(1);

  // Add table state
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ id: "", section: "Ground Floor", seats: 4 });

  const load = async () => {
    try {
      const tbls = await api.list("tables_floor");
      const ords = await api.list("orders");
      setTables(tbls);
      setOrders(ords);
    } catch (err) {
      console.error("Error loading floor data", err);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const sections = [...new Set(tables.map((t) => t.section))];

  const isMergedOrder = (orderId) => {
    const ord = orders.find((o) => o.id === orderId);
    return ord && ord.table_assignments && ord.table_assignments.length > 1;
  };

  const getTableOccupiedCount = (table) => {
    return (table.occupied_seats || []).reduce((sum, o) => sum + o.seats_occupied, 0);
  };

  const setStatus = async (table, status) => {
    await api.update("tables_floor", table.id, { status });
    setSelected(null);
    load();
  };

  const addTable = async () => {
    await api.create("tables_floor", { ...form, status: "available", order_id: null, occupied_seats: [] }, {
      user: user.name, module: "Table Management", action: `Added table ${form.id}`,
    });
    setAddOpen(false);
    setForm({ id: "", section: "Ground Floor", seats: 4 });
    load();
  };

  const startNewOrder = async () => {
    const newId = nextOrderId();
    const orderObj = {
      id: newId,
      type: "Dine-In",
      table_id: selected.id,
      table_assignments: [{ table_id: selected.id, seats_occupied: seatsToOccupy }],
      customer: "Walk-in",
      items_count: 0,
      total: 0,
      status: "new",
      waiter: user.name,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString()
    };
    await api.createOrderWithItems(orderObj, []);
    localStorage.setItem("active_pos_order_id", newId);
    navigate("/pos");
  };

  const handleMerge = async () => {
    if (!targetTableId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const currentAssignments = order.table_assignments || [
      { table_id: order.table_id, seats_occupied: tables.find(t => t.id === order.table_id)?.seats || 4 }
    ];

    if (currentAssignments.some(a => a.table_id === targetTableId)) {
      return;
    }

    const updatedAssignments = [
      ...currentAssignments,
      { table_id: targetTableId, seats_occupied: targetSeats }
    ];

    await api.assignTablesAndSeats(selectedOrderId, updatedAssignments);
    setSelected(null);
    setActiveModal("main");
    load();
  };

  const handleTransfer = async () => {
    if (!targetTableId) return;
    const order = orders.find(o => o.id === selectedOrderId);
    if (!order) return;

    const updatedAssignments = [
      { table_id: targetTableId, seats_occupied: targetSeats }
    ];

    await api.assignTablesAndSeats(selectedOrderId, updatedAssignments);
    setSelected(null);
    setActiveModal("main");
    load();
  };

  const handleRemoveAssignment = async (orderId, tableIdToRemove) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const currentAssignments = order.table_assignments || [
      { table_id: order.table_id, seats_occupied: tables.find(t => t.id === order.table_id)?.seats || 4 }
    ];

    const updatedAssignments = currentAssignments.filter(a => a.table_id !== tableIdToRemove);
    await api.assignTablesAndSeats(orderId, updatedAssignments);
    
    if (selected && selected.id === tableIdToRemove) {
      setSelected(null);
    }
    load();
  };

  const viewOrder = (orderId) => {
    localStorage.setItem("active_pos_order_id", orderId);
    navigate("/pos");
  };

  const getTableOccupiedInfo = (t) => {
    const count = getTableOccupiedCount(t);
    const isFull = count >= t.seats;
    const isMerged = (t.occupied_seats || []).some(o => isMergedOrder(o.order_id));

    return { count, isFull, isMerged };
  };

  // RENDER MAIN MODAL ACTIONS
  const renderMainModal = () => {
    const count = getTableOccupiedCount(selected);
    const isOccupied = (selected.occupied_seats || []).length > 0;

    return (
      <div className="space-y-4">
        {/* Table summary info */}
        <div className="flex items-center justify-between p-3.5 bg-canvas-50 rounded-xl border border-canvas-200 text-sm">
          <div>
            <p className="font-semibold text-ink-900">Section: {selected.section}</p>
            <p className="text-xs text-ink-500 mt-0.5">Capacity: {selected.seats} seats</p>
          </div>
          <span className={`text-xs font-bold capitalize px-3 py-1 rounded-full border ${STATUS_STYLES[selected.status]}`}>
            {selected.status} {isOccupied && `(${count}/${selected.seats} seats occupied)`}
          </span>
        </div>

        {/* If occupied, list orders */}
        {isOccupied && (
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-ink-400">Current Orders Seated</h4>
            {(selected.occupied_seats || []).map((occ) => {
              const order = orders.find(o => o.id === occ.order_id);
              const isMerged = isMergedOrder(occ.order_id);
              return (
                <div key={occ.order_id} className="p-4 bg-white border border-canvas-200 rounded-xl shadow-sm space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-sm text-ink-900">{occ.order_id}</span>
                        {isMerged && (
                          <span className="text-[10px] font-bold text-basil-700 bg-basil-100 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Merge size={10} /> Merged
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ink-500 mt-1">
                        Customer: {order?.customer || "Walk-in"} • Seats: {occ.seats_occupied}
                      </p>
                      {order && (
                        <p className="text-xs font-bold text-paprika-600 mt-1">
                          Total: Rs. {order.total.toLocaleString()}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="text-ink-600 border border-canvas-200" onClick={() => viewOrder(occ.order_id)}>
                        <ExternalLink size={13} className="mr-1" /> View POS
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-canvas-100">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs font-bold"
                      onClick={() => {
                        setSelectedOrderId(occ.order_id);
                        setTargetTableId("");
                        setTargetSeats(1);
                        setActiveModal("merge");
                      }}
                    >
                      <Merge size={13} className="mr-1.5" /> Merge Table
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="w-full text-xs font-bold"
                      onClick={() => {
                        setSelectedOrderId(occ.order_id);
                        setTargetTableId("");
                        setTargetSeats(1);
                        setActiveModal("transfer");
                      }}
                    >
                      <ArrowRightLeft size={13} className="mr-1.5" /> Transfer Order
                    </Button>
                  </div>

                  {/* Merge breakdown */}
                  {isMerged && order?.table_assignments && (
                    <div className="pt-2.5 border-t border-canvas-100 space-y-1.5">
                      <p className="text-[10px] font-extrabold text-ink-400 uppercase tracking-wider">Merged Tables breakdown</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {order.table_assignments.map((assign) => (
                          <div key={assign.table_id} className="flex items-center justify-between text-xs py-1 px-2 bg-canvas-50 rounded border border-canvas-200">
                            <span className="font-semibold text-ink-800">
                              Table {assign.table_id} ({assign.seats_occupied} seats)
                            </span>
                            <button
                              className="text-paprika-600 hover:text-paprika-700 transition-colors p-1"
                              title="Release table from merge"
                              onClick={() => handleRemoveAssignment(occ.order_id, assign.table_id)}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Available actions */}
        <div className="pt-4 border-t border-canvas-200 space-y-2">
          {!isOccupied && (
            <Button
              variant="primary"
              className="w-full justify-center text-sm font-bold bg-basil-600 hover:bg-basil-700 text-white"
              onClick={() => {
                setActiveModal("new_order");
                setSeatsToOccupy(selected.seats);
              }}
            >
              New Order
            </Button>
          )}
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="secondary"
              className="text-xs font-semibold px-2 py-2"
              disabled={selected.status === "cleaning"}
              onClick={() => setStatus(selected, "cleaning")}
            >
              <Brush size={13} className="mr-1" /> Mark Cleaning
            </Button>
            <Button
              variant="secondary"
              className="text-xs font-semibold px-2 py-2"
              disabled={selected.status === "available" && !isOccupied}
              onClick={() => setStatus(selected, "available")}
            >
              <CheckCircle size={13} className="mr-1" /> Mark Available
            </Button>
            <Button
              variant="secondary"
              className="text-xs font-semibold px-2 py-2"
              disabled={selected.status === "reserved"}
              onClick={() => setStatus(selected, "reserved")}
            >
              <Calendar size={13} className="mr-1" /> Reserve Table
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // RENDER NEW ORDER MODAL
  const renderNewOrderModal = () => {
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-ink-900">Start Dine-In Order</h4>
          <p className="text-xs text-ink-500 mt-0.5">Select seating capacity to occupy on Table {selected.id}</p>
        </div>

        <div className="p-4 bg-canvas-50 rounded-xl border border-canvas-200 text-center space-y-3">
          <label className="block text-xs font-bold text-ink-600 uppercase tracking-wider">Seats to Occupy</label>
          <div className="flex items-center justify-center gap-4">
            <button
              className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
              disabled={seatsToOccupy <= 1}
              onClick={() => setSeatsToOccupy(prev => prev - 1)}
            >
              -
            </button>
            <span className="font-mono font-black text-xl text-ink-900 w-8">{seatsToOccupy}</span>
            <button
              className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
              disabled={seatsToOccupy >= selected.seats}
              onClick={() => setSeatsToOccupy(prev => prev + 1)}
            >
              +
            </button>
          </div>
          <p className="text-[11px] text-ink-400">Total Table Seating Capacity: {selected.seats}</p>
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t border-canvas-200">
          <Button variant="secondary" onClick={() => setActiveModal("main")}>
            Back
          </Button>
          <Button variant="primary" className="bg-basil-600 hover:bg-basil-700 text-white font-bold" onClick={startNewOrder}>
            Confirm & Start POS
          </Button>
        </div>
      </div>
    );
  };

  // RENDER MERGE MODAL
  const renderMergeModal = () => {
    const order = orders.find(o => o.id === selectedOrderId);
    const occupiedTableIds = order ? (order.table_assignments || []).map(a => a.table_id) : [selected.id];
    const eligibleTables = tables.filter(t => !occupiedTableIds.includes(t.id));

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-ink-900">Merge Seats with Order {selectedOrderId}</h4>
          <p className="text-xs text-ink-500 mt-0.5">Select a table to merge and choose seats to assign to this order.</p>
        </div>

        {eligibleTables.length === 0 ? (
          <div className="p-6 text-center bg-canvas-50 rounded-xl border border-dashed border-canvas-200">
            <ShieldAlert className="mx-auto text-ink-400 mb-2" size={24} />
            <p className="text-xs text-ink-500 font-bold">No other tables available to merge.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Floor Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink-600 uppercase tracking-wider">Select Table to Merge</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border border-canvas-200 rounded-xl bg-canvas-50/50">
                {eligibleTables.map(t => {
                  const occupiedCount = getTableOccupiedCount(t);
                  const remaining = t.seats - occupiedCount;
                  const isSelected = targetTableId === t.id;

                  if (remaining <= 0) return null;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetTableId(t.id);
                        setTargetSeats(Math.min(targetSeats, remaining));
                      }}
                      className={`p-2.5 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? "border-basil-500 bg-basil-500/10 shadow-sm"
                          : "border-canvas-200 bg-white hover:border-basil-400 hover:bg-basil-50/30"
                      }`}
                    >
                      <span className="font-mono font-bold text-xs text-ink-900">{t.id}</span>
                      <span className="text-[10px] text-ink-500">
                        {remaining}/{t.seats} free
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {targetTableId && (
              <div className="p-4 bg-canvas-50 rounded-xl border border-canvas-200 text-center space-y-3">
                <label className="block text-xs font-bold text-ink-600 uppercase tracking-wider">
                  Seats to merge from Table {targetTableId}
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
                    disabled={targetSeats <= 1}
                    onClick={() => setTargetSeats(prev => prev - 1)}
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-ink-900 w-8">{targetSeats}</span>
                  <button
                    className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
                    disabled={
                      targetSeats >= (tables.find(t => t.id === targetTableId)?.seats - getTableOccupiedCount(tables.find(t => t.id === targetTableId)))
                    }
                    onClick={() => setTargetSeats(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-canvas-200">
          <Button variant="secondary" onClick={() => setActiveModal("main")}>
            Back
          </Button>
          <Button
            variant="primary"
            className="bg-basil-600 hover:bg-basil-700 text-white font-bold disabled:opacity-50"
            disabled={!targetTableId}
            onClick={handleMerge}
          >
            Confirm Merge
          </Button>
        </div>
      </div>
    );
  };

  // RENDER TRANSFER MODAL
  const renderTransferModal = () => {
    const eligibleTables = tables.filter(t => t.id !== selected.id);

    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold text-ink-900">Transfer Order {selectedOrderId}</h4>
          <p className="text-xs text-ink-500 mt-0.5">Select a new table and specify seats to transfer the order to.</p>
        </div>

        {eligibleTables.length === 0 ? (
          <div className="p-6 text-center bg-canvas-50 rounded-xl border border-dashed border-canvas-200">
            <ShieldAlert className="mx-auto text-ink-400 mb-2" size={24} />
            <p className="text-xs text-ink-500 font-bold">No other tables available to transfer.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Visual Floor Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-ink-600 uppercase tracking-wider">Select Target Table</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border border-canvas-200 rounded-xl bg-canvas-50/50">
                {eligibleTables.map(t => {
                  const occupiedCount = getTableOccupiedCount(t);
                  const remaining = t.seats - occupiedCount;
                  const isSelected = targetTableId === t.id;

                  if (remaining <= 0) return null;

                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setTargetTableId(t.id);
                        setTargetSeats(Math.min(targetSeats, remaining));
                      }}
                      className={`p-2.5 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                        isSelected
                          ? "border-basil-500 bg-basil-500/10 shadow-sm"
                          : "border-canvas-200 bg-white hover:border-basil-400 hover:bg-basil-50/30"
                      }`}
                    >
                      <span className="font-mono font-bold text-xs text-ink-900">{t.id}</span>
                      <span className="text-[10px] text-ink-500">
                        {remaining}/{t.seats} free
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {targetTableId && (
              <div className="p-4 bg-canvas-50 rounded-xl border border-canvas-200 text-center space-y-3">
                <label className="block text-xs font-bold text-ink-600 uppercase tracking-wider">
                  Seats to occupy on Table {targetTableId}
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
                    disabled={targetSeats <= 1}
                    onClick={() => setTargetSeats(prev => prev - 1)}
                  >
                    -
                  </button>
                  <span className="font-mono font-black text-xl text-ink-900 w-8">{targetSeats}</span>
                  <button
                    className="w-9 h-9 rounded-lg bg-white border border-canvas-300 flex items-center justify-center font-bold text-ink-800 hover:bg-canvas-100 disabled:opacity-50"
                    disabled={
                      targetSeats >= (tables.find(t => t.id === targetTableId)?.seats - getTableOccupiedCount(tables.find(t => t.id === targetTableId)))
                    }
                    onClick={() => setTargetSeats(prev => prev + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end pt-2 border-t border-canvas-200">
          <Button variant="secondary" onClick={() => setActiveModal("main")}>
            Back
          </Button>
          <Button
            variant="primary"
            className="bg-basil-600 hover:bg-basil-700 text-white font-bold disabled:opacity-50"
            disabled={!targetTableId}
            onClick={handleTransfer}
          >
            Confirm Transfer
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Live floor"
        title="Table Management"
        description="Tap a table to view actions — new order, merge, transfer, reserve."
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
            {tables.filter((t) => t.section === section).map((t) => {
              const { count, isFull, isMerged } = getTableOccupiedInfo(t);
              const isOccupied = count > 0;
              const displayStatus = isOccupied ? "occupied" : t.status;
              
              return (
                <button
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`relative rounded-xl2 border-2 p-4 flex flex-col gap-2 shadow-soft hover:-translate-y-0.5 transition-transform ${STATUS_STYLES[displayStatus]}`}
                >
                  {isMerged && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold text-basil-700 bg-basil-100 px-1 rounded flex items-center gap-0.5 border border-basil-200">
                      ⊕ Merged
                    </span>
                  )}
                  
                  <span className="font-mono font-semibold text-ink-900 text-sm">{t.id}</span>
                  
                  <div className="flex items-center gap-1 text-xs text-ink-600">
                    <Users size={12} /> {t.seats} seats
                  </div>

                  <span className="text-[11px] font-medium capitalize mt-1">
                    {isOccupied ? (
                      <span className="text-paprika-600 font-bold block">
                        Occupied: {count}/{t.seats}
                        <span className="text-[10px] font-mono text-ink-500 font-normal block truncate mt-0.5">
                          {(t.occupied_seats || []).map(o => o.order_id).join(", ")}
                        </span>
                      </span>
                    ) : (
                      t.status
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <Modal open={!!selected} onClose={() => { setSelected(null); setActiveModal("main"); }} title={selected ? `Table ${selected.id}` : ""}>
        {selected && (
          <div>
            {activeModal === "main" && renderMainModal()}
            {activeModal === "new_order" && renderNewOrderModal()}
            {activeModal === "merge" && renderMergeModal()}
            {activeModal === "transfer" && renderTransferModal()}
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
