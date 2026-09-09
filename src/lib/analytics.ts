import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Problem } from "@/types/problem";

function baseFields(problem: Problem, userId: string) {
  return {
    userId,
    ps_id: problem.ps_id,
    year: problem.year,
    title: problem.title,
    organization: problem.organization,
    theme: problem.theme,
  };
}

export function logProblemClick(problem: Problem, userId: string) {
  return addDoc(collection(db, "analytics_events"), {
    ...baseFields(problem, userId),
    eventType: "click",
    timestamp: serverTimestamp(),
  }).catch(() => {
    // best-effort; don't block the UI on analytics failures
  });
}

export function logDialogClose(
  problem: Problem,
  userId: string,
  durationMs: number,
  bookmarked: boolean
) {
  return addDoc(collection(db, "analytics_events"), {
    ...baseFields(problem, userId),
    eventType: "dialog_close",
    durationMs,
    bookmarked,
    timestamp: serverTimestamp(),
  }).catch(() => {
    // best-effort; don't block the UI on analytics failures
  });
}
