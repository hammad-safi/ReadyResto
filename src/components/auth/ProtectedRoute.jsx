import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { ShieldAlert } from "lucide-react";
import Button from "../ui/Button";

export default function ProtectedRoute({ module, children }) {
  const { user, canDo } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (module && !canDo(module, "view")) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-canvas-200 rounded-2xl p-8 shadow-card text-center space-y-4">
          <div className="h-16 w-16 mx-auto rounded-full bg-paprika-50 border border-paprika-200 flex items-center justify-center text-paprika-600">
            <ShieldAlert size={32} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-ink-900 font-display">Access Restricted</h2>
            <p className="text-sm text-ink-500 mt-1">
              You do not have permission to access the <span className="font-semibold text-ink-800">{module}</span> module.
            </p>
            <p className="text-xs text-ink-400 mt-2">
              Logged in as <span className="font-semibold text-ink-700">{user.name}</span> ({user.role})
            </p>
          </div>
          <div className="pt-2">
            <Button variant="primary" onClick={() => (window.location.hash = "#/")} className="w-full justify-center">
              Return to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
