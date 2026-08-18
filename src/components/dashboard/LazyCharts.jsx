import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = [
  "rgb(var(--color-primary-500))",
  "rgb(var(--status-warning-text))",
  "rgb(var(--status-success-text))",
  "rgb(var(--color-ink-500))",
  "rgb(var(--color-primary-300))"
];

export default function LazyCharts({
  trendTitle,
  trendSubtitle,
  trendGranularity,
  setTrendGranularity,
  trendData,
  hasTrendData,
  paymentData
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      <div className="lg:col-span-8 bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft min-h-[450px] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-display font-semibold">{trendTitle}</h3>
            <p className="text-xs text-ink-500">{trendSubtitle}</p>
          </div>
          <div className="flex bg-canvas-100 rounded-lg p-1">
            {["Hourly", "Daily", "Weekly", "Monthly"].map((g) => (
              <button
                key={g}
                onClick={() => setTrendGranularity(g)}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                  trendGranularity === g ? "bg-white shadow-sm text-ink-900" : "text-ink-500 hover:text-ink-700"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 relative">
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData} margin={{ top: 10, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSales" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="rgb(var(--color-primary-500))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#4E5661" }}
                  axisLine={{ stroke: "#E4E7EA" }}
                  tickLine={false}
                  tickMargin={12}
                />
                <Tooltip 
                  formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Sales']}
                  contentStyle={{ backgroundColor: 'rgb(var(--surface-card))', borderColor: 'rgb(var(--border-default))', borderRadius: '8px', color: 'rgb(var(--text-base))' }}
                  itemStyle={{ color: 'rgb(var(--color-primary-500))' }}
                  labelStyle={{ color: 'rgb(var(--text-muted))', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="rgb(var(--color-primary-500))"
                  strokeWidth={3}
                  strokeLinecap="round"
                  fill="url(#gradSales)"
                  dot={false}
                  activeDot={{ r: 5, fill: "rgb(var(--surface-card))", stroke: "rgb(var(--color-primary-500))", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-ink-400">No sales data</div>
          )}
        </div>
      </div>

      <div className="lg:col-span-4 bg-canvas-100 border border-canvas-200 p-6 rounded-xl2 shadow-soft flex flex-col">
        <h3 className="text-lg font-display font-semibold mb-4">Payment Split</h3>
        <div className="flex-1 flex flex-col items-center justify-center">
          {paymentData.length > 0 ? (
            <>
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie data={paymentData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} paddingAngle={2}>
                    {paymentData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="rgb(var(--surface-card))" />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(v) => [`Rs. ${v.toLocaleString()}`, 'Amount']} 
                    contentStyle={{ backgroundColor: 'rgb(var(--surface-card))', borderColor: 'rgb(var(--border-default))', borderRadius: '8px', color: 'rgb(var(--text-base))' }}
                    itemStyle={{ color: 'rgb(var(--color-primary-500))' }}
                    labelStyle={{ color: 'rgb(var(--text-muted))', fontWeight: 'bold' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="w-full mt-4 space-y-2">
                {paymentData.map((p, i) => (
                  <div key={p.name} className="flex justify-between text-sm">
                    <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full`} style={{ background: PIE_COLORS[i % PIE_COLORS.length] }}></span>{p.name}</div>
                    <div className="font-mono">{p.value}%</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-ink-400">No payment data</div>
          )}
        </div>
      </div>
    </div>
  );
}
