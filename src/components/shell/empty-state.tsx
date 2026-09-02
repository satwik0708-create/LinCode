import { Card, CardContent } from "@/components/ui/card";
import { NavIcon } from "@/components/shell/nav-icon";

export function EmptyState({
  icon = "Circle", title, description, action,
}: {
  icon?: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-3 p-10 text-center">
        <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <NavIcon name={icon} className="size-5" />
        </span>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
        </div>
        {action}
      </CardContent>
    </Card>
  );
}
