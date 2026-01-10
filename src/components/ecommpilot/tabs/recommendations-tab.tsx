"use client";

import React, { useMemo } from "react";
import type { InventoryRecommendationsOutput } from "@/ai/flows/generate-inventory-recommendations";
import type { InventoryItem } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationsTabProps {
  recommendations: InventoryRecommendationsOutput;
  inventoryData: InventoryItem[];
  isLoading: boolean;
  targetRoas: number;
  setTargetRoas: (value: number) => void;
  onRecalculate: () => void;
}

export default function RecommendationsTab({
  recommendations,
  inventoryData,
  isLoading,
  targetRoas,
  setTargetRoas,
  onRecalculate,
}: RecommendationsTabProps) {

    const recommendationData = useMemo(() => {
        return recommendations.map(rec => {
            const item = inventoryData.find(d => d.name === rec.sku);
            return { ...rec, ...item };
        });
    }, [recommendations, inventoryData]);

    const getActionBadge = (rec: string) => {
        switch (rec.toLowerCase()) {
            case 'restock':
            case 'increase spend':
                return <Badge variant="destructive">{rec}</Badge>;
            case 'reduce':
            case 'pause ads':
                return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">{rec}</Badge>;
            case 'ok':
            case 'monitor':
                return <Badge variant="default" className="bg-green-600/20 text-green-700">{rec}</Badge>;
            default:
                return <Badge variant="outline">{rec}</Badge>;
        }
    };

    const getHealthIndicator = (stockDays: number) => {
        if (stockDays < 5) return "bg-destructive";
        if (stockDays < 15) return "bg-amber-500";
        if (stockDays > 60) return "bg-slate-400";
        return "bg-green-600";
    };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-xl border gap-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Action Center
        </h2>
        <div className="flex gap-4 items-center bg-muted p-2 rounded-lg">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Target ROAS:
          </label>
          <Input
            type="number"
            value={targetRoas}
            onChange={(e) => setTargetRoas(parseFloat(e.target.value))}
            className="w-20 h-8 text-sm font-bold"
          />
          <Button size="sm" onClick={onRecalculate} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "Generating..." : "Generate Actions"}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="text-[10px] uppercase tracking-wide bg-muted/50">
              <TableRow>
                <TableHead className="p-3 sticky-col bg-card border-r z-10 min-w-[180px]">
                  SKU
                </TableHead>
                <TableHead className="text-center">Inv. Health</TableHead>
                <TableHead className="text-center">Net Value</TableHead>
                <TableHead className="text-center bg-blue-500/10">
                  Inventory Action
                </TableHead>
                 <TableHead className="text-center bg-accent/10">
                  Ad Action
                </TableHead>
                <TableHead className="p-3">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating AI recommendations...</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : recommendationData.length > 0 ? (
                recommendationData.map((rec) => {
                  const stockTotal = (rec.stock_kol || 0) + (rec.stock_pith || 0) + (rec.stock_har || 0) + (rec.stock_blr || 0);
                  const stockDays = (rec.drr || 0) > 0 ? stockTotal / (rec.drr || 1) : 999;
                  const netValue = (rec.price || 0) - (rec.shipping || 0) - (rec.commission || 0);
                  
                  return (
                  <TableRow key={rec.sku}>
                    <TableCell className="p-3 sticky-col bg-card border-r font-medium text-foreground">
                      {rec.sku}
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                            <div className={cn("w-3 h-3 rounded-full", getHealthIndicator(stockDays))} />
                            <span className="font-bold">{isFinite(stockDays) ? `${Math.round(stockDays)}d` : '∞'}</span>
                        </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">₹{netValue.toFixed(0)}</TableCell>
                    <TableCell className="p-3 text-center bg-blue-500/10">
                        {getActionBadge(rec.inventoryAction)}
                    </TableCell>
                    <TableCell className="p-3 text-center bg-accent/10">
                        {getActionBadge(rec.adAction)}
                    </TableCell>
                    <TableCell className="p-3 text-muted-foreground">{rec.remarks}</TableCell>
                  </TableRow>
                )})
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center text-muted-foreground">
                    Click "Generate Actions" to get AI-powered recommendations for your inventory and advertising.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
