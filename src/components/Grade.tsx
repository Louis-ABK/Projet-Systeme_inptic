import { cn } from "@/lib/utils";

interface GradeProps {
  value: number;
  className?: string;
}

export const Grade = ({ value, className }: GradeProps) => {
  const display = value.toFixed(2);
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        value < 10 ? "text-destructive font-bold" : value >= 14 ? "text-success font-semibold" : "text-foreground",
        className
      )}
    >
      {display}
    </span>
  );
};
