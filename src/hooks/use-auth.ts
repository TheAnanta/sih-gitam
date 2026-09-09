"use client";

import * as React from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  signInWithRedirect,
  linkWithPopup,
  linkWithRedirect,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

const REDIRECT_FALLBACK_CODES = new Set([
  "auth/popup-blocked",
  "auth/popup-closed-by-user",
  "auth/cancelled-popup-request",
  "auth/operation-not-supported-in-this-environment",
]);

export function useAuth() {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
      } else {
        // No session at all yet (first visit, or fully signed out): give every
        // visitor a stable anonymous identity so bookmarks/analytics still
        // attach to *someone* even if they never sign in with Google.
        signInAnonymously(auth).catch((err) => {
          console.error(
            "Anonymous sign-in failed — is Anonymous enabled as a sign-in provider " +
              "in the Firebase console for this project?",
            err
          );
          setLoading(false);
        });
      }
    });
    return unsubscribe;
  }, []);

  const signIn = React.useCallback(async () => {
    const current = auth.currentUser;
    try {
      if (current?.isAnonymous) {
        // Upgrade the anonymous account in place so existing bookmarks/
        // analytics under this uid carry over to the real account.
        await linkWithPopup(current, googleProvider);
      } else {
        await signInWithPopup(auth, googleProvider);
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code && REDIRECT_FALLBACK_CODES.has(code)) {
        if (current?.isAnonymous) {
          await linkWithRedirect(current, googleProvider);
        } else {
          await signInWithRedirect(auth, googleProvider);
        }
      } else if (code === "auth/credential-already-in-use") {
        // This Google account is already linked to a different uid (e.g. from
        // another browser/device). Fall back to a plain sign-in into that
        // existing account instead of failing outright.
        await signInWithPopup(auth, googleProvider);
      } else {
        throw err;
      }
    }
  }, []);

  const signOut = React.useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  return { user, loading, signIn, signOut };
}
