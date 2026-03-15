"use client";

import React, { useMemo, useState } from "react";
import type { InventoryItem, ProcessedSheetData } from "@/lib/types";
import KpiCard from "../kpi-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { TrendingUp, TrendingDown, Minus, ShoppingBag, Store, Truck, Globe } from "lucide-react";

// ── CHANNEL GROUP CONFIG ───────────────────────────────────────────────────
const CHANNEL_GROUPS = [
  {
    name: "Meesho",
    icon: ShoppingBag,
    color: "text-pink-600",
    bg: "bg-pink-50 dark:bg-pink-950/30",
    border: "border-pink-200 dark:border-pink-800",
    badge: "bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300",
    channels: ["meesho", "meesho_kheda", "meesho_gurgaon", "meesho_kolkata", "meesho_bangalore", "meesho_blr"],
  },
  {
    name: "Flipkart",
    icon: Store,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    channels: ["flipkart", "flipkart_bangalore", "flipkart_gurgaon", "flipkart_kolkata"],
  },
  {
    name: "Jiomart",
    icon: Truck,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-200 dark:border-green-800",
    badge: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    channels: ["jiomart", "jiomart_amour", "jiomart__kolkata", "jiomart amour"],
  },
  {
    name: "RK World",
    icon: Globe,
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-200 dark:border-orange-800",
    badge: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    channels: ["rk_world_", "rk world", "rkworld"],
  },
];

function getGroupForChannel(channel: string): string {
  const c = channel.toLowerCase().trim();
  for (const group of CHANNEL_GROUPS) {
    if (group.channels.some(gc => c.includes(gc) || gc.includes(c))) {
      return group.name;
    }
  }
  return "Other";
}

interface ChannelGroupsTabProps {
  inventoryData: InventoryItem[];
  dailyData: ProcessedSheetData[] | null;
}

