// import { useState, useEffect, useRef, useMemo } from "react";
// import {
//   Search, Filter, Settings2, ChevronUp, ChevronDown, ChevronsUpDown,
//   ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X
// } from "lucide-react";

// const PAGE_SIZES = [10, 25, 50, 100];

// export default function ModuleTable({
//   columns,
//   data,
//   onRowClick,
//   emptyLabel = "No records found",
//   storageKey,
//   searchPlaceholder = "Search...",
//   searchValue,
//   onSearchChange,
//   actions,
//   filterContent,
//   activeFilterCount = 0,
//   onClearFilters,
//   defaultPageSize = 25
// }) {
//   const [sortKey, setSortKey] = useState("");
//   const [sortDir, setSortDir] = useState("asc");
//   const [page, setPage] = useState(1);
//   const [pageSize, setPageSize] = useState(defaultPageSize);
//   const [filtersOpen, setFiltersOpen] = useState(false);
//   const [columnsOpen, setColumnsOpen] = useState(false);

//   const searchInputRef = useRef(null);
//   const columnsRef = useRef(null);
//   const filtersRef = useRef(null);

//   // Initialize visible columns
//   const [visibleCols, setVisibleCols] = useState(() => {
//     const defaultCols = columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {});
//     if (!storageKey) return defaultCols;
//     try {
//       const saved = localStorage.getItem(storageKey);
//       if (saved) return { ...defaultCols, ...JSON.parse(saved) };
//     } catch { /* ignore */ }
//     return defaultCols;
//   });

//   // Persist columns
//   useEffect(() => {
//     if (storageKey) {
//       try { localStorage.setItem(storageKey, JSON.stringify(visibleCols)); } catch { /* ignore */ }
//     }
//   }, [visibleCols, storageKey]);

//   // Click outside to close dropdowns
//   useEffect(() => {
//     const onClick = (e) => {
//       if (columnsOpen && columnsRef.current && !columnsRef.current.contains(e.target)) setColumnsOpen(false);
//       if (filtersOpen && filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false);
//     };
//     document.addEventListener("mousedown", onClick);
//     return () => document.removeEventListener("mousedown", onClick);
//   }, [columnsOpen, filtersOpen]);

//   // Keyboard shortcut Ctrl+F
//   useEffect(() => {
//     const handler = (e) => {
//       if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
//         e.preventDefault();
//         searchInputRef.current?.focus();
//         searchInputRef.current?.select();
//       }
//     };
//     window.addEventListener("keydown", handler);
//     return () => window.removeEventListener("keydown", handler);
//   }, []);

//   // Reset page when data length changes drastically
//   useEffect(() => {
//     setPage(1);
//   }, [data.length]);

//   // Sorting
//   const toggleSort = (key) => {
//     if (sortKey === key) {
//       setSortDir(sortDir === "asc" ? "desc" : "asc");
//     } else {
//       setSortKey(key);
//       setSortDir("asc");
//     }
//   };

//   const sortedData = useMemo(() => {
//     if (!sortKey) return data;
//     return [...data].sort((a, b) => {
//       let va = a[sortKey];
//       let vb = b[sortKey];
//       if (typeof va === "string") va = va.toLowerCase();
//       if (typeof vb === "string") vb = vb.toLowerCase();
//       if (va < vb) return sortDir === "asc" ? -1 : 1;
//       if (va > vb) return sortDir === "asc" ? 1 : -1;
//       return 0;
//     });
//   }, [data, sortKey, sortDir]);

//   // Pagination
//   const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
//   const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

//   const visibleColumnsList = columns.filter((c) => c.alwaysVisible || visibleCols[c.key]);

//   return (
//     <div className="space-y-4">
//       {/* ── SEARCH & ACTIONS ── */}
//       <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
//         {onSearchChange !== undefined && (
//           <div className="relative w-full sm:max-w-md">
//             <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
//             <input
//               ref={searchInputRef}
//               value={searchValue}
//               onChange={(e) => onSearchChange(e.target.value)}
//               placeholder={searchPlaceholder}
//               className="w-full text-sm border border-canvas-200 bg-white rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-paprika-500/30 transition-all"
//             />
//             <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50 hidden sm:flex">
//               <kbd className="font-sans text-[10px] font-bold border border-canvas-200 rounded px-1">Ctrl</kbd>
//               <kbd className="font-sans text-[10px] font-bold border border-canvas-200 rounded px-1">F</kbd>
//             </div>
//           </div>
//         )}
//         {actions && (
//           <div className="flex items-center gap-2 w-full sm:w-auto">
//             {actions}
//           </div>
//         )}
//       </div>

