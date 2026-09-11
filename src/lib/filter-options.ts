import { Problem, asArray, normalizedDifficulty } from "@/types/problem";

export const FILTER_FIELDS = [
  "technology",
  "difficulty",
  "stakeholders",
  "impact_area",
  "data_resource_type",
  "solution_type",
  "theme",
  "category",
  "organization",
] as const;

export type FilterField = (typeof FILTER_FIELDS)[number];

export const FILTER_LABELS: Record<FilterField, string> = {
  technology: "Technology",
  difficulty: "Difficulty",
  stakeholders: "Stakeholders",
  impact_area: "Impact Area",
  data_resource_type: "Data / Resource Type",
  solution_type: "Solution Type",
  theme: "Theme",
  category: "Category",
  organization: "Organization / Department",
};

export type FilterState = Record<FilterField, string[]> & {
  submissionRange: [number, number];
  sort: SortKey;
  years: number[];
};

export type SortKey =
  | "relevance"
  | "submissions_desc"
  | "submissions_asc"
  | "title_asc"
  | "difficulty_asc"
  | "difficulty_desc";

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Sort by Relevance" },
  { value: "submissions_desc", label: "Most Submissions" },
  { value: "submissions_asc", label: "Fewest Submissions" },
  { value: "title_asc", label: "Title (A-Z)" },
  { value: "difficulty_asc", label: "Difficulty (Easy first)" },
  { value: "difficulty_desc", label: "Difficulty (Hard first)" },
];

export function emptyFilterState(maxSubmissions: number): FilterState {
  return {
    technology: [],
    difficulty: [],
    stakeholders: [],
    impact_area: [],
    data_resource_type: [],
    solution_type: [],
    theme: [],
    category: [],
    organization: [],
    submissionRange: [0, maxSubmissions],
    sort: "relevance",
    years: [],
  };
}

function fieldValues(problem: Problem, field: FilterField): string[] {
  if (field === "difficulty") return [normalizedDifficulty(problem.difficulty)];
  if (field === "category") return [problem.category];
  if (field === "organization") {
    return Array.from(new Set([problem.organization, problem.department]));
  }
  return asArray(problem[field] as string | string[]);
}

export function buildFilterOptions(
  problems: Problem[]
): Record<FilterField, string[]> {
  const options = {} as Record<FilterField, string[]>;
  for (const field of FILTER_FIELDS) {
    const set = new Set<string>();
    for (const problem of problems) {
      fieldValues(problem, field).forEach((v) => v && set.add(v));
    }
    options[field] = Array.from(set).sort();
  }
  return options;
}

export function matchesFilters(problem: Problem, filters: FilterState): boolean {
  if (filters.years.length > 0 && !filters.years.includes(problem.year)) {
    return false;
  }
  if (
    problem.submission_count !== null &&
    (problem.submission_count < filters.submissionRange[0] ||
      problem.submission_count > filters.submissionRange[1])
  ) {
    return false;
  }
  for (const field of FILTER_FIELDS) {
    const selected = filters[field];
    if (selected.length === 0) continue;
    const values = fieldValues(problem, field);
    if (!selected.some((s) => values.includes(s))) return false;
  }
  return true;
}

const DIFFICULTY_RANK: Record<string, number> = { Easy: 0, Medium: 1, Hard: 2 };

export function sortProblems(problems: Problem[], sort: SortKey): Problem[] {
  const copy = [...problems];
  switch (sort) {
    case "submissions_desc":
      return copy.sort((a, b) => (b.submission_count ?? -1) - (a.submission_count ?? -1));
    case "submissions_asc":
      return copy.sort(
        (a, b) =>
          (a.submission_count ?? Infinity) - (b.submission_count ?? Infinity)
      );
    case "title_asc":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "difficulty_asc":
      return copy.sort(
        (a, b) =>
          DIFFICULTY_RANK[normalizedDifficulty(a.difficulty)] -
          DIFFICULTY_RANK[normalizedDifficulty(b.difficulty)]
      );
    case "difficulty_desc":
      return copy.sort(
        (a, b) =>
          DIFFICULTY_RANK[normalizedDifficulty(b.difficulty)] -
          DIFFICULTY_RANK[normalizedDifficulty(a.difficulty)]
      );
    default:
      return copy;
  }
}

export function searchProblems(problems: Problem[], query: string): Problem[] {
  const q = query.trim().toLowerCase();
  if (!q) return problems;
  const terms = q.split(/\s+/);
  return problems.filter((p) => {
    const haystack = [
      p.ps_id,
      p.title,
      p.summary,
      p.organization,
      p.department,
      p.category,
      ...asArray(p.technology),
      ...asArray(p.theme),
      ...asArray(p.stakeholders),
    ]
      .join(" ")
      .toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}
