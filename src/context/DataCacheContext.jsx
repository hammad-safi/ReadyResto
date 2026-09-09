import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import api from "../api/client";

const DataCacheContext = createContext();

export function DataCacheProvider({ children }) {
  const cacheRef = useRef({});
  const versionsRef = useRef({});
  const [cacheTick, forceUpdate] = useState(0);

  const getData = useCallback(async (table, options) => {
    const currentVersion = api.getStoreVersion ? api.getStoreVersion() : 0;
    const cacheKey = options ? `${table}:${JSON.stringify(options)}` : table;
    
    if (cacheRef.current[cacheKey] !== undefined && versionsRef.current[cacheKey] === currentVersion) {
      return cacheRef.current[cacheKey];
    }
    
    const data = await api.list(table, options);
    cacheRef.current[cacheKey] = data;
    versionsRef.current[cacheKey] = currentVersion;
    return data;
  }, []);

  const invalidate = useCallback((table) => {
    // Remove all cache entries that start with this table name
    Object.keys(versionsRef.current).forEach(key => {
      if (key === table || key.startsWith(`${table}:`)) {
        delete versionsRef.current[key];
        delete cacheRef.current[key];
      }
    });
    forceUpdate(n => n + 1);
  }, []);

  const invalidateAll = useCallback(() => {
    cacheRef.current = {};
    versionsRef.current = {};
    forceUpdate(n => n + 1);
  }, []);

  useEffect(() => {
    if (api.onInvalidate) {
      return api.onInvalidate((table) => {
        if (table === "*") {
          invalidateAll();
        } else {
          invalidate(table);
        }
      });
    }
  }, [invalidate, invalidateAll]);

  // Background polling for live sync
  useEffect(() => {
    if (!api.getStoreVersion) return;
    let localVersion = 0;
    const interval = setInterval(async () => {
      try {
        const globalVersion = await api.getStoreVersion();
        if (localVersion !== 0 && globalVersion > localVersion) {
          invalidateAll();
        }
        localVersion = globalVersion;
      } catch (e) {
        // Ignore network errors during polling
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [invalidateAll]);

  return (
    <DataCacheContext.Provider value={{ getData, invalidate, invalidateAll, cacheTick }}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error("useDataCache must be used within DataCacheProvider");
  return ctx;
}

export default DataCacheContext;
