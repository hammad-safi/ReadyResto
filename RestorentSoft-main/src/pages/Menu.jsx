import { useEffect, useRef, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Search, Filter, RotateCcw, Printer, RefreshCw } from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Badge, { statusTone } from "../components/ui/Badge";
import Modal from "../components/ui/Modal";
import BarcodePrintModal from "../components/ui/BarcodePrintModal";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

const CATEGORY_OPTIONS = ["Fast Food", "BBQ & Grill", "Rice & Karahi", "Beverages", "Desserts"];
const STATION_OPTIONS = ["Grill", "Bar", "Dessert", "Fry"];
const EMOJI = ["🍔", "🍗", "🍢", "🥩", "🍲", "🍛", "🍵", "🥤", "🍮", "🍕", "🌯", "🥗"];

const emptyForm = {
  name: "", category: CATEGORY_OPTIONS[0], price: 0, prep_time: 10,
  station: STATION_OPTIONS[0], status: "available", image: "🍽️", tax_rate: 16, barcode: "",
};

const isImageSource = (value) => typeof value === "string" && (value.startsWith("data:") || value.startsWith("http://") || value.startsWith("https://"));

const renderItemImage = (image) => {
  if (isImageSource(image)) {
    return <img src={image} alt="Menu item" className="h-full w-full object-cover rounded-lg" />;
  }
  return <span className="text-2xl">{image || "🍽️"}</span>;
};

