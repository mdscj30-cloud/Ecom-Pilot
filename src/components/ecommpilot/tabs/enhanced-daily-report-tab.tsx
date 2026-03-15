"use client";

import React, { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { useToast } from "@/hooks/use-toast";
import { Send, Loader2, AlertTriangle, Package, TrendingUp, Ban, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InventoryItem } from "@/lib/types";
import type { OrderRow } from "./cancellation-tab";
import { getChannelGroup, getWarehouseCode, fmtCr, fmtPct, fmtNum, applyDatePreset, WAREHOUSES } from "@/lib/filters";
import { format, subDays, differenceInDays } from "date-fns";

const RECIPIENT = "mdscj30@gmail.com";
const COLORS = ["#6366f1","#f43f5e","#10b981","#f59e0b","#3b82f6","#8b5cf6"];

const CHANNEL_COLORS: Record<string, string> = {
  Meesho: "#D4537E", Flipkart: "#378ADD", Jiomart: "#639922", "RK World": "#BA7517",
};

interface EnhancedDailyReportTabProps {
  inventoryData: InventoryItem[];
  orders: OrderRow[];
  oosDays: number;
  onOosDaysChange: (days: number) => void;
}

export default function EnhancedDailyReportTab({ inventoryData, orders, oosDays, onOosDaysChange }: EnhancedDailyReportTabProps) {
  const { toast } = useToast();
  const [sending, setSending]   = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [duration, setDuration] = useState<'7d'|'30d'|'90d'>('30d');

  // ── Date range for orders ─────────────────────────────────────────────
  const { from: dateFrom, to: dateTo } = applyDatePreset(duration);
  const filteredOrders = useMemo(() =>
    orders.filter(o => o.orderDate >= dateFrom && o.orderDate <= dateTo),
  [orders, duration]);

  // ── KPIs ──────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total      = filteredOrders.length;
    const cancelled  = filteredOrders.filter(o => o.itemStatus === 'CANCELLED' || o.status === 'CANCELLED').length;
    const returned   = filteredOrders.filter(o => o.status === 'RETURN' || o.returnDate != null).length;
    const dispatched = filteredOrders.filter(o => o.itemStatus === 'DISPATCHED' || o.status === 'DISPATCHED').length;
    const revenue    = filteredOrders.reduce((s, o) => s + o.sellingPrice, 0);
    const aov        = total > 0 ? revenue / total : 0;
    return { total, cancelled, returned, dispatched, revenue, aov, cancelRate: total > 0 ? cancelled/total*100 : 0, returnRate: total > 0 ? returned/total*100 : 0, fulfilRate: total > 0 ? dispatched/total*100 : 0 };
  }, [filteredOrders]);

  // ── Warehouse-wise low stock ──────────────────────────────────────────
  const whLowStock = useMemo(() => {
    return WAREHOUSES.map(wh => {
      const items = inventoryData.map(item => {
        const stock = item[`stock_${wh.code.toLowerCase()}` as keyof InventoryItem] as number || 0;
        const drr   = item[`drr_${wh.code.toLowerCase()}` as keyof InventoryItem] as number || 0;
        const cover = drr > 0 ? stock / drr : 999;
        return { name: item.name, sku: item.name, stock, drr, cover: Math.round(cover) };
      }).filter(i => i.drr > 0 && i.cover < 14).sort((a, b) => a.cover - b.cover).slice(0, 5);
      return { warehouse: wh.label, code: wh.code, items, critical: items.filter(i => i.cover < 5).length };
    });
  }, [inventoryData]);

  // ── Out of stock tracker (last X days with no orders) ─────────────────
  const oosSkus = useMemo(() => {
    const cutoff = subDays(new Date(), oosDays);
    const recentOrders = orders.filter(o => o.orderDate >= cutoff);
    const skusWithOrders = new Set(recentOrders.map(o => o.sku));
    return inventoryData
      .filter(item => !skusWithOrders.has(item.name) && item.drr > 0)
      .map(item => {
        const totalStock = (item.stock_kol||0)+(item.stock_pith||0)+(item.stock_har||0)+(item.stock_blr||0);
        const lastOrder = orders.filter(o => o.sku === item.name).sort((a,b) => b.orderDate.getTime() - a.orderDate.getTime())[0];
        return { sku: item.name, totalStock, drr: item.drr, daysSinceOrder: lastOrder ? differenceInDays(new Date(), lastOrder.orderDate) : 999, lastOrderDate: lastOrder?.orderDate };
      })
      .sort((a, b) => b.daysSinceOrder - a.daysSinceOrder)
      .slice(0, 20);
  }, [inventoryData, orders, oosDays]);

  // ── Channel group performance ─────────────────────────────────────────
  const channelPerf = useMemo(() => {
    const map: Record<string, { orders: number; revenue: number; cancelled: number; returned: number }> = {};
    filteredOrders.forEach(o => {
      const g = getChannelGroup(o.channel);
      if (!map[g]) map[g] = { orders: 0, revenue: 0, cancelled: 0, returned: 0 };
      map[g].orders++;
      map[g].revenue += o.sellingPrice;
      if (o.itemStatus === 'CANCELLED') map[g].cancelled++;
      if (o.returnDate) map[g].returned++;
    });
    return Object.entries(map).map(([platform, d]) => ({
      platform, ...d,
      aov: d.orders > 0 ? d.revenue / d.orders : 0,
      cancelRate: d.orders > 0 ? d.cancelled / d.orders * 100 : 0,
    })).sort((a, b) => b.revenue - a.revenue);
  }, [filteredOrders]);

  // ── SKU revenue per channel (top 10) ──────────────────────────────────
  const skuChannelPerf = useMemo(() => {
    const map: Record<string, { sku: string; [ch: string]: any }> = {};
    filteredOrders.forEach(o => {
      const g = getChannelGroup(o.channel);
      if (!map[o.sku]) map[o.sku] = { sku: o.sku, total: 0 };
      if (!map[o.sku][g]) map[o.sku][g] = { orders: 0, revenue: 0 };
      map[o.sku][g].orders++;
      map[o.sku][g].revenue += o.sellingPrice;
      map[o.sku].total += o.sellingPrice;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [filteredOrders]);

  // ── Daily trend ────────────────────────────────────────────────────────
  const dailyTrend = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; orders: number; cancelled: number }> = {};
    filteredOrders.forEach(o => {
      const d = o.orderDate.toISOString().slice(0,10);
      if (!map[d]) map[d] = { date: d.slice(5), revenue: 0, orders: 0, cancelled: 0 };
      map[d].revenue += o.sellingPrice;
      map[d].orders++;
      if (o.itemStatus === 'CANCELLED') map[d].cancelled++;
    });
    return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  // ── Return analysis by platform + SKU ────────────────────────────────
  const returnStats = useMemo(() => {
    const platforms: Record<string, { returned: number; total: number }> = {};
    const skus: Record<string, { returned: number; total: number; revenue: number }> = {};
    filteredOrders.forEach(o => {
      const p = getChannelGroup(o.channel);
      if (!platforms[p]) platforms[p] = { returned: 0, total: 0 };
      platforms[p].total++;
      if (o.returnDate) platforms[p].returned++;

      if (!skus[o.sku]) skus[o.sku] = { returned: 0, total: 0, revenue: 0 };
      skus[o.sku].total++;
      if (o.returnDate) { skus[o.sku].returned++; skus[o.sku].revenue += o.sellingPrice; }
    });
    return {
      byPlatform: Object.entries(platforms).map(([p, d]) => ({ platform: p, ...d, rate: d.total > 0 ? d.returned/d.total*100 : 0 })).sort((a,b) => b.returned - a.returned),
      bySku: Object.entries(skus).map(([sku, d]) => ({ sku, ...d, rate: d.total > 0 ? d.returned/d.total*100 : 0 })).filter(s => s.returned > 0).sort((a,b) => b.rate - a.rate).slice(0, 10),
    };
  }, [filteredOrders]);

  // ── Build email HTML ──────────────────────────────────────────────────
  const buildHtml = () => {
    const today = format(new Date(), "dd MMM yyyy, EEEE");
    const durationLabel = duration === '7d' ? 'Last 7 days' : duration === '90d' ? 'Last 90 days' : 'Last 30 days';
    const allLowStock = whLowStock.flatMap(wh => wh.items.map(i => ({ ...i, warehouse: wh.warehouse })));
    const criticalItems = allLowStock.filter(i => i.cover < 7).sort((a,b) => a.cover - b.cover).slice(0,8);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
body{font-family:Arial,sans-serif;background:#f5f5f5;margin:0;padding:20px}
.wrap{max-width:650px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden}
.hdr{background:#6366f1;color:#fff;padding:20px 24px}.hdr h1{margin:0;font-size:19px}.hdr p{margin:4px 0 0;font-size:12px;opacity:.85}
.sec{padding:18px 24px;border-bottom:1px solid #f0f0f0}.sec h2{margin:0 0 10px;font-size:13px;font-weight:700;color:#374151;text-transform:uppercase;letter-spacing:.05em}
.kgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.kcard{background:#f8fafc;border-radius:6px;padding:10px;text-align:center}.kcard .kl{font-size:10px;color:#6b7280;font-weight:600;text-transform:uppercase}.kcard .kv{font-size:17px;font-weight:700;color:#111;margin-top:3px}
.kv.red{color:#dc2626}.kv.grn{color:#16a34a}.kv.amb{color:#d97706}
table{width:100%;border-collapse:collapse;font-size:12px}th{background:#f8fafc;padding:7px 9px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase}td{padding:7px 9px;border-bottom:1px solid #f0f0f0}
.badge-r{background:#fee2e2;color:#dc2626;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700}
.badge-a{background:#fef3c7;color:#d97706;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700}
.badge-g{background:#dcfce7;color:#16a34a;padding:1px 6px;border-radius:4px;font-size:11px;font-weight:700}
.footer{padding:14px 24px;text-align:center;font-size:11px;color:#9ca3af;background:#fafafa}
</style></head><body><div class="wrap">
<div class="hdr"><h1>Amour Hygiene Daily Report</h1><p>${today} · ${durationLabel}</p></div>
<div class="sec"><h2>Overall performance</h2><div class="kgrid">
<div class="kcard"><div class="kl">Revenue</div><div class="kv">${fmtCr(kpis.revenue)}</div></div>
<div class="kcard"><div class="kl">Orders</div><div class="kv">${fmtNum(kpis.total)}</div></div>
<div class="kcard"><div class="kl">AOV</div><div class="kv">₹${Math.round(kpis.aov)}</div></div>
<div class="kcard"><div class="kl">Cancel rate</div><div class="kv ${kpis.cancelRate>15?'red':kpis.cancelRate>8?'amb':'grn'}">${fmtPct(kpis.cancelRate)}</div></div>
<div class="kcard"><div class="kl">Return rate</div><div class="kv ${kpis.returnRate>10?'red':kpis.returnRate>5?'amb':'grn'}">${fmtPct(kpis.returnRate)}</div></div>
<div class="kcard"><div class="kl">Fulfilment</div><div class="kv ${kpis.fulfilRate>80?'grn':kpis.fulfilRate>60?'amb':'red'}">${fmtPct(kpis.fulfilRate)}</div></div>
</div></div>

<div class="sec"><h2>Channel group performance</h2><table>
<tr><th>Platform</th><th>Orders</th><th>Revenue</th><th>AOV</th><th>Cancel</th></tr>
${channelPerf.map(p=>`<tr><td><b>${p.platform}</b></td><td>${fmtNum(p.orders)}</td><td>${fmtCr(p.revenue)}</td><td>₹${Math.round(p.aov)}</td><td><span class="${p.cancelRate>15?'badge-r':p.cancelRate>8?'badge-a':'badge-g'}">${fmtPct(p.cancelRate)}</span></td></tr>`).join('')}
</table></div>

${criticalItems.length > 0 ? `<div class="sec"><h2>Low stock alerts (by warehouse)</h2><table>
<tr><th>SKU</th><th>WH</th><th>Stock</th><th>DRR</th><th>Days cover</th></tr>
${criticalItems.map(i=>`<tr><td>${i.name}</td><td>${i.warehouse}</td><td>${i.stock}</td><td>${i.drr.toFixed(1)}</td><td><span class="${i.cover<3?'badge-r':'badge-a'}">${i.cover}d</span></td></tr>`).join('')}
</table></div>` : ''}

${oosSkus.length > 0 ? `<div class="sec"><h2>Out of stock (no orders in last ${oosDays} days)</h2><table>
<tr><th>SKU</th><th>Stock</th><th>Days since order</th></tr>
${oosSkus.slice(0,5).map(s=>`<tr><td>${s.sku}</td><td>${s.totalStock}</td><td><span class="badge-r">${s.daysSinceOrder === 999 ? 'Never' : s.daysSinceOrder + 'd'}</span></td></tr>`).join('')}
</table></div>` : ''}

<div class="sec"><h2>Returns analysis by platform</h2><table>
<tr><th>Platform</th><th>Returns</th><th>Return rate</th></tr>
${returnStats.byPlatform.map(p=>`<tr><td>${p.platform}</td><td>${p.returned}</td><td><span class="${p.rate>10?'badge-r':p.rate>5?'badge-a':'badge-g'}">${fmtPct(p.rate)}</span></td></tr>`).join('')}
</table></div>

<div class="sec"><h2>Top SKUs by revenue</h2><table>
<tr><th>SKU</th><th>Revenue</th><th>Orders</th></tr>
${skuChannelPerf.slice(0,5).map(s=>`<tr><td>${s.sku}</td><td>${fmtCr(s.total)}</td><td>${['Meesho','Flipkart','Jiomart','RK World'].reduce((sum,p)=>sum+(s[p]?.orders||0),0)}</td></tr>`).join('')}
</table></div>
<div class="footer">EcommPilot · Amour Hygiene · ${today}</div>
</div></body></html>`;
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/send-report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: RECIPIENT, subject: `Amour Daily Report — ${format(new Date(),"dd MMM yyyy")}`, html: buildHtml() }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      setLastSent(format(new Date(), "dd MMM, HH:mm"));
      toast({ title: "Report sent!", description: `Emailed to ${RECIPIENT}` });
    } catch(e) {
      toast({ variant: "destructive", title: "Send failed", description: String(e) });
    } finally { setSending(false); }
  };

  return (
    <div className="space-y-4">
      {/* Duration selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">Duration:</span>
        {(['7d','30d','90d'] as const).map(d => (
          <button key={d} onClick={() => setDuration(d)}
            className={cn("px-3 py-1.5 text-xs rounded-md border transition-colors",
              duration === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted bg-background text-muted-foreground"
            )}>{d === '7d' ? 'Last 7 days' : d === '90d' ? 'Last 90 days' : 'Last 30 days'}</button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {lastSent && <span className="text-xs text-green-600">Last sent: {lastSent}</span>}
          <Button size="sm" onClick={handleSend} disabled={sending || inventoryData.length === 0}>
            {sending ? <><Loader2 className="w-3 h-3 mr-1 animate-spin"/>Sending...</> : <><Send className="w-3 h-3 mr-1"/>Send report</>}
          </Button>
        </div>
      </div>

      {/* Global KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: "Revenue", value: fmtCr(kpis.revenue), color: "" },
          { label: "Orders", value: fmtNum(kpis.total), color: "" },
          { label: "AOV", value: `₹${Math.round(kpis.aov)}`, color: "" },
          { label: "Cancel rate", value: fmtPct(kpis.cancelRate), color: kpis.cancelRate > 15 ? "text-destructive" : kpis.cancelRate > 8 ? "text-amber-600" : "text-green-600" },
          { label: "Return rate", value: fmtPct(kpis.returnRate), color: kpis.returnRate > 10 ? "text-destructive" : kpis.returnRate > 5 ? "text-amber-600" : "text-green-600" },
          { label: "Fulfilment", value: fmtPct(kpis.fulfilRate), color: kpis.fulfilRate > 80 ? "text-green-600" : kpis.fulfilRate > 60 ? "text-amber-600" : "text-destructive" },
        ].map(k => (
          <div key={k.label} className="bg-muted/50 rounded-lg p-3">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{k.label}</p>
            <p className={cn("text-xl font-medium mt-1", k.color)}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Daily trend chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Daily revenue + cancellations</CardTitle></CardHeader>
        <CardContent>
          <ChartContainer config={{ revenue: { label: "Revenue", color: "#6366f1" }, cancelled: { label: "Cancelled", color: "#f43f5e" } }} className="h-44">
            <BarChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 10 }} tickFormatter={v => fmtCr(v).replace('₹','')} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: number, name) => [name === 'Revenue' ? fmtCr(v) : v, name]} />
              <Legend />
              <Bar yAxisId="left"  dataKey="revenue"   fill="#6366f1" name="Revenue"   radius={[2,2,0,0]} />
              <Bar yAxisId="right" dataKey="cancelled" fill="#f43f5e" name="Cancelled" radius={[2,2,0,0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Channel group + Return analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Channel group performance</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {channelPerf.map(p => (
              <div key={p.platform} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHANNEL_COLORS[p.platform] || "#888" }} />
                  <span className="text-sm font-medium">{p.platform}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-right">
                  <div><div className="text-muted-foreground">Orders</div><div className="font-medium">{fmtNum(p.orders)}</div></div>
                  <div><div className="text-muted-foreground">Revenue</div><div className="font-medium">{fmtCr(p.revenue)}</div></div>
                  <div><div className="text-muted-foreground">Cancel</div><div className={cn("font-medium", p.cancelRate > 15 ? "text-destructive" : p.cancelRate > 8 ? "text-amber-600" : "text-green-600")}>{fmtPct(p.cancelRate)}</div></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Returns by platform</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {returnStats.byPlatform.map(p => (
              <div key={p.platform} className="flex items-center justify-between py-1.5 border-b last:border-0">
                <span className="text-sm font-medium">{p.platform}</span>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-muted-foreground">{p.returned} returns</span>
                  <Badge variant={p.rate > 10 ? "destructive" : "secondary"} className="text-xs">{fmtPct(p.rate)}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Warehouse-wise low stock */}
      <Card>
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-amber-500" /> Warehouse-wise low stock alerts</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {whLowStock.map(wh => (
              <div key={wh.code}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{wh.warehouse}</p>
                  {wh.critical > 0 && <Badge variant="destructive" className="text-xs">{wh.critical} critical</Badge>}
                </div>
                <div className="space-y-1.5">
                  {wh.items.length === 0 && <p className="text-xs text-green-600">All good</p>}
                  {wh.items.map(item => (
                    <div key={item.name} className={cn("flex items-center justify-between rounded px-2 py-1.5 text-xs",
                      item.cover < 5 ? "bg-red-50 dark:bg-red-950/20" : "bg-amber-50 dark:bg-amber-950/20"
                    )}>
                      <span className="truncate max-w-[100px] font-medium">{item.name}</span>
                      <span className={cn("font-semibold shrink-0 ml-1", item.cover < 5 ? "text-destructive" : "text-amber-600")}>
                        {item.cover}d
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Out of Stock tracker */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> Out of stock tracker</CardTitle>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">No orders in last</span>
              {[7, 14, 30].map(d => (
                <button key={d} onClick={() => onOosDaysChange(d)}
                  className={cn("px-2.5 py-1 rounded border text-xs", oosDays === d ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted")}>{d}d</button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {oosSkus.length === 0
            ? <p className="text-sm text-center text-green-600 py-6">No out-of-stock SKUs in the last {oosDays} days</p>
            : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Total stock</TableHead>
                    <TableHead className="text-right">DRR</TableHead>
                    <TableHead className="text-right">Days since order</TableHead>
                    <TableHead>Last order date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {oosSkus.map(s => (
                    <TableRow key={s.sku}>
                      <TableCell className="font-medium text-xs">{s.sku}</TableCell>
                      <TableCell className="text-right text-xs">{fmtNum(s.totalStock)}</TableCell>
                      <TableCell className="text-right text-xs">{s.drr.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-xs">{s.daysSinceOrder === 999 ? "Never" : `${s.daysSinceOrder}d`}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{s.lastOrderDate ? format(s.lastOrderDate, "dd MMM yyyy") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )
          }
        </CardContent>
      </Card>

      {/* SKU Revenue per channel */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Revenue per SKU per channel (top 10)</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-right" style={{ color: CHANNEL_COLORS.Meesho }}>Meesho</TableHead>
                  <TableHead className="text-right" style={{ color: CHANNEL_COLORS.Flipkart }}>Flipkart</TableHead>
                  <TableHead className="text-right" style={{ color: CHANNEL_COLORS.Jiomart }}>Jiomart</TableHead>
                  <TableHead className="text-right" style={{ color: CHANNEL_COLORS["RK World"] }}>RK World</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {skuChannelPerf.map(s => (
                  <TableRow key={s.sku}>
                    <TableCell className="font-medium text-xs">{s.sku}</TableCell>
                    {['Meesho','Flipkart','Jiomart','RK World'].map(p => (
                      <TableCell key={p} className="text-right text-xs">
                        {s[p] ? <div><div className="font-medium">{fmtCr(s[p].revenue)}</div><div className="text-muted-foreground">{s[p].orders} ord</div></div> : <span className="text-muted-foreground/30">—</span>}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium text-xs">{fmtCr(s.total)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
