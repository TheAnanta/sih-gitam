import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Problem } from "@/types/problem";
import type { User } from "firebase/auth";

export interface ListItem {
  ps_id: string;
  year: number;
  title: string;
  organization: string;
  addedBy: string;
  addedByName: string;
  addedAt: unknown;
}

export interface ListDoc {
  title: string;
  ownerId: string;
  ownerName: string;
  createdAt: unknown;
}

function itemKey(problem: Problem) {
  return `${problem.year}-${problem.ps_id}`;
}

export async function createList(title: string, problems: Problem[], user: User) {
  const listRef = await addDoc(collection(db, "lists"), {
    title,
    ownerId: user.uid,
    ownerName: user.displayName ?? user.email ?? "Someone",
    createdAt: serverTimestamp(),
  } satisfies ListDoc);

  await Promise.all(
    problems.map((problem) =>
      setDoc(doc(db, "lists", listRef.id, "items", itemKey(problem)), {
        ps_id: problem.ps_id,
        year: problem.year,
        title: problem.title,
        organization: problem.organization,
        addedBy: user.uid,
        addedByName: user.displayName ?? user.email ?? "Someone",
        addedAt: serverTimestamp(),
      } satisfies ListItem)
    )
  );

  return listRef.id;
}

export async function addItemToList(listId: string, problem: Problem, user: User) {
  await setDoc(doc(db, "lists", listId, "items", itemKey(problem)), {
    ps_id: problem.ps_id,
    year: problem.year,
    title: problem.title,
    organization: problem.organization,
    addedBy: user.uid,
    addedByName: user.displayName ?? user.email ?? "Someone",
    addedAt: serverTimestamp(),
  } satisfies ListItem);
}

export async function removeItemFromList(listId: string, problem: Problem) {
  await deleteDoc(doc(db, "lists", listId, "items", itemKey(problem)));
}
