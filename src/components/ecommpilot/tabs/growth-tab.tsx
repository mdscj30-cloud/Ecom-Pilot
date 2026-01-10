
"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { BarChart2, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import React, { useMemo, useState } from 'react';
import type { ProcessedSheetData } from '@/lib/types';
import KpiCard from '../kpi-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from '@/lib/utils';
import { subMonths, startOfMonth, format } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";


interface GrowthTabProps {
  data: ProcessedSheetData[] | null;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))",},
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))"];


type SortKey = 'channel' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'mom';
type MonthSortKey = 'month' | 'gmv' | 'adsSpent' | 'tacos' | 'units';


export default function GrowthTab({ data }: GrowthTabProps) {
  const [channelSortConfig, setChannelSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'gmv', direction: 'desc' });
  const [monthSortConfig, setMonthSortConfig] = useState<{ key: MonthSortKey; direction: 'asc' | 'desc' }>({ key: 'month', direction: 'desc' });
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);


  const { years, channels } = useMemo(() => {
    if (!data) return { years: [], channels: [] };
    const yearSet = new Set<string>();
    const channelSet = new Set<string>();
    data.forEach(d => {
      yearSet.add(d.year);
      channelSet.add(d.channel);
    });
    return {
      years: Array.from(yearSet).sort((a, b) => b.localeCompare(a)),
      channels: ['All', ...Array.from(channelSet).sort()]
    };
  }, [data]);
  
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || 'All');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  
  React.useEffect(() => {
    if (years.length > 0 && !years.includes(selectedYear)) {
      setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(d => 
      (selectedYear === 'All' || d.year === selectedYear) &&
      (selectedChannel === 'All' || d.channel === selectedChannel)
    );
  }, [data, selectedYear, selectedChannel]);

  const { kpis, channelPerformance, monthlyChartData, monthlyTableData } = useMemo(() => {
    const kpis = { totalGmv: 0, totalAdsSpent: 0, totalUnits: 0, overallTacos: 0, avgAsp: 0, yoyGrowth: 0 };
    if (!filteredData.length || !data) return { kpis, channelPerformance: [], monthlyChartData: [], monthlyTableData: [] };

    const monthlyDataMap: { [key: string]: { month: string, year: string, platforms: { [key: string]: ProcessedSheetData } } } = {};
    const channelDataMap: { [key: string]: { gmv: number; adsSpent: number; units: number } } = {};

    filteredData.forEach(d => {
        const monthKey = `${d.year}-${d.month}`;
        if (!monthlyDataMap[monthKey]) {
            monthlyDataMap[monthKey] = { month: d.month, year: d.year, platforms: {} };
        }
        if(!monthlyDataMap[monthKey].platforms[d.channel]){
            monthlyDataMap[monthKey].platforms[d.channel] = {...d, gmv: 0, adsSpent: 0, units: 0};
        }
        monthlyDataMap[monthKey].platforms[d.channel].gmv += d.gmv;
        monthlyDataMap[monthKey].platforms[d.channel].adsSpent += d.adsSpent;
        monthlyDataMap[monthKey].platforms[d.channel].units += d.units;
        
        kpis.totalGmv += d.gmv;
        kpis.totalAdsSpent += d.adsSpent;
        kpis.totalUnits += d.units;

        if (!channelDataMap[d.channel]) {
          channelDataMap[d.channel] = { gmv: 0, adsSpent: 0, units: 0 };
        }
        channelDataMap[d.channel].gmv += d.gmv;
        channelDataMap[d.channel].adsSpent += d.adsSpent;
        channelDataMap[d.channel].units += d.units;
    });

    kpis.overallTacos = kpis.totalGmv > 0 ? kpis.totalAdsSpent / kpis.totalGmv : 0;
    kpis.avgAsp = kpis.totalUnits > 0 ? kpis.totalGmv / kpis.totalUnits : 0;
    
    // YOY Growth
    if (selectedYear !== 'All') {
        const currentYearGmv = kpis.totalGmv;
        const previousYear = (parseInt(selectedYear, 10) - 1).toString();
        const prevYearGmv = data
            .filter(d => d.year === previousYear && (selectedChannel === 'All' || d.channel === selectedChannel))
            .reduce((sum, d) => sum + d.gmv, 0);

        kpis.yoyGrowth = prevYearGmv > 0 ? (currentYearGmv - prevYearGmv) / prevYearGmv : currentYearGmv > 0 ? Infinity : 0;
    }

    const monthChartData = Object.values(monthlyDataMap).map(monthData => {
        let totalMonthGmv = 0, totalMonthAds = 0, totalMonthUnits = 0;
        Object.values(monthData.platforms).forEach(p => {
            totalMonthGmv += p.gmv;
            totalMonthAds += p.adsSpent;
            totalMonthUnits += p.units;
        });

        const currentMonthDate = startOfMonth(new Date(`${monthData.month} 1, ${monthData.year}`));
        const previousMonthDate = subMonths(currentMonthDate, 1);
        const prevMonthKey = `${format(previousMonthDate, 'yyyy')}-${format(previousMonthDate, 'MMM')}`;
        
        let prevMonthGmv = 0;
        if(monthlyDataMap[prevMonthKey]) {
            Object.values(monthlyDataMap[prevMonthKey].platforms).forEach(p => {
                 prevMonthGmv += p.gmv;
            });
        }

        return {
            month: monthData.month,
            gmv: totalMonthGmv,
            adsSpent: totalMonthAds,
            tacos: totalMonthGmv > 0 ? totalMonthAds / totalMonthGmv : 0,
            units: totalMonthUnits,
            mom: prevMonthGmv > 0 ? (totalMonthGmv - prevMonthGmv) / prevMonthGmv : totalMonthGmv > 0 ? Infinity : 0,
            platforms: Object.values(monthData.platforms).map(p => ({
                ...p,
                tacos: p.gmv > 0 ? p.adsSpent / p.gmv : 0,
                avgAsp: p.units > 0 ? p.gmv / p.units : 0,
            }))
        };
    }).sort((a,b) => new Date(`${a.month} 1, ${selectedYear === 'All' ? '2024' : selectedYear}`).getTime() - new Date(`${b.month} 1, ${selectedYear === 'All' ? '2024' : selectedYear}`).getTime());

    const perfData = Object.entries(channelDataMap).map(([channel, metrics]) => ({
      channel,
      ...metrics,
      tacos: metrics.gmv > 0 ? metrics.adsSpent / metrics.gmv : 0,
      avgAsp: metrics.units > 0 ? metrics.gmv / metrics.units : 0,
      gmvShare: kpis.totalGmv > 0 ? metrics.gmv / kpis.totalGmv : 0,
    }));
    
    const sortedChannelPerformance = [...perfData].sort((a, b) => {
        if (channelSortConfig.key === 'channel') {
            return channelSortConfig.direction === 'asc' ? a.channel.localeCompare(b.channel) : b.channel.localeCompare(a.channel);
        }
        const valA = a[channelSortConfig.key as keyof typeof a] as number;
        const valB = b[channelSortConfig.key as keyof typeof b] as number;
        return channelSortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    const sortedMonthData = [...monthChartData].sort((a, b) => {
        if (monthSortConfig.key === 'month') {
            const year = selectedYear === 'All' ? '2024' : selectedYear;
            const valA = new Date(`${a.month} 1, ${year}`).getTime();
            const valB = new Date(`${b.month} 1, ${year}`).getTime();
            return monthSortConfig.direction === 'asc' ? valA - valB : valB - valA;
        }
        const valA = a[monthSortConfig.key as keyof typeof a] as number;
        const valB = b[monthSortConfig.key as keyof typeof b] as number;
        return monthSortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return { kpis, channelPerformance: sortedChannelPerformance, monthlyChartData: monthChartData, monthlyTableData: sortedMonthData };

  }, [filteredData, data, selectedYear, selectedChannel, channelSortConfig, monthSortConfig]);

  const requestChannelSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (channelSortConfig.key === key && channelSortConfig.direction === 'desc') direction = 'asc';
    setChannelSortConfig({ key, direction });
  };
  
  const requestMonthSort = (key: MonthSortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (monthSortConfig.key === key && monthSortConfig.direction === 'desc') direction = 'asc';
    setMonthSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey | MonthSortKey, type: 'channel' | 'month') => {
    const config = type === 'channel' ? channelSortConfig : monthSortConfig;
    if (config.key === key) {
        return config.direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-1 inline" /> : <ArrowUp className="w-3 h-3 ml-1 inline" />;
    }
    return null;
};
  
  const toggleCollapsible = (month: string) => {
    setOpenCollapsibles(prev => prev.includes(month) ? prev.filter(d => d !== month) : [...prev, month]);
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Growth Analysis
            </div>
          </CardTitle>
          <CardDescription>
            Loading growth data...
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-16">
          <p>No growth data loaded.</p>
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
                     <BarChart2 className="w-5 h-5 text-primary" />
                     Growth Analysis
                  </CardTitle>
                  <CardDescription>
                     High-level strategic overview of channel performance.
                  </CardDescription>
               </div>
               <div className='flex items-center gap-2'>
                  <Select value={selectedYear} onValueChange={setSelectedYear}><SelectTrigger className="w-[90px] h-9"><SelectValue /></SelectTrigger><SelectContent>{['All', ...years].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent></Select>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}><SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger><SelectContent>{channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
               </div>
            </div>
         </CardHeader>
       </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total GMV" value={`₹${(kpis.totalGmv / 100000).toFixed(2)} L`} />
            <KpiCard title="Total Ads Spent" value={`₹${(kpis.totalAdsSpent / 100000).toFixed(2)} L`} />
            <KpiCard title="Overall TACOS" value={`${(kpis.overallTacos * 100).toFixed(2)}%`} className={cn(kpis.overallTacos < 0.1 ? 'text-green-600' : kpis.overallTacos > 0.2 ? 'text-destructive' : 'text-amber-600')} />
            <KpiCard title="Total Units" value={kpis.totalUnits.toLocaleString()} />
            <KpiCard title="Avg ASP" value={`₹${kpis.avgAsp.toFixed(0)}`} />
            <KpiCard title="YOY Growth %" value={`${isFinite(kpis.yoyGrowth) ? (kpis.yoyGrowth * 100).toFixed(1) : 'N/A'}%`} className={cn(kpis.yoyGrowth > 0 ? 'text-green-600' : 'text-destructive')} />
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Monthly Performance Timeline ({selectedYear})</CardTitle>
                <CardDescription>GMV, Ads Spent, and TACOS trends for the selected year and channel.</CardDescription>
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
                    <CardTitle className="text-base">Channel Performance</CardTitle>
                    <CardDescription>Aggregated channel metrics for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="cursor-pointer" onClick={() => requestChannelSort('channel')}>Channel {getSortIcon('channel', 'channel')}</TableHead>
                                    <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('gmv')}>GMV {getSortIcon('gmv', 'channel')}</TableHead>
                                    <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent', 'channel')}</TableHead>
                                    <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('tacos')}>TACOS {getSortIcon('tacos', 'channel')}</TableHead>
                                    <TableHead className="cursor-pointer text-right" onClick={() => requestChannelSort('units')}>Units {getSortIcon('units', 'channel')}</TableHead>
                                    <TableHead className="text-right">Avg ASP</TableHead>
                                    <TableHead className="text-right">GMV Share %</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {channelPerformance.map(item => (
                                    <TableRow key={item.channel}>
                                        <TableCell className="font-medium">{item.channel}</TableCell>
                                        <TableCell className="text-right">₹{item.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                        <TableCell className="text-right">₹{item.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                        <TableCell className={cn("text-right", item.tacos > kpis.overallTacos ? 'text-destructive' : 'text-green-600')}>{(item.tacos * 100).toFixed(2)}%</TableCell>
                                        <TableCell className="text-right">{item.units.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">₹{item.avgAsp.toFixed(0)}</TableCell>
                                        <TableCell className="text-right">{(item.gmvShare * 100).toFixed(1)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader><CardTitle className="text-base">GMV Distribution by Channel</CardTitle></CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfig} className="h-[300px] w-full">
                        <PieChart>
                            <Tooltip content={<ChartTooltipContent hideLabel formatter={(value, name) => `${name}: ₹${Number(value).toLocaleString()}`}/>} />
                            <Pie data={channelPerformance} dataKey="gmv" nameKey="channel" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ percent }) => `${(percent * 100).toFixed(0)}%`}>
                                {channelPerformance.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                             <Legend content={<ChartLegendContent nameKey="channel" />} />
                        </PieChart>
                    </ChartContainer>
                </CardContent>
            </Card>
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
                            <TableHead className="cursor-pointer" onClick={() => requestMonthSort('month')}>Month {getSortIcon('month', 'month')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestMonthSort('gmv')}>GMV {getSortIcon('gmv', 'month')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestMonthSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent', 'month')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestMonthSort('tacos')}>TACOS {getSortIcon('tacos', 'month')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestMonthSort('units')}>Units {getSortIcon('units', 'month')}</TableHead>
                            <TableHead className="cursor-pointer text-right">MOM %</TableHead>
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
                                            <TableCell className={cn("text-right", item.mom >= 0 ? 'text-green-600' : 'text-destructive')}>
                                                {isFinite(item.mom) ? `${(item.mom * 100).toFixed(1)}%` : 'N/A'}
                                            </TableCell>
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
                                                                </TableRow>
                                                            </TableHeader>
                                                            <TableBody>
                                                                {item.platforms.sort((a,b) => b.gmv - a.gmv).map(p => (
                                                                    <TableRow key={p.channel}>
                                                                        <TableCell className="font-medium">{p.channel}</TableCell>
                                                                        <TableCell className="text-right">₹{p.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                                                        <TableCell className="text-right">₹{p.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                                                        <TableCell className="text-right">{(p.tacos * 100).toFixed(2)}%</TableCell>
                                                                        <TableCell className="text-right">{p.units.toLocaleString()}</TableCell>
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


