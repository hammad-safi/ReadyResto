import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import { RestaurantProvider } from "./context/RestaurantContext";
import LoginScreen from "./auth/LoginScreen";
import LockScreen from "./auth/LockScreen";
import AppLayout from "./components/layout/AppLayout";
import { DashboardFilterProvider } from "./context/DashboardFilterContext";
import { DataCacheProvider } from "./context/DataCacheContext";
import { DialogProvider } from "./context/DialogContext";

import { lazy, Suspense } from "react";

// Lazy-loaded pages — each loads only when first visited
const Dashboard = lazy(() => import("./pages/Dashboard"));
const POS = lazy(() => import("./pages/POS"));
const Kitchen = lazy(() => import("./pages/Kitchen"));
const Tables = lazy(() => import("./pages/Tables"));
const Orders = lazy(() => import("./pages/Orders"));
const Sales = lazy(() => import("./pages/Sales"));
const Menu = lazy(() => import("./pages/Menu"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Purchases = lazy(() => import("./pages/Purchases"));
const Customers = lazy(() => import("./pages/Customers"));
const Employees = lazy(() => import("./pages/Employees"));
const Users = lazy(() => import("./pages/Users"));
const Expenses = lazy(() => import("./pages/Expenses"));
const Accounting = lazy(() => import("./pages/Accounting"));
const Reports = lazy(() => import("./pages/Reports"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Printing = lazy(() => import("./pages/Printing"));
const Hardware = lazy(() => import("./pages/Hardware"));
const Settings = lazy(() => import("./pages/Settings"));

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-paprika-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-ink-400 tracking-wide">Loading…</p>
      </div>
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </HashRouter>
  );
}

export default function App() {
  return (
    <RestaurantProvider>
      <DialogProvider>
        <AuthProvider>
          <DashboardFilterProvider>
            <DataCacheProvider>
              <Root />
            </DataCacheProvider>
          </DashboardFilterProvider>
        </AuthProvider>
      </DialogProvider>
    </RestaurantProvider>
  );
}