export default function ChannelGroupsTab({ inventoryData, dailyData }: ChannelGroupsTabProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  // ── INVENTORY-BASED METRICS ──────────────────────────────────────────────
  const groupStats = useMemo(() => {
    return CHANNEL_GROUPS.map(group => {
      const groupItems = inventoryData.filter(item =>
        getGroupForChannel(item.channel) === group.name
      );

      const totalOrders    = groupItems.reduce((s, i) => s + (i.orders || 0), 0);
      const totalRevenue   = groupItems.reduce((s, i) => s + (i.price * (i.orders || 0)), 0);
      const totalSpend     = groupItems.reduce((s, i) => s + (i.spend || 0), 0);
      const totalStock     = groupItems.reduce((s, i) =>
        s + (i.stock_kol||0) + (i.stock_pith||0) + (i.stock_har||0) + (i.stock_blr||0), 0);
      const totalReturns   = groupItems.reduce((s, i) => s + (i.returns || 0), 0);
      const avgRoas        = totalSpend > 0 ? totalRevenue / totalSpend : 0;
      const returnRate     = totalOrders > 0 ? (totalReturns / totalOrders) * 100 : 0;
      const totalDrr       = groupItems.reduce((s, i) => s + (i.drr || 0), 0);
      const avgCoverDays   = totalDrr > 0 ? totalStock / totalDrr : 999;
      const aov            = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      // Channel-level breakdown
      const channelBreakdown = Array.from(
        groupItems.reduce((map, item) => {
          const ch = item.channel || "Unknown";
          const existing = map.get(ch) || { channel: ch, orders: 0, revenue: 0, spend: 0, stock: 0 };
          existing.orders  += item.orders || 0;
          existing.revenue += item.price * (item.orders || 0);
          existing.spend   += item.spend || 0;
          existing.stock   += (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0);
          map.set(ch, existing);
          return map;
        }, new Map<string, any>()).values()
      ).sort((a, b) => b.revenue - a.revenue);

      return {
        ...group,
        skus: groupItems.length,
        totalOrders,
        totalRevenue,
        totalSpend,
        totalStock,
        totalReturns,
        avgRoas,
        returnRate,
        avgCoverDays,
        aov,
        channelBreakdown,
        hasData: groupItems.length > 0,
      };
    });
  }, [inventoryData]);

  // ── DAILY DATA METRICS ────────────────────────────────────────────────────
  const dailyGroupStats = useMemo(() => {
    if (!dailyData) return null;
    return CHANNEL_GROUPS.map(group => {
      const groupRows = dailyData.filter(row =>
        getGroupForChannel(row.channel) === group.name
      );
      const totalGmv      = groupRows.reduce((s, r) => s + (r.gmv || 0), 0);
      const totalUnits    = groupRows.reduce((s, r) => s + (r.units || 0), 0);
      const totalAds      = groupRows.reduce((s, r) => s + (r.adsSpent || 0), 0);
      const avgTacos      = totalGmv > 0 ? totalAds / totalGmv : 0;
      return { name: group.name, totalGmv, totalUnits, totalAds, avgTacos };
    });
  }, [dailyData]);

  // ── GLOBAL KPIs ───────────────────────────────────────────────────────────
  const totalRevenue = groupStats.reduce((s, g) => s + g.totalRevenue, 0);
  const totalOrders  = groupStats.reduce((s, g) => s + g.totalOrders, 0);
  const totalSpend   = groupStats.reduce((s, g) => s + g.totalSpend, 0);
  const totalStock   = groupStats.reduce((s, g) => s + g.totalStock, 0);

  const fmtCr = (n: number) => n >= 1e7 ? `₹${(n/1e7).toFixed(2)}Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(1)}L` : `₹${n.toLocaleString('en-IN')}`;
  const fmtPct = (n: number) => `${n.toFixed(1)}%`;

  const selectedGroupData = groupStats.find(g => g.name === selectedGroup);

  return (
    <div className="space-y-6">
      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Revenue" value={fmtCr(totalRevenue)} />
        <KpiCard title="Total Orders" value={totalOrders.toLocaleString('en-IN')} />
        <KpiCard title="Total Ad Spend" value={fmtCr(totalSpend)} />
        <KpiCard title="Total Stock" value={totalStock.toLocaleString('en-IN')} />
      </div>

      {/* Group Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {groupStats.map(group => {
          const Icon = group.icon;
          const shareOfRevenue = totalRevenue > 0 ? (group.totalRevenue / totalRevenue) * 100 : 0;
          const dailyStat = dailyGroupStats?.find(d => d.name === group.name);
          const isSelected = selectedGroup === group.name;

          return (
            <Card
              key={group.name}
              className={cn(
                "cursor-pointer transition-all duration-200 hover:shadow-md border-2",
                group.bg, group.border,
                isSelected && "ring-2 ring-offset-2 ring-primary shadow-lg"
              )}
              onClick={() => setSelectedGroup(isSelected ? null : group.name)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-5 h-5", group.color)} />
                    <CardTitle className="text-sm font-bold">{group.name}</CardTitle>
                  </div>
                  <Badge className={cn("text-xs font-semibold", group.badge)}>
                    {fmtPct(shareOfRevenue)} share
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className={cn("text-lg font-bold", group.color)}>{fmtCr(group.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="text-lg font-bold">{group.totalOrders.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">AOV</p>
                    <p className="text-sm font-semibold">₹{Math.round(group.aov).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className={cn("text-sm font-semibold", group.avgRoas >= 2 ? "text-green-600" : group.avgRoas >= 1 ? "text-amber-600" : "text-red-600")}>
                      {group.avgRoas.toFixed(2)}x
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Return Rate</p>
                    <p className={cn("text-sm font-semibold", group.returnRate < 10 ? "text-green-600" : group.returnRate < 20 ? "text-amber-600" : "text-red-600")}>
                      {fmtPct(group.returnRate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Cover Days</p>
                    <p className={cn("text-sm font-semibold",
                      group.avgCoverDays < 7 ? "text-red-600" :
                      group.avgCoverDays < 14 ? "text-amber-600" : "text-green-600"
                    )}>
                      {group.avgCoverDays === 999 ? "∞" : `${Math.round(group.avgCoverDays)}d`}
                    </p>
                  </div>
                </div>

                {/* Revenue share bar */}
                <div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", group.color.replace("text-", "bg-"))}
                      style={{ width: `${Math.min(shareOfRevenue, 100)}%` }}
                    />
                  </div>
                </div>

                {/* SKUs count */}
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{group.skus} SKUs</span>
                  <span>{group.channelBreakdown.length} channels</span>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  {isSelected ? "▲ Click to collapse" : "▼ Click for channel breakdown"}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Channel Breakdown Drill-down */}
      {selectedGroupData && (
        <Card className={cn("border-2", selectedGroupData.border, selectedGroupData.bg)}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <selectedGroupData.icon className={cn("w-5 h-5", selectedGroupData.color)} />
              {selectedGroupData.name} — Channel Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Channel</TableHead>
                  <TableHead className="text-right">Orders</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedGroupData.channelBreakdown.map(ch => {
                  const roas = ch.spend > 0 ? ch.revenue / ch.spend : 0;
                  const share = selectedGroupData.totalRevenue > 0 ? (ch.revenue / selectedGroupData.totalRevenue) * 100 : 0;
                  return (
                    <TableRow key={ch.channel}>
                      <TableCell className="font-medium">{ch.channel}</TableCell>
                      <TableCell className="text-right">{ch.orders.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{fmtCr(ch.revenue)}</TableCell>
                      <TableCell className="text-right">{fmtCr(ch.spend)}</TableCell>
                      <TableCell className={cn("text-right font-semibold",
                        roas >= 2 ? "text-green-600" : roas >= 1 ? "text-amber-600" : "text-red-600"
                      )}>{roas.toFixed(2)}x</TableCell>
                      <TableCell className="text-right">{ch.stock.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={cn("h-full rounded-full", selectedGroupData.color.replace("text-", "bg-"))}
                              style={{ width: `${share}%` }} />
                          </div>
                          <span className="text-xs">{share.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Daily P&L Group Summary */}
      {dailyGroupStats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-bold">Daily P&L by Channel Group</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Group</TableHead>
                  <TableHead className="text-right">Total GMV</TableHead>
                  <TableHead className="text-right">Total Units</TableHead>
                  <TableHead className="text-right">Ad Spend</TableHead>
                  <TableHead className="text-right">TACOS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dailyGroupStats.map(d => (
                  <TableRow key={d.name}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell className="text-right">{fmtCr(d.totalGmv)}</TableCell>
                    <TableCell className="text-right">{d.totalUnits.toLocaleString()}</TableCell>
                    <TableCell className="text-right">{fmtCr(d.totalAds)}</TableCell>
                    <TableCell className={cn("text-right font-semibold",
                      d.avgTacos < 0.15 ? "text-green-600" : d.avgTacos < 0.25 ? "text-amber-600" : "text-red-600"
                    )}>{(d.avgTacos * 100).toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {inventoryData.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-sm">No inventory data loaded.</p>
          <p className="text-xs mt-1">Upload your inventory sheet from the Daily Ops tab to see channel group KPIs.</p>
        </div>
      )}
    </div>
  );
}
