
"use client";

import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Bar, PieChart, Pie, Cell, BarChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { TrendingUp, Upload, Cloud, Download, ArrowUp, ArrowDown, ChevronDown, ChevronRight, GitCompareArrows } from "lucide-react";
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface GrowthTabProps {
  data: GrowthData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))" },
  compare_gmv: { label: "Comp GMV", color: "hsl(var(--foreground))" }
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))", "#FF8042", "#00C49F", "#FFBB28"];


type SortKey = 'month' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'avgAsp';
type ChannelSortKey = 'channel' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'mom';

export default function GrowthTab({ data, onFileUpload, onCloudImport }: GrowthTabProps) {
  const [isComparing, setIsComparing] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'month', direction: 'desc' });
  const [channelSortConfig, setChannelSortConfig] = useState<{ key: ChannelSortKey; direction: 'asc' | 'desc' }>({ key: 'gmv', direction: 'desc' });
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  
  const availableMonths = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.map(d => d.month))].sort((a,b) => new Date(`01 ${a}`).getTime() - new Date(`01 ${b}`).getTime());
  }, [data]);

  const [startMonth, setStartMonth] = useState<string | undefined>(availableMonths[0]);
  const [endMonth, setEndMonth] = useState<string | undefined>(availableMonths[availableMonths.length - 1]);
  const [compareStartMonth, setCompareStartMonth] = useState<string | undefined>(undefined);
  const [compareEndMonth, setCompareEndMonth] = useState<string | undefined>(undefined);

  React.useEffect(() => {
    if (availableMonths.length > 0) {
      setStartMonth(availableMonths[0]);
      setEndMonth(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths]);


  const processPeriodData = (periodData: GrowthData[]) => {
      const kpis = { totalGmv: 0, totalAds: 0, totalTacos: 0, totalUnits: 0, avgAsp: 0 };
      if (!periodData || periodData.length === 0) {
        return { kpis, chartData: [], tableData: [], channelPerformance: [] };
      }

      const monthlyDataMap: { [key: string]: { month: string, platforms: { [key: string]: GrowthData } } } = {};
      const channelDataMap: { [key: string]: { gmv: number; adsSpent: number; units: number; mom: number; } } = {};
      
      periodData.forEach(d => {
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

    return { kpis, chartData, tableData: sortedTableData, channelPerformance: sortedChannelData };
  };

  const { currentPeriod, comparisonPeriod } = useMemo(() => {
    if (!data) return { currentPeriod: processPeriodData([]), comparisonPeriod: processPeriodData([]) };

    const startIndex = availableMonths.indexOf(startMonth!);
    const endIndex = availableMonths.indexOf(endMonth!);
    const currentMonths = availableMonths.slice(startIndex, endIndex + 1);
    
    const currentData = data.filter(d => currentMonths.includes(d.month));

    let comparisonData: GrowthData[] = [];
    if (isComparing && compareStartMonth && compareEndMonth) {
        const compareStartIndex = availableMonths.indexOf(compareStartMonth);
        const compareEndIndex = availableMonths.indexOf(compareEndMonth);
        const comparisonMonths = availableMonths.slice(compareStartIndex, compareEndIndex + 1);
        comparisonData = data.filter(d => comparisonMonths.includes(d.month));
    }
    
    return {
        currentPeriod: processPeriodData(currentData),
        comparisonPeriod: processPeriodData(comparisonData),
    };
  }, [data, startMonth, endMonth, compareStartMonth, compareEndMonth, isComparing, availableMonths, sortConfig, channelSortConfig]);
  
  const mergedChartData = useMemo(() => {
    if (!isComparing) return currentPeriod.chartData;
    
    const maxLength = Math.max(currentPeriod.chartData.length, comparisonPeriod.chartData.length);
    const merged = [];

    for (let i=0; i<maxLength; i++) {
        const current = currentPeriod.chartData[i];
        const compare = comparisonPeriod.chartData[i];
        merged.push({
            month: current?.month || `Period ${i+1}`,
            gmv: current?.gmv,
            adsSpent: current?.adsSpent,
            tacos: current?.tacos,
            compare_gmv: compare?.gmv,
            compare_adsSpent: compare?.adsSpent,
            compare_tacos: compare?.tacos,
        });
    }
    return merged;
  }, [currentPeriod.chartData, comparisonPeriod.chartData, isComparing]);

  
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
  
  const renderKpiCard = (title: string, current: number, compare: number, format: (val:number) => string, higherIsBetter = true) => {
    const diff = isComparing && compare > 0 ? ((current - compare) / compare) * 100 : 0;
    const diffColor = higherIsBetter ? (diff >= 0 ? 'text-green-600' : 'text-destructive') : (diff < 0 ? 'text-green-600' : 'text-destructive');
    return (
        <Card>
            <CardHeader className="p-4 pb-0">
                <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
                   {title}
                   {isComparing && <span className={cn("text-xs font-bold", diffColor)}>{diff.toFixed(1)}%</span>}
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
                <h2 className="text-xl font-bold text-foreground mt-1">
                    {format(current)}
                </h2>
                {isComparing && <p className="text-xs text-muted-foreground mt-1">vs {format(compare)}</p>}
            </CardContent>
        </Card>
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
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                        <Switch id="growth-compare-mode" checked={isComparing} onCheckedChange={setIsComparing} />
                        <Label htmlFor="growth-compare-mode" className="flex items-center gap-1.5"><GitCompareArrows className="w-4 h-4" /> Compare</Label>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={startMonth} onValueChange={setStartMonth}>
                            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Start" /></SelectTrigger>
                            <SelectContent>{availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                        <Select value={endMonth} onValueChange={setEndMonth}>
                             <SelectTrigger className="w-36 h-9"><SelectValue placeholder="End" /></SelectTrigger>
                             <SelectContent>{availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                     {isComparing && (
                        <div className="flex items-center gap-2">
                            <Select value={compareStartMonth} onValueChange={setCompareStartMonth}>
                                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Comp Start" /></SelectTrigger>
                                <SelectContent>{availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={compareEndMonth} onValueChange={setCompareEndMonth}>
                                <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Comp End" /></SelectTrigger>
                                <SelectContent>{availableMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                     )}
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
            {renderKpiCard("Total GMV", currentPeriod.kpis.totalGmv, comparisonPeriod.kpis.totalGmv, (val) => `₹${val.toLocaleString(undefined, {maximumFractionDigits: 0})}`)}
            {renderKpiCard("Total Ads", currentPeriod.kpis.totalAds, comparisonPeriod.kpis.totalAds, (val) => `₹${val.toLocaleString(undefined, {maximumFractionDigits: 0})}`, false)}
            {renderKpiCard("Avg TACOS", currentPeriod.kpis.totalTacos, comparisonPeriod.kpis.totalTacos, (val) => `${(val * 100).toFixed(2)}%`, false)}
            {renderKpiCard("Total Units", currentPeriod.kpis.totalUnits, comparisonPeriod.kpis.totalUnits, (val) => val.toLocaleString())}
            {renderKpiCard("Avg ASP", currentPeriod.kpis.avgAsp, comparisonPeriod.kpis.avgAsp, (val) => `₹${val.toFixed(0)}`)}
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Performance Over Time</CardTitle>
                <CardDescription>GMV, Ads Spent, and TACOS trends for the selected period.</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ComposedChart data={mergedChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" fontSize={12} />
                    <YAxis yAxisId="left" label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} stroke="hsl(var(--chart-1))" tickFormatter={(value) => `₹${(value as number / 100000).toFixed(0)}L`} />
                    <YAxis yAxisId="right" orientation="right" label={{ value: 'TACOS (%)', angle: -90, position: 'insideRight' }} stroke="hsl(var(--chart-3))" tickFormatter={(value) => `${(value as number * 100).toFixed(0)}%`}/>
                    <Tooltip content={<ChartTooltipContent formatter={(value, name) => name === 'tacos' ? `${(Number(value) * 100).toFixed(2)}%` : `₹${Number(value).toLocaleString()}`} />} />
                    <Legend />
                    <Bar dataKey="gmv" yAxisId="left" fill="var(--color-gmv)" name="GMV" />
                    <Bar dataKey="adsSpent" yAxisId="left" fill="var(--color-adsSpent)" name="Ads Spent" />
                     {isComparing && <Line type="monotone" dataKey="compare_gmv" yAxisId="left" stroke="var(--color-compare_gmv)" strokeWidth={2} name="Comp GMV" dot={false} strokeDasharray="5 5" />}
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
                            {currentPeriod.channelPerformance.map(item => (
                                <TableRow key={item.channel}>
                                    <TableCell className="font-medium">{item.channel}</TableCell>
                                    <TableCell className="text-right">₹{item.gmv.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                    <TableCell className="text-right">₹{item.adsSpent.toLocaleString(undefined, {maximumFractionDigits: 0})}</TableCell>
                                    <TableCell className={cn("text-right", item.tacos > currentPeriod.kpis.totalTacos ? "text-destructive" : "text-green-600")}>{(item.tacos * 100).toFixed(2)}%</TableCell>
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
                                <Pie data={currentPeriod.channelPerformance} dataKey="gmv" nameKey="channel" cx="50%" cy="50%" outerRadius={80} label>
                                    {currentPeriod.channelPerformance.map((entry, index) => (
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
                            <BarChart data={currentPeriod.channelPerformance} layout="vertical" margin={{left: 100}}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `${(value as number * 100).toFixed(0)}%`}/>
                                <YAxis type="category" dataKey="channel" width={100} fontSize={12} />
                                <Tooltip content={<ChartTooltipContent formatter={(value) => `${(Number(value) * 100).toFixed(2)}%`}/>}/>
                                <Bar dataKey="tacos" fill="var(--color-tacos)">
                                    {currentPeriod.channelPerformance.map((entry, index) => (
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
                    
                        {currentPeriod.tableData.map(item => {
                            const monthKey = item.month;
                            const isOpen = openCollapsibles.includes(monthKey);
                            return (
                                <Collapsible asChild key={monthKey} open={isOpen} onOpenChange={() => toggleCollapsible(monthKey)}>
                                    <tbody className="[&_tr:last-child]:border-0">
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
                                    </tbody>
                                </Collapsible>
                            )
                        })}
                    
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
