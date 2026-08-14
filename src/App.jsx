import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import LoginScreen from "./auth/LoginScreen";
import LockScreen from "./auth/LockScreen";
import AppLayout from "./components/layout/AppLayout";
import { DashboardFilterProvider } from "./context/DashboardFilterContext";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS";
import Kitchen from "./pages/Kitchen";
import Tables from "./pages/Tables";
import Orders from "./pages/Orders";
import Sales from "./pages/Sales";
import Menu from "./pages/Menu";
import Inventory from "./pages/Inventory";
import Suppliers from "./pages/Suppliers";
import Purchases from "./pages/Purchases";
import Customers from "./pages/Customers";
import Employees from "./pages/Employees";
import Users from "./pages/Users";
import Expenses from "./pages/Expenses";
import Accounting from "./pages/Accounting";
import Reports from "./pages/Reports";
import Notifications from "./pages/Notifications";
import Printing from "./pages/Printing";
import Hardware from "./pages/Hardware";
import Settings from "./pages/Settings";

function Root() {
  const { user, locked } = useAuth();

  // Not logged in → show full Login Screen
  if (!user) return <LoginScreen />;

  // Logged in but session locked → show Lock Screen
  if (locked) return <LockScreen />;

  // Fully authenticated → show the app
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pos" element={<POS />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/tables" element={<Tables />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/users" element={<Users />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/accounting" element={<Accounting />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/printing" element={<Printing />} />
          <Route path="/hardware" element={<Hardware />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardFilterProvider>
        <Root />
      </DashboardFilterProvider>
    </AuthProvider>
  );
}
