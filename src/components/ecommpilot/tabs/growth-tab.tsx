"use client";

import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Bar, PieChart, Pie, Cell, BarChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { TrendingUp, Upload, Cloud, Download, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from 'react';
import type { GrowthData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import KpiCard from '../kpi-card';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface GrowthTabProps {
  data: GrowthData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))" },
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#FF8042", "#00C49F", "#FFBB28"];


type SortKey = 'month' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'avgAsp';
type ChannelSortKey = 'channel' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'mom';

export default function GrowthTab({ data, onFileUpload, onCloudImport }: GrowthTabProps) {

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'month', direction: 'desc' });
  const [channelSortConfig, setChannelSortConfig] = useState<{ key: ChannelSortKey; direction: 'asc' | 'desc' }>({ key: 'gmv', direction: 'desc' });
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);

  const { monthlyKpis, monthlyChartData, monthlyTableData, channelPerformance } = useMemo(() => {
    if (!data || data.length === 0) {
      return { monthlyKpis: { totalGmv: 0, totalAds: 0, totalTacos: 0, totalUnits: 0, avgAsp: 0 }, monthlyChartData: [], monthlyTableData: [], channelPerformance: [] };
    }

    const kpis = { totalGmv: 0, totalAds: 0, totalTacos: 0, totalUnits: 0, avgAsp: 0 };
    
    const monthlyDataMap: { [key: string]: { month: string, platforms: { [key: string]: GrowthData } } } = {};
    const channelDataMap: { [key: string]: { gmv: number; adsSpent: number; units: number; mom: number; } } = {};
    
    data.forEach(d => {
      const month = d.month;
      if (!monthlyDataMap[month]) {
        monthlyDataMap[month] = { month: month, platforms: {} };
      }
      if(!monthlyDataMap[month].platforms[d.channel]){
        monthlyDataMap[month].platforms[d.channel] = {...d};
      } else {
        monthlyDataMap[month].platforms[d.channel].gmv += d.gmv;
        monthlyDataMap[month].platforms[d.channel].adsSpent += d.adsSpent;
        monthlyDataMap[month].platforms[d.channel].units += d.units;
      }
      
      if (!channelDataMap[d.channel]) {
          channelDataMap[d.channel] = { gmv: 0, adsSpent: 0, units: 0, mom: 0 };
      }
      channelDataMap[d.channel].gmv += d.gmv;
      channelDataMap[d.channel].adsSpent += d.adsSpent;
      channelDataMap[d.channel].units += d.units;
      // Note: Aggregating MoM doesn't make sense, might need to be calculated later if needed
    });

    const chartData = Object.values(monthlyDataMap).map(monthData => {
        let totalMonthGmv = 0, totalMonthAds = 0, totalMonthUnits = 0;
        Object.values(monthData.platforms).forEach(p => {
            totalMonthGmv += p.gmv;
            totalMonthAds += p.adsSpent;
            totalMonthUnits += p.units;
        });
        
        return {
            month: monthData.month,
            gmv: totalMonthGmv,
            adsSpent: totalMonthAds,
            tacos: totalMonthGmv > 0 ? (totalMonthAds / totalMonthGmv) : 0,
            units: totalMonthUnits,
            avgAsp: totalMonthUnits > 0 ? totalMonthGmv / totalMonthUnits : 0,
            platforms: Object.values(monthData.platforms)
        };
    });
    
    chartData.forEach(d => {
      kpis.totalGmv += d.gmv;
      kpis.totalAds += d.adsSpent;
      kpis.totalUnits += d.units;
    });

    kpis.totalTacos = kpis.totalGmv > 0 ? kpis.totalAds / kpis.totalGmv : 0;
    kpis.avgAsp = kpis.totalUnits > 0 ? kpis.totalGmv / kpis.totalUnits : 0;
    
    const sortedTableData = [...chartData].sort((a, b) => {
      // Simple string sort for month, might need smarter date-based sort if format varies
      return sortConfig.direction === 'asc' ? a.month.localeCompare(b.month) : b.month.localeCompare(a.month);
    });

    const perfData = Object.entries(channelDataMap).map(([channel, metrics]) => ({
      channel,
      ...metrics,
      tacos: metrics.gmv > 0 ? metrics.adsSpent / metrics.gmv : 0,
      avgAsp: metrics.units > 0 ? metrics.gmv / metrics.units : 0,
    }));
    
    const sortedChannelData = [...perfData].sort((a, b) => {
        const valA = a[channelSortConfig.key];
        const valB = b[channelSortConfig.key];
        if (typeof valA === 'string' && typeof valB === 'string') {
            return channelSortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
            return channelSortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        return 0;
    });

    return { monthlyKpis: kpis, monthlyChartData: chartData, monthlyTableData: sortedTableData, channelPerformance: sortedChannelData };
  }, [data, sortConfig, channelSortConfig]);
  
  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
    }
    setSortConfig({ key, direction });
  };
  
  const requestChannelSort = (key: ChannelSortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (channelSortConfig.key === key && channelSortConfig.direction === 'desc') {
        direction = 'asc';
    }
    setChannelSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey | ChannelSortKey) => {
    if (sortConfig.key === key) {
        return sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 inline" /> : <ArrowUp className="w-3 h-3 ml-1 inline" />;
    }
    if (channelSortConfig.key === key) {
        return channelSortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 inline" /> : <ArrowUp className="w-3 h-3 ml-1 inline" />;
    }
    return null;
  };
  
  const toggleCollapsible = (month: string) => {
    setOpenCollapsibles(prev => 
      prev.includes(month) ? prev.filter(d => d !== month) : [...prev, month]
    );
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Monthly Growth
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href="/growth-template.csv" download>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('growth-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import from File
                </Button>
                <Button size="sm" variant="outline" onClick={onCloudImport}>
                    <Cloud className="w-4 h-4 mr-2" />
                    Import from Sheet
                </Button>
            </div>
            <input type="file" id="growth-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
          </CardTitle>
          <CardDescription>
            Import your monthly growth data to see visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-16">
          <p>No monthly growth data loaded. Please import a file.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Monthly Growth
                    </CardTitle>
                    <CardDescription>
                        High-level view of monthly performance across all channels.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2">
                    <TooltipProvider>
                         <UiTooltip>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" asChild>
                                    <a href="/growth-template.csv" download><Download className="w-4 h-4" /></a>
                                </Button>
                            </UiTooltipTrigger>
                            <UiTooltipContent>Download Template</UiTooltipContent>
                        </UiTooltip>
                        <UiTooltip>
                             <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => document.getElementById('growth-upload')?.click()}>
                                    <Upload className="w-4 h-4" />
                                </Button>
                            </UiTooltipTrigger>
                             <UiTooltipContent>Import from file</UiTooltipContent>
                        </UiTooltip>
                        <UiTooltip>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={onCloudImport}>
                                    <Cloud className="w-4 h-4" />
                                </Button>
                            </UiTooltipTrigger>
                            <UiTooltipContent>Import from Google Sheet</UiTooltipContent>
                        </UiTooltip>
                    </TooltipProvider>
                    <input type="file" id="growth-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </div>
        </CardHeader>
      </Card>
      
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard title="Total GMV" value={`₹${monthlyKpis.totalGmv.toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
            <KpiCard title="Total Ads" value={`₹${monthlyKpis.totalAds.toLocaleString(undefined, {maximumFractionDigits: 0})}`} />
            <KpiCard title="Avg TACOS" value={`${(monthlyKpis.totalTacos * 100).toFixed(2)}%`} />
            <KpiCard title="Total Units" value={monthlyKpis.totalUnits.toLocaleString()} />
            <KpiCard title="Avg ASP" value={`₹${monthlyKpis.avgAsp.toFixed(0)}`} />
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Performance Over Time</CardTitle>
                <CardDescription>GMV, Ads Spent, and TACOS trends for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ComposedChart data={monthlyChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis yAxisId="left" label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} stroke="hsl(var(--chart-1))" tickFormatter={(value) => `₹${(value as number / 100000).toFixed(0)}L`} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'TACOS (%)', angle: -90, position: 'insideRight' }} stroke="hsl(var(--chart-3))" tickFormatter={(value) => `${(value as number * 100).toFixed(0)}%`}/>
                    <Tooltip content={<ChartTooltipContent formatter={(value, name) => name === 'tacos' ? `${(Number(value) * 100).toFixed(2)}%` : `₹${Number(value).toLocaleString()}`} />} />
                    <Legend />
                    <Bar dataKey="gmv" yAxisId="left" fill="var(--color-gmv)" name="GMV" />
                    <Bar dataKey="adsSpent" yAxisId="left" fill="var(--color-adsSpent)" name="Ads Spent" />
                    <Line type="monotone" dataKey="tacos" yAxisId="right" stroke="var(--color-tacos)" strokeWidth={2} name="TACOS" dot={false} />
                </ComposedChart>
              </ChartContainer>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="text-base">Platform Performance</CardTitle>
                    <CardDescription>Detailed breakdown of metrics by sales channel for the selected period.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto custom-scrollbar">
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => requestChannelSort('channel')}>Channel {getSortIcon('channel')}</TableHead>
                                <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('gmv')}>GMV {getSortIcon('gmv')}</TableHead>
                                <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent')}</TableHead>
                                <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('tacos')}>TACOS {getSortIcon('tacos')}</TableHead>
                                <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('units')}>Units {getSortIcon('units')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {channelPerformance.map(item => (
                                <TableRow key={item.channel}>
                                    <TableCell className="font-medium">{item.channel}</TableCell>
                                    <TableCell className="text-right">₹{item.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                    <TableCell className="text-right">₹{item.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                    <TableCell className={cn("text-right", item.tacos > monthlyKpis.totalTacos ? "text-destructive" : "text-green-600")}>{(item.tacos * 100).toFixed(2)}%</TableCell>
                                    <TableCell className="text-right">{item.units.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">GMV Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{}} className="h-[200px] w-full">
                            <PieChart>
                                <Tooltip content={<ChartTooltipContent hideLabel />} />
                                <Pie data={channelPerformance} dataKey="gmv" nameKey="channel" cx="50%" cy="50%" outerRadius={80} label>
                                    {channelPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Legend/>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">TACOS by Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <ChartContainer config={chartConfig} className="h-[200px] w-full">
                            <BarChart data={channelPerformance} layout="vertical" margin={{left: 100}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `${(value as number * 100).toFixed(0)}%`}/>
                                <YAxis type="category" dataKey="channel" width={100} fontSize={12} />
                                <Tooltip content={<ChartTooltipContent formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`}/>}/>
                                <Bar dataKey="tacos" fill="var(--color-tacos)">
                                    {channelPerformance.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </div>

        <Card>
             <CardHeader>
                <CardTitle className="text-base">Monthly Breakdown Table</CardTitle>
                 <CardDescription>Metrics for each month. Click a row to see platform details.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[600px] custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('month')}>Month {getSortIcon('month')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('gmv')}>GMV {getSortIcon('gmv')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('tacos')}>TACOS {getSortIcon('tacos')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('units')}>Units {getSortIcon('units')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('avgAsp')}>Avg ASP {getSortIcon('avgAsp')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {monthlyTableData.map(item => {
                            const monthKey = item.month;
                            const isOpen = openCollapsibles.includes(monthKey);
                            return (
                                <Collapsible asChild key={monthKey} open={isOpen} onOpenChange={() => toggleCollapsible(monthKey)}>
                                    <>
                                        <TableRow className="cursor-pointer" onClick={() => toggleCollapsible(monthKey)}>
                                            <TableCell>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </TableCell>
                                            <TableCell className="font-medium">{item.month}</TableCell>
                                            <TableCell className="text-right">₹{item.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                            <TableCell className="text-right">₹{item.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                            <TableCell className="text-right">{(item.tacos * 100).toFixed(2)}%</TableCell>
                                            <TableCell className="text-right">{item.units.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">₹{item.avgAsp.toFixed(0)}</TableCell>
                                        </TableRow>
                                        <CollapsibleContent asChild>
                                             <tr>
                                                <td colSpan={7} className="p-0">
                                                    <div className="bg-muted/50 p-4">
                                                        <Table>
                                                            <TableHeader>
                                                                <TableRow>
                                                                    <TableHead>Platform</TableHead>
                                                                    <TableHead className="text-right">GMV</TableHead>
                                                                    <TableHead className="text-right">Ads Spent</TableHead>
                                                                    <TableHead className="text-right">TACOS</TableHead>
                                                                    <TableHead className="text-right">Units</TableHead>
                                                                    <TableHead className="text-right">Avg ASP</TableHead>
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {item.platforms.map(p => (
                                                                    <TableRow key={p.channel}>
                                                                        <TableCell className="font-medium">{p.channel}</TableCell>
                                                                        <TableCell className="text-right">₹{p.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                                                        <TableCell className="text-right">₹{p.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                                                        <TableCell className="text-right">{(p.gmv > 0 ? (p.adsSpent / p.gmv) * 100 : 0).toFixed(2)}%</TableCell>
                                                                        <TableCell className="text-right">{p.units.toLocaleString()}</TableCell>
                                                                        <TableCell className="text-right">₹{(p.units > 0 ? p.gmv / p.units : 0).toFixed(0)}</TableCell>
                                                                    </TableRow>
                                                                ))}
                                                            </TableBody>
                                                        </Table>
                                                    </div>
                                                </td>
                                            </tr>
                                        </CollapsibleContent>
                                    </>
                                </Collapsible>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
