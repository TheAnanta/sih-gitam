"use client";

import * as React from "react";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export function useLiveSubmissionCounts() {
  const [counts, setCounts] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/sih2026-submissions", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && data.counts) {
          setCounts(data.counts);
        }
      } catch {
        // ignore network errors; fall back to bundled submission counts
      }
    }

    load();
    const interval = setInterval(load, REFRESH_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return counts;
}
