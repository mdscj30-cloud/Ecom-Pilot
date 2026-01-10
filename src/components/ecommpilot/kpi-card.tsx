import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export default function KpiCard({ title, value, className }: KpiCardProps) {
  return (
    <Card>
      <CardHeader className="p-4 pb-0">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <h2 className={cn("text-xl font-bold text-foreground mt-1", className)}>
          {value}
        </h2>
      </CardContent>
    </Card>
  );
}
