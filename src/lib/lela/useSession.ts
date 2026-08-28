import { useCallback, useEffect, useState } from "react";
import {
  clearCurrent,
  loadCurrent,
  loadSaved,
  saveCurrent,
  type DateSession,
  type SavedDate,
} from "./session";

/** Reads localStorage after hydration only, so SSR markup stays stable. */
export function useCurrentSession() {
  const [session, setSession] = useState<DateSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setSession(loadCurrent());
    sync();
    setReady(true);
    window.addEventListener("lela:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lela:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<DateSession>) => {
    const current = loadCurrent();
    if (!current) return;
    saveCurrent({ ...current, ...patch });
  }, []);

  return { session, ready, update, reset: clearCurrent };
}

export function useSavedDates() {
  const [dates, setDates] = useState<SavedDate[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setDates(loadSaved());
    sync();
    setReady(true);
    window.addEventListener("lela:change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("lela:change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { dates, ready };
}