//       {/* ── TOOLBAR (Filters & Columns) ── */}
//       <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-canvas-200 rounded-xl px-2.5 py-2 shadow-sm">
//         <div className="flex items-center gap-2">
//           {filterContent && (
//             <div className="relative" ref={filtersRef}>
//               <button
//                 onClick={() => { setFiltersOpen(!filtersOpen); setColumnsOpen(false); }}
//                 className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
//                   filtersOpen || activeFilterCount > 0
//                     ? "bg-paprika-50 border-paprika-200 text-paprika-700"
//                     : "border-canvas-200 text-ink-600 hover:bg-canvas-50"
//                 }`}
//               >
//                 <Filter size={14} className={activeFilterCount > 0 ? "text-paprika-500" : "text-ink-400"} />
//                 Filters
//                 {activeFilterCount > 0 && (
//                   <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-paprika-500 text-[10px] font-bold text-white">
//                     {activeFilterCount}
//                   </span>
//                 )}
//               </button>

//               {filtersOpen && (
//                 <div className="absolute left-0 top-full mt-1.5 w-[320px] sm:w-[400px] z-20 bg-white border border-canvas-200 rounded-xl shadow-lg p-4">
//                   <div className="flex items-center justify-between mb-4 pb-2 border-b border-canvas-100">
//                     <p className="text-sm font-semibold text-ink-900">Advanced Filters</p>
//                     {activeFilterCount > 0 && onClearFilters && (
//                       <button onClick={onClearFilters} className="text-[11px] font-medium text-paprika-600 hover:underline">
//                         Clear all
//                       </button>
//                     )}
//                   </div>
//                   {filterContent}
//                 </div>
//               )}
//             </div>
//           )}

//           {filterContent && <div className="h-4 w-px bg-canvas-200 mx-1 hidden sm:block"></div>}
//           <p className="text-[13px] text-ink-500 font-medium">
//             <span className="font-bold text-ink-900">{data.length}</span> records
//           </p>
//         </div>

//         <div className="flex items-center gap-2">
//           <div className="relative" ref={columnsRef}>
//             <button
//               onClick={() => { setColumnsOpen(!columnsOpen); setFiltersOpen(false); }}
//               className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
//                 columnsOpen ? "bg-canvas-100 border-canvas-300 text-ink-900" : "border-canvas-200 text-ink-600 hover:bg-canvas-50"
//               }`}
//             >
//               <Settings2 size={14} className="text-ink-400" />
//               Columns
//             </button>

//             {columnsOpen && (
//               <div className="absolute right-0 top-full mt-1.5 w-48 z-20 bg-white border border-canvas-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
//                 <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">Visible Columns</p>
//                 {columns.filter(c => !c.alwaysVisible && c.header).map((col) => (
//                   <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-canvas-50 cursor-pointer">
//                     <input
//                       type="checkbox"
//                       checked={visibleCols[col.key]}
//                       onChange={(e) => setVisibleCols(p => ({ ...p, [col.key]: e.target.checked }))}
//                       className="rounded accent-paprika-500 w-3.5 h-3.5"
//                     />
//                     <span className="text-[13px] font-medium text-ink-700">{col.header}</span>
//                   </label>
//                 ))}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── DATA TABLE ── */}
//       <div className="rounded-xl bg-white border border-canvas-200 shadow-sm overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full text-sm text-left">
//             <thead className="bg-canvas-50 border-b border-canvas-200">
//               <tr>
//                 {visibleColumnsList.map((col) => {
//                   const canSort = !!col.sortKey;
//                   const isSorted = sortKey === col.sortKey;
//                   return (
//                     <th
//                       key={col.key}
//                       className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 whitespace-nowrap ${canSort ? "cursor-pointer hover:bg-canvas-100 select-none" : ""}`}
//                       onClick={() => canSort && toggleSort(col.sortKey)}
//                       style={{ width: col.width }}
//                     >
//                       <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
//                         {col.header}
//                         {canSort && (
//                           isSorted ? (sortDir === "asc" ? <ChevronUp size={13}/> : <ChevronDown size={13}/>) : <ChevronsUpDown size={13} className="opacity-30"/>
//                         )}
//                       </div>
//                     </th>
//                   );
//                 })}
//               </tr>
//             </thead>
//             <tbody>
//               {paginatedData.length === 0 && (
//                 <tr>
//                   <td colSpan={visibleColumnsList.length} className="px-4 py-12 text-center text-ink-400">
//                     <div className="flex flex-col items-center gap-2">
//                       <Search size={24} className="opacity-20" />
//                       <p>{emptyLabel}</p>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//               {paginatedData.map((row, idx) => (
//                 <tr
//                   key={row.id || idx}
//                   onClick={() => onRowClick && onRowClick(row)}
//                   className={`border-b border-canvas-100 last:border-0 ${onRowClick ? "hover:bg-canvas-50 cursor-pointer" : ""} transition-colors`}
//                 >
//                   {visibleColumnsList.map((col) => (
//                     <td key={col.key} className={`px-4 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}>
//                       {col.render ? col.render(row) : row[col.key]}
//                     </td>
//                   ))}
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>

