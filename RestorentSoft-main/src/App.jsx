import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RestaurantProvider } from "./context/RestaurantContext";
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

function Protected({ module, children }) {
  const { canDo, user } = useAuth();
  if (!user) return <Navigate to="/" />;
  if (user.role === "Owner") return children;
  if (module && !canDo(module, "view")) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-ink-500 p-10 text-center">
        <div className="text-4xl mb-4">🚫</div>
        <h2 className="text-lg font-bold text-ink-900 mb-2">Access Denied</h2>
        <p className="text-sm">Your role does not have permission to view this page.</p>
      </div>
    );
  }
  return children;
}

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
          <Route path="/" element={<Protected module="Dashboard"><Dashboard /></Protected>} />
          <Route path="/pos" element={<Protected module="POS Billing"><POS /></Protected>} />
          <Route path="/kitchen" element={<Protected module="Kitchen Display"><Kitchen /></Protected>} />
          <Route path="/tables" element={<Protected module="Table Management"><Tables /></Protected>} />
          <Route path="/orders" element={<Protected module="Order Management"><Orders /></Protected>} />
          <Route path="/sales" element={<Protected module="Sales"><Sales /></Protected>} />
          <Route path="/menu" element={<Protected module="Menu Management"><Menu /></Protected>} />
          <Route path="/inventory" element={<Protected module="Inventory"><Inventory /></Protected>} />
          <Route path="/suppliers" element={<Protected module="Suppliers"><Suppliers /></Protected>} />
          <Route path="/purchases" element={<Protected module="Purchases"><Purchases /></Protected>} />
          <Route path="/customers" element={<Protected module="Customers"><Customers /></Protected>} />
          <Route path="/employees" element={<Protected module="Employees"><Employees /></Protected>} />
          <Route path="/users" element={<Protected module="Users & Roles"><Users /></Protected>} />
          <Route path="/expenses" element={<Protected module="Expenses"><Expenses /></Protected>} />
          <Route path="/accounting" element={<Protected module="Accounting"><Accounting /></Protected>} />
          <Route path="/reports" element={<Protected module="Reports"><Reports /></Protected>} />
          <Route path="/notifications" element={<Protected module="Notifications"><Notifications /></Protected>} />
          <Route path="/printing" element={<Protected module="Printing"><Printing /></Protected>} />
          <Route path="/hardware" element={<Protected module="Hardware"><Hardware /></Protected>} />
          <Route path="/settings" element={<Protected module="Settings"><Settings /></Protected>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <AuthProvider>
        <DashboardFilterProvider>
          <Root />
        </DashboardFilterProvider>
      </AuthProvider>
    </RestaurantProvider>
  );
}
