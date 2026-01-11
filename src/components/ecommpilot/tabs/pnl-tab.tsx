
"use client";

import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Bar, PieChart, Pie, Cell, BarChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Upload, Cloud, Download, ArrowUp, ArrowDown, ChevronDown, ChevronRight, GitCompareArrows } from "lucide-react";
import React, { useMemo, useState } from 'react';
import type { ProcessedSheetData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, startOfToday, endOfToday, subDays } from 'date-fns';
import KpiCard from '../kpi-card';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';


interface PnlTabProps {
  data: ProcessedSheetData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))" },
  compare_gmv: { label: "Comp GMV", color: "hsl(var(--foreground))" }
};

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];


type SortKey = 'date' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'avgAsp';
type ChannelSortKey = 'channel' | 'gmv' | 'adsSpent' | 'tacos' | 'units';

export default function PnlTab({ data, onFileUpload, onCloudImport }: PnlTabProps) {
  
  const [isComparing, setIsComparing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
     if (data && data.length > 0) {
        const maxDate = data.reduce((max, p) => p.date > max ? p.date : max, data[0].date);
        return { from: subDays(maxDate, 30), to: maxDate };
    }
    return { from: subDays(startOfToday(), 30), to: endOfToday() };
  });

  const [compareDateRange, setCompareDateRange] = useState<DateRange | undefined>(() => {
    if (dateRange?.from && dateRange?.to) {
      const diff = dateRange.to.getTime() - dateRange.from.getTime();
      return { from: new Date(dateRange.from.getTime() - diff), to: new Date(dateRange.to.getTime() - diff) };
    }
    return { from: subDays(startOfToday(), 60), to: subDays(endOfToday(), 30) };
  });


  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  const [channelSortConfig, setChannelSortConfig] = useState<{ key: ChannelSortKey; direction: 'asc' | 'desc' }>({ key: 'gmv', direction: 'desc' });
  const [openCollapsibles, setOpenCollapsibles] = useState<string[]>([]);
  
  React.useEffect(() => {
    if (data && data.length > 0 && (!dateRange?.from || !dateRange.to)) {
      const maxDate = data.reduce((max, p) => p.date > max ? p.date : max, data[0].date);
      const minDate = data.reduce((min, p) => p.date < min ? p.date : min, data[0].date);
      setDateRange({ from: minDate, to: maxDate });
    }
  }, [data, dateRange]);
  
  const processPeriodData = (periodData: ProcessedSheetData[]) => {
    const kpis = { totalGmv: 0, totalAds: 0, totalTacos: 0, totalUnits: 0, avgAsp: 0 };
    if (periodData.length === 0) {
      return { kpis, chartData: [], tableData: [], channelPerformance: [] };
    }

    const dailyDataMap: { [key: string]: { date: Date, platforms: { [key: string]: ProcessedSheetData } } } = {};
    const channelDataMap: { [key: string]: { gmv: number; adsSpent: number; units: number } } = {};
    
    periodData.forEach(d => {
      const day = format(d.date, 'yyyy-MM-dd');
      if (!dailyDataMap[day]) {
        dailyDataMap[day] = { date: d.date, platforms: {} };
      }
      if(!dailyDataMap[day].platforms[d.channel]){
        dailyDataMap[day].platforms[d.channel] = {...d};
      } else {
        dailyDataMap[day].platforms[d.channel].gmv += d.gmv;
        dailyDataMap[day].platforms[d.channel].adsSpent += d.adsSpent;
        dailyDataMap[day].platforms[d.channel].units += d.units;
      }
      
      if (!channelDataMap[d.channel]) {
          channelDataMap[d.channel] = { gmv: 0, adsSpent: 0, units: 0 };
      }
      channelDataMap[d.channel].gmv += d.gmv;
      channelDataMap[d.channel].adsSpent += d.adsSpent;
      channelDataMap[d.channel].units += d.units;
    });

    const chartData = Object.values(dailyDataMap).map(dayData => {
        let totalDayGmv = 0, totalDayAds = 0, totalDayUnits = 0;
        Object.values(dayData.platforms).forEach(p => {
            totalDayGmv += p.gmv;
            totalDayAds += p.adsSpent;
            totalDayUnits += p.units;
        });
        
        return {
            date: dayData.date,
            day: format(dayData.date, 'dd/MM'),
            gmv: totalDayGmv,
            adsSpent: totalDayAds,
            tacos: totalDayGmv > 0 ? (totalDayAds / totalDayGmv) : 0,
            units: totalDayUnits,
            avgAsp: totalDayUnits > 0 ? totalDayGmv / totalDayUnits : 0,
            platforms: Object.values(dayData.platforms)
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
      if (sortConfig.key === 'date') {
        const valA = a.date.getTime();
        const valB = b.date.getTime();
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      const valA = a[sortConfig.key as keyof typeof a] as number;
      const valB = b[sortConfig.key as keyof typeof b] as number;
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
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

    return { kpis, chartData: chartData.sort((a, b) => a.date.getTime() - b.date.getTime()), tableData: sortedTableData, channelPerformance: sortedChannelData };
  };

  const { currentPeriod, comparisonPeriod } = useMemo(() => {
    if (!data) return { currentPeriod: processPeriodData([]), comparisonPeriod: processPeriodData([]) };

    const currentData = data.filter(d => 
        (!dateRange?.from || d.date >= dateRange.from) &&
        (!dateRange?.to || d.date <= dateRange.to)
    );

    const comparisonData = isComparing ? data.filter(d =>
        (!compareDateRange?.from || d.date >= compareDateRange.from) &&
        (!compareDateRange?.to || d.date <= compareDateRange.to)
    ) : [];
    
    return {
        currentPeriod: processPeriodData(currentData),
        comparisonPeriod: processPeriodData(comparisonData),
    };
  }, [data, dateRange, compareDateRange, isComparing, sortConfig, channelSortConfig]);
  
  const mergedChartData = useMemo(() => {
    if (!isComparing) return currentPeriod.chartData;
    
    const maxLength = Math.max(currentPeriod.chartData.length, comparisonPeriod.chartData.length);
    const merged = [];

    for (let i=0; i<maxLength; i++) {
        const current = currentPeriod.chartData[i];
        const compare = comparisonPeriod.chartData[i];
        merged.push({
            day: current?.day || `Day ${i+1}`,
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
  
  const toggleCollapsible = (date: string) => {
    setOpenCollapsibles(prev => 
      prev.includes(date) ? prev.filter(d => d !== date) : [...prev, date]
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
                <CalendarIcon className="w-5 h-5 text-amber-600" />
                Daily P&L
            </div>
            <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" asChild>
                  <a href="/pnl-template.csv" download>
                    <Download className="w-4 h-4 mr-2" />
                    Download Template
                  </a>
                </Button>
                <Button size="sm" variant="outline" onClick={() => document.getElementById('daily-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import from File
                </Button>
                <Button size="sm" variant="outline" onClick={onCloudImport}>
                    <Cloud className="w-4 h-4 mr-2" />
                    Import from Sheet
                </Button>
            </div>
            <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
          </CardTitle>
          <CardDescription>
            Import your daily P&L data to see visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-16">
          <p>No daily P&L data loaded. Please import a file.</p>
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
                        <CalendarIcon className="w-5 h-5 text-amber-600" />
                        Daily P&L
                    </CardTitle>
                    <CardDescription>
                        Operational view for daily performance and ad spend efficiency.
                    </CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-wrap justify-end">
                    <div className="flex items-center gap-2">
                        <Switch id="compare-mode" checked={isComparing} onCheckedChange={setIsComparing} />
                        <Label htmlFor="compare-mode" className="flex items-center gap-1.5"><GitCompareArrows className="w-4 h-4" /> Compare</Label>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                             <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-full sm:w-[260px] justify-start text-left font-normal h-9",
                                !dateRange && "text-muted-foreground"
                                )}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (
                                dateRange.to ? (
                                    <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                    </>
                                ) : (
                                    format(dateRange.from, "LLL dd, y")
                                )
                                ) : (
                                <span>Pick a date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={setDateRange}
                                numberOfMonths={2}
                            />
                        </PopoverContent>
                    </Popover>
                    {isComparing && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="compare-date"
                                    variant={"outline"}
                                    className={cn(
                                    "w-full sm:w-[260px] justify-start text-left font-normal h-9",
                                    !compareDateRange && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {compareDateRange?.from ? (
                                    compareDateRange.to ? (
                                        <>
                                        {format(compareDateRange.from, "LLL dd, y")} -{" "}
                                        {format(compareDateRange.to, "LLL dd, y")}
                                        </>
                                    ) : (
                                        format(compareDateRange.from, "LLL dd, y")
                                    )
                                    ) : (
                                    <span>Pick a compare period</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={compareDateRange?.from}
                                    selected={compareDateRange}
                                    onSelect={setCompareDateRange}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                    <TooltipProvider>
                         <UiTooltip>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" asChild>
                                    <a href="/pnl-template.csv" download><Download className="w-4 h-4" /></a>
                                </Button>
                            </UiTooltipTrigger>
                            <UiTooltipContent>Download Template</UiTooltipContent>
                        </UiTooltip>
                        <UiTooltip>
                             <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => document.getElementById('daily-upload')?.click()}>
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
                    <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
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
                    <XAxis dataKey="day" fontSize={12} />
                    <YAxis yAxisId="left" label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} stroke="hsl(var(--chart-1))" tickFormatter={(value) => `₹${(value as number / 1000).toFixed(0)}k`} />
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
                <CardTitle className="text-base">Daily Breakdown Table</CardTitle>
                 <CardDescription>Metrics for each day in the selected range. Click a row to see platform details.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-y-auto max-h-[600px] custom-scrollbar">
                <Table>
                    <TableHeader className="sticky top-0 bg-card z-10">
                        <TableRow>
                            <TableHead className="w-12"></TableHead>
                            <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIcon('date')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('gmv')}>GMV {getSortIcon('gmv')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('tacos')}>TACOS {getSortIcon('tacos')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('units')}>Units {getSortIcon('units')}</TableHead>
                            <TableHead className="cursor-pointer text-right" onClick={() => requestSort('avgAsp')}>Avg ASP {getSortIcon('avgAsp')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    
                        {currentPeriod.tableData.map(item => {
                            const dateKey = format(item.date, 'yyyy-MM-dd');
                            const isOpen = openCollapsibles.includes(dateKey);
                            return (
                                <Collapsible asChild key={dateKey} open={isOpen} onOpenChange={() => toggleCollapsible(dateKey)}>
                                    <tbody className="[&_tr:last-child]:border-0">
                                        <TableRow className="cursor-pointer" onClick={() => toggleCollapsible(dateKey)}>
                                            <TableCell>
                                                <CollapsibleTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                    </Button>
                                                </CollapsibleTrigger>
                                            </TableCell>
                                            <TableCell className="font-medium">{format(item.date, 'MMM dd, yyyy')}</TableCell>
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
