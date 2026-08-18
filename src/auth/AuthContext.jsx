import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);       // null = not logged in
  const [locked, setLocked] = useState(false);  // true = session locked (show LockScreen)
  const [ready, setReady] = useState(false);    // app init complete
  const [permissions, setPermissions] = useState([]); // flat rows from role_permissions
  const [autoLockMinutes, setAutoLockMinutesState] = useState(0);
  const idleTimerRef = useRef(null);
  const deviceName = useRef("Browser-Dev");

  // Load device name once
  useEffect(() => {
    api.getDeviceName?.()?.then?.((n) => { if (n) deviceName.current = n; });
  }, []);

  // Load auto-lock preference from settings
  useEffect(() => {
    api.getSetting("session_settings").then((s) => {
      if (s?.autoLockMinutes !== undefined) setAutoLockMinutesState(s.autoLockMinutes);
    }).catch(() => {});
  }, []);

  // On first load: app is ready but user is NOT auto-logged-in — show Login Screen
  useEffect(() => {
    setReady(true);
  }, []);

  // Fetch permissions whenever the logged-in user changes
  useEffect(() => {
    if (user) {
      api.getPermissions().then(setPermissions).catch(() => setPermissions([]));
    } else {
      setPermissions([]);
    }
  }, [user]);

  // ── Auto-lock idle timer ──────────────────────────────────────────────────
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (!autoLockMinutes || !user || locked) return;
    idleTimerRef.current = setTimeout(() => {
      setLocked(true);
    }, autoLockMinutes * 60 * 1000);
  }, [autoLockMinutes, user, locked]);

  useEffect(() => {
    if (!user || locked || !autoLockMinutes) return;
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdleTimer, { passive: true }));
    resetIdleTimer();
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [user, locked, autoLockMinutes, resetIdleTimer]);

  const setAutoLockMinutes = async (minutes) => {
    setAutoLockMinutesState(minutes);
    await api.setSetting("session_settings", { autoLockMinutes: minutes });
  };

  // ── Auth actions ──────────────────────────────────────────────────────────
  const loginWithPin = async (pin) => {
    const res = await api.loginWithPin(pin);
    if (res.success) {
      try {
        const perms = await api.getPermissions();
        setPermissions(perms);
      } catch {}
      setUser(res.user);
      setLocked(false);
    }
    return res;
  };

  const loginWithPassword = async (usernameOrEmail, password) => {
    const res = await api.loginWithPassword(usernameOrEmail, password);
    if (res.success) {
      try {
        const perms = await api.getPermissions();
        setPermissions(perms);
      } catch {}
      setUser(res.user);
      setLocked(false);
    }
    return res;
  };

  const lock = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    setLocked(true);
  };

  const logout = () => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (user) {
      api.logAction(user.name, "Authentication", "Logged out manually");
    }
    setUser(null);
    setLocked(false);
  };

  // ── Permission helper ─────────────────────────────────────────────────────
  const refreshPermissions = useCallback(async (customUser) => {
    const targetUser = customUser || user;
    if (targetUser) {
      try {
        const perms = await api.getPermissions();
        setPermissions(perms);
      } catch (e) {
        setPermissions([]);
      }
    }
  }, [user]);

  const canDo = (module, action = "view") => {
    if (!user) return false;
    if (user.role === "Owner") return true;
    const row = permissions.find((p) => p.role === user.role && p.module === module);
    return row ? !!row[`can_${action}`] : false;
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-paprika-500 flex items-center justify-center animate-pulse">
            <span className="text-white text-lg">🍽</span>
          </div>
          <p className="text-sm text-canvas-200/60">Starting Dastarkhwan ERP…</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{
      user, locked,
      loginWithPin, loginWithPassword,
      lock, logout,
      permissions, canDo, refreshPermissions,
      autoLockMinutes, setAutoLockMinutes,
      deviceName: deviceName.current,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
