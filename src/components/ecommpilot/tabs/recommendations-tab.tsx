
"use client";

import React, { useMemo } from "react";
import type { Recommendation, InventoryItem, SortConfig } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RecommendationsTabProps {
  inventoryData: InventoryItem[];
  roasThreshold: number;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
}

export default function RecommendationsTab({
  inventoryData,
  roasThreshold,
  sortConfig,
  setSortConfig
}: RecommendationsTabProps) {

  const recommendations = useMemo<Recommendation[]>(() => {
    return inventoryData.map(item => {
      const stockTotal = (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
      const stockDays = (item.drr || 0) > 0 ? stockTotal / (item.drr || 1) : Infinity;
      const revenue = item.price * item.orders;
      const roas = item.spend > 0 ? revenue / item.spend : Infinity;
      const returnsPercent = item.orders > 0 ? (item.returns / item.orders) * 100 : 0;

      let inventoryAction = "OK";
      if (stockDays < 7) inventoryAction = "Restock";
      if (stockDays > 60) inventoryAction = "Reduce";

      let adAction = "Monitor";
      if (stockDays < 3) {
        adAction = "Pause Ads";
      } else if (roas > roasThreshold && stockDays > 15) {
        adAction = "Increase Spend";
      }

      let remarks = [];
      if (inventoryAction === 'Restock') remarks.push(`Low stock cover (${Math.round(stockDays)} days).`);
      if (inventoryAction === 'Reduce') remarks.push(`High stock cover (${Math.round(stockDays)} days).`);
      if (adAction === 'Pause Ads') remarks.push(`Critically low stock cover.`);
      if (adAction === 'Increase Spend') remarks.push(`High ROAS (${roas.toFixed(2)}) with healthy stock.`);
      if(roas < roasThreshold && item.spend > 0) remarks.push(`ROAS (${roas.toFixed(2)}) is below target.`);

      return {
        sku: item.name,
        inventoryAction,
        adAction,
        remarks: remarks.length > 0 ? remarks.join(' ') : 'Performance is stable.',
        stockDays,
        netValue: item.price - item.shipping - item.commission,
        roas,
        returns: returnsPercent,
        reviews: item.reviews || 0,
      };
    });
  }, [inventoryData, roasThreshold]);

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

    const requestSort = (column: keyof Recommendation) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig.column === column && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ column, direction });
    };
    
    const getSortIcon = (column: keyof Recommendation) => {
      if (sortConfig.column !== column) {
        return <ArrowUpDown className="ml-2 h-4 w-4 inline-block opacity-50" />;
      }
      return sortConfig.direction === 'desc' ? '▼' : '▲';
    };

    const sortedRecommendations = useMemo(() => {
        let sortableItems = [...recommendations];
        if (sortConfig.column) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.column as keyof Recommendation];
                const bValue = b[sortConfig.column as keyof Recommendation];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return (aValue - bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
                }
                return 0;
            });
        }
        return sortableItems;
    }, [recommendations, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-4 rounded-xl border gap-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <CheckCircle className="w-6 h-6 text-green-600" />
          Action Center
        </h2>
        <p className="text-sm text-muted-foreground">
          Automated recommendations based on your current data and thresholds.
        </p>
      </div>

      <div className="bg-card rounded-xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader className="text-[10px] uppercase tracking-wide bg-muted/50">
              <TableRow>
                <TableHead className="p-3 sticky-col bg-card border-r z-10 min-w-[180px] cursor-pointer" onClick={() => requestSort('sku')}>
                  SKU {getSortIcon('sku')}
                </TableHead>
                <TableHead className="text-center cursor-pointer" onClick={() => requestSort('stockDays')}>Inv. Health {getSortIcon('stockDays')}</TableHead>
                <TableHead className="text-center cursor-pointer" onClick={() => requestSort('netValue')}>Net Value {getSortIcon('netValue')}</TableHead>
                <TableHead className="text-center cursor-pointer" onClick={() => requestSort('roas')}>ROAS {getSortIcon('roas')}</TableHead>
                <TableHead className="text-center cursor-pointer" onClick={() => requestSort('returns')}>Returns % {getSortIcon('returns')}</TableHead>
                <TableHead className="text-center cursor-pointer" onClick={() => requestSort('reviews')}>Reviews {getSortIcon('reviews')}</TableHead>
                <TableHead className="text-center bg-blue-500/10 cursor-pointer" onClick={() => requestSort('inventoryAction')}>
                  Inventory Action {getSortIcon('inventoryAction')}
                </TableHead>
                 <TableHead className="text-center bg-accent/10 cursor-pointer" onClick={() => requestSort('adAction')}>
                  Ad Action {getSortIcon('adAction')}
                </TableHead>
                <TableHead className="p-3">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="text-xs">
              {sortedRecommendations.length > 0 ? (
                sortedRecommendations.map((rec) => (
                  <TableRow key={rec.sku}>
                    <TableCell className="p-3 sticky-col bg-card border-r font-medium text-foreground">
                      {rec.sku}
                    </TableCell>
                    <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                            <div className={cn("w-3 h-3 rounded-full", getHealthIndicator(rec.stockDays))} />
                            <span className="font-bold">{isFinite(rec.stockDays) ? `${Math.round(rec.stockDays)}d` : '∞'}</span>
                        </div>
                    </TableCell>
                    <TableCell className={cn("text-center font-mono", rec.netValue > 300 ? 'text-green-600' : 'text-destructive')}>₹{rec.netValue.toFixed(0)}</TableCell>
                    <TableCell className={cn("text-center font-bold", isFinite(rec.roas) && rec.roas > 3 ? 'text-green-600' : isFinite(rec.roas) && rec.roas < 1.5 ? 'text-destructive' : '')}>{isFinite(rec.roas) ? rec.roas.toFixed(2) : 'N/A'}</TableCell>
                    <TableCell className={cn("text-center", rec.returns > 5 ? 'text-destructive' : '')}>{rec.returns.toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{rec.reviews}</TableCell>
                    <TableCell className="p-3 text-center bg-blue-500/10">
                        {getActionBadge(rec.inventoryAction)}
                    </TableCell>
                    <TableCell className="p-3 text-center bg-accent/10">
                        {getActionBadge(rec.adAction)}
                    </TableCell>
                    <TableCell className="p-3 text-muted-foreground">{rec.remarks}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="h-48 text-center text-muted-foreground">
                    No data available to generate actions. Please import your inventory data.
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
