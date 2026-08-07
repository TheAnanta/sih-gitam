"use client";

import { Bookmark, Building2, Landmark, TrendingUp } from "lucide-react";
import { Problem, asArray, normalizedDifficulty } from "@/types/problem";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DifficultyBadge } from "@/components/difficulty-badge";
import { cn } from "@/lib/utils";

function TagGroup({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <Badge key={v} variant="outline" className="text-xs font-normal">
            {v}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export function ProblemDialog({
  problem,
  open,
  onOpenChange,
  bookmarked,
  onToggleBookmark,
}: {
  problem: Problem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookmarked: boolean;
  onToggleBookmark: () => void;
}) {
  if (!problem) return null;
  const difficulty = normalizedDifficulty(problem.difficulty);
  const hasLongDescription =
    problem.description && problem.description.trim() !== problem.title.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-0 sm:max-w-2xl">
        <DialogHeader className="gap-2 pb-4">
          <div className="flex items-start justify-between gap-3 pr-6">
            <DialogTitle className="text-left text-lg leading-snug sm:text-xl">
              {problem.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 flex-shrink-0 p-0"
              onClick={onToggleBookmark}
              aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
              aria-pressed={bookmarked}
            >
              <Bookmark
                className={cn(
                  "h-4 w-4",
                  bookmarked ? "fill-primary text-primary" : "text-muted-foreground"
                )}
              />
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-sm text-muted-foreground">
            <span className="font-mono text-xs">{problem.ps_id}</span>
            <Badge variant="secondary" className="px-1.5 py-0 text-[11px]">
              SIH {problem.year}
            </Badge>
            <DifficultyBadge difficulty={difficulty} />
            <span className="flex items-center gap-1 text-xs">
              <TrendingUp className="h-3 w-3" aria-hidden="true" />
              {problem.submission_count === null ? "N/A" : problem.submission_count}{" "}
              submissions
            </span>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto pr-1 text-sm">
          <div className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="text-muted-foreground">{problem.organization}</span>
            </div>
            {problem.department !== problem.organization && (
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
                <span className="text-muted-foreground">{problem.department}</span>
              </div>
            )}
          </div>

          {hasLongDescription && (
            <p className="leading-relaxed text-muted-foreground">{problem.summary}</p>
          )}

          <Separator />

          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Detailed Description
            </div>
            <div className="whitespace-pre-line leading-relaxed text-foreground">
              {problem.description}
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TagGroup label="Technology" values={asArray(problem.technology)} />
            <TagGroup label="Stakeholders" values={asArray(problem.stakeholders)} />
            <TagGroup label="Impact Area" values={asArray(problem.impact_area)} />
            <TagGroup
              label="Data / Resource Type"
              values={asArray(problem.data_resource_type)}
            />
            <TagGroup label="Solution Type" values={asArray(problem.solution_type)} />
            <TagGroup label="Theme" values={asArray(problem.theme)} />
            <TagGroup label="Category" values={[problem.category]} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
