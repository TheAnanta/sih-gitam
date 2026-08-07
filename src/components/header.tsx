"use client";

import { Compass, Bookmark } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Header({
  bookmarkCount,
  showBookmarksOnly,
  onToggleBookmarksOnly,
}: {
  bookmarkCount: number;
  showBookmarksOnly: boolean;
  onToggleBookmarksOnly: () => void;
}) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Compass className="h-5 w-5 text-primary" aria-hidden="true" />
          <span className="text-sm font-semibold sm:text-base">SIH GITAM Navigator</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant={showBookmarksOnly ? "default" : "ghost"}
            size="sm"
            className="h-9 gap-1.5 px-3"
            onClick={onToggleBookmarksOnly}
            aria-pressed={showBookmarksOnly}
          >
            <Bookmark className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">Bookmarks</span>
            {bookmarkCount > 0 && (
              <span className="ml-0.5 rounded-full bg-primary/15 px-1.5 text-xs font-medium text-primary">
                {bookmarkCount}
              </span>
            )}
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
