import { useState, useEffect } from "react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import StatCard from "../components/ui/StatCard";
import { DollarSign, TrendingDown, TrendingUp, Scale } from "lucide-react";
import api from "../api/client";

export default function Accounting() {
  const [stats, setStats] = useState({
    cashInDrawer: 0,
    incomeToday: 0,
    expensesToday: 0,
    netMargin: 0
  });

  const [plData, setPlData] = useState([]);

  useEffect(() => {
    Promise.all([
      api.list("orders"),
      api.list("expenses")
    ]).then(([orders, expenses]) => {
      // For the mock scenario, we'll treat all orders as relevant for "Today" and "This Month" 
      // since the system adds `created_at` on startup. 
      // In a real app, we would filter by exact date.
      
      const today = new Date();
      
      let incomeToday = 0;
      let cashInDrawer = 0;
      
      orders.forEach(o => {
        // Only count paid or completed orders
        if (o.status === "paid" || o.status === "completed" || o.status === "served") {
           incomeToday += Number(o.total || 0);
           if (o.payment_method === "Cash" || o.payment_method?.includes("Cash")) {
             // If tendered is recorded and change_due is present, the actual cash kept is tendered - change_due
             // But if payment is split or complex, we'll just use total for now.
             cashInDrawer += Number(o.total || 0);
           }
        }
      });

      let expensesToday = 0;
      let totalOperatingExpenses = 0;
      const expensesByCategory = {};

      expenses.forEach(e => {
        const amt = Number(e.amount || 0);
        
        // Simple mock check for "today" - if it has "Today" or if we just parse it
        const eDate = new Date(e.date);
        if (eDate.toDateString() === today.toDateString() || e.date === "Today") {
          expensesToday += amt;
        }
        
        // For P&L, aggregate all expenses (assuming they are for the current month in mock data)
        totalOperatingExpenses += amt;
        expensesByCategory[e.category] = (expensesByCategory[e.category] || 0) + amt;
      });

      // Calculate Net Margin for today
      let netMargin = 0;
      if (incomeToday > 0) {
        netMargin = ((incomeToday - expensesToday) / incomeToday) * 100;
      }

      setStats({
        cashInDrawer,
        incomeToday,
        expensesToday,
        netMargin: isNaN(netMargin) ? 0 : netMargin
      });

      // P&L Calculations
      const revenue = incomeToday; // Assuming all mock orders are for this month
      const cogs = Math.round(revenue * 0.3); // Rough 30% estimate for COGS
      const grossProfit = revenue - cogs;
      const netProfit = grossProfit - totalOperatingExpenses;

      const dynamicPlRows = [
        { label: "Revenue", value: revenue },
        { label: "Cost of Goods Sold (COGS, Est. 30%)", value: -cogs },
        { label: "Gross Profit", value: grossProfit, bold: true },
        { label: "Operating Expenses", value: -totalOperatingExpenses }
      ];

      Object.entries(expensesByCategory).forEach(([category, amount]) => {
        dynamicPlRows.push({
          label: category,
          value: -amount,
          indent: true
        });
      });

      dynamicPlRows.push({ label: "Net Profit", value: netProfit, bold: true });
      
      setPlData(dynamicPlRows);
    });
  }, []);

  return (
    <div>
      <PageHeader
        eyebrow="Books"
        title="Accounting"
        description="Cash book, daily closing, and profit & loss at a glance."
        actions={<Button variant="primary">Start Day Close</Button>}
      />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Cash in Drawer" value={`Rs. ${stats.cashInDrawer.toLocaleString()}`} icon={DollarSign} />
        <StatCard label="Income (Today)" value={`Rs. ${stats.incomeToday.toLocaleString()}`} icon={TrendingUp} deltaTone="success" />
        <StatCard label="Expenses (Today)" value={`Rs. ${stats.expensesToday.toLocaleString()}`} icon={TrendingDown} deltaTone={stats.expensesToday > 0 ? "danger" : "neutral"} />
        <StatCard label="Net Margin" value={`${stats.netMargin.toFixed(1)}%`} icon={Scale} />
      </div>

      <div className="rounded-xl2 bg-white border border-canvas-200 shadow-soft p-5 max-w-xl">
        <p className="font-display font-semibold text-ink-900 mb-4">Profit & Loss — This Month</p>
        <div className="space-y-2">
          {plData.map((r) => (
            <div
              key={r.label}
              className={`flex justify-between text-sm ${r.bold ? "font-semibold border-t border-canvas-200 pt-2 mt-1" : ""} ${r.indent ? "pl-4 text-ink-500" : "text-ink-800"}`}
            >
              <span>{r.label}</span>
              <span className={`font-mono ${r.value < 0 ? "text-paprika-600" : ""}`}>
                {r.value < 0 ? "-" : ""}Rs. {Math.abs(r.value).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" className="mt-4 w-full">Export P&L Statement</Button>
      </div>
    </div>
  );
}
