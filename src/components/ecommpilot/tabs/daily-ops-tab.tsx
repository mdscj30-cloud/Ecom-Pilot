
"use client";

import React, { useMemo } from "react";
import type { InventoryItem, Kpi, Channel, SortConfig } from "@/lib/types";
import KpiCard from "../kpi-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Upload,
  Plus,
  Trash2,
  Cloud,
  Download,
  ArrowUpDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ListTodo,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DailyOpsTabProps {
  data: InventoryItem[];
  kpis: Kpi;
  roasThreshold: number;
  setRoasThreshold: (value: number) => void;
  currentChannel: Channel;
  setCurrentChannel: (channel: Channel) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onAddSku: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  onDeleteSku: (id: number) => void;
}

const channels: Channel[] = ["All", "Meesho", "Amazon"];

export default function DailyOpsTab({
  data,
  kpis,
  roasThreshold,
  setRoasThreshold,
  currentChannel,
  setCurrentChannel,
  searchTerm,
  setSearchTerm,
  onAddSku,
  onFileUpload,
  onCloudImport,
  sortConfig,
  setSortConfig,
  onDeleteSku,
}: DailyOpsTabProps) {
    
  const getDecision = (item: InventoryItem) => {
    const stockTotal = (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0);
    const stockDays = item.drr > 0 ? (stockTotal / item.drr) : 999;
    const revenue = item.price * item.orders;
    const roas = item.spend > 0 ? (revenue / item.spend) : 0;
    
    if (stockDays < 5) return { text: "CRITICAL", variant: "destructive" as const, className: "bg-red-500/10 text-red-600" };
    if (roas > roasThreshold && stockDays > 10) return { text: "GREEN", variant: "default" as const, className: "bg-green-500/10 text-green-600" };
    return { text: "AMBER", variant: "secondary" as const, className: "bg-amber-500/10 text-amber-600" };
  };

  const decisionMatrix = useMemo(() => {
    return data.reduce((acc, item) => {
        const decision = getDecision(item);
        if (decision.text === 'GREEN') acc.green++;
        else if (decision.text === 'AMBER') acc.amber++;
        else acc.critical++;
        return acc;
    }, { green: 0, amber: 0, critical: 0 });
  }, [data, roasThreshold]);

  const topPriorities = useMemo(() => {
    const sortedByRevenue = [...data].sort((a,b) => (b.price * b.orders) - (a.price * a.orders)).slice(0,5);
    const sortedByStock = [...data].filter(i => i.drr > 0).sort((a,b) => {
        const stockDaysA = ((a.stock_kol||0)+(a.stock_pith||0)+(a.stock_har||0)+(a.stock_blr||0))/a.drr;
        const stockDaysB = ((b.stock_kol||0)+(b.stock_pith||0)+(b.stock_har||0)+(b.stock_blr||0))/b.drr;
        return stockDaysA - stockDaysB;
    }).slice(0,5);
    return { topRevenue: sortedByRevenue, criticalStock: sortedByStock };
  }, [data]);

  const requestSort = (column: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.column === column && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ column, direction });
  };
  
  const getSortIcon = (column: string) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="ml-2 h-4 w-4 inline-block opacity-30" />;
    }
    return sortConfig.direction === 'desc' ? '▼' : '▲';
  };

  const sortedData = useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig.column !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.column as keyof InventoryItem];
        const bValue = b[sortConfig.column as keyof InventoryItem];
        
        if(sortConfig.column === 'name' || sortConfig.column === 'channel') {
            return (aValue as string).localeCompare(bValue as string) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        // Custom logic for derived columns
        if (sortConfig.column === 'net') {
            const netA = a.price - a.shipping - a.commission;
            const netB = b.price - b.shipping - b.commission;
            return (netA - netB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (sortConfig.column === 'stock') {
            const stockA = (a.stock_kol||0)+(a.stock_pith||0)+(a.stock_har||0)+(a.stock_blr||0);
            const stockB = (b.stock_kol||0)+(b.stock_pith||0)+(b.stock_har||0)+(b.stock_blr||0);
            return (stockA - stockB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (sortConfig.column === 'days') {
            const daysA = a.drr > 0 ? ((a.stock_kol||0)+(a.stock_pith||0)+(a.stock_har||0)+(a.stock_blr||0))/a.drr : 999;
            const daysB = b.drr > 0 ? ((b.stock_kol||0)+(b.stock_pith||0)+(b.stock_har||0)+(b.stock_blr||0))/b.drr : 999;
            return (daysA - daysB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (sortConfig.column === 'roas') {
            const roasA = a.spend > 0 ? (a.price*a.orders/a.spend) : 0;
            const roasB = b.spend > 0 ? (b.price*b.orders/b.spend) : 0;
            return (roasA - roasB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        if (sortConfig.column === 'cvr') {
            const cvrA = a.clicks > 0 ? (a.orders/a.clicks) : 0;
            const cvrB = b.clicks > 0 ? (b.orders/b.clicks) : 0;
            return (cvrA - cvrB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
         if (sortConfig.column === 'ret') {
            const retA = a.orders > 0 ? (a.returns/a.orders) : 0;
            const retB = b.orders > 0 ? (b.returns/b.orders) : 0;
            return (retA - retB) * (sortConfig.direction === 'asc' ? 1 : -1);
        }


        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return (aValue - bValue) * (sortConfig.direction === 'asc' ? 1 : -1);
        }
        
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-2 space-y-6">
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Revenue (Today)" value={`₹${kpis.revenue.toLocaleString()}`} />
                <KpiCard title="Ad Spend" value={`₹${kpis.spend.toLocaleString()}`} />
                <KpiCard title="Blended ROAS" value={(kpis.revenue / kpis.spend || 0).toFixed(2)} className="text-primary" />
                <KpiCard title="Active SKUs" value={data.length} />
             </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard title="Avg CVR %" value="12.5%" />
                <KpiCard title="Returns %" value="3.1%" />
                <KpiCard title="Total Inventory" value={kpis.stock.toLocaleString()} />
                <KpiCard title="SKUs Tracked" value={kpis.skus} />
             </div>
         </div>
         <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><ListTodo className="w-5 h-5 text-primary"/> Decision Matrix</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center">
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-500/10">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-6 h-6 text-green-600"/>
                            <div>
                                <h3 className="font-bold text-green-600">GREEN (Scale)</h3>
                                <p className="text-xs text-muted-foreground">High ROAS, healthy stock.</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-green-600">{decisionMatrix.green}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-amber-600"/>
                             <div>
                                <h3 className="font-bold text-amber-600">AMBER (Monitor)</h3>
                                <p className="text-xs text-muted-foreground">Low ROAS or borderline stock.</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-amber-600">{decisionMatrix.amber}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-red-600"/>
                             <div>
                                <h3 className="font-bold text-red-600">CRITICAL (Fix)</h3>
                                <p className="text-xs text-muted-foreground">Very low stock. Pause ads.</p>
                            </div>
                        </div>
                        <span className="text-2xl font-bold text-red-600">{decisionMatrix.critical}</span>
                    </div>
                </div>
            </CardContent>
         </Card>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><TrendingUp className="text-primary w-5 h-5"/> Top 5 by Revenue</CardTitle>
            </CardHeader>
            <CardContent>
                <ul className="text-sm space-y-2">
                    {topPriorities.topRevenue.map(item => (
                        <li key={item.id} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/50">
                            <span className="font-medium text-foreground truncate pr-4">{item.name}</span>
                            <span className="font-bold text-primary">₹{(item.price * item.orders).toLocaleString()}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
          </Card>
           <Card>
            <CardHeader>
                <CardTitle className="text-base font-bold flex items-center gap-2"><AlertTriangle className="text-destructive w-5 h-5"/> Top 5 Critical Stock</CardTitle>
            </CardHeader>
            <CardContent>
                 <ul className="text-sm space-y-2">
                    {topPriorities.criticalStock.map(item => {
                        const stockDays = ((item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0))/item.drr;
                        return (
                            <li key={item.id} className="flex justify-between items-center text-xs p-1.5 rounded bg-muted/50">
                                <span className="font-medium text-foreground truncate pr-4">{item.name}</span>
                                <span className="font-bold text-destructive">{Math.round(stockDays)} days</span>
                            </li>
                        )
                    })}
                </ul>
            </CardContent>
          </Card>
       </div>


      <div className="bg-card p-3 rounded-lg border flex flex-wrap gap-4 items-center text-xs">
         <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground font-medium">ROAS Threshold:</label>
            <Input type="number" value={roasThreshold} onChange={e => setRoasThreshold(parseFloat(e.target.value))} className="w-16 h-8 text-sm" />
         </div>
         <div className="h-5 w-px bg-border mx-2"></div>
         <div className="flex items-center gap-2">
            {channels.map(channel => (
                <Button key={channel} onClick={() => setCurrentChannel(channel)} size="sm" variant={currentChannel === channel ? 'default' : 'outline'}>{channel}</Button>
            ))}
         </div>
         <div className="ml-auto flex gap-2 items-center flex-grow sm:flex-grow-0">
             <Input placeholder="Search SKU..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="h-9 w-full sm:w-48"/>
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
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('inventory-upload')?.click()}><Upload className="h-4 w-4" /></Button>
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
             <input type="file" id="inventory-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
             <Button onClick={onAddSku} size="sm"><Plus className="h-4 w-4 mr-1" /> Add SKU</Button>
         </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
            <Table>
                <TableHeader className="bg-muted/50 uppercase text-[10px] tracking-wide">
                    <TableRow>
                        <TableHead className="w-12 cursor-pointer sticky left-0 bg-muted/50 z-10" onClick={() => requestSort('channel')}>Ch {getSortIcon('channel')}</TableHead>
                        <TableHead className="min-w-[180px] cursor-pointer sticky left-12 bg-muted/50 z-10" onClick={() => requestSort('name')}>SKU Name {getSortIcon('name')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('price')}>Price {getSortIcon('price')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('shipping')}>Ship {getSortIcon('shipping')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('net')}>Net {getSortIcon('net')}</TableHead>
                        <TableHead className="text-center bg-primary/10 cursor-pointer" onClick={() => requestSort('stock')}>Stock {getSortIcon('stock')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('drr')}>DRR {getSortIcon('drr')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('days')}>Days {getSortIcon('days')}</TableHead>
                        <TableHead className="text-center bg-accent/10 cursor-pointer" onClick={() => requestSort('roas')}>ROAS {getSortIcon('roas')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('cvr')}>CVR {getSortIcon('cvr')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('ret')}>Ret% {getSortIcon('ret')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('rating')}>Rating {getSortIcon('rating')}</TableHead>
                        <TableHead className="text-center cursor-pointer" onClick={() => requestSort('reviews')}>Revs {getSortIcon('reviews')}</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                    {sortedData.map(item => {
                        const decision = getDecision(item);
                        const stockTotal = (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0);
                        const stockDays = item.drr > 0 ? stockTotal/item.drr : 999;
                        const roas = item.spend > 0 ? (item.price*item.orders/item.spend) : 0;
                        const cvr = item.clicks > 0 ? (item.orders/item.clicks)*100 : 0;
                        const ret = item.orders > 0 ? (item.returns/item.orders)*100 : 0;
                        const net = item.price - item.shipping - (item.commission||0);

                        return (
                            <TableRow key={item.id}>
                                <TableCell className="sticky left-0 z-10 bg-card"><Badge variant="secondary">{item.channel.charAt(0)}</Badge></TableCell>
                                <TableCell className="font-medium sticky left-12 z-10 bg-card">{item.name}</TableCell>
                                <TableCell className="text-center">₹{item.price}</TableCell>
                                <TableCell className="text-center text-muted-foreground">₹{item.shipping}</TableCell>
                                <TableCell className="text-center font-mono text-sm">₹{Math.round(net)}</TableCell>
                                <TableCell className="text-center bg-primary/10 font-bold">{stockTotal}</TableCell>
                                <TableCell className="text-center">{item.drr}</TableCell>
                                <TableCell className={cn('text-center font-bold', stockDays < 5 ? 'text-destructive' : stockDays > 40 ? 'text-amber-500' : '')}>{isFinite(stockDays) ? `${Math.round(stockDays)}d` : '∞'}</TableCell>
                                <TableCell className="text-center font-bold bg-accent/10">{roas.toFixed(2)}</TableCell>
                                <TableCell className="text-center">{cvr.toFixed(1)}%</TableCell>
                                <TableCell className="text-center">{ret.toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-amber-500">{'★'.repeat(Math.round(item.rating||0))}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{item.reviews||0}</TableCell>
                                <TableCell className="text-center"><Badge variant={decision.variant} className={cn('font-bold', decision.className)}>{decision.text}</Badge></TableCell>
                                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDeleteSku(item.id)}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></Button></TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
      </div>
    </div>
  );
}

    
