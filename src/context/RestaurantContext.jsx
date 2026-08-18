import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/client";

const RestaurantContext = createContext(null);

export const DEFAULT_PROFILE = {
  name: "Dastarkhwan Restaurant",
  tagline: "Authentic Taste & Hospitality",
  logo: null,
  ownerName: "Hammadullah",
  ownerTitle: "Founder & Owner",
  ownerPhoto: null,
  ownerPhone: "0300-0000001",
  ownerEmail: "owner@dastarkhwan.pk",
  address: "University Road, Peshawar",
  phone: "091-1234567",
  ntn: "1234567-8",
  currency: "PKR",
  taxRate: 0,
  serviceCharge: 0,
  receiptFooter: "Thank you for dining with us — visit again!",
  showLogo: true,
  showOwnerInfo: true,
  showTaxBreakdown: true,
  showCashierName: true,
  showQrCode: false,
  theme: "sunset-paprika",
};

export function RestaurantProvider({ children }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    try {
      const stored = await api.getSetting("restaurant_profile");
      setProfile({ ...DEFAULT_PROFILE, ...(stored || {}) });
    } catch {
      setProfile(DEFAULT_PROFILE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (profile?.theme && !loading) {
      const html = document.documentElement;
      const current = [...html.classList].find(c => c.startsWith("theme-"));
      const wanted = `theme-${profile.theme}`;
      if (current !== wanted) {
        html.className = html.className.split(" ").filter(c => !c.startsWith("theme-")).join(" ");
        html.classList.add(wanted);
      }
      localStorage.setItem("theme-preference", profile.theme);
    }
  }, [profile?.theme, loading]);

  useEffect(() => {
    if (!loading && window.api?.isElectron && window.api.setAppIcon) {
      if (profile?.logo && profile.logo.startsWith("data:image/")) {
        window.api.setAppIcon(profile.logo);
      }
    }
  }, [profile?.logo, loading]);

  const updateProfile = async (newProfile) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    await api.setSetting("restaurant_profile", updated);
    return updated;
  };

  return (
    <RestaurantContext.Provider value={{ profile, updateProfile, refreshProfile: loadProfile, loading }}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurant must be used within a RestaurantProvider");
  }
  return ctx;
}
