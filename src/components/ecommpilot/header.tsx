"use client";

import { Button } from "@/components/ui/button";
import {
  CloudLightning,
  LayoutDashboard,
  RefreshCw,
  RotateCcw,
} from "lucide-react";

interface HeaderProps {
  onReset: () => void;
  onSyncAll: () => void;
}

export default function Header({ onReset, onSyncAll }: HeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
          <span className="flex items-center justify-center bg-primary/10 text-primary rounded-lg p-2">
            <LayoutDashboard className="w-6 h-6" />
          </span>
          Unified Command Center
        </h1>
        <p className="text-muted-foreground text-xs mt-1 font-medium ml-14">
          Multi-Channel Operations • Location-Wise Inventory • Advanced Growth
          Analytics
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs bg-card p-2 rounded-lg border shadow-sm">
        <Button size="sm" variant="outline" className="bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 font-bold" onClick={onSyncAll}>
          <CloudLightning className="mr-1.5 h-3.5 w-3.5" />
          Sync All
        </Button>
        <div className="h-5 w-px bg-border" />
        <Button size="sm" variant="secondary">
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refresh View
        </Button>
        <div className="h-5 w-px bg-border" />
        <Button size="sm" variant="ghost" className="text-destructive-foreground bg-destructive/80 hover:bg-destructive" onClick={onReset}>
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
