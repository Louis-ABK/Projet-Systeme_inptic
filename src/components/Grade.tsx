import { cn } from "@/lib/utils";

interface GradeProps {
  value?: number;
  className?: string;
}

export const Grade = ({ value, className }: GradeProps) => {
  // -1 = note non saisie → afficher un tiret
  if (typeof value !== 'number' || value < 0) {
    return <span className={cn("text-muted-foreground italic", className)}>—</span>;
  }
  const num = isNaN(value) ? 0 : value;
  const display = num.toFixed(2);
  const isEliminatory = num >= 0 && num <= 5;
  return (
    <span
      className={cn(
        "tabular-nums font-medium",
        isEliminatory ? "text-destructive font-black" :
        num < 10 ? "text-destructive font-bold" :
        num >= 14 ? "text-success font-semibold" : "text-foreground",
        className
      )}
    >
      {display}
    </span>
  );
};
