
"use client";

import React, { useState, useMemo } from "react";
import type { InventoryItem, InventoryKpi } from "@/lib/types";
import KpiCard from "../kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Copy, Link, Check, AlertTriangle, ArrowUp, ArrowDown, Upload, Cloud, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


type ViewMode = "units" | "planning" | "days" | "value";

interface InventoryTabProps {
  data: InventoryItem[];
  searchTerm: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

export default function InventoryTab({ data, searchTerm, onFileUpload, onCloudImport }: InventoryTabProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("units");

  const filteredInventoryData = useMemo(() => {
    return data.filter((item) => {
      return searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    });
  }, [data, searchTerm]);

  const kpis = useMemo<InventoryKpi>(() => {
    let totalStock = 0;
    let totalDrr = 0;
    
    const result = filteredInventoryData.reduce(
      (acc, item) => {
        const totalLocStock = (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
        const globalCover = item.drr > 0 ? totalLocStock / item.drr : 0;
        
        acc.sellableValue += totalLocStock * item.price;
        
        if (globalCover > 40 && item.drr > 0) { // Overstocked logic for Stuck Capital
            const excessStock = (globalCover - 40) * item.drr;
            acc.stuckCapital += excessStock * item.price;
        }

        if (globalCover < 8) { // Stockout logic
             acc.stockouts++;
        }
        
        const deficit = ["kol", "pith", "har", "blr"].reduce((sum, loc) => {
            const stock = item[`stock_${loc}`] || 0;
            const drr = item[`drr_${loc}`] || 0;
            return sum + Math.max(0, drr * 15 - stock);
        }, 0);
        acc.capitalNeeded += deficit * item.price;
        
        totalStock += totalLocStock;
        totalDrr += item.drr;

        return acc;
      },
      { sellableValue: 0, capitalNeeded: 0, avgCover: 0, stockouts: 0, stuckCapital: 0 }
    );

    result.avgCover = totalDrr > 0 ? totalStock / totalDrr : 0;
    return result;
  }, [filteredInventoryData]);

  const renderCell = (stock: number, drr: number, price: number, view: ViewMode) => {
    const deficit = Math.max(0, (drr * 15) - stock);

    switch (view) {
        case 'planning':
            return deficit > 0 
                ? <span className="text-destructive font-bold bg-destructive/10 p-1 rounded">-{deficit}</span> 
                : <span className="text-green-600 font-bold bg-green-600/10 p-1 rounded">OK</span>;
        case 'days':
            const days = drr > 0 ? stock / drr : 999;
            const colorClass = days < 8 ? 'text-destructive font-bold' : days > 40 ? 'text-amber-600' : 'text-green-600';
            return <span className={colorClass}>{days === 999 ? '∞' : `${Math.round(days)}d`}</span>;
        case 'value':
            return `₹${Math.round(stock * price / 1000)}k`;
        default: // 'units'
            return stock;
    }
  };


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KpiCard title="Sellable Value" value={`₹${(kpis.sellableValue/100000).toFixed(2)} L`} className="text-green-600" />
        <KpiCard title="Need (15d Cover)" value={`₹${(kpis.capitalNeeded/100000).toFixed(2)} L`} className="text-primary" />
        <KpiCard title="Avg Cover" value={`${Math.round(kpis.avgCover)} Days`} className="text-primary" />
        <KpiCard title="Stockouts (<8d)" value={`${kpis.stockouts} SKUs`} className="text-destructive" />
        <KpiCard title="Stuck Capital (>40d)" value={`₹${(kpis.stuckCapital/100000).toFixed(2)} L`} className="text-amber-600" />
      </div>

      <div className="flex justify-between gap-3 mb-4 bg-card p-2.5 rounded-xl border items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">VIEW:</span>
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <SelectTrigger className="w-[130px] h-8 text-xs font-bold text-primary bg-transparent border-none focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="units">📦 Units</SelectItem>
              <SelectItem value="planning">📉 Planning</SelectItem>
              <SelectItem value="days">⏳ Days</SelectItem>
              <SelectItem value="value">💰 Value</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                            <a href="/inventory-template.csv" download>
                                <Download className="h-4 w-4" />
                            </a>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Download Template</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('inventory-upload-inv-tab')?.click()}><Upload className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Import from .xlsx</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={onCloudImport}><Cloud className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Import from Google Sheet</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
             <input type="file" id="inventory-upload-inv-tab" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
            <Button size="sm" variant="outline"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
            <Button size="sm" variant="outline"><Link className="w-3 h-3 mr-1" /> Link</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="col-span-1 h-fit">
            <CardHeader><CardTitle className="text-sm font-bold text-primary">Daily Inventory SOP</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-3 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2"><span className="text-primary mt-1">1.</span> Identify <b className="text-destructive">Critical</b> SKUs (&lt; 8 days cover). Pause Ads if active.</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-1">2.</span> Review <b className="text-amber-600">Overstocked</b> SKUs (&gt; 40 days). Plan promotions or reduce reorders.</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-1">3.</span> Check for <b className="text-green-600">Healthy</b> SKUs (8-40 days) to ensure stable sales.</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-1">4.</span> Monitor <b className="text-slate-500">Slow Moving</b> items (low DRR) for potential liquidation.</li>
                    <li className="flex items-start gap-2"><span className="text-primary mt-1">5.</span> Raise PO if <b>Days to Reorder ≤ 3</b>.</li>
                </ul>
            </CardContent>
        </Card>
        
        <div className="lg:col-span-3 bg-card rounded-xl border shadow-md overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
                <Table>
                    <TableHeader className="text-[10px] uppercase tracking-wide bg-muted/50">
                        <TableRow>
                            <TableHead className="p-3 sticky-col bg-card border-r min-w-[150px] z-20">SKU Name</TableHead>
                            <TableHead colSpan={2} className="text-center bg-blue-500/10">Kol</TableHead>
                            <TableHead colSpan={2} className="text-center bg-purple-500/10">Pith</TableHead>
                            <TableHead colSpan={2} className="text-center bg-orange-500/10">Har</TableHead>
                            <TableHead colSpan={2} className="text-center bg-cyan-500/10">Blr</TableHead>
                            <TableHead className="text-center bg-muted">Cover</TableHead>
                            <TableHead className="text-center bg-muted">Trend</TableHead>
                            <TableHead className="text-center bg-muted">ROP</TableHead>
                            <TableHead className="text-center bg-muted">Reorder In</TableHead>
                            <TableHead className="text-center bg-muted border-r">Status</TableHead>
                            <TableHead className="text-center bg-yellow-500/10">Plan</TableHead>
                        </TableRow>
                        <TableRow className="text-[9px] bg-muted/50">
                            <TableHead className="sticky-col bg-card border-r z-20"></TableHead>
                            <TableHead className="text-center">Stock</TableHead><TableHead className="text-center border-r loc-group-border">DRR</TableHead>
                            <TableHead className="text-center">Stock</TableHead><TableHead className="text-center border-r loc-group-border">DRR</TableHead>
                            <TableHead className="text-center">Stock</TableHead><TableHead className="text-center border-r loc-group-border">DRR</TableHead>
                            <TableHead className="text-center">Stock</TableHead><TableHead className="text-center border-r loc-group-border">DRR</TableHead>
                            <TableHead className="text-center">(Days)</TableHead>
                            <TableHead className="text-center">(30d)</TableHead>
                            <TableHead className="text-center">(Units)</TableHead>
                            <TableHead className="text-center">(Days)</TableHead>
                            <TableHead className="text-center border-r">Risk</TableHead>
                            <TableHead className="text-center">Req</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                        {filteredInventoryData.map(item => {
                            const totalLocStock = (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
                            const globalCover = item.drr > 0 ? totalLocStock / item.drr : 999;
                            const rop = Math.ceil(item.drr * 10); // Reorder point at 10 days of stock
                            const daysToRop = item.drr > 0 ? Math.round((totalLocStock - rop) / item.drr) : 99;
                            const totalDeficit = ["kol", "pith", "har", "blr"].reduce((sum, loc) => sum + Math.max(0, (item[`drr_${loc}`] || 0) * 15 - (item[`stock_${loc}`] || 0)), 0);
                            
                            const getStatus = () => {
                                if (item.drr === 0 && totalLocStock > 0) return <span className="text-slate-500 font-bold">Slow Moving</span>;
                                if (globalCover < 8) return <span className="text-destructive font-bold animate-pulse">Critical</span>;
                                if (globalCover > 40) return <span className="text-amber-600 font-bold">Overstocked</span>;
                                return <span className="text-green-600 font-bold">Healthy</span>;
                            };

                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="sticky-col bg-card border-r font-medium text-foreground">{item.name}</TableCell>
                                    <TableCell className="text-center">{renderCell(item.stock_kol || 0, item.drr_kol || 0, item.price, viewMode)}</TableCell><TableCell className="text-center border-r loc-group-border text-muted-foreground">{item.drr_kol || 0}</TableCell>
                                    <TableCell className="text-center">{renderCell(item.stock_pith || 0, item.drr_pith || 0, item.price, viewMode)}</TableCell><TableCell className="text-center border-r loc-group-border text-muted-foreground">{item.drr_pith || 0}</TableCell>
                                    <TableCell className="text-center">{renderCell(item.stock_har || 0, item.drr_har || 0, item.price, viewMode)}</TableCell><TableCell className="text-center border-r loc-group-border text-muted-foreground">{item.drr_har || 0}</TableCell>
                                    <TableCell className="text-center">{renderCell(item.stock_blr || 0, item.drr_blr || 0, item.price, viewMode)}</TableCell><TableCell className="text-center border-r loc-group-border text-muted-foreground">{item.drr_blr || 0}</TableCell>
                                    <TableCell className="text-center font-bold text-foreground">{Math.round(globalCover)}d</TableCell>
                                    <TableCell className="text-center text-lg">{item.id % 2 === 0 ? <ArrowUp className="w-4 h-4 mx-auto text-green-500" /> : <ArrowDown className="w-4 h-4 mx-auto text-red-400" />}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{rop}</TableCell>
                                    <TableCell className={`text-center font-bold ${daysToRop < 3 ? 'text-destructive' : ''}`}>{daysToRop < 0 ? 0 : daysToRop}d</TableCell>
                                    <TableCell className="text-center text-[10px] border-r">
                                        {getStatus()}
                                    </TableCell>
                                    <TableCell className="text-center bg-yellow-500/10">
                                        <div className="flex flex-col text-[10px]">
                                            <span className="font-bold text-destructive">{totalDeficit > 0 ? totalDeficit : '-'}</span>
                                            <span className="text-muted-foreground">₹{Math.round(totalDeficit*item.price/1000)}k</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
      </div>
    </div>
  );
}

    