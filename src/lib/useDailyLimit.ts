"use client";

import { useCallback, useEffect, useState } from "react";

export const DAILY_LIMIT = 3;

const STORAGE_KEY = "fluent.dailyUsage";

interface DailyUsage {
  date: string;
  count: number;
}

function todayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function readUsage(): DailyUsage {
  const today = todayKey();

  if (typeof window === "undefined") {
    return { date: today, count: 0 };
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyUsage>;
      if (parsed.date === today && typeof parsed.count === "number") {
        return { date: today, count: parsed.count };
      }
    }
  } catch {
    // Ignore malformed/inaccessible storage and start fresh.
  }

  return { date: today, count: 0 };
}

function writeUsage(usage: DailyUsage): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
  } catch {
    // Storage may be unavailable (private mode, quota); fail silently.
  }
}

export function useDailyLimit() {
  const [count, setCount] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const usage = readUsage();
    setCount(usage.count);
    writeUsage(usage);
    setHydrated(true);
  }, []);

  const increment = useCallback(() => {
    setCount((current) => {
      const next = current + 1;
      writeUsage({ date: todayKey(), count: next });
      return next;
    });
  }, []);

  const remaining = Math.max(0, DAILY_LIMIT - count);
  const limitReached = hydrated && remaining <= 0;

  return { count, remaining, limitReached, hydrated, increment };
}
