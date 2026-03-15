"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import GlobalFilterBar from "../global-filter-bar";
import type { GlobalFilters } from "@/lib/filters";
import { DEFAULT_FILTERS, getChannelGroup, fmtCr, fmtPct, fmtNum, applyDatePreset } from "@/lib/filters";
import type { OrderRow } from "./cancellation-tab";

const PLATFORM_COLORS: Record<string, string> = {
  Meesho:   "#D4537E",
  Flipkart: "#378ADD",
  Jiomart:  "#639922",
  "RK World": "#BA7517",
  Other:    "#888780",
};

const chartConfig = {
  Meesho:   { label: "Meesho",   color: "#D4537E" },
  Flipkart: { label: "Flipkart", color: "#378ADD" },
  Jiomart:  { label: "Jiomart",  color: "#639922" },
  "RK World": { label: "RK World", color: "#BA7517" },
};

interface PlatformComparisonTabProps {
  orders: OrderRow[];
  availableChannels: string[];
}

export default function PlatformComparisonTab({ orders, availableChannels }: PlatformComparisonTabProps) {
  const [filters, setFilters] = useState<GlobalFilters>(DEFAULT_FILTERS);
  const [metric, setMetric] = useState<'orders' | 'revenue' | 'cancelRate' | 'aov'>('revenue');

  const filtered = useMemo(() => {
    const { from, to } = applyDatePreset(filters.durationPreset);
    const dateFrom = filters.durationPreset === 'custom' && filters.dateFrom ? new Date(filters.dateFrom) : from;
    const dateTo   = filters.durationPreset === 'custom' && filters.dateTo   ? new Date(filters.dateTo)   : to;
    return orders.filter(o => {
      if (o.orderDate < dateFrom || o.orderDate > dateTo) return false;
      if (filters.skuSearch && !o.sku.toLowerCase().includes(filters.skuSearch.toLowerCase())) return false;
      return true;
    });
  }, [orders, filters]);

  // ── Platform stats ───────────────────────────────────────────────────
  const platformStats = useMemo(() => {
    const map: Record<string, {
      platform: string; orders: number; cancelled: number; returned: number;
      revenue: number; adSpend: number;
      skus: Set<string>; channels: Set<string>;
    }> = {};

    filtered.forEach(o => {
      const p = getChannelGroup(o.channel);
      if (!map[p]) map[p] = { platform: p, orders: 0, cancelled: 0, returned: 0, revenue: 0, adSpend: 0, skus: new Set(), channels: new Set() };
      map[p].orders++;
      map[p].revenue += o.sellingPrice;
      map[p].skus.add(o.sku);
      map[p].channels.add(o.channel);
      if (o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED') map[p].cancelled++;
      if (o.status === 'RETURN' || o.itemStatus === 'RETURN' || o.returnDate) map[p].returned++;
    });

    const totalOrders  = filtered.length;
    const totalRevenue = filtered.reduce((s, o) => s + o.sellingPrice, 0);

    return Object.values(map).map(p => ({
      ...p,
      skus:       p.skus.size,
      channels:   p.channels.size,
      aov:        p.orders > 0 ? p.revenue / p.orders : 0,
      cancelRate: p.orders > 0 ? (p.cancelled / p.orders) * 100 : 0,
      returnRate: p.orders > 0 ? (p.returned  / p.orders) * 100 : 0,
      revenueShare: totalRevenue > 0 ? (p.revenue / totalRevenue) * 100 : 0,
      orderShare:   totalOrders  > 0 ? (p.orders  / totalOrders)  * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  // ── Daily trend by platform ──────────────────────────────────────────
  const dailyTrend = useMemo(() => {
    const map: Record<string, Record<string, { orders: number; revenue: number }>> = {};
    filtered.forEach(o => {
      const d = o.orderDate.toISOString().slice(0, 10);
      const p = getChannelGroup(o.channel);
      if (!map[d]) map[d] = {};
      if (!map[d][p]) map[d][p] = { orders: 0, revenue: 0 };
      map[d][p].orders++;
      map[d][p].revenue += o.sellingPrice;
    });
    const platforms = ['Meesho','Flipkart','Jiomart','RK World'];
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, pData]) => ({
        date: date.slice(5),
        ...Object.fromEntries(platforms.map(p => [p, metric === 'revenue' ? Math.round(pData[p]?.revenue || 0) : pData[p]?.orders || 0]))
      }))
      .slice(-30);
  }, [filtered, metric]);

  // ── SKU cross-platform performance ──────────────────────────────────
  const skuCrossPerf = useMemo(() => {
    const map: Record<string, { sku: string; [platform: string]: any }> = {};
    filtered.forEach(o => {
      const p = getChannelGroup(o.channel);
      if (!map[o.sku]) map[o.sku] = { sku: o.sku };
      if (!map[o.sku][p]) map[o.sku][p] = { orders: 0, revenue: 0, cancelled: 0 };
      map[o.sku][p].orders++;
      map[o.sku][p].revenue += o.sellingPrice;
      if (o.itemStatus === 'CANCELLED') map[o.sku][p].cancelled++;
    });
    return Object.values(map)
      .filter(s => Object.keys(s).length > 2) // appears on multiple platforms
      .sort((a, b) => {
        const aTotal = ['Meesho','Flipkart','Jiomart','RK World'].reduce((s, p) => s + (a[p]?.revenue || 0), 0);
        const bTotal = ['Meesho','Flipkart','Jiomart','RK World'].reduce((s, p) => s + (b[p]?.revenue || 0), 0);
        return bTotal - aTotal;
      })
      .slice(0, 15);
  }, [filtered]);

  const platforms = ['Meesho','Flipkart','Jiomart','RK World'];
  const totalRevenue = platformStats.reduce((s, p) => s + p.revenue, 0);

  return (
    <div className="space-y-4">
      <GlobalFilterBar filters={filters} onChange={setFilters} availableChannels={availableChannels} showStatus={false} showWarehouse={false} />

      {orders.length === 0 && (
        <div className="text-center py-16 text-muted-foreground text-sm">No order data. Upload Sale Orders CSVs first.</div>
      )}

      {orders.length > 0 && (
        <>
          {/* Platform KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {platformStats.map(p => (
              <Card key={p.platform} style={{ borderTop: `3px solid ${PLATFORM_COLORS[p.platform] || '#888'}` }}>
                <CardHeader className="pb-1 pt-3 px-4">
                  <CardTitle className="text-sm font-medium" style={{ color: PLATFORM_COLORS[p.platform] }}>{p.platform}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-1">
                  <p className="text-xl font-medium">{fmtCr(p.revenue)}</p>
                  <p className="text-xs text-muted-foreground">{fmtNum(p.orders)} orders · AOV ₹{Math.round(p.aov)}</p>
                  <div className="flex gap-2 text-xs flex-wrap">
                    <span className={cn("font-medium", p.cancelRate > 15 ? "text-destructive" : p.cancelRate > 8 ? "text-amber-600" : "text-green-600")}>
                      Cancel {fmtPct(p.cancelRate)}
                    </span>
                    <span className="text-muted-foreground">{p.skus} SKUs</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${p.revenueShare}%`, background: PLATFORM_COLORS[p.platform] }} />
                  </div>
                  <p className="text-xs text-muted-foreground">{fmtPct(p.revenueShare)} revenue share</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Metric selector + trend chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-sm">Platform trend (last 30 days)</CardTitle>
                <div className="flex gap-1">
                  {(['revenue','orders'] as const).map(m => (
                    <button key={m} onClick={() => setMetric(m)}
                      className={cn("px-2.5 py-1 text-xs rounded border", metric === m ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>
                      {m === 'revenue' ? 'Revenue' : 'Orders'}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-52">
                <LineChart data={dailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => metric === 'revenue' ? fmtCr(v).replace('₹','') : String(v)} />
                  <Tooltip formatter={(v: number, name) => [metric === 'revenue' ? fmtCr(v) : fmtNum(v), name]} />
                  <Legend />
                  {platforms.map(p => (
                    <Line key={p} type="monotone" dataKey={p} stroke={PLATFORM_COLORS[p]} dot={false} strokeWidth={2} />
                  ))}
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Side-by-side comparison bar */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Platform comparison — key metrics</CardTitle></CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-52">
                <BarChart data={platformStats.map(p => ({
                  platform: p.platform,
                  'Cancel rate': +p.cancelRate.toFixed(1),
                  'Return rate': +p.returnRate.toFixed(1),
                  'Revenue share': +p.revenueShare.toFixed(1),
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="platform" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v: number) => [`${v}%`]} />
                  <Legend />
                  <Bar dataKey="Cancel rate"    fill="#f43f5e" radius={[3,3,0,0]} />
                  <Bar dataKey="Return rate"    fill="#f59e0b" radius={[3,3,0,0]} />
                  <Bar dataKey="Revenue share"  fill="#6366f1" radius={[3,3,0,0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* SKU cross-platform table */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Top SKUs — cross-platform performance</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">SKU</TableHead>
                      {platforms.map(p => (
                        <TableHead key={p} className="text-right" style={{ color: PLATFORM_COLORS[p] }}>{p}</TableHead>
                      ))}
                      <TableHead className="text-right">Total rev</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {skuCrossPerf.map(s => {
                      const totalRev = platforms.reduce((sum, p) => sum + (s[p]?.revenue || 0), 0);
                      return (
                        <TableRow key={s.sku}>
                          <TableCell className="font-medium text-xs">{s.sku}</TableCell>
                          {platforms.map(p => (
                            <TableCell key={p} className="text-right text-xs">
                              {s[p] ? (
                                <div>
                                  <div className="font-medium">{fmtCr(s[p].revenue)}</div>
                                  <div className="text-muted-foreground">{s[p].orders} ord</div>
                                </div>
                              ) : <span className="text-muted-foreground/40">—</span>}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-medium text-xs">{fmtCr(totalRev)}</TableCell>
                        </TableRow>
                      );
                    })}
                    {skuCrossPerf.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm py-8">No cross-platform SKU data</TableCell></TableRow>
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
