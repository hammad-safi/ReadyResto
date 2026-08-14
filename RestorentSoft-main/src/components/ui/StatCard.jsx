export default function StatCard({ label, value, delta, deltaTone = "success", icon: Icon, sub }) {
  return (
    <div className="rounded-xl border-l-4 border-l-paprika-500 bg-canvas-100 border-y border-r border-canvas-200 p-4 shadow-soft flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-500 uppercase tracking-wide">{label}</span>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-paprika-50 text-paprika-600 flex items-center justify-center shrink-0">
            <Icon size={16} strokeWidth={2} />
          </div>
        )}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span className="font-display text-2xl font-semibold text-ink-900 truncate">{value}</span>
        {delta && (
          <span
            className={`text-xs font-semibold mb-0.5 shrink-0 ${
              deltaTone === "success" ? "text-basil-600" : "text-paprika-600"
            }`}
          >
            {delta}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-ink-500">{sub}</span>}
    </div>
  );
}
