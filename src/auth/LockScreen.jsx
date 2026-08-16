import { useState, useEffect, useRef } from "react";
import { Delete, UtensilsCrossed, RefreshCw, LogOut } from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "../api/client";

function PinPad({ onPress, onClear, onBack }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          onClick={() => onPress(String(n))}
          className="h-14 rounded-xl bg-canvas-100 hover:bg-canvas-200 active:bg-canvas-300 text-ink-900 text-xl font-semibold
                     border border-canvas-200 transition-all duration-100 active:scale-95 select-none"
        >
          {n}
        </button>
      ))}
      <button onClick={onClear}
        className="h-14 rounded-xl bg-canvas-100 hover:bg-canvas-200 text-ink-600 text-xs font-semibold
                   border border-canvas-200 transition-all duration-100 active:scale-95 select-none">
        CLR
      </button>
      <button onClick={() => onPress("0")}
        className="h-14 rounded-xl bg-canvas-100 hover:bg-canvas-200 text-ink-900 text-xl font-semibold
                   border border-canvas-200 transition-all duration-100 active:scale-95 select-none">
        0
      </button>
      <button onClick={onBack}
        className="h-14 rounded-xl bg-canvas-100 hover:bg-canvas-200 border border-canvas-200
                   flex items-center justify-center text-ink-600 transition-all duration-100 active:scale-95 select-none">
        <Delete size={20} />
      </button>
    </div>
  );
}

export default function LockScreen() {
  const { user, loginWithPin, logout } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const submitTimeoutRef = useRef(null);
  const [expectedPinLength, setExpectedPinLength] = useState(user?.pin?.length || 4);

  const initials = user?.name
    ? user.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "U";

  useEffect(() => {
    if (user?.id) {
      api.get("users", user.id).then((u) => {
        if (u?.pin) setExpectedPinLength(u.pin.length);
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const pressPin = async (d) => {
    if (loading || pin.length >= 6) return;
    setError("");
    const next = pin + d;
    setPin(next);

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }

    if (next.length === expectedPinLength) {
      submitTimeoutRef.current = setTimeout(() => submit(next), 200);
    }
  };

  const submit = async (p) => {
    const pinToTry = p ?? pin;
    if (pinToTry.length < 4) return;
    setLoading(true);
    setError("");
    const res = await loginWithPin(pinToTry);
    setLoading(false);
    if (!res.success) {
      setError(res.message || "Invalid PIN");
      setPin("");
      triggerShake();
    }
  };

  return (
    <div className="min-h-screen bg-canvas-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-paprika-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

      <div
        className={`relative w-full max-w-sm ${shake ? "" : ""}`}
        style={shake ? { animation: "shake 0.5s ease" } : {}}
      >
        <div className="bg-white border border-canvas-200 rounded-3xl p-7 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="h-12 w-12 rounded-2xl bg-paprika-500 flex items-center justify-center shadow-lg shadow-paprika-500/30">
              <UtensilsCrossed size={22} className="text-white" strokeWidth={2} />
            </div>
          </div>

          {/* Locked user info */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-full bg-saffron-400/20 border-2 border-saffron-400/30 flex items-center justify-center text-saffron-600 text-xl font-bold mb-3">
              {user?.profile_photo ? (
                <img src={user.profile_photo} alt={user.name} className="h-full w-full rounded-full object-cover" />
              ) : initials}
            </div>
            <p className="font-display font-semibold text-ink-900">{user?.name || "User"}</p>
            <span className="text-xs text-ink-500 mt-0.5 bg-canvas-100 rounded-full px-2.5 py-0.5 border border-canvas-200">{user?.role}</span>
            <p className="text-xs text-ink-500 mt-3 text-center">Screen is locked — enter your PIN to continue</p>
          </div>

          {/* PIN dots */}
          <div className="flex justify-center gap-3 mb-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}
                className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                  i < pin.length ? "bg-paprika-500 border-paprika-500 scale-110" : "bg-canvas-100 border-canvas-200"
                }`}
              />
            ))}
          </div>

          {error && <p className="text-center text-xs text-red-400 mb-3">{error}</p>}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw size={22} className="text-ink-400 animate-spin" />
            </div>
          ) : (
            <PinPad
              onPress={pressPin}
              onClear={() => { setPin(""); setError(""); }}
              onBack={() => setPin((p) => p.slice(0, -1))}
            />
          )}

          <button
            onClick={() => submit(pin)}
            disabled={pin.length < 4 || loading}
            className="w-full mt-4 py-3 rounded-xl bg-paprika-500 text-white font-semibold text-sm
                       hover:bg-paprika-600 disabled:opacity-30 transition-all duration-200 shadow-lg shadow-paprika-500/20"
          >
            {loading ? "Verifying…" : "Unlock"}
          </button>

          {/* Switch user */}
          <button
            onClick={logout}
            className="w-full mt-3 py-2.5 rounded-xl border border-canvas-200 text-ink-500 hover:text-ink-700 hover:bg-canvas-100
                       text-xs font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <LogOut size={13} />
            Switch User
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          45% { transform: translateX(-6px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-3px); }
          90% { transform: translateX(3px); }
        }
      `}</style>
    </div>
  );
}
