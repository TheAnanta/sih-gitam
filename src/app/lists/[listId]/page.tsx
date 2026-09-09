"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { collection, doc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Link as LinkIcon, Loader2, Trash2, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { addItemToList, removeItemFromList, type ListDoc, type ListItem } from "@/lib/lists";
import problemsData from "@/data/problems.json";
import type { Problem } from "@/types/problem";
import { normalizedDifficulty } from "@/types/problem";
import { Header } from "@/components/header";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/difficulty-badge";

const problemIndex = new Map<string, Problem>(
  (problemsData as unknown as Problem[]).map((p) => [`${p.year}-${p.ps_id}`, p])
);

export default function ListPage() {
  const params = useParams<{ listId: string }>();
  const listId = params.listId;
  const { user, loading: authLoading, signIn, signOut } = useAuth();
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks(user);

  const [list, setList] = React.useState<ListDoc | null | undefined>(undefined);
  const [items, setItems] = React.useState<(ListItem & { id: string })[]>([]);
  const [addQuery, setAddQuery] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    const unsubList = onSnapshot(doc(db, "lists", listId), (snap) => {
      setList(snap.exists() ? (snap.data() as ListDoc) : null);
    });
    const itemsQuery = query(
      collection(db, "lists", listId, "items"),
      orderBy("addedAt", "asc")
    );
    const unsubItems = onSnapshot(itemsQuery, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ListItem) })));
    });
    return () => {
      unsubList();
      unsubItems();
    };
  }, [listId]);

  const itemProblems = items.map((item) => ({
    item,
    problem: problemIndex.get(`${item.year}-${item.ps_id}`),
  }));

  const searchResults = React.useMemo(() => {
    const q = addQuery.trim().toLowerCase();
    if (!q) return [];
    const existingKeys = new Set(items.map((i) => `${i.year}-${i.ps_id}`));
    return (problemsData as unknown as Problem[])
      .filter((p) => !p.hidden && !existingKeys.has(`${p.year}-${p.ps_id}`))
      .filter((p) => p.title.toLowerCase().includes(q))
      .slice(0, 8);
  }, [addQuery, items]);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        bookmarkCount={Object.keys(bookmarks).length}
        showBookmarksOnly={false}
        onToggleBookmarksOnly={() => {}}
        user={user}
        authLoading={authLoading}
        onSignIn={signIn}
        onSignOut={signOut}
      />

      <section className="container mx-auto flex-1 px-4 py-8 sm:px-6 lg:px-8">
        {list === undefined && (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {list === null && (
          <div className="py-24 text-center text-muted-foreground">
            This list doesn&apos;t exist or was deleted.
          </div>
        )}

        {list && (
          <>
            <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-semibold">{list.title}</h1>
                <p className="text-sm text-muted-foreground">
                  Shared by {list.ownerName} · {items.length} problem
                  {items.length === 1 ? "" : "s"}
                </p>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={copyLink}>
                <LinkIcon className="h-4 w-4" />
                {copied ? "Copied!" : "Copy link"}
              </Button>
            </div>

            {user ? (
              <div className="relative mb-6 max-w-md">
                <Input
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Search to add a problem statement to this list..."
                />
                {searchResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-popover shadow-md">
                    {searchResults.map((p) => (
                      <button
                        key={`${p.year}-${p.ps_id}`}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent"
                        onClick={async () => {
                          await addItemToList(listId, p, user);
                          setAddQuery("");
                        }}
                      >
                        <span className="line-clamp-1">{p.title}</span>
                        <span className="flex-shrink-0 text-xs text-muted-foreground">
                          Add
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mb-6 text-sm text-muted-foreground">
                Sign in to add or remove problem statements from this list.
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {itemProblems.map(({ item, problem }) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="line-clamp-2 text-sm font-semibold">
                      {problem?.title ?? item.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {problem?.organization ?? item.organization}
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      {problem && (
                        <DifficultyBadge difficulty={normalizedDifficulty(problem.difficulty)} />
                      )}
                      <span className="text-xs text-muted-foreground">
                        added by {item.addedByName}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {problem && user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          toggleBookmark(`${problem.year}-${problem.ps_id}`)
                        }
                        aria-label="Toggle bookmark"
                      >
                        <span
                          className={
                            isBookmarked(`${problem.year}-${problem.ps_id}`)
                              ? "text-primary"
                              : "text-muted-foreground"
                          }
                        >
                          ★
                        </span>
                      </Button>
                    )}
                    {user && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          problem
                            ? removeItemFromList(listId, problem)
                            : undefined
                        }
                        aria-label="Remove from list"
                      >
                        {problem ? <Trash2 className="h-4 w-4" /> : <X className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
              {items.length === 0 && (
                <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
                  No problem statements in this list yet.
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
