"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GlobalFilters } from "@/lib/filters";
import { DURATION_OPTIONS, WAREHOUSES, ORDER_STATUSES, getChannelGroup } from "@/lib/filters";

const ALL_CHANNELS = [
  'MEESHO_KHEDA','MEESHO_GURGAON','MEESHO_KOLKATA','MEESHO_BANGALORE',
  'FLIPKART_BANGALORE','FLIPKART_GURGAON','FLIPKART_KOLKATA',
  'JIOMART_AMOUR','JIOMART__KOLKATA',
  'RK_WORLD_',
];

interface GlobalFilterBarProps {
  filters: GlobalFilters;
  onChange: (f: GlobalFilters) => void;
  availableChannels?: string[];
  showStatus?: boolean;
  showWarehouse?: boolean;
  compact?: boolean;
}

export default function GlobalFilterBar({
  filters, onChange, availableChannels = ALL_CHANNELS,
  showStatus = true, showWarehouse = true, compact = false,
}: GlobalFilterBarProps) {

  const update = (patch: Partial<GlobalFilters>) => onChange({ ...filters, ...patch });

  const toggleArr = (arr: string[], val: string): string[] =>
    arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const activeCount = [
    filters.channels.length > 0,
    filters.warehouses.length > 0,
    filters.statuses.length > 0,
    filters.skuSearch.trim().length > 0,
    filters.durationPreset !== '30d',
  ].filter(Boolean).length;

  return (
    <div className={cn("space-y-2 rounded-lg border p-3 bg-muted/30", compact && "p-2")}>
      {/* Row 1: Duration + Search + Reset */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Duration presets */}
        <div className="flex gap-1 flex-wrap">
          {DURATION_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => update({ durationPreset: opt.value as GlobalFilters['durationPreset'] })}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md border transition-colors",
                filters.durationPreset === opt.value
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border hover:bg-muted bg-background text-muted-foreground"
              )}
            >{opt.label}</button>
          ))}
        </div>

        {/* Custom date range */}
        {filters.durationPreset === 'custom' && (
          <div className="flex items-center gap-1">
            <input type="date" value={filters.dateFrom}
              onChange={e => update({ dateFrom: e.target.value })}
              className="text-xs border rounded px-2 py-1 bg-background h-7" />
            <span className="text-xs text-muted-foreground">to</span>
            <input type="date" value={filters.dateTo}
              onChange={e => update({ dateTo: e.target.value })}
              className="text-xs border rounded px-2 py-1 bg-background h-7" />
          </div>
        )}

        {/* SKU Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
          <Input
            placeholder="Search SKU..."
            value={filters.skuSearch}
            onChange={e => update({ skuSearch: e.target.value })}
            className="pl-7 h-7 text-xs"
          />
        </div>

        {/* Reset */}
        {activeCount > 0 && (
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground"
            onClick={() => onChange({ dateFrom:'', dateTo:'', channels:[], warehouses:[], skuSearch:'', statuses:[], durationPreset:'30d' })}>
            <X className="w-3 h-3" />
            Reset ({activeCount})
          </Button>
        )}
      </div>

      {/* Row 2: Channel filter */}
      <div className="flex flex-wrap gap-1 items-center">
        <span className="text-xs text-muted-foreground font-medium mr-1">Channel:</span>
        <button
          onClick={() => update({ channels: [] })}
          className={cn("px-2 py-0.5 text-xs rounded border transition-colors",
            filters.channels.length === 0 ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"
          )}>All</button>
        {availableChannels.map(ch => (
          <button key={ch}
            onClick={() => update({ channels: toggleArr(filters.channels, ch) })}
            className={cn("px-2 py-0.5 text-xs rounded border transition-colors",
              filters.channels.includes(ch) ? "bg-primary/10 text-primary border-primary/30" : "border-border bg-background text-muted-foreground hover:bg-muted"
            )}>{ch}</button>
        ))}
      </div>

      {/* Row 3: Warehouse + Status */}
      <div className="flex flex-wrap gap-3 items-start">
        {showWarehouse && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground font-medium mr-1">WH:</span>
            <button onClick={() => update({ warehouses: [] })}
              className={cn("px-2 py-0.5 text-xs rounded border",
                filters.warehouses.length === 0 ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}>All</button>
            {WAREHOUSES.map(wh => (
              <button key={wh.code}
                onClick={() => update({ warehouses: toggleArr(filters.warehouses, wh.code) })}
                className={cn("px-2 py-0.5 text-xs rounded border",
                  filters.warehouses.includes(wh.code) ? "bg-primary/10 text-primary border-primary/30" : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}>{wh.label}</button>
            ))}
          </div>
        )}

        {showStatus && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-xs text-muted-foreground font-medium mr-1">Status:</span>
            <button onClick={() => update({ statuses: [] })}
              className={cn("px-2 py-0.5 text-xs rounded border",
                filters.statuses.length === 0 ? "bg-primary text-primary-foreground border-primary" : "border-border bg-background text-muted-foreground hover:bg-muted"
              )}>All</button>
            {ORDER_STATUSES.map(st => (
              <button key={st}
                onClick={() => update({ statuses: toggleArr(filters.statuses, st) })}
                className={cn("px-2 py-0.5 text-xs rounded border",
                  filters.statuses.includes(st) ? "bg-primary/10 text-primary border-primary/30" : "border-border bg-background text-muted-foreground hover:bg-muted"
                )}>{st}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
