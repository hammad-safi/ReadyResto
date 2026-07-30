import { useState, useEffect } from "react";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import Button from "../ui/Button";
import { generateReportData } from "../../api/reports";
import { exportToCSV, printReport } from "../../utils/export";

const COLORS = ['#e63946', '#f4a261', '#2a9d8f', '#e9c46a', '#264653', '#8ab17d'];

export default function ReportViewer({ reportType, onBack }) {
  const [dataPayload, setDataPayload] = useState(null);
  const [dateRange, setDateRange] = useState("This Month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    generateReportData(reportType, dateRange).then(res => {
      setDataPayload(res);
      setLoading(false);
    });
  }, [reportType, dateRange]);

  const handleExportCSV = () => {
    if (dataPayload?.data) {
      exportToCSV(dataPayload.data, reportType.replace(/\s+/g, '_'));
    }
  };

  const renderChart = () => {
    if (!dataPayload || dataPayload.chartType === "none" || !dataPayload.data.length) return null;

    if (dataPayload.chartType === "bar") {
      return (
        <div className="h-72 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataPayload.data}>
              <XAxis dataKey="label" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `Rs. ${v}`} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey={dataPayload.dataKey} fill="#e63946" radius={[4, 4, 0, 0]} />
              {dataPayload.secondaryDataKey && (
                <Bar dataKey={dataPayload.secondaryDataKey} fill="#f4a261" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (dataPayload.chartType === "pie") {
      return (
        <div className="h-72 w-full mb-8">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dataPayload.data}
                dataKey={dataPayload.dataKey}
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#e63946"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {dataPayload.data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }
  };

  const renderTable = () => {
    if (!dataPayload || !dataPayload.data.length) {
      return <div className="text-center py-10 text-ink-500">No data available for this period.</div>;
    }

    const headers = Object.keys(dataPayload.data[0]);

    return (
      <div className="overflow-x-auto rounded-xl border border-canvas-200">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-canvas-50 text-ink-500 border-b border-canvas-200">
            <tr>
              {headers.map(h => (
                <th key={h} className="px-4 py-3 font-semibold capitalize">{h.replace(/_/g, " ")}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-canvas-200">
            {dataPayload.data.map((row, i) => (
              <tr key={i} className="hover:bg-canvas-50/50 transition-colors">
                {headers.map(h => (
                  <td key={h} className="px-4 py-3 text-ink-800">
                    {typeof row[h] === 'number' && h !== 'orders' && h !== 'qty' && h !== 'tables' 
                      ? `Rs. ${row[h].toLocaleString()}` 
                      : row[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl2 border border-canvas-200 shadow-soft p-6 @container print:border-none print:shadow-none print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-lg text-ink-500 hover:bg-canvas-100 hover:text-ink-900 transition-colors print:hidden">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-display font-semibold text-ink-900">{reportType}</h2>
            <p className="text-sm text-ink-500 mt-0.5">Summary based on live data</p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-canvas-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-paprika-500/30 bg-canvas-50 hover:bg-white transition-colors"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>This Year</option>
            <option>All Time</option>
          </select>
          <Button variant="secondary" size="sm" icon={Printer} onClick={printReport} title="Print Report">
            Print
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
            Export CSV
          </Button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20 text-ink-400">
          <div className="animate-spin h-6 w-6 border-2 border-paprika-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderChart()}
          {renderTable()}
        </div>
      )}
    </div>
  );
}
