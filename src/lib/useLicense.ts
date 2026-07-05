"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "fluent.licenseKey";

export function useLicense() {
  const [licenseKey, setLicenseKey] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setLicenseKey(stored);
      }
    } catch {
      // Storage may be unavailable; treat as no license.
    }
    setHydrated(true);
  }, []);

  const activate = useCallback((key: string) => {
    const trimmed = key.trim();
    setLicenseKey(trimmed);
    try {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } catch {
      // Ignore storage write failures (private mode, quota).
    }
  }, []);

  return {
    licenseKey,
    isPro: Boolean(licenseKey),
    hydrated,
    activate,
  };
}
