import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "@/lib/firebase";
import type { Problem } from "@/types/problem";

function baseFields(problem: Problem, user: User) {
  return {
    userId: user.uid,
    isAnonymous: user.isAnonymous,
    ps_id: problem.ps_id,
    year: problem.year,
    title: problem.title,
    organization: problem.organization,
    theme: problem.theme,
  };
}

export function logProblemClick(problem: Problem, user: User) {
  return addDoc(collection(db, "analytics_events"), {
    ...baseFields(problem, user),
    eventType: "click",
    timestamp: serverTimestamp(),
  }).catch(() => {
    // best-effort; don't block the UI on analytics failures
  });
}

export function logDialogClose(
  problem: Problem,
  user: User,
  durationMs: number,
  bookmarked: boolean
) {
  return addDoc(collection(db, "analytics_events"), {
    ...baseFields(problem, user),
    eventType: "dialog_close",
    durationMs,
    bookmarked,
    timestamp: serverTimestamp(),
  }).catch(() => {
    // best-effort; don't block the UI on analytics failures
  });
}
