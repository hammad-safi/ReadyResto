import { useState, useEffect } from "react";

/**
 * A drop-in replacement for useState that persists state in sessionStorage.
 * This ensures that when a user navigates away from a page and comes back,
 * their partially filled forms, active tabs, and toggles are perfectly preserved!
 */
export default function useStickyState(defaultValue, key) {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.sessionStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (value === undefined || value === null) {
        window.sessionStorage.removeItem(key);
      } else {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (e) {
      console.warn("Failed to save sticky state", e);
    }
  }, [key, value]);

  return [value, setValue];
}
