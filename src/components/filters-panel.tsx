"use client";

import { Filter, RotateCcw } from "lucide-react";
import {
  FILTER_FIELDS,
  FILTER_LABELS,
  FilterState,
  SORT_OPTIONS,
  emptyFilterState,
} from "@/lib/filter-options";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FiltersPanel({
  filters,
  onChange,
  options,
  maxSubmissions,
  showHeading = true,
}: {
  filters: FilterState;
  onChange: (next: FilterState) => void;
  options: Record<string, string[]>;
  maxSubmissions: number;
  showHeading?: boolean;
}) {
  function toggleValue(field: (typeof FILTER_FIELDS)[number], value: string) {
    const current = filters[field];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [field]: next });
  }

  const activeCount =
    FILTER_FIELDS.reduce((sum, field) => sum + filters[field].length, 0) +
    (filters.submissionRange[0] !== 0 || filters.submissionRange[1] !== maxSubmissions
      ? 1
      : 0);

  return (
    <div className="space-y-7">
      {showHeading && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-base font-semibold">
            <Filter className="h-4 w-4 text-primary" aria-hidden="true" />
            Filters &amp; Sort
          </div>
          {activeCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs text-muted-foreground"
              onClick={() => onChange(emptyFilterState(maxSubmissions))}
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              Reset ({activeCount})
            </Button>
          )}
        </div>
      )}
      {!showHeading && activeCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={() => onChange(emptyFilterState(maxSubmissions))}
          >
            <RotateCcw className="h-3 w-3" aria-hidden="true" />
            Reset ({activeCount})
          </Button>
        </div>
      )}

      <div className="space-y-2.5">
        <label htmlFor="sort-select" className="text-sm font-medium">
          Sort By
        </label>
        <Select
          value={filters.sort}
          onValueChange={(value) =>
            onChange({ ...filters, sort: value as FilterState["sort"] })
          }
        >
          <SelectTrigger id="sort-select" className="h-10 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 rounded-lg border border-border p-4">
        <label className="text-sm font-medium">Submission Count Range</label>
        <Slider
          min={0}
          max={maxSubmissions}
          step={5}
          value={filters.submissionRange}
          onValueChange={(value) =>
            onChange({ ...filters, submissionRange: [value[0], value[1]] })
          }
          aria-label="Submission count range"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{filters.submissionRange[0]} submissions</span>
          <span>{filters.submissionRange[1]} submissions</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Min: 0</span>
          <span>Max: {maxSubmissions}</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Problems with unknown submission counts (marked N/A) are always shown.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["technology"]} className="w-full">
        {FILTER_FIELDS.map((field) => (
          <AccordionItem key={field} value={field}>
            <AccordionTrigger className="py-3.5 text-sm font-medium">
              <span className="flex items-center gap-2">
                {FILTER_LABELS[field]}
                {filters[field].length > 0 && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-xs font-medium text-primary">
                    {filters[field].length}
                  </span>
                )}
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-1 pb-1">
                {(options[field] ?? []).map((value) => {
                  const id = `${field}-${value}`;
                  return (
                    <label
                      key={value}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-2 text-sm hover:bg-accent"
                    >
                      <Checkbox
                        id={id}
                        checked={filters[field].includes(value)}
                        onCheckedChange={() => toggleValue(field, value)}
                      />
                      <span className="text-muted-foreground">{value}</span>
                    </label>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
