"use client";

import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { BarChart2, Upload, Cloud, Download, ArrowUp, ArrowDown } from "lucide-react";
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
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { subMonths, startOfMonth } from 'date-fns';

interface GrowthTabProps {
  data: ProcessedSheetData[] | null;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  adsSpent: { label: "Ads Spent", color: "hsl(var(--chart-2))" },
  tacos: { label: "TACOS", color: "hsl(var(--chart-3))" },
};

type SortKey = 'gmv' | 'adsSpent' | 'tacos' | 'units' | 'mom';

export default function GrowthTab({ data, onFileUpload, onCloudImport }: GrowthTabProps) {
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: 'asc' | 'desc' }>({ key: 'gmv', direction: 'desc' });

  const { years, months, channels } = useMemo(() => {
    if (!data) return { years: [], months: [], channels: [] };
    const yearSet = new Set<string>();
    const monthSet = new Set<string>();
    const channelSet = new Set<string>();
    data.forEach(d => {
      yearSet.add(d.year);
      monthSet.add(d.month);
      channelSet.add(d.channel);
    });
    return {
      years: Array.from(yearSet).sort((a, b) => b.localeCompare(a)),
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      channels: ['All', ...Array.from(channelSet).sort()]
    };
  }, [data]);
  
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || 'All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
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
      (selectedMonth === 'All' || d.month === selectedMonth) &&
      (selectedChannel === 'All' || d.channel === selectedChannel)
    );
  }, [data, selectedYear, selectedMonth, selectedChannel]);

  const previousMonthData = useMemo(() => {
    if (!data || selectedMonth === 'All' || selectedYear === 'All') return null;

    const currentMonthDate = startOfMonth(new Date(`${selectedMonth} 1, ${selectedYear}`));
    const previousMonthDate = subMonths(currentMonthDate, 1);
    const prevMonth = previousMonthDate.toLocaleString('default', { month: 'short' });
    const prevYear = previousMonthDate.getFullYear().toString();
    
    return data.filter(d => d.month === prevMonth && d.year === prevYear);
  }, [data, selectedYear, selectedMonth]);

  const { kpis, channelPerformance, chartData } = useMemo(() => {
    const kpis = { totalGmv: 0, totalAdsSpent: 0, totalUnits: 0, overallTacos: 0, avgAsp: 0, momGrowth: 0 };
    if (filteredData.length === 0) return { kpis, channelPerformance: [], chartData: [] };

    const gmvByChannel: { [key: string]: number } = {};
    const adsByChannel: { [key: string]: number } = {};
    const unitsByChannel: { [key: string]: number } = {};

    filteredData.forEach(d => {
      kpis.totalGmv += d.gmv;
      kpis.totalAdsSpent += d.adsSpent;
      kpis.totalUnits += d.units;
      gmvByChannel[d.channel] = (gmvByChannel[d.channel] || 0) + d.gmv;
      adsByChannel[d.channel] = (adsByChannel[d.channel] || 0) + d.adsSpent;
      unitsByChannel[d.channel] = (unitsByChannel[d.channel] || 0) + d.units;
    });

    kpis.overallTacos = kpis.totalGmv > 0 ? kpis.totalAdsSpent / kpis.totalGmv : 0;
    kpis.avgAsp = kpis.totalUnits > 0 ? kpis.totalGmv / kpis.totalUnits : 0;
    
    let prevMonthTotalGmv = 0;
    if (previousMonthData) {
      previousMonthData.forEach(d => {
        if(selectedChannel === 'All' || d.channel === selectedChannel) {
          prevMonthTotalGmv += d.gmv;
        }
      });
      kpis.momGrowth = prevMonthTotalGmv > 0 ? (kpis.totalGmv - prevMonthTotalGmv) / prevMonthTotalGmv : kpis.totalGmv > 0 ? Infinity : 0;
    }
    
    const performanceData = Object.keys(gmvByChannel).map(ch => {
        const gmv = gmvByChannel[ch];
        const adsSpent = adsByChannel[ch];
        const units = unitsByChannel[ch];
        const tacos = gmv > 0 ? adsSpent / gmv : 0;
        const avgAsp = units > 0 ? gmv / units : 0;
        const gmvShare = kpis.totalGmv > 0 ? gmv / kpis.totalGmv : 0;

        let mom = 0;
        if (previousMonthData) {
            const prevMonthChannelGmv = previousMonthData.filter(d => d.channel === ch).reduce((sum, d) => sum + d.gmv, 0);
            mom = prevMonthChannelGmv > 0 ? (gmv - prevMonthChannelGmv) / prevMonthChannelGmv : gmv > 0 ? Infinity : 0;
        }
        
        let quadrant: 'Scale Hard' | 'Optimize' | 'Fix or Pause' | 'Harvest' | 'N/A' = 'N/A';
        const prevTacos = previousMonthData ? previousMonthData.filter(d => d.channel === ch).reduce((sum, d) => sum + d.adsSpent, 0) / previousMonthData.filter(d => d.channel === ch).reduce((sum, d) => sum + d.gmv, 0) : 0;

        if (mom > 0 && tacos < prevTacos) quadrant = 'Scale Hard';
        else if (mom > 0 && tacos >= prevTacos) quadrant = 'Optimize';
        else if (mom <= 0 && tacos >= prevTacos) quadrant = 'Fix or Pause';
        else if (mom <= 0 && tacos < prevTacos) quadrant = 'Harvest';

        return { channel: ch, gmv, adsSpent, tacos, units, avgAsp, mom, gmvShare, quadrant };
    });

    const sortedPerformance = [...performanceData].sort((a, b) => {
        if (sortConfig.direction === 'asc') {
            return a[sortConfig.key] - b[sortConfig.key];
        }
        return b[sortConfig.key] - a[sortConfig.key];
    });

    return { kpis, channelPerformance: sortedPerformance, chartData: performanceData };

  }, [filteredData, previousMonthData, sortConfig]);

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

  const getQuadrantBadge = (quadrant: string) => {
    switch (quadrant) {
        case 'Scale Hard': return <Badge className="bg-green-600/20 text-green-700 hover:bg-green-600/30">{quadrant}</Badge>;
        case 'Optimize': return <Badge className="bg-sky-600/20 text-sky-700 hover:bg-sky-600/30">{quadrant}</Badge>;
        case 'Fix or Pause': return <Badge variant="destructive">{quadrant}</Badge>;
        case 'Harvest': return <Badge className="bg-amber-500/20 text-amber-700 hover:bg-amber-500/30">{quadrant}</Badge>;
        default: return <Badge variant="outline">{quadrant}</Badge>;
    }
  }


  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-primary" />
              Growth Analysis
            </div>
            <div className='flex items-center gap-2'>
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
            Import your growth data to see visualizations and analysis.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-16">
          <p>No growth data loaded. Please import a file.</p>
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
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}><SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger><SelectContent>{['All', ...months].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}><SelectTrigger className="w-[120px] h-9"><SelectValue /></SelectTrigger><SelectContent>{channels.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select>
               </div>
            </div>
         </CardHeader>
       </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <KpiCard title="Total GMV" value={`₹${(kpis.totalGmv / 100000).toFixed(2)} L`} />
            <KpiCard title="Total Ads Spent" value={`₹${(kpis.totalAdsSpent / 1000).toFixed(2)} K`} />
            <KpiCard title="Overall TACOS" value={`${(kpis.overallTacos * 100).toFixed(2)}%`} className={cn(kpis.overallTacos < 0.1 ? 'text-green-600' : kpis.overallTacos > 0.2 ? 'text-destructive' : 'text-amber-600')} />
            <KpiCard title="Total Units" value={kpis.totalUnits.toLocaleString()} />
            <KpiCard title="Avg ASP" value={`₹${kpis.avgAsp.toFixed(0)}`} />
            <KpiCard title="MOM Growth %" value={`${isFinite(kpis.momGrowth) ? (kpis.momGrowth * 100).toFixed(1) : 'N/A'}%`} className={cn(kpis.momGrowth > 0 ? 'text-green-600' : 'text-destructive')} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Platform-wise Ads vs GMV</CardTitle>
                    <CardDescription>High Ads + Low GMV is inefficient. Low Ads + High GMV shows organic strength.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <ComposedChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="channel" angle={-45} textAnchor="end" height={60} />
                        <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--chart-1))" label={{ value: 'GMV (₹)', angle: -90, position: 'insideLeft' }} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-2))" label={{ value: 'Ads Spent (₹)', angle: -90, position: 'insideRight' }} />
                        <Tooltip content={<ChartTooltipContent formatter={(value, name) => `₹${Number(value).toLocaleString()}`} />} />
                        <Legend />
                        <Bar dataKey="gmv" yAxisId="left" fill="var(--color-gmv)" name="GMV" />
                        <Line type="monotone" dataKey="adsSpent" yAxisId="right" stroke="var(--color-adsSpent)" strokeWidth={2} name="Ads Spent" />
                    </ComposedChart>
                </ChartContainer>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">TACOS by Channel</CardTitle>
                    <CardDescription>Indicates advertising efficiency. Lower is better.</CardDescription>
                </CardHeader>
                <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px] w-full">
                    <Bar dataKey="tacos" yAxisId="left" fill="var(--color-tacos)" name="TACOS">
                        <ChartLegend content={<ChartLegendContent />} />
                    </Bar>
                </ChartContainer>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader><CardTitle className='text-base'>Channel Performance &amp; Growth Quadrant</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Channel</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('gmv')}>GMV {getSortIcon('gmv')}</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('adsSpent')}>Ads Spent {getSortIcon('adsSpent')}</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('tacos')}>TACOS {getSortIcon('tacos')}</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('units')}>Units {getSortIcon('units')}</TableHead>
                                <TableHead>Avg ASP</TableHead>
                                <TableHead className="cursor-pointer" onClick={() => requestSort('mom')}>MOM % {getSortIcon('mom')}</TableHead>
                                <TableHead>GMV Share %</TableHead>
                                <TableHead>Growth Quadrant</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {channelPerformance.map(item => (
                                <TableRow key={item.channel}>
                                    <TableCell className="font-medium">{item.channel}</TableCell>
                                    <TableCell>₹{item.gmv.toLocaleString()}</TableCell>
                                    <TableCell>₹{item.adsSpent.toLocaleString()}</TableCell>
                                    <TableCell className={cn(item.tacos > kpis.overallTacos ? 'text-destructive' : 'text-green-600')}>{(item.tacos * 100).toFixed(2)}%</TableCell>
                                    <TableCell>{item.units.toLocaleString()}</TableCell>
                                    <TableCell>₹{item.avgAsp.toFixed(2)}</TableCell>
                                    <TableCell className={cn(item.mom >= 0 ? 'text-green-600' : 'text-destructive')}>
                                        {isFinite(item.mom) ? `${(item.mom * 100).toFixed(1)}%` : 'N/A'}
                                    </TableCell>
                                    <TableCell>{(item.gmvShare * 100).toFixed(2)}%</TableCell>
                                    <TableCell>{getQuadrantBadge(item.quadrant)}</TableCell>
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
