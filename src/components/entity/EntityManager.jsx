import { useEffect, useState, useMemo } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import PageHeader from "../ui/PageHeader";
import Button from "../ui/Button";
import ModuleTable from "../ui/ModuleTable";
import Modal from "../ui/Modal";

/**
 * fields: [{ key, label, type: 'text'|'number'|'select'|'textarea', options?: [], required?: bool }]
 */
export default function EntityManager({
  table,
  eyebrow,
  title,
  description,
  columns,
  fields,
  moduleName,
  emptyLabel,
  extraHeaderActions,
  rowActions = true,
  filterContent,
  activeFilterCount,
  onClearFilters,
  onFilter,
}) {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const load = () => {
    setLoading(true);
    api.list(table).then((data) => {
      setRows(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table]);

  const openAdd = () => {
    const defaults = {};
    fields.forEach((f) => {
      if (f.type === "number") {
        defaults[f.key] = 0;
      } else if (f.type === "select") {
        defaults[f.key] = f.options?.[0] ?? "";
      } else {
        defaults[f.key] = "";
      }
    });
    setForm(defaults);
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setEditing(row);
    setModalOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form };
    delete payload.id;
    if (editing) {
      await api.update(table, editing.id, payload, {
        user: user.name,
        module: moduleName,
        action: `Updated ${moduleName} record #${editing.id}`,
      });
    } else {
      await api.create(table, payload, {
        user: user.name,
        module: moduleName,
        action: `Added new ${moduleName} record`,
      });
    }
    setModalOpen(false);
    load();
  };

  const handleDelete = async () => {
    await api.remove(table, confirmDelete.id, {
      user: user.name,
      module: moduleName,
      action: `Deleted ${moduleName} record #${confirmDelete.id}`,
    });
    setConfirmDelete(null);
    load();
  };

  const finalColumns = rowActions
    ? [
        ...columns,
        {
          key: "_actions",
          header: "Actions",
          alwaysVisible: true,
          render: (row) => (
            <div className="flex gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(row);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-600 hover:border-paprika-500 hover:text-paprika-600"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmDelete(row);
                }}
                className="h-7 w-7 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-600 hover:border-paprika-500 hover:text-paprika-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ),
        },
      ]
    : columns;

  const filteredRows = useMemo(() => {
    let result = rows;
    if (onFilter) {
      result = result.filter(onFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((r) =>
        Object.values(r).some((v) => String(v).toLowerCase().includes(q))
      );
    }
    return result;
  }, [rows, searchQuery, onFilter]);

  return (
    <div>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        actions={
          <>
            {extraHeaderActions}
            <Button variant="primary" icon={Plus} onClick={openAdd}>
              Add {moduleName}
            </Button>
          </>
        }
      />

      {loading ? (
        <div className="text-sm text-ink-500 py-10 text-center">Loading…</div>
      ) : (
        <ModuleTable
          columns={finalColumns}
          data={filteredRows}
          emptyLabel={emptyLabel || `No ${moduleName.toLowerCase()}s found.`}
          storageKey={`${table}_visible_cols`}
          searchPlaceholder={`Search ${moduleName.toLowerCase()}s…`}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          filterContent={filterContent}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
        />
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${moduleName}` : `Add ${moduleName}`}
        width="max-w-xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>{editing ? "Save Changes" : `Add ${moduleName}`}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.key} className={f.fullWidth ? "sm:col-span-2" : ""}>
              <label className="text-xs font-medium text-ink-600">{f.label}</label>
              {f.type === "select" ? (
                <select
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                >
                  {f.options.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : f.type === "textarea" ? (
                <textarea
                  rows={3}
                  value={form[f.key] ?? ""}
                  onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                />
              ) : (
                <input
                  type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value }))
                  }
                  className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
                />
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title={`Delete ${moduleName}?`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDelete}>Delete Permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This will permanently remove <span className="font-medium text-ink-900">{confirmDelete?.name || confirmDelete?.id}</span>. This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