export default function Menu() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeLines, setRecipeLines] = useState([]);
  const [invSearch, setInvSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printItem, setPrintItem] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);

  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchParams] = useSearchParams();
  const searchParamVal = searchParams.get("search") || "";
  const [query, setQuery] = useState(searchParamVal);

  useEffect(() => {
    setQuery(searchParamVal);
  }, [searchParamVal]);

  const [statusFilter, setStatusFilter] = useState("All");
  const [stationFilter, setStationFilter] = useState("All");

  const load = () => {
    setLoading(true);
    Promise.all([
      api.list("menu_items"),
      api.list("inventory_items"),
      api.list("recipes")
    ]).then(([m, i, r]) => {
      setItems(m);
      setInventory(i);
      setRecipes(r);
      setLoading(false);
    });
  };

  useEffect(() => {
    void load();
  }, []);

  const filtered = items.filter((m) => {
    if (category !== "All" && m.category !== category) return false;
    if (statusFilter !== "All" && m.status !== statusFilter) return false;
    if (stationFilter !== "All" && m.station !== stationFilter) return false;
    if (query.trim() && !m.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const activeFilterCount = (statusFilter !== "All" ? 1 : 0) + (stationFilter !== "All" ? 1 : 0);
  const clearFilters = () => { setStatusFilter("All"); setStationFilter("All"); setQuery(""); };

  const openAdd = () => {
    setForm(emptyForm);
    setRecipeLines([]);
    setEditing(null);
    setImageError("");
    setAddOpen(true);
  };

  const openEdit = (item) => {
    setForm(item);
    const lines = recipes.filter(r => r.menu_item_id === item.id).map(r => {
      const inv = inventory.find(i => i.id === r.inventory_item_id);
      return {
        inventory_item_id: r.inventory_item_id,
        name: inv?.name || "Unknown",
        unit: inv?.unit || "",
        cost: inv?.cost || 0,
        qty: r.qty
      };
    });
    setRecipeLines(lines);
    setEditing(item);
    setImageError("");
    setAddOpen(true);
  };

  const handleImageSelection = (files) => {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setImageError("Please choose a valid image file.");
      return;
    }

    setImageError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 200;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/webp", 0.8);
        setForm((prev) => ({ ...prev, image: dataUrl }));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleImageSelection(event.dataTransfer?.files);
  };

  const filteredInventory = useMemo(() => {
    const q = invSearch.toLowerCase();
    if (!q) return inventory.slice(0, 10);
    return inventory.filter(i => i.name.toLowerCase().includes(q)).slice(0, 10);
  }, [inventory, invSearch]);

  const addInvItem = (item) => {
    setRecipeLines(prev => {
      const existing = prev.find(it => it.inventory_item_id === item.id);
      if (existing) {
        return prev.map(it => it.inventory_item_id === item.id ? { ...it, qty: Number(it.qty) + 1 } : it);
      }
      return [...prev, { inventory_item_id: item.id, name: item.name, unit: item.unit, cost: item.cost, qty: 1 }];
    });
  };

  const updateLine = (idx, val) => {
    setRecipeLines(prev => prev.map((it, i) => i === idx ? { ...it, qty: Number(val) } : it));
  };

  const removeLine = (idx) => {
    setRecipeLines(prev => prev.filter((_, i) => i !== idx));
  };

  const totalCost = recipeLines.reduce((s, it) => s + (Number(it.qty) * Number(it.cost)), 0);
  const profitMargin = form.price > 0 ? Math.round(((form.price - totalCost) / form.price) * 100) : 0;

  const save = async () => {
    const payload = { ...form, cost: totalCost };
    delete payload.id;
    let savedItem;
    if (editing) {
      savedItem = await api.update("menu_items", editing.id, payload, { user: user.name, module: "Menu Management", action: `Updated menu item "${form.name}"` });
      const oldLines = recipes.filter(r => r.menu_item_id === editing.id);
      for (const o of oldLines) {
        await api.remove("recipes", o.id);
      }
    } else {
      savedItem = await api.create("menu_items", payload, { user: user.name, module: "Menu Management", action: `Added menu item "${form.name}"` });
    }
    
    for (const l of recipeLines) {
      await api.create("recipes", {
        menu_item_id: savedItem.id,
        inventory_item_id: l.inventory_item_id,
        qty: l.qty
      });
    }

    setAddOpen(false);
    load();
  };

  const remove = async () => {
    await api.remove("menu_items", confirmDelete.id, { user: user.name, module: "Menu Management", action: `Deleted menu item "${confirmDelete.name}"` });
    setConfirmDelete(null);
    load();
  };

  const toggleAvailability = async (item) => {
    const next = item.status === "available" ? "out_of_stock" : "available";
    await api.update("menu_items", item.id, { status: next }, { user: user.name, module: "Menu Management", action: `Marked "${item.name}" as ${next}` });
    load();
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Menu Management"
        description="Manage categories, pricing, availability, and kitchen routing."
        actions={<Button variant="primary" icon={Plus} onClick={openAdd}>Add New Item</Button>}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex gap-2 overflow-x-auto">
          {["All", ...CATEGORY_OPTIONS].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 px-3.5 py-1.5 rounded-lg text-xs font-medium border ${
                category === c ? "bg-paprika-500 text-white border-paprika-500 shadow-sm" : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative hidden sm:block">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
            <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu..."
              className="w-48 pl-7 pr-3 py-1.5 text-xs border border-canvas-200 rounded-lg outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
          <button
            onClick={() => setFiltersOpen((o) => !o)}
            className={`relative flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
              filtersOpen || activeFilterCount > 0
                ? "border-paprika-400 bg-paprika-50 text-paprika-700"
                : "border-canvas-200 text-ink-600 hover:bg-canvas-100"
            }`}
          >
            <Filter size={13} /> Filters
            {activeFilterCount > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-paprika-500 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          {activeFilterCount > 0 && (
            <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-ink-400 hover:text-paprika-600 transition-colors">
              <RotateCcw size={11} /> Clear
            </button>
          )}
        </div>
      </div>

      {filtersOpen && (
        <div className="mb-5 p-3.5 rounded-xl border border-canvas-200 bg-canvas-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:hidden relative">
             <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Search</p>
             <div className="relative">
               <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none" />
               <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search menu..."
                 className="w-full border border-canvas-200 bg-white rounded-lg pl-7 pr-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30" />
             </div>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Status</p>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
              <option value="All">All statuses</option>
              <option value="available">Available</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 mb-1">Station</p>
            <select value={stationFilter} onChange={(e) => setStationFilter(e.target.value)}
              className="w-full border border-canvas-200 bg-white rounded-lg px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-paprika-500/30">
              <option value="All">All stations</option>
              {STATION_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-ink-500 py-10 text-center">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white border border-canvas-200 rounded-xl2 shadow-soft p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div className="h-12 w-12 rounded-lg bg-canvas-100 flex items-center justify-center overflow-hidden">
                  {renderItemImage(item.image)}
                </div>
                <button onClick={() => toggleAvailability(item)}>
                  <Badge tone={statusTone(item.status)}>{item.status === "available" ? "Available" : "Out of stock"}</Badge>
                </button>
              </div>
              <div>
                <p className="font-medium text-sm text-ink-900">{item.name}</p>
                <p className="text-xs text-ink-500">{item.category} · {item.station}</p>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono font-semibold text-paprika-600">Rs. {item.price}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink-500">Cost Rs. {item.cost}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-canvas-100">
                <Button variant="secondary" size="sm" icon={Pencil} className="flex-1" onClick={() => openEdit(item)}>Edit</Button>
                <button
                  onClick={() => setConfirmDelete(item)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-canvas-200 text-ink-500 hover:text-paprika-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center text-sm text-ink-500 py-10">No items in this category yet.</div>
          )}
        </div>
      )}

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title={editing ? "Edit Menu Item" : "Add New Menu Item"}
        width="max-w-2xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={save}>{editing ? "Save Changes" : "Save Item"}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-ink-600">Item Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30"
              placeholder="e.g. Chicken Malai Boti"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
              className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none"
            >
              {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-ink-600 mb-1 block">Barcode</label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                value={form.barcode || ""}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                className="flex-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30 font-mono"
                placeholder="Scan or enter barcode"
              />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, barcode: Math.floor(100000000000 + Math.random() * 900000000000).toString() }))}
                  className="flex-1 sm:flex-none px-3 py-2 bg-canvas-100 hover:bg-canvas-200 text-ink-700 text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <RefreshCw size={14} /> Generate
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPrintItem(form);
                    setPrintModalOpen(true);
                  }}
                  disabled={!form.barcode}
                  className="flex-1 sm:flex-none px-3 py-2 bg-paprika-500 hover:bg-paprika-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  <Printer size={14} /> Print Labels
                </button>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-ink-600">Menu Image</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
              className={`mt-1 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-center transition ${isDragging ? "border-paprika-500 bg-paprika-50" : "border-canvas-200 bg-canvas-50"}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => handleImageSelection(event.target.files)}
              />
              {isImageSource(form.image) ? (
                <>
                  <img src={form.image} alt="Preview" className="h-20 w-20 rounded-lg object-cover border border-canvas-200" />
                  <div>
                    <p className="text-sm font-medium text-ink-900">Image selected</p>
                    <p className="text-xs text-ink-500">Drag another image here or click to replace it.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-canvas-200 bg-white text-3xl">
                    {renderItemImage(form.image)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">Upload menu image</p>
                    <p className="text-xs text-ink-500">PNG, JPG, or WEBP • drag and drop here</p>
                  </div>
                </>
              )}
              {imageError && <p className="text-xs text-paprika-600">{imageError}</p>}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Selling Price (Rs.)</label>
            <input type="number" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Preparation Time (min)</label>
            <input type="number" value={form.prep_time} onChange={(e) => setForm((p) => ({ ...p, prep_time: Number(e.target.value) }))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none" />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600">Kitchen Station</label>
            <select value={form.station} onChange={(e) => setForm((p) => ({ ...p, station: e.target.value }))} className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2 text-sm outline-none">
              {STATION_OPTIONS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex flex-col justify-center border border-canvas-200 rounded-lg px-3 py-2 mt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-ink-600">Available for sale</span>
              <input
                type="checkbox"
                checked={form.status === "available"}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.checked ? "available" : "out_of_stock" }))}
                className="h-4 w-4 accent-paprika-500"
              />
            </div>
          </div>

          <div className="sm:col-span-2 mt-4 pt-4 border-t border-canvas-200">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-500 mb-2">Add Ingredients</p>
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-400" />
              <input type="text" value={invSearch} onChange={(e) => setInvSearch(e.target.value)} placeholder="Search inventory..." className="w-full rounded-lg border border-canvas-200 bg-white pl-8 pr-3 py-2 text-sm outline-none" />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {filteredInventory.map(item => (
                <button key={item.id} onClick={() => addInvItem(item)} className="shrink-0 rounded-lg border border-canvas-200 bg-white px-3 py-2 text-left hover:border-basil-400 hover:bg-basil-50">
                  <p className="text-sm font-semibold text-ink-900">{item.name}</p>
                  <p className="text-[10px] text-ink-400">Cost: Rs. {item.cost} / {item.unit}</p>
                </button>
              ))}
            </div>

            <div className="mt-4 rounded-xl border border-canvas-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-canvas-50 text-[11px] uppercase text-ink-500">
                  <tr>
                    <th className="px-3 py-2.5 text-left">Ingredient</th>
                    <th className="px-3 py-2.5 text-right w-24">Qty</th>
                    <th className="px-3 py-2.5 text-left w-16">Unit</th>
                    <th className="px-3 py-2.5 text-right w-24">Est. Cost</th>
                    <th className="px-3 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {recipeLines.map((line, idx) => (
                    <tr key={idx} className="border-t border-canvas-100">
                      <td className="px-3 py-2 font-medium text-ink-900">{line.name}</td>
                      <td className="px-3 py-2 text-right">
                        <input type="number" min={0} step="any" value={line.qty} onChange={(e) => updateLine(idx, e.target.value)} className="w-16 rounded-lg border border-canvas-200 px-2 py-1.5 text-sm text-right font-mono outline-none" />
                      </td>
                      <td className="px-3 py-2 text-ink-500">{line.unit}</td>
                      <td className="px-3 py-2 text-right font-mono font-semibold text-ink-700">
                        Rs. {(Number(line.qty) * Number(line.cost)).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => removeLine(idx)} className="text-ink-400 hover:text-paprika-600"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                  {recipeLines.length === 0 && <tr><td colSpan={5} className="px-3 py-6 text-center text-ink-400 text-sm italic">No ingredients added yet.</td></tr>}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 bg-[rgb(var(--surface-sidebar))] text-white rounded-xl p-4">
              <div>
                <p className="text-[11px] text-white/70">Total Cost per Plate</p>
                <p className="font-mono font-bold text-xl">Rs. {totalCost.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-white/70">Estimated Profit Margin</p>
                <p className={`font-mono font-bold text-xl ${profitMargin < 50 ? "text-paprika-400" : "text-basil-400"}`}>{profitMargin}%</p>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete menu item?"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="danger" onClick={remove}>Delete Permanently</Button>
          </>
        }
      >
        <p className="text-sm text-ink-600">
          This will permanently remove <span className="font-medium text-ink-900">{confirmDelete?.name}</span> from the menu.
        </p>
      </Modal>

      <BarcodePrintModal 
        isOpen={printModalOpen} 
        onClose={() => setPrintModalOpen(false)} 
        item={printItem} 
      />
    </div>
  );
}
