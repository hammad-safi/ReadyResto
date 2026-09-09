import { useState, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDataCache } from "../../context/DataCacheContext";

export default function GlobalSearch() {
  const { getData } = useDataCache();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({ orders: [], menu: [], customers: [], inventory: [] });
  const navigate = useNavigate();
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults({ orders: [], menu: [], customers: [], inventory: [] });
      setLoading(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.toLowerCase();
        
        // Fetch data
        const [orders, menu, customers, inventory] = await Promise.all([
          getData("orders"),
          getData("menu_items"),
          getData("customers"),
          getData("inventory_items")
        ]);

        // Filter
        const filteredOrders = orders.filter(o => String(o.id).toLowerCase().includes(q) || String(o.table_id).toLowerCase().includes(q) || String(o.customer).toLowerCase().includes(q)).slice(0, 5);
        const filteredMenu = menu.filter(m => String(m.name).toLowerCase().includes(q) || String(m.barcode).toLowerCase().includes(q)).slice(0, 5);
        const filteredCustomers = customers.filter(c => String(c.name).toLowerCase().includes(q) || String(c.phone).toLowerCase().includes(q)).slice(0, 5);
        const filteredInventory = inventory.filter(i => String(i.name).toLowerCase().includes(q) || String(i.sku).toLowerCase().includes(q)).slice(0, 5);

        setResults({
          orders: filteredOrders,
          menu: filteredMenu,
          customers: filteredCustomers,
          inventory: filteredInventory
        });
      } catch (err) {
        console.error("Global search error", err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (path) => {
    setIsOpen(false);
    setQuery("");
    navigate(path);
  };

  const hasResults = Object.values(results).some(arr => arr.length > 0);

  return (
    <div ref={wrapperRef} className="hidden sm:flex items-center flex-1 max-w-md relative z-50">
      <Search size={16} className="absolute left-3 text-ink-500" />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => { if (query.trim().length >= 2) setIsOpen(true); }}
        placeholder="Search orders, items, customers..."
        className="w-full bg-canvas-100 rounded-lg pl-9 pr-3 py-2 text-sm placeholder:text-ink-500/60 outline-none focus:ring-2 focus:ring-paprika-500/30"
      />
      {loading && (
        <Loader2 size={16} className="absolute right-3 text-ink-400 animate-spin" />
      )}

      {isOpen && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-canvas-200 overflow-hidden max-h-96 overflow-y-auto">
          {!loading && !hasResults && (
            <div className="p-4 text-center text-sm text-ink-500">
              No results found for "{query}"
            </div>
          )}

          {results.orders.length > 0 && (
            <div className="border-b border-canvas-100 last:border-0">
              <div className="px-3 py-1.5 bg-canvas-50 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Orders</div>
              {results.orders.map(o => (
                <button
                  key={o.id}
                  onClick={() => handleSelect('/orders')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-canvas-50 transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-ink-900">{o.id}</span>
                  <span className="text-xs text-ink-500">{o.customer || 'Walk-in'} - Rs. {o.total}</span>
                </button>
              ))}
            </div>
          )}

          {results.menu.length > 0 && (
            <div className="border-b border-canvas-100 last:border-0">
              <div className="px-3 py-1.5 bg-canvas-50 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Menu Items</div>
              {results.menu.map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSelect('/menu')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-canvas-50 transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-ink-900">{m.name}</span>
                  <span className="text-xs text-ink-500">Rs. {m.price}</span>
                </button>
              ))}
            </div>
          )}

          {results.customers.length > 0 && (
            <div className="border-b border-canvas-100 last:border-0">
              <div className="px-3 py-1.5 bg-canvas-50 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Customers</div>
              {results.customers.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelect('/customers')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-canvas-50 transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-ink-900">{c.name}</span>
                  <span className="text-xs text-ink-500">{c.phone}</span>
                </button>
              ))}
            </div>
          )}

          {results.inventory.length > 0 && (
            <div className="border-b border-canvas-100 last:border-0">
              <div className="px-3 py-1.5 bg-canvas-50 text-[10px] font-bold text-ink-500 uppercase tracking-wider">Inventory</div>
              {results.inventory.map(i => (
                <button
                  key={i.id}
                  onClick={() => handleSelect('/inventory')}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-canvas-50 transition-colors flex justify-between items-center"
                >
                  <span className="font-medium text-ink-900">{i.name}</span>
                  <span className="text-xs text-ink-500">{i.stock} {i.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
