import { useState } from "react";
import {
  BarChart3, TrendingUp, Package, Truck, Users, ChefHat, Wallet, Receipt, PieChart, CalendarDays,
} from "lucide-react";
import PageHeader from "../components/ui/PageHeader";
import ReportViewer from "../components/reports/ReportViewer";

const REPORTS = [
  { name: "Daily Sales", icon: CalendarDays },
  { name: "Monthly Sales", icon: BarChart3 },
  { name: "Annual Sales", icon: TrendingUp },
  { name: "Product-wise Sales", icon: Package },
  { name: "Category-wise Sales", icon: PieChart },
  { name: "Waiter Performance", icon: Users },
  { name: "Cashier Report", icon: Receipt },
  { name: "Kitchen Report", icon: ChefHat },
  { name: "Inventory Report", icon: Package },
  { name: "Purchase Report", icon: Truck },
  { name: "Supplier Report", icon: Truck },
  { name: "Expense Report", icon: Wallet },
  { name: "Profit Report", icon: TrendingUp },
  { name: "Tax Report", icon: Receipt },
];

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState(null);

  if (selectedReport) {
    return (
      <div className="h-full print:bg-white print:p-0">
        <ReportViewer 
          reportType={selectedReport} 
          onBack={() => setSelectedReport(null)} 
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Every report exports to PDF, Excel, or CSV with custom date ranges."
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {REPORTS.map((r) => (
          <button
            key={r.name}
            onClick={() => setSelectedReport(r.name)}
            className="text-left bg-white border border-canvas-200 rounded-xl2 shadow-soft p-4 hover:shadow-card hover:-translate-y-0.5 transition-all"
          >
            <div className="h-9 w-9 rounded-lg bg-paprika-50 text-paprika-600 flex items-center justify-center mb-3">
              <r.icon size={17} />
            </div>
            <p className="text-sm font-medium text-ink-900">{r.name}</p>
            <p className="text-xs text-ink-500 mt-0.5">View report →</p>
          </button>
        ))}
      </div>
    </div>
  );
}
