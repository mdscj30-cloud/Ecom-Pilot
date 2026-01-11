
"use client";

import React, { useMemo } from "react";
import type { B2BInventoryItem, SortConfig } from "@/lib/types";
import KpiCard from "../kpi-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Upload, Cloud, Download, ArrowUpDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface B2BInventoryTabProps {
  data: B2BInventoryItem[];
  searchTerm: string;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
}

export default function B2BInventoryTab({ data, searchTerm, onFileUpload, onCloudImport, sortConfig, setSortConfig }: B2BInventoryTabProps) {

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return searchTerm ? item.sku_name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
    });
  }, [data, searchTerm]);

  const kpis = useMemo(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.totalStock += item.stock;
        acc.totalValue += item.stock * item.b2b_price;
        acc.inboundStock += item.inbound_stock;
        return acc;
      },
      { totalStock: 0, totalValue: 0, inboundStock: 0, skuCount: filteredData.length }
    );
  }, [filteredData]);

  const requestSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };
  
  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline-block opacity-50" />;
    }
    return sortConfig.direction === 'desc' ? '▼' : '▲';
  };

  const getAction = (doc: number) => {
    if (doc < 15) return <Badge variant="destructive">Restock</Badge>;
    if (doc > 60) return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">Overstocked</Badge>;
    return <Badge variant="default" className="bg-green-600/20 text-green-700">Healthy</Badge>;
  };
  
  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.column !== null) {
      sortableItems.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.column === 'doc') {
            aValue = a.drr > 0 ? a.stock / a.drr : Infinity;
            bValue = b.drr > 0 ? b.stock / b.drr : Infinity;
        } else {
            aValue = a[sortConfig.column as keyof B2BInventoryItem];
            bValue = b[sortConfig.column as keyof B2BInventoryItem];
        }


        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return aValue.localeCompare(bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return (aValue - bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);


  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total B2B SKUs" value={kpis.skuCount} />
        <KpiCard title="Total Stock (Units)" value={kpis.totalStock.toLocaleString()} />
        <KpiCard title="Total Inventory Value" value={`₹${(kpis.totalValue / 100000).toFixed(2)} L`} className="text-green-600" />
        <KpiCard title="Inbound Stock (Units)" value={kpis.inboundStock.toLocaleString()} className="text-blue-500" />
      </div>

      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="text-base">B2B Inventory Details</CardTitle>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                                    <a href="/b2b-inventory-template.csv" download>
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download B2B Template</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('b2b-inventory-upload')?.click()}><Upload className="h-4 w-4" /></Button>
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
                    <input type="file" id="b2b-inventory-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto custom-scrollbar">
                <Table>
                    <TableHeader className="text-[10px] uppercase tracking-wide bg-muted/50">
                        <TableRow>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('platform')}>Platform {getSortIcon('platform')}</TableHead>
                            <TableHead className="cursor-pointer min-w-[200px]" onClick={() => requestSort('sku_name')}>SKU Name {getSortIcon('sku_name')}</TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('asin')}>ASIN / FSN {getSortIcon('asin')}</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => requestSort('listing_price')}>Listing Price {getSortIcon('listing_price')}</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => requestSort('b2b_price')}>B2B Price {getSortIcon('b2b_price')}</TableHead>
                            <TableHead className="text-right cursor-pointer bg-primary/10" onClick={() => requestSort('stock')}>Stock {getSortIcon('stock')}</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => requestSort('inbound_stock')}>Inbound {getSortIcon('inbound_stock')}</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => requestSort('drr')}>DRR {getSortIcon('drr')}</TableHead>
                            <TableHead className="text-right cursor-pointer" onClick={() => requestSort('doc')}>DOC {getSortIcon('doc')}</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                        {sortedData.map(item => {
                            const doc = item.drr > 0 ? item.stock / item.drr : Infinity;
                            return (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.platform}</TableCell>
                                    <TableCell className="font-medium text-foreground">{item.sku_name}</TableCell>
                                    <TableCell className="font-mono">{item.asin}</TableCell>
                                    <TableCell className="text-right font-mono">₹{item.listing_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-mono text-primary font-bold">₹{item.b2b_price.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-bold bg-primary/10">{item.stock.toLocaleString()}</TableCell>
                                    <TableCell className="text-right text-blue-500 font-bold">{item.inbound_stock > 0 ? item.inbound_stock.toLocaleString() : '-'}</TableCell>
                                    <TableCell className="text-right">{item.drr}</TableCell>
                                    <TableCell 
                                        className={cn("text-right font-bold", 
                                            doc < 15 ? 'text-destructive' : doc > 60 ? 'text-amber-600' : 'text-green-600'
                                        )}
                                    >
                                        {isFinite(doc) ? `${Math.round(doc)}d` : '∞'}
                                    </TableCell>
                                    <TableCell className="text-center">{getAction(doc)}</TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
