import { cn } from "@/lib/utils";

interface GradeProps {
  value?: number;
  className?: string;
}

export const Grade = ({ value, className }: GradeProps) => {
  const num = typeof value === 'number' && !isNaN(value) ? value : 0;
  const display = num.toFixed(2);
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        num < 10 ? "text-destructive font-bold" : num >= 14 ? "text-success font-semibold" : "text-foreground",
        className
      )}
    >
      {display}
    </span>
  );
};
