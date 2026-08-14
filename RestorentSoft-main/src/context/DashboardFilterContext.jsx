import { createContext, useContext, useState } from "react";

const DashboardFilterContext = createContext(null);

export function DashboardFilterProvider({ children }) {
  const [filters, setFilters] = useState({ range: "Today", branch: "All Branches" });

  const updateFilters = (updates) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const getDateRange = () => {
    const now = new Date();
    const start = new Date(now);
    const end = new Date(now);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    if (filters.range === "Today") {
      return { start, end };
    } else if (filters.range === "This Week") {
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
      start.setDate(diff);
      return { start, end };
    } else if (filters.range === "This Month") {
      start.setDate(1);
      return { start, end };
    } else if (filters.range === "This Year") {
      start.setMonth(0, 1);
      return { start, end };
    }
    return { start: null, end: null }; // All Time or unknown
  };

  return (
    <DashboardFilterContext.Provider value={{ filters, updateFilters, getDateRange }}>
      {children}
    </DashboardFilterContext.Provider>
  );
}

export function useDashboardFilters() {
  const context = useContext(DashboardFilterContext);
  if (!context) {
    throw new Error("useDashboardFilters must be used within a DashboardFilterProvider");
  }
  return context;
}
