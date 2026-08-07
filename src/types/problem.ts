export interface Problem {
  ps_id: string;
  title: string;
  summary: string;
  description: string;
  difficulty: string | string[];
  technology: string | string[];
  stakeholders: string | string[];
  impact_area: string | string[];
  data_resource_type: string | string[];
  solution_type: string | string[];
  organization: string;
  department: string;
  category: string;
  theme: string | string[];
  submission_count: number | null;
  year: number;
}

export function asArray(value: string | string[] | undefined | null): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function normalizedDifficulty(value: string | string[]): string {
  const first = asArray(value)[0] ?? "";
  return first === "Med" ? "Medium" : first;
}
