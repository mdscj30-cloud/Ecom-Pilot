import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center bg-primary rounded-lg text-primary-foreground",
        className
      )}
    >
      <Package className="w-[60%] h-[60%]" />
    </div>
  );
}
