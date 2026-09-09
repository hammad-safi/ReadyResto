import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';

export default function SearchableSelect({ value, onChange, options, placeholder = "Select...", displayKey = "name", valueKey = "id", className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o[valueKey]) === String(value));
  const filteredOptions = options.filter(o => 
    (o[displayKey] || "").toLowerCase().includes(search.toLowerCase()) || 
    (o.code && o.code.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div 
        className="w-full border border-canvas-200 rounded-lg px-3 py-2 text-sm flex justify-between items-center bg-white cursor-pointer hover:border-paprika-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className={selectedOption ? "text-ink-900" : "text-ink-400"}>
          {selectedOption ? selectedOption[displayKey] : placeholder}
        </span>
        <ChevronDown size={16} className="text-ink-400" />
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-canvas-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white border-b border-canvas-100">
            <input 
              type="text" 
              className="w-full bg-canvas-50 border border-canvas-200 rounded px-2 py-1.5 text-sm outline-none focus:border-paprika-500"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-ink-400 text-center">No results found</div>
            ) : (
              filteredOptions.map(opt => (
                <div 
                  key={opt[valueKey]}
                  className={`px-3 py-2 text-sm rounded cursor-pointer flex justify-between items-center hover:bg-canvas-50 ${String(opt[valueKey]) === String(value) ? 'bg-paprika-50 text-paprika-700 font-medium' : 'text-ink-700'}`}
                  onClick={() => {
                    onChange(opt[valueKey]);
                    setIsOpen(false);
                    setSearch("");
                  }}
                >
                  <span>{opt.code ? <span className="text-ink-400 mr-2 text-xs">{opt.code}</span> : null}{opt[displayKey]}</span>
                  {String(opt[valueKey]) === String(value) && <CheckCircle2 size={14} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
