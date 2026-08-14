import { useEffect, useState, useRef } from "react";
import {
  Plus, Pencil, Trash2, KeyRound, Users as UsersIcon, ShieldCheck,
  History, Search, Upload, RefreshCw, Download,
  ToggleLeft, ToggleRight, Check, X, AlertTriangle, UserPlus
} from "lucide-react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
const BRANCHES = ["Main Branch", "Downtown", "Airport Road"];
const ACTIONS = ["can_view", "can_add", "can_edit", "can_delete", "can_export"];
const ACTION_LABELS = { can_view: "View", can_add: "Add", can_edit: "Edit", can_delete: "Delete", can_export: "Export" };

const MODULES = [
  "Dashboard", "POS Billing", "Sales", "Kitchen Display", "Table Management",
  "Order Management", "Menu Management", "Recipe Management", "Inventory",
  "Suppliers", "Purchases", "Customers", "Employees", "Users & Roles",
  "Expenses", "Accounting", "Reports", "Notifications", "Printing",
  "Backup & Restore", "Active Log", "Hardware", "Settings",
];

const MODULE_SUPPORTED_ACTIONS = {
  "Dashboard": ["can_view"],
  "POS Billing": ["can_view", "can_add"],
  "Sales": ["can_view", "can_export"],
  "Kitchen Display": ["can_view", "can_edit"],
  "Table Management": ["can_view", "can_edit"],
  "Order Management": ["can_view", "can_add", "can_edit", "can_delete"],
  "Menu Management": ["can_view", "can_add", "can_edit", "can_delete", "can_export"],
  "Recipe Management": ["can_view", "can_add", "can_edit", "can_delete", "can_export"],
  "Inventory": ["can_view", "can_add", "can_edit", "can_delete", "can_export"],
  "Suppliers": ["can_view", "can_add", "can_edit", "can_delete"],
  "Purchases": ["can_view", "can_add", "can_edit", "can_delete"],
  "Customers": ["can_view", "can_add", "can_edit", "can_delete", "can_export"],
  "Employees": ["can_view", "can_add", "can_edit", "can_delete"],
  "Users & Roles": ["can_view", "can_add", "can_edit", "can_delete"],
  "Expenses": ["can_view", "can_add", "can_edit", "can_delete", "can_export"],
  "Accounting": ["can_view", "can_add", "can_edit", "can_export"],
  "Reports": ["can_view", "can_export"],
  "Notifications": ["can_view"],
  "Printing": ["can_view", "can_edit"],
  "Backup & Restore": ["can_view", "can_add", "can_export"],
  "Active Log": ["can_view", "can_export"],
  "Hardware": ["can_view", "can_edit"],
  "Settings": ["can_view", "can_edit"],
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
function RoleBadge({ role }) {
  const colors = {
    Owner: "bg-purple-100 text-purple-700",
    Manager: "bg-blue-100 text-blue-700",
    Cashier: "bg-green-100 text-green-700",
    Waiter: "bg-amber-100 text-amber-700",
    "Kitchen Staff": "bg-orange-100 text-orange-700",
    Accountant: "bg-cyan-100 text-cyan-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${colors[role] || "bg-canvas-100 text-ink-600"}`}>
      {role}
    </span>
  );
}



/* ── Add/Edit User Modal ─────────────────────────────────────────────────── */
function UserModal({ open, onClose, onSave, editing, allRoles }) {
  const [form, setForm] = useState({
    name: "", role: "Cashier", pin: "", password: "",
    email: "", phone: "", branch: "Main Branch", status: "active", profile_photo: null,
  });
  const fileRef = useRef(null);

  useEffect(() => {
    if (editing) setForm({ ...editing });
    else setForm({ name: "", role: "Cashier", pin: "", password: "", email: "", phone: "", branch: "Main Branch", status: "active", profile_photo: null });
  }, [editing, open]);

  const upd = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => upd("profile_photo", ev.target.result);
    reader.readAsDataURL(file);
  };

  const initials = form.name
    ? form.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  if (!open) return null;
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Edit User" : "Add New User"}
      width="max-w-2xl"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" icon={editing ? Pencil : UserPlus} onClick={() => onSave(form)}>
            {editing ? "Save Changes" : "Add User"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Photo */}
        <div className="sm:col-span-2 flex items-center gap-4">
          <div
            className="h-16 w-16 rounded-full bg-canvas-100 flex items-center justify-center text-ink-600 font-bold text-lg cursor-pointer hover:bg-canvas-200 overflow-hidden shrink-0 border-2 border-canvas-200"
            onClick={() => fileRef.current?.click()}
          >
            {form.profile_photo ? (
              <img src={form.profile_photo} alt="avatar" className="h-full w-full object-cover" />
            ) : initials}
          </div>
          <div>
            <button type="button" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-paprika-600 hover:text-paprika-700">
              <Upload size={13} /> Upload Photo
            </button>
            {form.profile_photo && (
              <button type="button" onClick={() => upd("profile_photo", null)}
                className="text-xs text-ink-400 hover:text-red-500 mt-1 flex items-center gap-1">
                <X size={11} /> Remove
              </button>
            )}
            <p className="text-[10px] text-ink-400 mt-0.5">JPG or PNG, max 2 MB</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>

        {/* Name */}
        <div className="sm:col-span-2">
          <label className="text-xs font-medium text-ink-600">Full Name *</label>
          <input value={form.name} onChange={(e) => upd("name", e.target.value)}
            placeholder="e.g. Ahmed Raza"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
        </div>

        {/* Role */}
        <div>
          <label className="text-xs font-medium text-ink-600">Role *</label>
          <select value={form.role} onChange={(e) => upd("role", e.target.value)}
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">
            {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {/* Branch */}
        <div>
          <label className="text-xs font-medium text-ink-600">Assigned Branch</label>
          <select value={form.branch} onChange={(e) => upd("branch", e.target.value)}
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">
            {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        {/* Email */}
        <div>
          <label className="text-xs font-medium text-ink-600">Email</label>
          <input type="email" value={form.email} onChange={(e) => upd("email", e.target.value)}
            placeholder="user@restaurant.pk"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
        </div>

        {/* Phone */}
        <div>
          <label className="text-xs font-medium text-ink-600">Phone</label>
          <input value={form.phone} onChange={(e) => upd("phone", e.target.value)}
            placeholder="0300-0000000"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
        </div>

        {/* PIN */}
        <div>
          <label className="text-xs font-medium text-ink-600">PIN (4–6 digits)</label>
          <input type="password" inputMode="numeric" maxLength={6}
            value={form.pin} onChange={(e) => upd("pin", e.target.value.replace(/\D/g, ""))}
            placeholder="e.g. 1234"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
        </div>

        {/* Password */}
        <div>
          <label className="text-xs font-medium text-ink-600">Password</label>
          <input type="password"
            value={form.password} onChange={(e) => upd("password", e.target.value)}
            placeholder="Enter password"
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-medium text-ink-600">Status</label>
          <select value={form.status} onChange={(e) => upd("status", e.target.value)}
            className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}

/* ── Reset PIN Modal ─────────────────────────────────────────────────────── */
function ResetPinModal({ open, onClose, targetUser }) {
  const [ownerPwd, setOwnerPwd] = useState("");
  const [newPin, setNewPin] = useState("");
  const [resetType, setResetType] = useState("pin");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => { if (!open) { setOwnerPwd(""); setNewPin(""); setNewPassword(""); setError(""); setSuccess(false); } }, [open]);

  const doReset = async () => {
    if (resetType === "pin" && (newPin.length < 4 || newPin.length > 6)) { setError("PIN must be 4–6 digits"); return; }
    if (resetType === "password" && newPassword.length < 4) { setError("Password must be at least 4 characters"); return; }
    if (!ownerPwd.trim()) { setError("Owner password required"); return; }
    setLoading(true);
    setError("");
    let res;
    if (resetType === "pin") res = await api.resetUserPin(targetUser.id, newPin, ownerPwd);
    else res = await api.resetUserPassword(targetUser.id, newPassword, ownerPwd);
    setLoading(false);
    if (res.success) setSuccess(true);
    else setError(res.message || "Failed");
  };

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={`Reset Credentials — ${targetUser?.name}`} width="max-w-md"
      footer={!success && (
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={doReset} disabled={loading}>
            {loading ? "Resetting…" : "Reset"}
          </Button>
        </>
      )}
    >
      {success ? (
        <div className="text-center py-4">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3 text-2xl">✓</div>
          <p className="font-semibold text-ink-900">Reset Successful</p>
          <button onClick={onClose} className="mt-4 px-5 py-2 rounded-lg bg-paprika-500 text-white text-sm font-medium">Close</button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2">
            {["pin", "password"].map((t) => (
              <button key={t} onClick={() => setResetType(t)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border ${resetType === t ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 bg-[rgb(var(--surface-card))] hover:bg-canvas-50"}`}>
                Reset {t === "pin" ? "PIN" : "Password"}
              </button>
            ))}
          </div>
          {resetType === "pin" ? (
            <div>
              <label className="text-xs font-medium text-ink-600">New PIN (4–6 digits)</label>
              <input type="password" inputMode="numeric" maxLength={6} value={newPin}
                onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-ink-600">New Password</label>
              <input type="password" value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-ink-600">Owner Master Password</label>
            <input type="password" value={ownerPwd}
              onChange={(e) => { setOwnerPwd(e.target.value); setError(""); }}
              className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </Modal>
  );
}

/* ── Users Sub-Tab ───────────────────────────────────────────────────────── */
function UsersTab({ allRoles }) {
  const { user: currentUser, canDo } = useAuth();
  const canAdd = canDo("Users & Roles", "add");
  const canEdit = canDo("Users & Roles", "edit");
  const canDelete = canDo("Users & Roles", "delete");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [selected, setSelected] = useState(new Set());
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [bulkAction, setBulkAction] = useState("");

  const load = () => {
    setLoading(true);
    api.list("users").then((d) => { setRows(d); setLoading(false); });
  };
  useEffect(load, []);

  const filtered = rows.filter((r) => {
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || r.role === roleFilter;
    return matchSearch && matchRole;
  });

  const toggleSelect = (id) => setSelected((s) => {
    const ns = new Set(s);
    if (ns.has(id)) ns.delete(id); else ns.add(id);
    return ns;
  });
  const allSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(filtered.map((r) => r.id)));

  const handleSave = async (form) => {
    const payload = { ...form };
    delete payload.id;
    if (editing) {
      await api.update("users", editing.id, payload, { user: currentUser.name, module: "Users & Roles", action: `Updated user ${editing.name}` });
    } else {
      await api.create("users", payload, { user: currentUser.name, module: "Users & Roles", action: `Added new user ${form.name}` });
    }
    setModalOpen(false);
    setEditing(null);
    load();
  };

  const handleDelete = async () => {
    await api.remove("users", deleteTarget.id, { user: currentUser.name, module: "Users & Roles", action: `Deleted user ${deleteTarget.name}` });
    setDeleteTarget(null);
    load();
  };

  const toggleStatus = async (row) => {
    if (!canEdit) return;
    const newStatus = row.status === "active" ? "inactive" : "active";
    await api.update("users", row.id, { status: newStatus }, { user: currentUser.name, module: "Users & Roles", action: `${newStatus === "active" ? "Activated" : "Deactivated"} user ${row.name}` });
    load();
  };

  const applyBulkAction = async () => {
    if (!bulkAction || selected.size === 0) return;
    const ids = [...selected];
    if (bulkAction === "delete") {
      for (const id of ids) await api.remove("users", id, { user: currentUser.name, module: "Users & Roles", action: "Bulk deleted user" });
    } else {
      const status = bulkAction === "activate" ? "active" : "inactive";
      for (const id of ids) await api.update("users", id, { status }, { user: currentUser.name, module: "Users & Roles", action: `Bulk ${status}d user` });
    }
    setSelected(new Set());
    setBulkAction("");
    load();
  };

  const initials = (name) => name ? name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase() : "?";

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users…"
            className="w-full pl-8 pr-3 py-2 border border-canvas-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 bg-white" />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Roles</option>
          {allRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <select value={bulkAction} onChange={(e) => setBulkAction(e.target.value)}
              className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
              <option value="">Bulk Actions ({selected.size})</option>
              {canEdit && <option value="activate">Activate Selected</option>}
              {canEdit && <option value="deactivate">Deactivate Selected</option>}
              {canDelete && <option value="delete">Delete Selected</option>}
            </select>
            {bulkAction && (
              <button onClick={applyBulkAction}
                className={`px-3 py-2 rounded-lg text-sm font-medium text-white ${bulkAction === "delete" ? "bg-red-500 hover:bg-red-600" : "bg-paprika-500 hover:bg-paprika-600"}`}>
                Apply
              </button>
            )}
          </div>
        )}
        {canAdd && (
          <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add User
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-canvas-200 bg-white overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canvas-100 bg-canvas-50">
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-left w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-4 w-4 accent-paprika-500 rounded" />
                  </th>
                )}
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">PIN</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">Branch</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-100">
              {loading ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-ink-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-10 text-center text-sm text-ink-400">No users found</td></tr>
              ) : filtered.map((row) => (
                <tr key={row.id} className={`hover:bg-canvas-50 transition-colors ${selected.has(row.id) ? "bg-paprika-50/50" : ""}`}>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(row.id)} onChange={() => toggleSelect(row.id)} className="h-4 w-4 accent-paprika-500 rounded" />
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-saffron-100 flex items-center justify-center text-saffron-700 text-xs font-bold shrink-0 overflow-hidden">
                        {row.profile_photo ? <img src={row.profile_photo} alt={row.name} className="h-full w-full object-cover" /> : initials(row.name)}
                      </div>
                      <div>
                        <p className="font-medium text-ink-900 text-sm">{row.name}</p>
                        {row.email && <p className="text-[11px] text-ink-400">{row.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><RoleBadge role={row.role} /></td>
                  <td className="px-4 py-3">
                    {row.pin ? (
                      <span className="text-xs font-mono text-ink-500 bg-canvas-100 px-2 py-0.5 rounded">{"•".repeat(row.pin.length)}</span>
                    ) : (
                      <span className="text-[11px] text-ink-400 italic">Not set</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-600">{row.branch || "—"}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">{row.last_login || "Never"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleStatus(row)} className="group" disabled={!canEdit}>
                      {row.status === "active"
                        ? <ToggleRight size={22} className={`text-green-500 ${canEdit ? "group-hover:text-green-600" : "opacity-70"}`} />
                        : <ToggleLeft size={22} className={`text-ink-300 ${canEdit ? "group-hover:text-ink-500" : ""}`} />}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {canEdit && (
                        <>
                          <button onClick={() => { setEditing(row); setModalOpen(true); }}
                            title="Edit" className="h-7 w-7 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:border-paprika-400 hover:text-paprika-600 transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setResetTarget(row)}
                            title="Reset PIN / Password" className="h-7 w-7 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:border-amber-400 hover:text-amber-600 transition-colors">
                            <KeyRound size={13} />
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button onClick={() => setDeleteTarget(row)}
                          title="Delete" className="h-7 w-7 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:border-red-400 hover:text-red-600 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <UserModal open={modalOpen} onClose={() => { setModalOpen(false); setEditing(null); }} onSave={handleSave} editing={editing} allRoles={allRoles} />
      <ResetPinModal open={!!resetTarget} onClose={() => setResetTarget(null)} targetUser={resetTarget} />

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete User?"
        footer={<><Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button><Button variant="danger" onClick={handleDelete}>Delete Permanently</Button></>}>
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} className="text-red-600" />
          </div>
          <p className="text-sm text-ink-600">
            This will permanently remove <span className="font-semibold text-ink-900">{deleteTarget?.name}</span>. This action cannot be undone.
          </p>
        </div>
      </Modal>
    </div>
  );
}

/* ── Permissions Sub-Tab ─────────────────────────────────────────────────── */
function PermissionsTab() {
  const { user: currentUser } = useAuth();
  const [matrix, setMatrix] = useState({}); // { [role]: { [module]: { can_view, can_add, ... } } }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customRoles, setCustomRoles] = useState([]);
  const [roles, setRoles] = useState([]);
  const [newRoleName, setNewRoleName] = useState("");
  const [showNewRole, setShowNewRole] = useState(false);
  const [creatingRole, setCreatingRole] = useState(false);

  const loadAll = async () => {
    setLoading(true);
    const [perms, rolesList] = await Promise.all([api.getPermissions(), api.listRoles()]);
    setRoles(rolesList.map((r) => r.name));
    setCustomRoles(rolesList.filter((r) => !r.isBuiltIn).map((r) => r.name));
    const m = {};
    for (const p of perms) {
      if (!m[p.role]) m[p.role] = {};
      m[p.role][p.module] = { can_view: !!p.can_view, can_add: !!p.can_add, can_edit: !!p.can_edit, can_delete: !!p.can_delete, can_export: !!p.can_export };
    }
    setMatrix(m);
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, []);

  const toggle = (role, module, action) => {
    if (role === "Owner") return; // Owner is always full
    setMatrix((prev) => ({
      ...prev,
      [role]: {
        ...(prev[role] || {}),
        [module]: {
          ...(prev[role]?.[module] || {}),
          [action]: !(prev[role]?.[module]?.[action]),
        },
      },
    }));
  };

  const saveAll = async () => {
    setSaving(true);
    const rows = [];
    for (const role of roles) {
      for (const module of MODULES) {
        const p = matrix[role]?.[module] || {};
        rows.push({ role, module, can_view: p.can_view ? 1 : 0, can_add: p.can_add ? 1 : 0, can_edit: p.can_edit ? 1 : 0, can_delete: p.can_delete ? 1 : 0, can_export: p.can_export ? 1 : 0 });
      }
    }
    await api.savePermissions(rows, { user: currentUser.name });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const resetDefaults = async () => {
    await api.resetDefaultPermissions({ user: currentUser.name });
    loadAll();
  };

  const createRole = async () => {
    if (!newRoleName.trim()) return;
    setCreatingRole(true);
    await api.createRole(newRoleName.trim(), { user: currentUser.name });
    setNewRoleName("");
    setShowNewRole(false);
    setCreatingRole(false);
    loadAll();
  };

  const deleteRole = async (name) => {
    await api.deleteRole(name, { user: currentUser.name });
    loadAll();
  };

  if (loading) return <div className="py-10 text-center text-sm text-ink-400">Loading permissions…</div>;

  return (
    <div>
      {/* Header actions */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="flex-1" />
        {showNewRole ? (
          <div className="flex items-center gap-2">
            <input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && createRole()}
              placeholder="New role name…"
              className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 w-40" />
            <Button variant="primary" size="sm" onClick={createRole} disabled={creatingRole || !newRoleName.trim()}>
              {creatingRole ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />} Create
            </Button>
            <button onClick={() => setShowNewRole(false)} className="text-ink-400 hover:text-ink-700"><X size={16} /></button>
          </div>
        ) : (
          <Button variant="secondary" icon={Plus} size="sm" onClick={() => setShowNewRole(true)}>New Role</Button>
        )}
        <button onClick={resetDefaults} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-canvas-200 text-xs font-medium text-ink-600 hover:bg-canvas-100">
          <RefreshCw size={12} /> Reset to Default
        </button>
        <button onClick={saveAll} disabled={saving}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors ${saved ? "bg-green-500" : "bg-paprika-500 hover:bg-paprika-600"} disabled:opacity-50`}>
          {saving ? <RefreshCw size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <ShieldCheck size={12} />}
          {saved ? "Saved!" : saving ? "Saving…" : "Save Permissions"}
        </button>
      </div>

      {/* Custom roles list */}
      {customRoles.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {customRoles.map((r) => (
            <span key={r} className="inline-flex items-center gap-1.5 bg-canvas-100 border border-canvas-200 rounded-full px-3 py-1 text-xs font-medium text-ink-700">
              {r}
              <button onClick={() => deleteRole(r)} className="text-ink-400 hover:text-red-500"><X size={11} /></button>
            </span>
          ))}
        </div>
      )}

      {/* Matrix */}
      <div className="rounded-xl border border-canvas-200 bg-white overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-canvas-200 bg-canvas-50">
                <th className="px-4 py-3 text-left font-semibold text-ink-600 sticky left-0 bg-canvas-50 z-10 min-w-[160px]">Module</th>
                {roles.map((role) => (
                  <th key={role} className="px-3 py-3 text-center font-semibold text-ink-600 min-w-[160px]">
                    <RoleBadge role={role} />
                  </th>
                ))}
              </tr>
              <tr className="border-b border-canvas-100 bg-white">
                <th className="px-4 py-2 sticky left-0 bg-white z-10 text-[10px] text-ink-400 font-normal">Permission types →</th>
                {roles.map((role) => (
                  <th key={role} className="px-3 py-2 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {ACTIONS.map((a) => (
                        <span key={a} className="text-[10px] text-ink-400 w-8 text-center font-medium">{ACTION_LABELS[a]}</span>
                      ))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-100">
              {MODULES.map((mod) => (
                <tr key={mod} className="hover:bg-canvas-50/50">
                  <td className="px-4 py-2.5 font-medium text-ink-800 sticky left-0 bg-white hover:bg-canvas-50/50 z-10">{mod}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-2.5">
                      <div className="flex items-center justify-center gap-2">
                        {ACTIONS.map((action) => {
                          const isSupported = MODULE_SUPPORTED_ACTIONS[mod]?.includes(action);
                          const val = role === "Owner" ? true : !!(matrix[role]?.[mod]?.[action]);
                          const isOwner = role === "Owner";
                          
                          if (!isSupported) {
                            return (
                              <div key={action} className="h-4 w-8 rounded flex items-center justify-center bg-canvas-100" title="Not Applicable">
                                <span className="text-[10px] text-ink-300 select-none opacity-50">—</span>
                              </div>
                            );
                          }
                          
                          return (
                            <button key={action}
                              onClick={() => toggle(role, mod, action)}
                              disabled={isOwner}
                              title={`${ACTION_LABELS[action]} — ${role} — ${mod}`}
                              className={`h-4 w-8 rounded flex items-center justify-center transition-colors ${
                                val ? "bg-paprika-500 text-white" : "bg-canvas-100 text-ink-300 hover:bg-canvas-200"
                              } ${isOwner ? "cursor-not-allowed opacity-80" : "cursor-pointer"}`}
                            >
                              {val && <Check size={10} strokeWidth={3} />}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Activity Log Sub-Tab ────────────────────────────────────────────────── */
function ActivityTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterUser, setFilterUser] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    api.list("audit_log", { orderBy: "id DESC" }).then((d) => { setRows(d); setLoading(false); });
    api.list("users").then(setUsers);
  }, []);

  const filtered = rows.filter((r) => {
    const ms = !search || r.action?.toLowerCase().includes(search.toLowerCase()) || r.module?.toLowerCase().includes(search.toLowerCase());
    const mu = filterUser === "All" || r.user === filterUser;
    const ma = filterAction === "All" || r.action?.toLowerCase().includes(filterAction.toLowerCase());
    return ms && mu && ma;
  });

  const exportCSV = () => {
    const headers = ["Time", "User", "Module", "Action", "Device"];
    const csvRows = [headers.join(","), ...filtered.map((r) =>
      [r.time, r.user, r.module, `"${(r.action || "").replace(/"/g, '""')}"`, r.ip_device || ""].join(",")
    )].join("\n");
    const blob = new Blob([csvRows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `active-log-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const actionTypes = ["Login", "Logout", "Failed Login"];

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions…"
            className="w-full pl-8 pr-3 py-2 border border-canvas-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 bg-white" />
        </div>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
          className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Users</option>
          {users.map((u) => <option key={u.id} value={u.name}>{u.name}</option>)}
        </select>
        <select value={filterAction} onChange={(e) => setFilterAction(e.target.value)}
          className="border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none bg-white">
          <option value="All">All Actions</option>
          {actionTypes.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={exportCSV}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-canvas-200 text-sm font-medium text-ink-700 hover:bg-canvas-100">
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-canvas-200 bg-white overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-canvas-100 bg-canvas-50">
                {["Time", "User", "Module", "Action", "Device"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-semibold text-xs text-ink-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-canvas-100">
              {loading ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-ink-400">Loading…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-10 text-center text-sm text-ink-400">No log entries found</td></tr>
              ) : filtered.map((r) => (
                <tr key={r.id} className="hover:bg-canvas-50 transition-colors">
                  <td className="px-4 py-3 text-xs text-ink-500 font-mono whitespace-nowrap">{r.time}</td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-ink-800">{r.user}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-canvas-100 text-ink-600 px-2 py-0.5 rounded-md">{r.module}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-ink-700">{r.action}</td>
                  <td className="px-4 py-3 text-xs text-ink-400">{r.ip_device || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="px-4 py-2.5 border-t border-canvas-100 text-xs text-ink-400">
            Showing {filtered.length} of {rows.length} entries
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Main Users Page ─────────────────────────────────────────────────────── */
const TABS = [
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "permissions", label: "Permissions", icon: ShieldCheck },
  { id: "activity", label: "Activity Log", icon: History },
];

export default function Users() {
  const [tab, setTab] = useState("users");
  const [allRoles, setAllRoles] = useState(["Owner", "Manager", "Cashier", "Waiter", "Kitchen Staff", "Accountant"]);

  useEffect(() => {
    api.listRoles().then((r) => setAllRoles(r.map((x) => x.name))).catch(() => {});
  }, []);

  const descriptions = {
    users: "Manage staff accounts, roles, PINs, and branch assignments.",
    permissions: "Control what each role can view, create, edit, delete, or export across every module.",
    activity: "Full audit trail of every login, edit, deletion, and action taken in the system.",
  };

  return (
    <div>
      <PageHeader
        eyebrow="Access Control"
        title="Users & Roles"
        description={descriptions[tab]}
      />

      {/* Tab Bar */}
      <div className="flex gap-1 bg-canvas-100 rounded-xl p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              tab === t.id
                ? "bg-white text-ink-900 shadow-soft"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "users" && <UsersTab allRoles={allRoles} />}
      {tab === "permissions" && <PermissionsTab />}
      {tab === "activity" && <ActivityTab />}
    </div>
  );
}
