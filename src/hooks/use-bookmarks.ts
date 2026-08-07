"use client";

import * as React from "react";

const STORAGE_KEY = "sih-gitam-nav:bookmarks";

function readBookmarks(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

let cache: Record<string, number> = {};
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return cache;
}

function getServerSnapshot() {
  return cache;
}

function write(next: Record<string, number>) {
  cache = next;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  listeners.forEach((listener) => listener());
}

export function useBookmarks() {
  const bookmarks = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  React.useEffect(() => {
    cache = readBookmarks();
    listeners.forEach((listener) => listener());
  }, []);

  const toggleBookmark = React.useCallback((psId: string) => {
    const next = { ...cache };
    if (next[psId]) {
      delete next[psId];
    } else {
      next[psId] = Date.now();
    }
    write(next);
  }, []);

  const isBookmarked = React.useCallback(
    (psId: string) => Boolean(bookmarks[psId]),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}
