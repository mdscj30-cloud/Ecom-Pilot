"use client";

import { Bar, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Calendar as CalendarIcon, Upload, Cloud, Download, AlertTriangle, CheckCircle } from "lucide-react";
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
import { format, subDays, startOfToday, startOfYesterday } from 'date-fns';
import KpiCard from '../kpi-card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface PnlTabProps {
  data: ProcessedSheetData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
};

export default function PnlTab({ data, onFileUpload, onCloudImport }: PnlTabProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());

  const { todayData, yesterdayData } = useMemo(() => {
    if (!data) return { todayData: null, yesterdayData: null };
    const todayStr = format(selectedDate, 'yyyy-MM-dd');
    const yesterdayStr = format(startOfYesterday(), 'yyyy-MM-dd');
    
    return {
      todayData: data.filter(d => format(d.date, 'yyyy-MM-dd') === todayStr),
      yesterdayData: data.filter(d => format(d.date, 'yyyy-MM-dd') === yesterdayStr)
    };
  }, [data, selectedDate]);

  const { dailyKpis, dailyChannelPerformance, dailyChartData } = useMemo(() => {
    const kpis = { todayGmv: 0, todayAds: 0, todayTacos: 0, unitsSold: 0, avgAsp: 0 };
    if (!todayData || todayData.length === 0) {
      return { dailyKpis: kpis, dailyChannelPerformance: [], dailyChartData: [] };
    }

    const channelDataMap: { [key: string]: { gmv: number; ads: number; units: number } } = {};
    
    todayData.forEach(d => {
      kpis.todayGmv += d.gmv;
      kpis.todayAds += d.adsSpent;
      kpis.unitsSold += d.units;

      if (!channelDataMap[d.channel]) {
        channelDataMap[d.channel] = { gmv: 0, ads: 0, units: 0 };
      }
      channelDataMap[d.channel].gmv += d.gmv;
      channelDataMap[d.channel].ads += d.adsSpent;
      channelDataMap[d.channel].units += d.units;
    });

    kpis.todayTacos = kpis.todayGmv > 0 ? kpis.todayAds / kpis.todayGmv : 0;
    kpis.avgAsp = kpis.unitsSold > 0 ? kpis.todayGmv / kpis.unitsSold : 0;

    const performance = Object.keys(channelDataMap).map(channel => {
      const today = channelDataMap[channel];
      const yesterdayGmv = yesterdayData?.filter(d => d.channel === channel).reduce((sum, d) => sum + d.gmv, 0) || 0;
      const deltaVsYesterday = yesterdayGmv > 0 ? (today.gmv - yesterdayGmv) / yesterdayGmv : today.gmv > 0 ? Infinity : 0;
      
      const last7DaysData = data?.filter(d => 
        d.channel === channel && 
        d.date < selectedDate && 
        d.date >= subDays(selectedDate, 7)
      ) || [];
      
      const avgLast7DaysAds = last7DaysData.reduce((sum, d) => sum + d.adsSpent, 0) / 7;
      const avgLast7DaysGmv = last7DaysData.reduce((sum, d) => sum + d.gmv, 0) / 7;

      const spendAlert = today.ads > avgLast7DaysAds * 1.3;
      const revenueAlert = today.gmv < avgLast7DaysGmv * 0.85;

      return {
        channel,
        gmv: today.gmv,
        ads: today.ads,
        tacos: today.gmv > 0 ? today.ads / today.gmv : 0,
        units: today.units,
        avgAsp: today.units > 0 ? today.gmv / today.units : 0,
        deltaVsYesterday,
        spendAlert,
        revenueAlert
      };
    });

    return { dailyKpis: kpis, dailyChannelPerformance: performance, dailyChartData: performance };
  }, [todayData, yesterdayData, data, selectedDate]);


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
                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={selectedDate} onSelect={(day) => day && setSelectedDate(day)} initialFocus />
                        </PopoverContent>
                    </Popover>
                    <TooltipProvider>
                         <Tooltip>
                            <TooltipContent>Download Template</TooltipContent>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" asChild>
                                    <a href="/pnl-template.csv" download><Download className="w-4 h-4" /></a>
                                </Button>
                            </TooltipTrigger>
                        </Tooltip>
                        <Tooltip>
                            <TooltipContent>Import from file</TooltipContent>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={() => document.getElementById('daily-upload')?.click()}>
                                    <Upload className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                        </Tooltip>
                        <Tooltip>
                            <TooltipContent>Import from Google Sheet</TooltipContent>
                            <TooltipTrigger asChild>
                                <Button size="icon" variant="outline" className="h-9 w-9" onClick={onCloudImport}>
                                    <Cloud className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                        </Tooltip>
                    </TooltipProvider>
                    <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </div>
        </CardHeader>
      </Card>
      
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard title="Today GMV" value={`₹${dailyKpis.todayGmv.toLocaleString()}`} />
            <KpiCard title="Today Ads" value={`₹${dailyKpis.todayAds.toLocaleString()}`} />
            <KpiCard title="Today TACOS" value={`${(dailyKpis.todayTacos * 100).toFixed(2)}%`} />
            <KpiCard title="Units Sold" value={dailyKpis.unitsSold.toLocaleString()} />
            <KpiCard title="Avg ASP" value={`₹${dailyKpis.avgAsp.toFixed(0)}`} />
        </div>
      
        <Card>
            <CardHeader><CardTitle className='text-base'>Daily Ads Efficiency &amp; Alerts</CardTitle></CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Daily Ads vs GMV</h3>
                  <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <ComposedChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="channel" fontSize={12} />
                        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" />
                        <Tooltip content={<ChartTooltipContent formatter={(value) => `₹${Number(value).toLocaleString()}`} />} />
                        <Legend />
                        <Bar dataKey="gmv" yAxisId="left" fill="var(--color-gmv)" name="GMV" />
                        <Bar dataKey="ads" yAxisId="right" fill="var(--color-adsSpent)" name="Ads" />
                    </ComposedChart>
                  </ChartContainer>
                </div>
                <div className="overflow-x-auto">
                    <h3 className="text-sm font-semibold mb-2">Alerts &amp; Performance vs Yesterday</h3>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Channel</TableHead>
                                <TableHead>GMV</TableHead>
                                <TableHead>TACOS</TableHead>
                                <TableHead>Δ vs Yday</TableHead>
                                <TableHead>Alerts</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dailyChannelPerformance.map(item => (
                                <TableRow key={item.channel}>
                                    <TableCell className="font-medium">{item.channel}</TableCell>
                                    <TableCell>₹{item.gmv.toLocaleString()}</TableCell>
                                    <TableCell>{(item.tacos * 100).toFixed(2)}%</TableCell>
                                    <TableCell className={cn(item.deltaVsYesterday >= 0 ? 'text-green-600' : 'text-destructive')}>
                                        {isFinite(item.deltaVsYesterday) ? `${(item.deltaVsYesterday * 100).toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {item.spendAlert && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Overspend</Badge>}
                                            {item.revenueAlert && <Badge variant="destructive" className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Drop</Badge>}
                                            {!item.spendAlert && !item.revenueAlert && <Badge className="bg-green-600/20 text-green-700 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> OK</Badge>}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
