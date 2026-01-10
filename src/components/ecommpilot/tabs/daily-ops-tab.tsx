"use client";

import React from "react";
import type { InventoryItem, Kpi, SortConfig, Channel } from "@/lib/types";
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
  Link,
  Copy,
  Upload,
  Plus,
  Trash2,
  ArrowUpDown,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface DailyOpsTabProps {
  data: InventoryItem[];
  kpis: Kpi;
  roasThreshold: number;
  setRoasThreshold: (value: number) => void;
  cvrThreshold: number;
  setCvrThreshold: (value: number) => void;
  currentChannel: Channel;
  setCurrentChannel: (channel: Channel) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortConfig: SortConfig;
  setSortConfig: (config: SortConfig) => void;
  onAddSku: () => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
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
  onFileUpload
}: DailyOpsTabProps) {
    
  const getDecision = (item: InventoryItem) => {
    const stockTotal = (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0);
    const stockDays = item.drr > 0 ? (stockTotal / item.drr) : 999;
    const revenue = item.price * item.orders;
    const roas = item.spend > 0 ? (revenue / item.spend) : 0;
    
    if (stockDays < 5) return { text: "CRITICAL", variant: "destructive" as const };
    if (roas > roasThreshold && stockDays > 10) return { text: "GREEN", variant: "default" as const, className: "bg-green-600/20 text-green-700" };
    return { text: "AMBER", variant: "secondary" as const, className: "bg-amber-500/20 text-amber-700" };
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <KpiCard title="Revenue (Today)" value={`₹${kpis.revenue.toLocaleString()}`} />
        <KpiCard title="Ad Spend" value={`₹${kpis.spend.toLocaleString()}`} />
        <KpiCard title="Blended ROAS" value={(kpis.revenue / kpis.spend || 0).toFixed(2)} className="text-primary" />
        <KpiCard title="Avg CVR %" value="0.0%" />
        <KpiCard title="Returns %" value="0.0%" />
        <KpiCard title="Total Inventory" value={kpis.stock.toLocaleString()} />
        <KpiCard title="Active SKUs" value={data.length} />
      </div>

      <div className="bg-card p-3 rounded-lg border flex flex-wrap gap-4 items-center text-xs">
         <div className="flex items-center gap-1.5">
            <label className="text-muted-foreground font-medium">ROAS:</label>
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
                        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('inventory-upload')?.click()}><Upload className="h-4 w-4" /></Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Import from .xlsx</p></TooltipContent>
                </Tooltip>
             </TooltipProvider>
             <input type="file" id="inventory-upload" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload}/>
             <Button onClick={onAddSku} size="sm"><Plus className="h-4 w-4 mr-1" /> Add SKU</Button>
         </div>
      </div>
      
      <div className="bg-card rounded-xl shadow-md border overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
            <Table>
                <TableHeader className="bg-muted/50 uppercase text-[10px] tracking-wide">
                    <TableRow>
                        <TableHead className="w-12">Ch</TableHead>
                        <TableHead className="min-w-[180px]">SKU Name</TableHead>
                        <TableHead className="text-center">Price</TableHead>
                        <TableHead className="text-center">Ship</TableHead>
                        <TableHead className="text-center">Net</TableHead>
                        <TableHead className="text-center bg-primary/10">Stock</TableHead>
                        <TableHead className="text-center">DRR</TableHead>
                        <TableHead className="text-center">Days</TableHead>
                        <TableHead className="text-center bg-accent/10">ROAS</TableHead>
                        <TableHead className="text-center">CVR</TableHead>
                        <TableHead className="text-center">Ret%</TableHead>
                        <TableHead className="text-center">Rating</TableHead>
                        <TableHead className="text-center">Revs</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                    {data.map(item => {
                        const decision = getDecision(item);
                        return (
                            <TableRow key={item.id}>
                                <TableCell><Badge variant="secondary">{item.channel.charAt(0)}</Badge></TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-center">₹{item.price}</TableCell>
                                <TableCell className="text-center text-muted-foreground">₹{item.shipping}</TableCell>
                                <TableCell className="text-center font-mono text-sm">₹{Math.round(item.price - item.shipping - (item.commission||0))}</TableCell>
                                <TableCell className="text-center bg-primary/10 font-bold">{ (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0) }</TableCell>
                                <TableCell className="text-center">{item.drr}</TableCell>
                                <TableCell className={`text-center font-bold ${item.drr > 0 && ((item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0))/item.drr < 5 ? 'text-destructive' : ''}`}>{item.drr > 0 ? `${Math.round(((item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0))/item.drr)}d` : '∞'}</TableCell>
                                <TableCell className="text-center font-bold bg-accent/10">{(item.spend > 0 ? (item.price*item.orders/item.spend) : 0).toFixed(2)}</TableCell>
                                <TableCell className="text-center">{(item.clicks>0?(item.orders/item.clicks)*100:0).toFixed(1)}%</TableCell>
                                <TableCell className="text-center">{(item.orders>0?(item.returns/item.orders)*100:0).toFixed(1)}%</TableCell>
                                <TableCell className="text-center text-amber-500">{'★'.repeat(Math.round(item.rating||0))}</TableCell>
                                <TableCell className="text-center text-muted-foreground">{item.reviews||0}</TableCell>
                                <TableCell className="text-center"><Badge variant={decision.variant} className={decision.className}>{decision.text}</Badge></TableCell>
                                <TableCell><Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" /></Button></TableCell>
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
