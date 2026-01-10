
"use client";

import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip, Bar } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Upload, Cloud, Download, ArrowUp, ArrowDown } from "lucide-react";
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
import { format, subDays, startOfToday, endOfToday, addDays } from 'date-fns';
import KpiCard from '../kpi-card';
import { cn } from '@/lib/utils';
import { DateRange } from 'react-day-picker';

interface PnlTabProps {
  data: ProcessedSheetData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))" },
};

type SortKey = 'date' | 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'avgAsp';

export default function PnlTab({ data, onFileUpload, onCloudImport }: PnlTabProps) {

  const defaultDateRange = {
    from: data && data.length > 0 ? data.reduce((min, p) => p.date < min ? p.date : min, data[0].date) : startOfToday(),
    to: data && data.length > 0 ? data.reduce((max, p) => p.date > max ? p.date : max, data[0].date) : endOfToday(),
  }

  const [dateRange, setDateRange] = useState<DateRange | undefined>(defaultDateRange);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
  
  React.useEffect(() => {
    if (data && data.length > 0) {
      const minDate = data.reduce((min, p) => p.date < min ? p.date : min, data[0].date);
      const maxDate = data.reduce((max, p) => p.date > max ? p.date : max, data[0].date);
      setDateRange({ from: minDate, to: maxDate });
    }
  }, [data]);

  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter(d => 
      (!dateRange?.from || d.date >= dateRange.from) &&
      (!dateRange?.to || d.date <= dateRange.to)
    );
  }, [data, dateRange]);

  const { dailyKpis, dailyChartData, dailyTableData } = useMemo(() => {
    const kpis = { totalGmv: 0, totalAds: 0, totalTacos: 0, totalUnits: 0, avgAsp: 0 };
    if (filteredData.length === 0) {
      return { dailyKpis: kpis, dailyChartData: [], dailyTableData: [] };
    }

    const dailyDataMap: { [key: string]: { date: Date, gmv: number; adsSpent: number; units: number } } = {};
    
    filteredData.forEach(d => {
      const day = format(d.date, 'yyyy-MM-dd');
      if (!dailyDataMap[day]) {
        dailyDataMap[day] = { date: d.date, gmv: 0, adsSpent: 0, units: 0 };
      }
      dailyDataMap[day].gmv += d.gmv;
      dailyDataMap[day].adsSpent += d.adsSpent;
      dailyDataMap[day].units += d.units;
    });

    const chartData = Object.values(dailyDataMap).map(d => ({
        date: d.date,
        day: format(d.date, 'dd/MM'),
        gmv: d.gmv,
        adsSpent: d.adsSpent,
        tacos: d.gmv > 0 ? (d.adsSpent / d.gmv) * 100 : 0,
        units: d.units,
        avgAsp: d.units > 0 ? d.gmv / d.units : 0,
    }));
    
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
      const valA = a[sortConfig.key];
      const valB = b[sortConfig.key];
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });

    return { dailyKpis: kpis, dailyChartData: chartData.sort((a, b) => a.date.getTime() - b.date.getTime()), dailyTableData: sortedTableData };
  }, [filteredData, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
        direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'desc' ? <ArrowDown className="w-3 h-3 ml-1" /> : <ArrowUp className="w-3 h-3 ml-1" />;
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
                 <div className="flex items-center gap-2">
                    <Popover>
                        <PopoverTrigger asChild>
                             <Button
                                id="date"
                                variant={"outline"}
                                className={cn(
                                "w-[300px] justify-start text-left font-normal",
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
                    <TooltipProvider>
                         <UiTooltip>
                            <UiTooltipContent>Download Template</UiTooltipContent>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" asChild>
                                    <a href="/pnl-template.csv" download><Download className="w-4 h-4" /></a>
                                </Button>
                            </UiTooltipTrigger>
                        </UiTooltip>
                        <UiTooltip>
                             <UiTooltipContent>Import from file</UiTooltipContent>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => document.getElementById('daily-upload')?.click()}>
                                    <Upload className="w-4 h-4" />
                                </Button>
                            </UiTooltipTrigger>
                        </UiTooltip>
                        <UiTooltip>
                            <UiTooltipContent>Import from Google Sheet</UiTooltipContent>
                            <UiTooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={onCloudImport}>
                                    <Cloud className="w-4 h-4" />
                                </Button>
                            </UiTooltipTrigger>
                        </UiTooltip>
                    </TooltipProvider>
                    <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </div>
        </CardHeader>
      </Card>
      
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard title="Total GMV" value={`₹${dailyKpis.totalGmv.toLocaleString()}`} />
            <KpiCard title="Total Ads" value={`₹${dailyKpis.totalAds.toLocaleString()}`} />
            <KpiCard title="Avg TACOS" value={`${(dailyKpis.totalTacos * 100).toFixed(2)}%`} />
            <KpiCard title="Total Units" value={dailyKpis.totalUnits.toLocaleString()} />
            <KpiCard title="Avg ASP" value={`₹${dailyKpis.avgAsp.toFixed(0)}`} />
        </div>
      
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
            <Card className="xl:col-span-3">
                <CardHeader>
                    <CardTitle className="text-base">Performance Over Time</CardTitle>
                    <CardDescription>GMV, Ads Spent, and TACOS trends for the selected period.</CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ComposedChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" fontSize={12} />
                        <YAxis yAxisId="left" label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }} stroke="hsl(var(--chart-1))" />
                        <YAxis yAxisId="right" orientation="right" label={{ value: 'TACOS (%)', angle: -90, position: 'insideRight' }} stroke="hsl(var(--chart-3))" />
                        <Tooltip content={<ChartTooltipContent formatter={(value, name) => name === 'tacos' ? `${Number(value).toFixed(2)}%` : `₹${Number(value).toLocaleString()}`} />} />
                        <Legend />
                        <Bar dataKey="gmv" yAxisId="left" fill="var(--color-gmv)" name="GMV" />
                        <Bar dataKey="adsSpent" yAxisId="left" fill="var(--color-adsSpent)" name="Ads Spent" />
                        <Line type="monotone" dataKey="tacos" yAxisId="right" stroke="var(--color-tacos)" strokeWidth={2} name="TACOS" dot={false} />
                    </ComposedChart>
                  </ChartContainer>
                </CardContent>
            </Card>
            <Card className="xl:col-span-2">
                 <CardHeader>
                    <CardTitle className="text-base">Daily Breakdown</CardTitle>
                     <CardDescription>Metrics for each day in the selected range.</CardDescription>
                </CardHeader>
                <CardContent className="overflow-y-auto max-h-[350px] custom-scrollbar">
                    <Table>
                        <TableHeader className="sticky top-0 bg-card">
                            <TableRow>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('date')}>Date {getSortIcon('date')}</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('gmv')}>GMV {getSortIcon('gmv')}</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('tacos')}>TACOS {getSortIcon('tacos')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyTableData.map(item => (
                                <TableRow key={format(item.date, 'yyyy-MM-dd')}>
                                    <TableCell className="font-medium">{format(item.date, 'MMM dd')}</TableCell>
                                    <TableCell>₹{item.gmv.toLocaleString()}</TableCell>
                                    <TableCell>{item.tacos.toFixed(2)}%</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