//         {/* ── PAGINATION ── */}
//         {sortedData.length > 0 && (
//           <div className="flex items-center justify-between px-4 py-3 border-t border-canvas-200 bg-canvas-50/50">
//             <div className="flex items-center gap-2">
//               <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 hidden sm:inline">Rows per page:</span>
//               <select
//                 value={pageSize}
//                 onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
//                 className="text-[13px] font-bold text-ink-700 bg-transparent outline-none cursor-pointer"
//               >
//                 {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
//               </select>
//             </div>
//             <div className="flex items-center gap-4 text-[13px] font-medium text-ink-600">
//               <span className="hidden sm:inline">
//                 {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedData.length)} of {sortedData.length}
//               </span>
//               <div className="flex items-center gap-1">
//                 <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronsLeft size={16}/></button>
//                 <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronLeft size={16}/></button>
//                 <span className="px-2 font-mono text-xs">{page} / {totalPages}</span>
//                 <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronRight size={16}/></button>
//                 <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronsRight size={16}/></button>
//               </div>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }


import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search, Filter, Settings2, ChevronUp, ChevronDown, ChevronsUpDown,
  ChevronLeft, ChevronsLeft, ChevronRight, ChevronsRight, X
} from "lucide-react";

const PAGE_SIZES = [10, 25, 50, 100];

