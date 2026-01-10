"use client";

import React from "react";
import type { InventoryRecommendationsOutput } from "@/ai/flows/generate-inventory-recommendations";
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
import { CheckCircle, Loader2 } from "lucide-react";

interface RecommendationsTabProps {
  recommendations: InventoryRecommendationsOutput;
  isLoading: boolean;
  targetRoas: number;
  setTargetRoas: (value: number) => void;
  onRecalculate: () => void;
}

export default function RecommendationsTab({
  recommendations,
  isLoading,
  targetRoas,
  setTargetRoas,
  onRecalculate,
}: RecommendationsTabProps) {

    const getRecommendationBadge = (rec: string) => {
        switch (rec.toLowerCase()) {
            case 'restock':
                return <Badge variant="destructive">Restock</Badge>;
            case 'reduce':
                return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">Reduce</Badge>;
            case 'ok':
                return <Badge variant="default" className="bg-green-600/20 text-green-700">OK</Badge>;
            default:
                return <Badge variant="outline">{rec}</Badge>;
        }
    }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-xl border gap-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-600" />
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
            {isLoading ? "Generating..." : "Recalculate"}
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
                <TableHead className="p-3">Platform</TableHead>
                <TableHead className="p-3 bg-blue-500/10">
                  Inventory Action
                </TableHead>
                <TableHead className="p-3">Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {isLoading ? (
                <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Generating AI recommendations...</span>
                        </div>
                    </TableCell>
                </TableRow>
              ) : recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <TableRow key={`${rec.sku}-${index}`}>
                    <TableCell className="p-3 sticky-col bg-card border-r font-medium text-foreground">
                      {rec.sku}
                    </TableCell>
                    <TableCell className="p-3 text-muted-foreground">
                      {/* Channel info is not in the output, can be added if needed */}
                      N/A 
                    </TableCell>
                    <TableCell className="p-3 bg-blue-500/10">
                        {getRecommendationBadge(rec.recommendation)}
                    </TableCell>
                    <TableCell className="p-3">{rec.reason}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground">
                    Click "Recalculate" to generate AI-powered recommendations.
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
