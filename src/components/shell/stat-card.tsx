import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { NavIcon } from "@/components/shell/nav-icon";

export function StatCard({
  label, value, hint, icon, tone = "default", className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: string;
  tone?: "default" | "success" | "warning" | "destructive";
  className?: string;
}) {
  return (
    <Card className={className}>
      <CardContent className="flex items-start gap-3 p-4 sm:p-5">
        {icon && (
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              tone === "default" && "bg-primary/10 text-primary",
              tone === "success" && "bg-success/12 text-success",
              tone === "warning" && "bg-warning/15 text-warning",
              tone === "destructive" && "bg-destructive/12 text-destructive",
            )}
          >
            <NavIcon name={icon} />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums leading-tight">{value}</p>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