export default function ModuleTable({
  columns,
  data,
  onRowClick,
  emptyLabel = "No records found",
  storageKey,
  searchPlaceholder = "Search...",
  searchValue,
  onSearchChange,
  actions,
  filterContent,
  activeFilterCount = 0,
  onClearFilters,
  defaultPageSize = 25,
  maxHeight = "65vh"
}) {
  const [sortKey, setSortKey] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);

  const searchInputRef = useRef(null);
  const columnsRef = useRef(null);
  const filtersRef = useRef(null);

  // Initialize visible columns
  const [visibleCols, setVisibleCols] = useState(() => {
    const defaultCols = columns.reduce((acc, c) => ({ ...acc, [c.key]: true }), {});
    if (!storageKey) return defaultCols;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...defaultCols, ...JSON.parse(saved) };
    } catch { /* ignore */ }
    return defaultCols;
  });

  // Persist columns
  useEffect(() => {
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(visibleCols)); } catch { /* ignore */ }
    }
  }, [visibleCols, storageKey]);

  // Click outside to close dropdowns
  useEffect(() => {
    const onClick = (e) => {
      if (columnsOpen && columnsRef.current && !columnsRef.current.contains(e.target)) setColumnsOpen(false);
      if (filtersOpen && filtersRef.current && !filtersRef.current.contains(e.target)) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [columnsOpen, filtersOpen]);

  // Keyboard shortcut Ctrl+F
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Reset page when data length changes drastically
  useEffect(() => {
    setPage(1);
  }, [data.length]);

  // Sorting
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (!sortKey) return data;
    return [...data].sort((a, b) => {
      let va = a[sortKey];
      let vb = b[sortKey];
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortKey, sortDir]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);

  const visibleColumnsList = columns.filter((c) => c.alwaysVisible || visibleCols[c.key]);

  return (
    <div className="space-y-4">
      <style>{`
        .modtable-scroll::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .modtable-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .modtable-scroll::-webkit-scrollbar-thumb {
          background-color: #d4d4d8;
          border-radius: 9999px;
        }
        .modtable-scroll::-webkit-scrollbar-thumb:hover {
          background-color: #a1a1aa;
        }
        .modtable-scroll {
          scrollbar-width: thin;
          scrollbar-color: #d4d4d8 transparent;
        }
      `}</style>

      {/* ── SEARCH & ACTIONS ── */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        {onSearchChange !== undefined && (
          <div className="relative w-full sm:max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              ref={searchInputRef}
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full text-sm border border-canvas-200 bg-white rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-paprika-500/30 transition-all"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none opacity-50 hidden sm:flex">
              <kbd className="font-sans text-[10px] font-bold border border-canvas-200 rounded px-1">Ctrl</kbd>
              <kbd className="font-sans text-[10px] font-bold border border-canvas-200 rounded px-1">F</kbd>
            </div>
          </div>
        )}
        {actions && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {actions}
          </div>
        )}
      </div>

      {/* ── TOOLBAR (Filters & Columns) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-canvas-200 rounded-xl px-2.5 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          {filterContent && (
            <div className="relative" ref={filtersRef}>
              <button
                onClick={() => { setFiltersOpen(!filtersOpen); setColumnsOpen(false); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                  filtersOpen || activeFilterCount > 0
                    ? "bg-paprika-50 border-paprika-200 text-paprika-700"
                    : "border-canvas-200 text-ink-600 hover:bg-canvas-50"
                }`}
              >
                <Filter size={14} className={activeFilterCount > 0 ? "text-paprika-500" : "text-ink-400"} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-paprika-500 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-[320px] sm:w-[400px] z-20 bg-white border border-canvas-200 rounded-xl shadow-lg p-4">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-canvas-100">
                    <p className="text-sm font-semibold text-ink-900">Advanced Filters</p>
                    {activeFilterCount > 0 && onClearFilters && (
                      <button onClick={onClearFilters} className="text-[11px] font-medium text-paprika-600 hover:underline">
                        Clear all
                      </button>
                    )}
                  </div>
                  {filterContent}
                </div>
              )}
            </div>
          )}

          {filterContent && <div className="h-4 w-px bg-canvas-200 mx-1 hidden sm:block"></div>}
          <p className="text-[13px] text-ink-500 font-medium">
            <span className="font-bold text-ink-900">{data.length}</span> records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative" ref={columnsRef}>
            <button
              onClick={() => { setColumnsOpen(!columnsOpen); setFiltersOpen(false); }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium border transition-colors ${
                columnsOpen ? "bg-canvas-100 border-canvas-300 text-ink-900" : "border-canvas-200 text-ink-600 hover:bg-canvas-50"
              }`}
            >
              <Settings2 size={14} className="text-ink-400" />
              Columns
            </button>

            {columnsOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-48 z-20 bg-white border border-canvas-200 rounded-xl shadow-lg p-2 flex flex-col gap-1">
                <p className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-ink-400">Visible Columns</p>
                {columns.filter(c => !c.alwaysVisible && c.header).map((col) => (
                  <label key={col.key} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-canvas-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleCols[col.key]}
                      onChange={(e) => setVisibleCols(p => ({ ...p, [col.key]: e.target.checked }))}
                      className="rounded accent-paprika-500 w-3.5 h-3.5"
                    />
                    <span className="text-[13px] font-medium text-ink-700">{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DATA TABLE ── */}
      <div className="rounded-xl bg-white border border-canvas-200 shadow-sm overflow-hidden">
        <div className="modtable-scroll overflow-auto" style={{ maxHeight }}>
          <table className="w-full text-sm text-left">
            <thead className="bg-canvas-50 border-b border-canvas-200 sticky top-0 z-10">
              <tr>
                {visibleColumnsList.map((col) => {
                  const canSort = !!col.sortKey;
                  const isSorted = sortKey === col.sortKey;
                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink-500 whitespace-nowrap ${canSort ? "cursor-pointer hover:bg-canvas-100 select-none" : ""}`}
                      onClick={() => canSort && toggleSort(col.sortKey)}
                      style={{ width: col.width }}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === "right" ? "justify-end" : col.align === "center" ? "justify-center" : ""}`}>
                        {col.header}
                        {canSort && (
                          isSorted ? (sortDir === "asc" ? <ChevronUp size={13}/> : <ChevronDown size={13}/>) : <ChevronsUpDown size={13} className="opacity-30"/>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {paginatedData.length === 0 && (
                <tr>
                  <td colSpan={visibleColumnsList.length} className="px-4 py-12 text-center text-ink-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search size={24} className="opacity-20" />
                      <p>{emptyLabel}</p>
                    </div>
                  </td>
                </tr>
              )}
              {paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`border-b border-canvas-100 last:border-0 ${onRowClick ? "hover:bg-canvas-50 cursor-pointer" : ""} transition-colors`}
                >
                  {visibleColumnsList.map((col) => (
                    <td key={col.key} className={`px-4 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}>
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ── */}
        {sortedData.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-canvas-200 bg-canvas-50/50">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 hidden sm:inline">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="text-[13px] font-bold text-ink-700 bg-transparent outline-none cursor-pointer"
              >
                {PAGE_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-4 text-[13px] font-medium text-ink-600">
              <span className="hidden sm:inline">
                {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, sortedData.length)} of {sortedData.length}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(1)} disabled={page === 1} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronsLeft size={16}/></button>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronLeft size={16}/></button>
                <span className="px-2 font-mono text-xs">{page} / {totalPages}</span>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronRight size={16}/></button>
                <button onClick={() => setPage(totalPages)} disabled={page === totalPages} className="p-1 rounded hover:bg-canvas-200 disabled:opacity-30 disabled:hover:bg-transparent text-ink-500"><ChevronsRight size={16}/></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}