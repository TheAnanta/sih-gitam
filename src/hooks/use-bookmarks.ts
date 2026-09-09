"use client";

import * as React from "react";
import { doc, onSnapshot, setDoc, getDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";

const STORAGE_KEY = "sih-gitam-nav:bookmarks";

function readLocalBookmarks(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeLocalBookmarks(next: Record<string, number>) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore (e.g. storage disabled)
  }
}

export function useBookmarks(user: User | null) {
  const [localBookmarks, setLocalBookmarks] = React.useState<Record<string, number>>(
    readLocalBookmarks
  );
  const [cloudBookmarks, setCloudBookmarks] = React.useState<Record<string, number>>({});
  const hasMergedRef = React.useRef(false);

  React.useEffect(() => {
    if (!user) {
      hasMergedRef.current = false;
      return;
    }

    const userRef = doc(db, "users", user.uid);

    if (!hasMergedRef.current) {
      hasMergedRef.current = true;
      (async () => {
        const local = readLocalBookmarks();
        const snap = await getDoc(userRef);
        const existing = (snap.data()?.bookmarks as Record<string, number>) ?? {};
        const merged = { ...local, ...existing };
        await setDoc(userRef, { bookmarks: merged }, { merge: true });
      })();
    }

    const unsubscribe = onSnapshot(userRef, (snap) => {
      setCloudBookmarks((snap.data()?.bookmarks as Record<string, number>) ?? {});
    });
    return unsubscribe;
  }, [user]);

  const bookmarks = user ? cloudBookmarks : localBookmarks;

  const toggleBookmark = React.useCallback(
    (psId: string) => {
      const next = { ...bookmarks };
      if (next[psId]) {
        delete next[psId];
      } else {
        next[psId] = Date.now();
      }

      if (user) {
        setCloudBookmarks(next);
        setDoc(doc(db, "users", user.uid), { bookmarks: next }, { merge: true });
      } else {
        setLocalBookmarks(next);
        writeLocalBookmarks(next);
      }
    },
    [bookmarks, user]
  );

  const isBookmarked = React.useCallback(
    (psId: string) => Boolean(bookmarks[psId]),
    [bookmarks]
  );

  return { bookmarks, toggleBookmark, isBookmarked };
}
