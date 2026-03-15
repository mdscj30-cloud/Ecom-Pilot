"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalFilterBar from "../global-filter-bar";
import type { GlobalFilters } from "@/lib/filters";
import { DEFAULT_FILTERS, getChannelGroup, getWarehouseCode, fmtCr, fmtPct, fmtNum, applyDatePreset } from "@/lib/filters";

export interface OrderRow {
  orderItemCode: string;
  sku: string;
  skuName: string;
  channel: string;
  facility: string;
  status: string;
  itemStatus: string;
  cancellationReason?: string;
  sellingPrice: number;
  orderDate: Date;
  invoiceDate?: Date;
  returnDate?: Date;
}

interface CancellationTabProps {
  orders: OrderRow[];
  availableChannels: string[];
}

const COLORS = ["#6366f1","#f43f5e","#10b981","#f59e0b","#3b82f6","#8b5cf6","#ec4899"];

const chartConfig = {
  cancelled: { label: "Cancelled", color: "#f43f5e" },
  total:     { label: "Total",     color: "#6366f1" },
  rate:      { label: "Rate %",    color: "#f59e0b" },
};

export default function CancellationTab({ orders, availableChannels }: CancellationTabProps) {
  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<'rate' | 'count' | 'revenue'>('rate');

  // ── Apply filters ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const { from, to } = applyDatePreset(filters.durationPreset);
    const dateFrom = filters.durationPreset === 'custom' && filters.dateFrom ? new Date(filters.dateFrom) : from;
    const dateTo   = filters.durationPreset === 'custom' && filters.dateTo   ? new Date(filters.dateTo)   : to;

    return orders.filter(o => {
      if (o.orderDate < dateFrom || o.orderDate > dateTo) return false;
      if (filters.channels.length && !filters.channels.includes(o.channel)) return false;
      if (filters.warehouses.length && !filters.warehouses.includes(getWarehouseCode(o.facility))) return false;
      if (filters.skuSearch && !o.sku.toLowerCase().includes(filters.skuSearch.toLowerCase()) &&
          !o.skuName.toLowerCase().includes(filters.skuSearch.toLowerCase())) return false;
      return true;
    });
  }, [orders, filters]);

  const cancelled = filtered.filter(o => o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED');
  const totalOrders = filtered.length;
  const cancelRate = totalOrders > 0 ? (cancelled.length / totalOrders) * 100 : 0;
  const cancelledRevenue = cancelled.reduce((s, o) => s + o.sellingPrice, 0);

  // ── SKU-wise cancellation ────────────────────────────────────────────
  const skuStats = useMemo(() => {
    const map: Record<string, { sku: string; name: string; total: number; cancelled: number; revenue: number; reasons: Record<string, number> }> = {};
    filtered.forEach(o => {
      if (!map[o.sku]) map[o.sku] = { sku: o.sku, name: o.skuName, total: 0, cancelled: 0, revenue: 0, reasons: {} };
      map[o.sku].total++;
      if (o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED') {
        map[o.sku].cancelled++;
        map[o.sku].revenue += o.sellingPrice;
        const reason = o.cancellationReason || 'Unknown';
        map[o.sku].reasons[reason] = (map[o.sku].reasons[reason] || 0) + 1;
      }
    });
    return Object.values(map)
      .map(s => ({ ...s, rate: s.total > 0 ? (s.cancelled / s.total) * 100 : 0 }))
      .filter(s => s.total > 0)
      .sort((a, b) => sortBy === 'rate' ? b.rate - a.rate : sortBy === 'count' ? b.cancelled - a.cancelled : b.revenue - a.revenue)
      .slice(0, 20);
  }, [filtered, sortBy]);

  // ── Platform-wise cancellation ───────────────────────────────────────
  const platformStats = useMemo(() => {
    const map: Record<string, { platform: string; total: number; cancelled: number; revenue: number }> = {};
    filtered.forEach(o => {
      const p = getChannelGroup(o.channel);
      if (!map[p]) map[p] = { platform: p, total: 0, cancelled: 0, revenue: 0 };
      map[p].total++;
      if (o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED') {
        map[p].cancelled++;
        map[p].revenue += o.sellingPrice;
      }
    });
    return Object.values(map).map(p => ({ ...p, rate: p.total > 0 ? (p.cancelled / p.total) * 100 : 0 }))
      .sort((a, b) => b.cancelled - a.cancelled);
  }, [filtered]);

  // ── Warehouse-wise cancellation ──────────────────────────────────────
  const whStats = useMemo(() => {
    const map: Record<string, { wh: string; total: number; cancelled: number }> = {};
    filtered.forEach(o => {
      const wh = getWarehouseCode(o.facility);
      if (!map[wh]) map[wh] = { wh, total: 0, cancelled: 0 };
      map[wh].total++;
      if (o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED') map[wh].cancelled++;
    });
    return Object.values(map).map(w => ({ ...w, rate: w.total > 0 ? (w.cancelled / w.total) * 100 : 0 }));
  }, [filtered]);

  // ── Reason breakdown ─────────────────────────────────────────────────
  const reasonStats = useMemo(() => {
    const map: Record<string, number> = {};
    cancelled.forEach(o => {
      const r = o.cancellationReason || 'Unknown';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 8);
  }, [cancelled]);

  // ── Daily trend ──────────────────────────────────────────────────────
  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; total: number; cancelled: number }> = {};
    filtered.forEach(o => {
      const d = o.orderDate.toISOString().slice(0, 10);
      if (!map[d]) map[d] = { date: d, total: 0, cancelled: 0 };
      map[d].total++;
      if (o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED') map[d].cancelled++;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, rate: d.total > 0 ? +((d.cancelled / d.total) * 100).toFixed(1) : 0 }))
      .slice(-30);
  }, [filtered]);

  const noData = orders.length === 0;

  return (
    <div className="space-y-4">
      <GlobalFilterBar filters={filters} onChange={setFilters} availableChannels={availableChannels} showStatus={false} />

      {noData && (
        <div className="text-center py-16 text-muted-foreground">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No order data loaded. Upload your Sale Orders CSVs from the UC Upload tab.</p>
        </div>
      )}

      {!noData && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Total Orders</CardTitle></CardHeader><CardContent className="px-4 pb-3"><p className="text-2xl font-medium">{fmtNum(totalOrders)}</p></CardContent></Card>
            <Card><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Cancelled</CardTitle></CardHeader><CardContent className="px-4 pb-3"><p className="text-2xl font-medium text-destructive">{fmtNum(cancelled.length)}</p></CardContent></Card>
            <Card><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Cancel Rate</CardTitle></CardHeader><CardContent className="px-4 pb-3"><p className={cn("text-2xl font-medium", cancelRate > 15 ? "text-destructive" : cancelRate > 8 ? "text-amber-600" : "text-green-600")}>{fmtPct(cancelRate)}</p></CardContent></Card>
            <Card><CardHeader className="pb-1 pt-3 px-4"><CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Lost Revenue</CardTitle></CardHeader><CardContent className="px-4 pb-3"><p className="text-2xl font-medium text-destructive">{fmtCr(cancelledRevenue)}</p></CardContent></Card>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform cancellation bar chart */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Cancellations by platform</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                  <BarChart data={platformStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Bar yAxisId="left" dataKey="cancelled" fill="#f43f5e" name="Cancelled" radius={[3,3,0,0]} />
                    <Bar yAxisId="right" dataKey="rate" fill="#f59e0b" name="Rate %" radius={[3,3,0,0]} />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Cancellation reason pie */}
            <Card>
              <CardHeader><CardTitle className="text-sm">Cancellation reasons</CardTitle></CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-48">
                  <PieChart>
                    <Pie data={reasonStats} dataKey="count" nameKey="reason" cx="50%" cy="50%" outerRadius={70} label={({reason, percent}) => `${reason.slice(0,12)} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                      {reasonStats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Daily trend */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Daily cancellation rate trend</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-40">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => [`${v}%`, 'Cancel rate']} labelFormatter={l => `Date: ${l}`} />
                  <Line type="monotone" dataKey="rate" stroke="#f43f5e" dot={false} strokeWidth={2} name="Cancel rate %" />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Warehouse stats */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Warehouse-wise cancellations</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {whStats.map(w => (
                  <div key={w.wh} className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground font-medium">{w.wh}</p>
                    <p className="text-xl font-medium mt-1">{w.cancelled}</p>
                    <p className={cn("text-xs mt-1 font-medium", w.rate > 15 ? "text-destructive" : w.rate > 8 ? "text-amber-600" : "text-green-600")}>
                      {fmtPct(w.rate)} of {fmtNum(w.total)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* SKU Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">SKU-wise cancellation analysis</CardTitle>
                <div className="flex gap-1">
                  {(['rate','count','revenue'] as const).map(s => (
                    <button key={s} onClick={() => setSortBy(s)}
                      className={cn("px-2 py-1 text-xs rounded border", sortBy === s ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                      By {s}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Cancelled</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                      <TableHead className="text-right">Lost Rev</TableHead>
                      <TableHead>Top reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skuStats.map(s => {
                      const topReason = Object.entries(s.reasons).sort((a,b)=>b[1]-a[1])[0]?.[0] || '—';
                      return (
                        <TableRow key={s.sku}>
                          <TableCell><p className="font-medium text-xs">{s.sku}</p><p className="text-xs text-muted-foreground truncate max-w-[160px]">{s.name}</p></TableCell>
                          <TableCell className="text-right text-sm">{s.total}</TableCell>
                          <TableCell className="text-right text-sm text-destructive font-medium">{s.cancelled}</TableCell>
                          <TableCell className="text-right">
                            <span className={cn("text-sm font-medium", s.rate > 15 ? "text-destructive" : s.rate > 8 ? "text-amber-600" : "text-green-600")}>
                              {fmtPct(s.rate)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-sm">{fmtCr(s.revenue)}</TableCell>
                          <TableCell><span className="text-xs text-muted-foreground truncate block max-w-[140px]">{topReason}</span></TableCell>
                        </TableRow>
                      );
                    })}
                    {skuStats.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No data for selected filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
