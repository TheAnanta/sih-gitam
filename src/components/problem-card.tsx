"use client";

import { Bookmark, Building2, Target, TrendingUp } from "lucide-react";
import { Problem, asArray, normalizedDifficulty } from "@/types/problem";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DifficultyBadge, DIFFICULTY_BORDER } from "@/components/difficulty-badge";
import { cn } from "@/lib/utils";

export function ProblemCard({
  problem,
  bookmarked,
  onToggleBookmark,
  onClick,
}: {
  problem: Problem;
  bookmarked: boolean;
  onToggleBookmark: () => void;
  onClick: () => void;
}) {
  const difficulty = normalizedDifficulty(problem.difficulty);
  const technologies = asArray(problem.technology);

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View details for ${problem.title}`}
      className={cn(
        "cursor-pointer border-l-4 py-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        DIFFICULTY_BORDER[difficulty] ?? DIFFICULTY_BORDER.Medium
      )}
    >
      <CardHeader className="gap-2 px-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="text-sm leading-snug font-semibold sm:text-base lg:text-lg">
            {problem.title}
          </div>
          <div className="flex flex-shrink-0 items-center gap-2">
            <DifficultyBadge difficulty={difficulty} />
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 hover:bg-primary/10"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark();
              }}
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
        </div>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <span>{problem.ps_id}</span>
            <Badge variant="secondary" className="px-1.5 py-0 font-sans text-[11px]">
              SIH {problem.year}
            </Badge>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
            <span>
              {problem.submission_count === null ? "N/A" : problem.submission_count}{" "}
              submissions
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-4 pt-0 sm:space-y-4 sm:px-6">
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:line-clamp-3 sm:text-sm">
          {problem.summary}
        </p>
        <div className="space-y-1.5 sm:space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="h-3 w-3 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="truncate text-muted-foreground">{problem.organization}</span>
          </div>
          {asArray(problem.solution_type).length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <Target className="h-3 w-3 flex-shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate text-muted-foreground">
                {asArray(problem.solution_type).join(", ")}
              </span>
            </div>
          )}
        </div>
        {technologies.length > 0 && (
          <div className="space-y-1.5 sm:space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Technologies:</div>
            <div className="flex flex-wrap gap-1.5">
              {technologies.slice(0, 5).map((tech) => (
                <Badge key={tech} variant="outline" className="px-1.5 py-0.5 text-xs font-medium">
                  {tech}
                </Badge>
              ))}
              {technologies.length > 5 && (
                <Badge variant="outline" className="px-1.5 py-0.5 text-xs font-medium">
                  +{technologies.length - 5}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
