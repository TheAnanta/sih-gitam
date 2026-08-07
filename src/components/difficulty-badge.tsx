import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  Easy: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Hard: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export const DIFFICULTY_BORDER: Record<string, string> = {
  Easy: "border-l-green-500",
  Medium: "border-l-yellow-500",
  Hard: "border-l-red-500",
};

export function DifficultyBadge({ difficulty }: { difficulty: string }) {
  return (
    <Badge
      className={cn(
        "text-xs px-2 py-1 font-medium border-transparent",
        STYLES[difficulty] ?? STYLES.Medium
      )}
    >
      {difficulty}
    </Badge>
  );
}
