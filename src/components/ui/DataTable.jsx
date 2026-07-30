export default function DataTable({ columns, rows, keyField = "id", onRowClick, emptyLabel = "No records found" }) {
  return (
    <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-canvas-200 bg-canvas-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left font-medium text-ink-500 uppercase tracking-wide text-[11px] px-4 py-3 whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-ink-500 text-sm">
                  {emptyLabel}
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={() => onRowClick && onRowClick(row)}
                className={`border-b border-canvas-100 last:border-0 ${
                  onRowClick ? "hover:bg-canvas-50 cursor-pointer" : ""
                } transition-colors`}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 whitespace-nowrap text-ink-800">
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
