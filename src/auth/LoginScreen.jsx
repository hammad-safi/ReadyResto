import { useState, useEffect, useRef } from "react";
import {
  UtensilsCrossed, Eye, EyeOff, Delete, ChevronDown,
  Lock, X, KeyRound, RefreshCw, Building2, ShieldAlert
} from "lucide-react";
import { useAuth } from "./AuthContext";
import api from "../api/client";

const BRANCHES = ["Main Branch", "Downtown", "Airport Road"];

/* ── Admin Override / Forgot PIN Modal ──────────────────────────────────── */
function AdminOverrideModal({ onClose, users }) {
  const [step, setStep] = useState("verify"); // verify | reset
  const [ownerPwd, setOwnerPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [targetUser, setTargetUser] = useState(users[0]?.id ?? "");
  const [resetType, setResetType] = useState("pin"); // pin | password
  const [newPin, setNewPin] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [success, setSuccess] = useState(false);

  const verify = async () => {
    if (!ownerPwd.trim()) { setError("Enter the Owner master password"); return; }
    setLoading(true);
    setError("");
    const res = await api.adminOverride(ownerPwd);
    setLoading(false);
    if (res.success) setStep("reset");
    else setError(res.message || "Incorrect master password");
  };

  const doReset = async () => {
    if (resetType === "pin" && (newPin.length < 4 || newPin.length > 6)) {
      setError("PIN must be 4–6 digits"); return;
    }
    if (resetType === "password" && newPassword.length < 4) {
      setError("Password must be at least 4 characters"); return;
    }
    setLoading(true);
    setError("");
    const uid = Number(targetUser);
    let res;
    if (resetType === "pin") res = await api.resetUserPin(uid, newPin, ownerPwd);
    else res = await api.resetUserPassword(uid, newPassword, ownerPwd);
    setLoading(false);
    if (res.success) setSuccess(true);
    else setError(res.message || "Reset failed");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-canvas-100">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <ShieldAlert size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink-900">Admin Override</p>
              <p className="text-xs text-ink-500">Forgot PIN / Password recovery</p>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg text-ink-500 hover:bg-canvas-100">
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl">✓</span>
              </div>
              <p className="font-semibold text-ink-900 mb-1">Reset Successful</p>
              <p className="text-sm text-ink-500 mb-5">The {resetType === "pin" ? "PIN" : "password"} has been updated.</p>
              <button onClick={onClose} className="px-5 py-2 rounded-lg bg-paprika-500 text-white text-sm font-medium">
                Close
              </button>
            </div>
          ) : step === "verify" ? (
            <div className="space-y-4">
              <p className="text-sm text-ink-600">
                Enter the <span className="font-semibold text-ink-900">Owner's master password</span> to proceed with a PIN or password reset.
              </p>
              <div>
                <label className="text-xs font-medium text-ink-600">Owner Master Password</label>
                <div className="relative mt-1">
                  <input
                    type={showPwd ? "text" : "password"}
                    value={ownerPwd}
                    onChange={(e) => { setOwnerPwd(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && verify()}
                    placeholder="Enter master password"
                    className="w-full border border-canvas-200 rounded-lg px-3 py-2.5 text-sm pr-10 outline-none focus:ring-2 focus:ring-paprika-500/30 focus:border-paprika-400"
                  />
                  <button type="button" onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700">
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-canvas-200 text-sm font-medium text-ink-700 hover:bg-canvas-50">
                  Cancel
                </button>
                <button onClick={verify} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-paprika-500 text-white text-sm font-medium hover:bg-paprika-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Lock size={14} />}
                  Verify
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-green-600 font-medium flex items-center gap-1.5">
                <span className="text-base">✓</span> Master password verified
              </p>

              {/* Reset type */}
              <div className="flex gap-2">
                {["pin", "password"].map((t) => (
                  <button key={t} onClick={() => setResetType(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-colors ${
                      resetType === t ? "bg-ink-900 text-white border-ink-900" : "border-canvas-200 text-ink-600 hover:bg-canvas-50"
                    }`}>
                    Reset {t === "pin" ? "PIN" : "Password"}
                  </button>
                ))}
              </div>

              {/* User selector */}
              <div>
                <label className="text-xs font-medium text-ink-600">Select User</label>
                <select value={targetUser} onChange={(e) => setTargetUser(e.target.value)}
                  className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30">
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {resetType === "pin" ? (
                <div>
                  <label className="text-xs font-medium text-ink-600">New PIN (4–6 digits)</label>
                  <input type="password" inputMode="numeric" maxLength={6}
                    value={newPin} onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, "")); setError(""); }}
                    placeholder="Enter new PIN"
                    className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-ink-600">New Password</label>
                  <input type="password"
                    value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                    placeholder="Enter new password"
                    className="w-full mt-1 border border-canvas-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-paprika-500/30" />
                </div>
              )}

              {error && <p className="text-xs text-red-500">{error}</p>}

              <div className="flex gap-2 pt-1">
                <button onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-canvas-200 text-sm font-medium text-ink-700 hover:bg-canvas-50">
                  Cancel
                </button>
                <button onClick={doReset} disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-paprika-500 text-white text-sm font-medium hover:bg-paprika-600 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                  Reset {resetType === "pin" ? "PIN" : "Password"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── PIN Pad ────────────────────────────────────────────────────────────── */
function PinPad({ onPress, onClear, onBack }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
        <button
          key={n}
          onClick={() => onPress(String(n))}
          className="h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xl font-semibold
                     border border-white/10 transition-all duration-100 active:scale-95 select-none"
        >
          {n}
        </button>
      ))}
      <button onClick={onClear}
        className="h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white/70 text-xs font-semibold
                   border border-white/10 transition-all duration-100 active:scale-95 select-none">
        CLR
      </button>
      <button onClick={() => onPress("0")}
        className="h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white text-xl font-semibold
                   border border-white/10 transition-all duration-100 active:scale-95 select-none">
        0
      </button>
      <button onClick={onBack}
        className="h-14 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 border border-white/10
                   flex items-center justify-center text-white/70 transition-all duration-100 active:scale-95 select-none">
        <Delete size={20} />
      </button>
    </div>
  );
}

/* ── Main Login Screen ──────────────────────────────────────────────────── */
export default function LoginScreen() {
  const { loginWithPin, loginWithPassword } = useAuth();
  const [tab, setTab] = useState("pin"); // pin | password
  const [pin, setPin] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [branch, setBranch] = useState(BRANCHES[0]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [showOverride, setShowOverride] = useState(false);
  const [users, setUsers] = useState([]);
  const usernameRef = useRef(null);

  const submitTimeoutRef = useRef(null);

  // Load users list for admin override dropdown
  useEffect(() => {
    api.list("users").then(setUsers).catch(() => {});
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (submitTimeoutRef.current) clearTimeout(submitTimeoutRef.current);
    };
  }, []);

  // Restore remembered username
  useEffect(() => {
    const saved = localStorage.getItem("dastarkhwan-remembered-user");
    if (saved) setUsername(saved);
  }, []);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const pressPin = (d) => {
    if (loading || pin.length >= 6) return;
    setError("");
    const next = pin + d;
    setPin(next);

    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current);
      submitTimeoutRef.current = null;
    }

    // Check if this matches an active user's PIN exactly
    const exactMatch = users.some((u) => u.pin === next && u.status === "active");
    // Check if this is a prefix of any active user's longer PIN
    const isPrefix = users.some((u) => u.pin.startsWith(next) && u.pin.length > next.length && u.status === "active");

    // Auto-submit if:
    // 1. Reached 6 digits (max PIN length)
    // 2. Exact match is found
    // 3. Reached 4 or more digits and is not a prefix of any active user's PIN
    if (next.length === 6 || exactMatch || (next.length >= 4 && !isPrefix)) {
      submitTimeoutRef.current = setTimeout(() => submitPin(next), 200);
    }
  };

  const submitPin = async (p) => {
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

  const submitPassword = async () => {
    if (!username.trim() || !password.trim()) { setError("Enter username and password"); return; }
    setLoading(true);
    setError("");
    const res = await loginWithPassword(username.trim(), password);
    setLoading(false);
    if (!res.success) {
      setError(res.message || "Invalid credentials");
      triggerShake();
    } else {
      if (rememberDevice) localStorage.setItem("dastarkhwan-remembered-user", username.trim());
      else localStorage.removeItem("dastarkhwan-remembered-user");
    }
  };

  const PIN_DOTS = 6;

  return (
    <>
      {showOverride && (
        <AdminOverrideModal onClose={() => setShowOverride(false)} users={users} />
      )}

      {/* Background */}
      <div className="min-h-screen bg-ink-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-paprika-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-paprika-900/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card */}
        <div
          className={`relative w-full max-w-sm transition-transform duration-100 ${shake ? "animate-[shake_0.5s_ease]" : ""}`}
          style={shake ? { animation: "shake 0.5s ease" } : {}}
        >
          {/* Glass card */}
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-3xl p-7 shadow-2xl">
            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-paprika-500 flex items-center justify-center mb-4 shadow-lg shadow-paprika-500/30">
                <UtensilsCrossed size={26} className="text-white" strokeWidth={2} />
              </div>
              <h1 className="font-display font-bold text-xl text-white">Dastarkhwan ERP</h1>
              <p className="text-xs text-white/50 mt-1 tracking-wide">Restaurant Management System</p>
            </div>

            {/* Branch Selector (shown when multi-branch) */}
            <div className="mb-5">
              <label className="relative flex items-center gap-2 bg-white/10 border border-white/10 rounded-xl px-3.5 py-2.5 cursor-pointer hover:bg-white/15 transition-colors">
                <Building2 size={15} className="text-white/60 shrink-0" />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="flex-1 bg-transparent text-sm text-white outline-none appearance-none cursor-pointer"
                >
                  {BRANCHES.map((b) => <option key={b} value={b} className="bg-ink-900 text-white">{b}</option>)}
                </select>
                <ChevronDown size={14} className="text-white/40 shrink-0" />
              </label>
            </div>

            {/* Tab Toggle */}
            <div className="flex bg-white/10 rounded-xl p-1 mb-5 gap-1">
              {[{ id: "pin", label: "PIN Login" }, { id: "password", label: "Password" }].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setError(""); setPin(""); }}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    tab === t.id
                      ? "bg-paprika-500 text-white shadow-lg shadow-paprika-500/30"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* ── PIN Mode ── */}
            {tab === "pin" && (
              <div>
                {/* PIN dot indicators */}
                <div className="flex justify-center gap-3 mb-4">
                  {Array.from({ length: PIN_DOTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-3 w-3 rounded-full border transition-all duration-200 ${
                        i < pin.length
                          ? "bg-paprika-400 border-paprika-400 scale-110"
                          : "border-white/30"
                      }`}
                    />
                  ))}
                </div>

                {error && (
                  <p className="text-center text-xs text-red-400 mb-3 animate-pulse">{error}</p>
                )}

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw size={22} className="text-white/60 animate-spin" />
                  </div>
                ) : (
                  <PinPad
                    pin={pin}
                    onPress={pressPin}
                    onClear={() => { setPin(""); setError(""); }}
                    onBack={() => setPin((p) => p.slice(0, -1))}
                  />
                )}

                {/* Manual submit if auto-submit didn't fire */}
                <button
                  onClick={() => submitPin(pin)}
                  disabled={pin.length < 4 || loading}
                  className="w-full mt-4 py-3 rounded-xl bg-paprika-500 text-white font-semibold text-sm
                             hover:bg-paprika-600 disabled:opacity-30 transition-all duration-200
                             shadow-lg shadow-paprika-500/20"
                >
                  {loading ? "Verifying…" : "Unlock"}
                </button>

                <p className="text-center text-[10px] text-white/30 mt-4">
                  Demo PINs: <span className="text-white/50">1234</span> Owner ·{" "}
                  <span className="text-white/50">2345</span> Cashier ·{" "}
                  <span className="text-white/50">3456</span> Waiter ·{" "}
                  <span className="text-white/50">4567</span> Kitchen
                </p>
              </div>
            )}

            {/* ── Password Mode ── */}
            {tab === "password" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-white/60">Username or Email</label>
                  <input
                    ref={usernameRef}
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                    placeholder="Enter username or email"
                    className="w-full mt-1.5 bg-white/10 border border-white/10 rounded-xl px-3.5 py-3
                               text-sm text-white placeholder:text-white/30 outline-none
                               focus:ring-2 focus:ring-paprika-500/50 focus:border-paprika-500/50 transition-all"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-white/60">Password</label>
                  <div className="relative mt-1.5">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                      placeholder="Enter password"
                      className="w-full bg-white/10 border border-white/10 rounded-xl px-3.5 py-3 pr-11
                                 text-sm text-white placeholder:text-white/30 outline-none
                                 focus:ring-2 focus:ring-paprika-500/50 focus:border-paprika-500/50 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {error && <p className="text-xs text-red-400">{error}</p>}

                {/* Remember device */}
                <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="h-4 w-4 rounded accent-paprika-500 cursor-pointer"
                  />
                  <span className="text-xs text-white/50 group-hover:text-white/70 transition-colors">
                    Remember this device
                  </span>
                </label>

                <button
                  onClick={submitPassword}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-paprika-500 text-white font-semibold text-sm
                             hover:bg-paprika-600 disabled:opacity-40 transition-all duration-200
                             shadow-lg shadow-paprika-500/20 mt-1 flex items-center justify-center gap-2"
                >
                  {loading ? <><RefreshCw size={14} className="animate-spin" />Signing in…</> : "Login"}
                </button>

                <p className="text-center text-[10px] text-white/30">
                  Demo password: <span className="text-white/50">owner123</span> (Owner)
                </p>
              </div>
            )}

            {/* Forgot PIN / Password link */}
            <div className="mt-5 text-center">
              <button
                onClick={() => setShowOverride(true)}
                className="text-xs text-white/40 hover:text-white/70 transition-colors underline underline-offset-2"
              >
                Forgot PIN / Password?
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-[10px] text-white/20 mt-5">
            Dastarkhwan ERP · Offline Mode · v1.0
          </p>
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
    </>
  );
}
