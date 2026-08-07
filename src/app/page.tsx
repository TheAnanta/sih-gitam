"use client";

import * as React from "react";
import { SlidersHorizontal } from "lucide-react";
import problemsData from "@/data/problems.json";
import { Problem } from "@/types/problem";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { FiltersPanel } from "@/components/filters-panel";
import { ProblemCard } from "@/components/problem-card";
import { ProblemDialog } from "@/components/problem-dialog";
import { useBookmarks } from "@/hooks/use-bookmarks";
import {
  buildFilterOptions,
  emptyFilterState,
  matchesFilters,
  searchProblems,
  sortProblems,
} from "@/lib/filter-options";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const problems = problemsData as unknown as Problem[];
const MAX_SUBMISSIONS = Math.max(
  ...problems.map((p) => p.submission_count ?? 0)
);
const FILTER_OPTIONS = buildFilterOptions(problems);
const DOMAIN_COUNT = new Set(problems.map((p) => p.department)).size;
const YEARS = Array.from(new Set(problems.map((p) => p.year))).sort((a, b) => b - a);

export default function Home() {
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState(() => emptyFilterState(MAX_SUBMISSIONS));
  const [showBookmarksOnly, setShowBookmarksOnly] = React.useState(false);
  const [activeProblem, setActiveProblem] = React.useState<Problem | null>(null);
  const { bookmarks, toggleBookmark, isBookmarked } = useBookmarks();

  const filtered = React.useMemo(() => {
    let result = searchProblems(problems, query);
    result = result.filter((p) => matchesFilters(p, filters));
    if (showBookmarksOnly) {
      result = result.filter((p) => bookmarks[`${p.year}-${p.ps_id}`]);
    }
    return sortProblems(result, filters.sort);
  }, [query, filters, showBookmarksOnly, bookmarks]);

  const bookmarkCount = Object.keys(bookmarks).length;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header
        bookmarkCount={bookmarkCount}
        showBookmarksOnly={showBookmarksOnly}
        onToggleBookmarksOnly={() => setShowBookmarksOnly((v) => !v)}
      />
      <Hero
        query={query}
        onQueryChange={setQuery}
        total={problems.length}
        domainCount={DOMAIN_COUNT}
        yearCount={YEARS.length}
      />

      <section className="flex-1 py-8 sm:py-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 pb-6 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:pb-8">
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold sm:text-2xl">Problem Statements</h3>
              <p className="text-sm text-muted-foreground" aria-live="polite">
                {filtered.length} result{filtered.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Tabs
                value={filters.years.length === 1 ? String(filters.years[0]) : "all"}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    years: value === "all" ? [] : [Number(value)],
                  })
                }
              >
                <TabsList aria-label="Filter by year">
                  <TabsTrigger value="all">All years</TabsTrigger>
                  {YEARS.map((year) => (
                    <TabsTrigger key={year} value={String(year)}>
                      {year}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="flex w-[88vw] max-w-sm flex-col gap-0 p-0"
                >
                  <SheetHeader className="border-b border-border px-4 py-4">
                    <SheetTitle>Filters &amp; Sort</SheetTitle>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                    <FiltersPanel
                      filters={filters}
                      onChange={setFilters}
                      options={FILTER_OPTIONS}
                      maxSubmissions={MAX_SUBMISSIONS}
                      showHeading={false}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[288px_1fr] lg:items-start lg:gap-10">
            <aside className="hidden lg:block">
              <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-xl border border-border p-5">
                <FiltersPanel
                  filters={filters}
                  onChange={setFilters}
                  options={FILTER_OPTIONS}
                  maxSubmissions={MAX_SUBMISSIONS}
                />
              </div>
            </aside>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6">
              {filtered.map((problem) => (
                <ProblemCard
                  key={`${problem.year}-${problem.ps_id}`}
                  problem={problem}
                  bookmarked={isBookmarked(`${problem.year}-${problem.ps_id}`)}
                  onToggleBookmark={() => toggleBookmark(`${problem.year}-${problem.ps_id}`)}
                  onClick={() => setActiveProblem(problem)}
                />
              ))}
              {filtered.length === 0 && (
                <div className="col-span-full py-20 text-center text-sm text-muted-foreground">
                  No problem statements match your filters. Try adjusting your search
                  or filter criteria.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <ProblemDialog
        problem={activeProblem}
        open={Boolean(activeProblem)}
        onOpenChange={(open) => !open && setActiveProblem(null)}
        bookmarked={
          activeProblem ? isBookmarked(`${activeProblem.year}-${activeProblem.ps_id}`) : false
        }
        onToggleBookmark={() =>
          activeProblem && toggleBookmark(`${activeProblem.year}-${activeProblem.ps_id}`)
        }
      />
    </div>
  );
}
