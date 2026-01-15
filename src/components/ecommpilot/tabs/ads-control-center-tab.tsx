
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Line, ComposedChart, XAxis, YAxis, CartesianGrid, Legend, Tooltip as RechartsTooltip, Bar } from 'recharts';
import { DateRange } from 'react-day-picker';
import { subDays, format, startOfToday, endOfToday } from 'date-fns';
import {
  Campaign,
  AdGroup,
  AdsDailyMetrics,
  InventorySnapshot,
  ControlThresholds,
  DecisionEngineOutput,
} from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from '../kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Flame, GitCommit, AlertOctagon, Bot, ChevronsRight, Edit, Save, X, RadioTower, Zap, Upload, Cloud, Download, ChevronRight, ChevronDown, Calendar as CalendarIcon, GitCompareArrows, ArrowUp, ArrowDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AdsControlCenterTabProps {
    campaigns: Campaign[];
    adGroups: AdGroup[];
    adsDailyMetrics: AdsDailyMetrics[];
    inventorySnapshots: InventorySnapshot[];
    decisionEngineOutputs: DecisionEngineOutput[];
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCloudImport: () => void;
}

type PlatformMatrix = {
  [platform: string]: {
    [metric: string]: {
      [date: string]: number;
    }
  }
};

const METRIC_CONFIG: {key: keyof AdsDailyMetrics, name: string, format: (val: number) => string | number}[] = [
    { key: 'gmv', name: 'GMV (₹)', format: (val) => `₹${val.toLocaleString()}` },
    { key: 'ads_spent', name: 'Ad Spend (₹)', format: (val) => `₹${val.toLocaleString()}` },
    { key: 'roas', name: 'ROAS', format: (val) => val.toFixed(2) },
    { key: 'impressions', name: 'Impressions', format: (val) => val.toLocaleString() },
    { key: 'clicks', name: 'Clicks', format: (val) => val.toLocaleString() },
    { key: 'orders', name: 'Orders', format: (val) => val.toLocaleString() },
    { key: 'acos', name: 'ACOS', format: (val) => `${(val * 100).toFixed(1)}%` },
];


export default function AdsControlCenterTab({
    campaigns,
    adGroups,
    adsDailyMetrics,
    inventorySnapshots,
    decisionEngineOutputs,
    onFileUpload,
    onCloudImport,
}: AdsControlCenterTabProps) {
  const [controlThresholds, setControlThresholds] = useState<ControlThresholds[]>([]);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [editedThresholds, setEditedThresholds] = useState<Partial<ControlThresholds>>({});
  const [openPlatforms, setOpenPlatforms] = useState<string[]>([]);
  
  const [isComparing, setIsComparing] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: subDays(startOfToday(), 7), to: endOfToday() });
  const [compareDateRange, setCompareDateRange] = useState<DateRange | undefined>({ from: subDays(startOfToday(), 14), to: subDays(endOfToday(), 7) });
  const [selectedChartPlatform, setSelectedChartPlatform] = useState<string>('All');


  const allPlatforms = useMemo(() => Array.from(new Set(adsDailyMetrics.map(m => m.platform_id))), [adsDailyMetrics]);

  useEffect(() => {
    setControlThresholds(prev => {
        const existingPlatforms = new Set(prev.map(p => p.platform_id));
        const newPlatforms = allPlatforms.filter(p => !existingPlatforms.has(p));
        
        const newThresholds = newPlatforms.map(platform => ({
            id: `${platform}_default`,
            platform_id: platform,
            phase: 'Default',
            min_roas: 2.0,
            target_roas: 3.0,
            max_tacos: 0.35,
            min_stock_cover: 10,
            pause_stock_cover: 5,
            scale_budget_pct: 0.20,
            cut_budget_pct: 0.20,
        }));
        
        return [...prev, ...newThresholds];
    });
    setOpenPlatforms(allPlatforms);
  }, [allPlatforms]);
  

  const processPeriodData = (data: AdsDailyMetrics[], platformFilter: string) => {
      if (!data) return { kpis: { totalSpend: 0, totalGmv: 0, blendedRoas: 0 }, chartData: [], platformPerformance: [] };

      const filteredDataForChart = platformFilter === 'All' ? data : data.filter(d => d.platform_id === platformFilter);

      const kpis = data.reduce((acc, item) => {
          acc.totalSpend += item.ads_spent || 0;
          acc.totalGmv += item.gmv || 0;
          return acc;
      }, { totalSpend: 0, totalGmv: 0 });

      const blendedRoas = kpis.totalGmv / kpis.totalSpend || 0;

      const dailyDataMap: { [day: string]: any } = {};
      filteredDataForChart.forEach(metric => {
          const day = format(new Date(metric.date), 'dd/MM');
          if (!dailyDataMap[day]) {
              dailyDataMap[day] = { day, gmv: 0, ads_spent: 0 };
          }
          dailyDataMap[day].gmv += metric.gmv;
          dailyDataMap[day].ads_spent += metric.ads_spent;
      });

      const chartData = Object.values(dailyDataMap).map(d => ({
          ...d,
          roas: d.gmv / d.ads_spent || 0
      }));

      const platformMap: { [key: string]: { gmv: number, spend: number } } = {};
      data.forEach(metric => {
        if (!platformMap[metric.platform_id]) {
          platformMap[metric.platform_id] = { gmv: 0, spend: 0 };
        }
        platformMap[metric.platform_id].gmv += metric.gmv;
        platformMap[metric.platform_id].spend += metric.ads_spent;
      });

      const platformPerformance = Object.entries(platformMap).map(([name, data]) => ({
        name,
        gmv: data.gmv,
        spend: data.spend,
        roas: data.gmv / data.spend || 0,
      }));

      return { kpis: { ...kpis, blendedRoas }, chartData, platformPerformance };
  };

  const { currentPeriod, comparisonPeriod, matrixData, dates } = useMemo(() => {
    const filterDataByRange = (range: DateRange | undefined) => {
        if (!range?.from || !range.to) return [];
        return adsDailyMetrics.filter(d => {
            const date = new Date(d.date);
            return date >= range.from! && date <= range.to!;
        });
    };

    const currentData = filterDataByRange(dateRange);
    const compareData = isComparing ? filterDataByRange(compareDateRange) : [];

    const matrix: PlatformMatrix = {};
    const dateSet = new Set<string>();

    currentData.forEach(metric => {
        const platform = metric.platform_id;
        const date = format(new Date(metric.date), 'yyyy-MM-dd');
        dateSet.add(date);
        if (!matrix[platform]) matrix[platform] = {};
        METRIC_CONFIG.forEach(config => {
            const key = config.key;
            if (!matrix[platform][key]) matrix[platform][key] = {};
            matrix[platform][key][date] = (matrix[platform][key][date] || 0) + (metric[key] as number);
        });
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return {
        currentPeriod: processPeriodData(currentData, selectedChartPlatform),
        comparisonPeriod: processPeriodData(compareData, selectedChartPlatform),
        matrixData: matrix,
        dates: sortedDates
    };
  }, [adsDailyMetrics, dateRange, compareDateRange, isComparing, selectedChartPlatform]);

  const criticalAlerts = useMemo(() => {
      if (!isComparing || comparisonPeriod.platformPerformance.length === 0) return [];
      const alerts: {platform: string, message: string, type: 'CRITICAL' | 'OPPORTUNITY' | 'EFFICIENCY'}[] = [];

      currentPeriod.platformPerformance.forEach(current => {
          const compare = comparisonPeriod.platformPerformance.find(c => c.name === current.name);
          if (!compare) return;

          const roasChange = compare.roas > 0 ? (current.roas - compare.roas) / compare.roas : 0;
          const spendChange = compare.spend > 0 ? (current.spend - compare.spend) / compare.spend : 0;
          const gmvChange = compare.gmv > 0 ? (current.gmv - compare.gmv) / compare.gmv : 0;

          // ROAS Drop Alert
          if (roasChange < -0.25) { 
              alerts.push({
                  platform: current.name,
                  message: `ROAS dropped by ${Math.abs(roasChange * 100).toFixed(0)}% to ${current.roas.toFixed(2)}.`,
                  type: 'CRITICAL'
              });
          }

          // Wasted Spend Alert
          if (spendChange > 0.5 && gmvChange < spendChange / 2) {
               alerts.push({
                  platform: current.name,
                  message: `Spend is up ${Math.abs(spendChange * 100).toFixed(0)}% but GMV growth is lagging significantly.`,
                  type: 'EFFICIENCY'
              });
          }

          // Opportunity Alert
          if (current.roas > 4.0 && roasChange > 0.1) {
             alerts.push({
                  platform: current.name,
                  message: `ROAS is strong and growing (${current.roas.toFixed(2)}). Consider scaling budget.`,
                  type: 'OPPORTUNITY'
              });
          }
      });
      return alerts;
  }, [currentPeriod, comparisonPeriod, isComparing]);
  
  const handleEdit = (threshold: ControlThresholds) => {
    setEditingThresholdId(threshold.id);
    setEditedThresholds(threshold);
  };

  const handleSave = (id: string) => {
    setControlThresholds(prev => prev.map(t => t.id === id ? { ...t, ...editedThresholds } : t));
    setEditingThresholdId(null);
    setEditedThresholds({});
  };

  const handleCancel = () => {
    setEditingThresholdId(null);
    setEditedThresholds({});
  };
  
  const handleThresholdChange = (field: keyof ControlThresholds, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
        setEditedThresholds(prev => ({ ...prev, [field]: numValue }));
    }
  };

  const togglePlatform = (platform: string) => {
    setOpenPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  const renderKpiCard = (title: string, current: number, compare: number, formatFn: (val: number) => string, higherIsBetter = true) => {
      const diff = isComparing && compare > 0 ? ((current - compare) / compare) * 100 : 0;
      const diffColor = higherIsBetter ? (diff >= 0 ? 'text-green-600' : 'text-destructive') : (diff < 0 ? 'text-green-600' : 'text-destructive');
      return (
          <Card>
              <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
                  <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</CardTitle>
                   {isComparing && diff !== 0 && (
                      <span className={cn("text-xs font-bold flex items-center gap-1", diffColor)}>
                          {diff > 0 ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>}
                          {Math.abs(diff).toFixed(1)}%
                      </span>
                  )}
              </CardHeader>
              <CardContent className="p-4 pt-1">
                  <h2 className="text-xl font-bold text-foreground mt-1">{formatFn(current)}</h2>
                  {isComparing && <p className="text-xs text-muted-foreground mt-1">vs {formatFn(compare)}</p>}
              </CardContent>
          </Card>
      );
  };

  const chartConfig = {
      gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
      ads_spent: { label: "Ad Spend", color: "hsl(var(--chart-2))" },
      roas: { label: "ROAS", color: "hsl(var(--chart-3))" },
      compare_gmv: { label: "Comp GMV", color: "hsl(var(--foreground))" },
  };

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <RadioTower className="w-6 h-6 text-primary" />
                        Ads Control Center
                    </CardTitle>
                    <CardDescription>Real-time, rules-based ad decisions across all platforms.</CardDescription>
                </div>
                 <div className="flex items-center gap-2 flex-wrap justify-end w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <Switch id="compare-mode" checked={isComparing} onCheckedChange={setIsComparing} />
                        <Label htmlFor="compare-mode" className="flex items-center gap-1.5"><GitCompareArrows className="w-4 h-4" /> Compare</Label>
                    </div>
                     <Popover>
                        <PopoverTrigger asChild>
                             <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}`: format(dateRange.from, "LLL dd, y")) : (<span>Pick a date</span>)}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/></PopoverContent>
                    </Popover>
                    {isComparing && (
                         <Popover>
                            <PopoverTrigger asChild>
                                 <Button id="compare-date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal h-9", !compareDateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {compareDateRange?.from ? (compareDateRange.to ? `${format(compareDateRange.from, "LLL dd, y")} - ${format(compareDateRange.to, "LLL dd, y")}`: format(compareDateRange.from, "LLL dd, y")) : (<span>Pick a period</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end"><Calendar initialFocus mode="range" defaultMonth={compareDateRange?.from} selected={compareDateRange} onSelect={setCompareDateRange} numberOfMonths={2}/></PopoverContent>
                        </Popover>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                         <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" asChild><a href="/ads-template.csv" download><Download className="h-4 w-4" /></a></Button></TooltipTrigger><TooltipContent><p>Download Template</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('ads-upload')?.click()}><Upload className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Import from .xlsx</p></TooltipContent></Tooltip>
                        <Tooltip><TooltipTrigger asChild><Button variant="outline" size="icon" className="h-9 w-9" onClick={onCloudImport}><Cloud className="h-4 w-4" /></Button></TooltipTrigger><TooltipContent><p>Import from Google Sheet</p></TooltipContent></Tooltip>
                    </TooltipProvider>
                    <input type="file" id="ads-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderKpiCard("Total Ad Spend", currentPeriod.kpis.totalSpend, comparisonPeriod.kpis.totalSpend, (val) => `₹${val.toLocaleString(undefined, {maximumFractionDigits:0})}`, false)}
            {renderKpiCard("Total GMV", currentPeriod.kpis.totalGmv, comparisonPeriod.kpis.totalGmv, (val) => `₹${val.toLocaleString(undefined, {maximumFractionDigits:0})}`)}
            {renderKpiCard("Blended ROAS", currentPeriod.kpis.blendedRoas, comparisonPeriod.kpis.blendedRoas, (val) => val.toFixed(2), true)}
        </div>
        
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Performance Over Time</CardTitle>
                <Select value={selectedChartPlatform} onValueChange={setSelectedChartPlatform}>
                    <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Select Platform" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Platforms</SelectItem>
                        {allPlatforms.map(p => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                 <ChartContainer config={chartConfig} className="h-[250px] w-full">
                    <ComposedChart data={currentPeriod.chartData}>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
                        <YAxis yAxisId="left" stroke="hsl(var(--chart-1))" tickFormatter={(value) => `₹${(value as number / 1000)}k`} />
                        <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--chart-3))" tickFormatter={(value) => value.toFixed(1)} />
                        <RechartsTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Bar dataKey="gmv" name="GMV" yAxisId="left" fill="var(--color-gmv)" radius={[4,4,0,0]} />
                        <Line type="monotone" dataKey="roas" name="ROAS" yAxisId="right" stroke="var(--color-roas)" strokeWidth={2} dot={false}/>
                        {isComparing && <Line type="monotone" dataKey="compare_gmv" name="Comp GMV" yAxisId="left" stroke="var(--color-compare_gmv)" strokeWidth={2} dot={false} strokeDasharray="3 3"/>}
                    </ComposedChart>
                </ChartContainer>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/>Platform-Level Daily Performance</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto custom-scrollbar border rounded-lg">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="sticky left-0 bg-muted/50 z-20 w-[200px] min-w-[200px]">Platform</TableHead>
                        {dates.map(date => (
                            <TableHead key={date} className="text-right min-w-[100px] font-normal">
                                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </TableHead>
                        ))}
                    </TableRow>
                    </TableHeader>
                    
                    {allPlatforms.map(platform => {
                        const isOpen = openPlatforms.includes(platform);
                        return (
                            <Collapsible asChild key={platform} open={isOpen} onOpenChange={() => togglePlatform(platform)}>
                                <TableBody>
                                    <TableRow className="bg-card hover:bg-muted/50 border-b font-bold cursor-pointer" onClick={() => togglePlatform(platform)}>
                                        <TableCell className="sticky left-0 bg-card z-10 font-bold capitalize text-foreground flex items-center gap-2">
                                           <CollapsibleTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-6 w-6">
                                                   {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                                </Button>
                                            </CollapsibleTrigger>
                                            {platform}
                                        </TableCell>
                                        {dates.map(date => {
                                             const gmv = matrixData[platform]?.gmv?.[date] || 0;
                                             return (
                                                <TableCell key={`${platform}-gmv-${date}`} className="text-right font-mono text-primary">
                                                    {gmv > 0 ? `₹${Math.round(gmv / 1000)}k` : '-'}
                                                </TableCell>
                                             );
                                        })}
                                    </TableRow>

                                    <CollapsibleContent asChild>
                                        <>
                                            {METRIC_CONFIG.map(metric => (
                                                <TableRow key={`${platform}-${metric.key}`} className="text-xs">
                                                    <TableCell className="sticky left-0 bg-card z-10 pl-12 text-muted-foreground">{metric.name}</TableCell>
                                                    {dates.map(date => {
                                                        const value = matrixData[platform]?.[metric.key]?.[date];
                                                        return (
                                                            <TableCell key={`${platform}-${metric.key}-${date}`} className={cn("text-right font-mono", metric.key === 'gmv' ? 'text-primary' : '')}>
                                                                {value !== undefined && value !== null ? metric.format(value) : '-'}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            ))}
                                        </>
                                    </CollapsibleContent>
                                </TableBody>
                             </Collapsible>
                        );
                    })}
                </Table>
                </div>
            </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
                 <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flame className="w-5 h-5 text-amber-500"/>Control Rules Engine</CardTitle></CardHeader>
                 <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Platform</TableHead>
                                <TableHead className="text-right">Min ROAS</TableHead>
                                <TableHead className="text-right">Target ROAS</TableHead>
                                <TableHead className="text-right">Max TACOS</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {controlThresholds.map(t => (
                                <TableRow key={t.id}>
                                    {editingThresholdId === t.id ? (
                                        <>
                                            <TableCell className="font-medium capitalize">{t.platform_id}</TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.min_roas} onChange={e => handleThresholdChange('min_roas', e.target.value)}/></TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.target_roas} onChange={e => handleThresholdChange('target_roas', e.target.value)}/></TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.max_tacos} onChange={e => handleThresholdChange('max_tacos', e.target.value)}/></TableCell>
                                            <TableCell className="flex gap-1 justify-center">
                                                <Button size="icon" className="h-8 w-8" onClick={() => handleSave(t.id)}><Save className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}><X className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-medium capitalize">{t.platform_id}</TableCell>
                                            <TableCell className="text-right font-mono">{t.min_roas.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{t.target_roas.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{(t.max_tacos*100).toFixed(1)}%</TableCell>
                                            <TableCell className="text-center">
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(t)}><Edit className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                 </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><AlertOctagon className="w-5 h-5 text-destructive"/>Critical Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                    {criticalAlerts.length > 0 ? (
                        <ul className="space-y-3">
                            {criticalAlerts.map((alert, i) => (
                                <li key={i} className="flex items-start gap-3 text-xs">
                                     <div className="mt-0.5">
                                        {alert.type === 'CRITICAL' && <AlertOctagon className="w-4 h-4 text-destructive flex-shrink-0"/>}
                                        {alert.type === 'EFFICIENCY' && <Flame className="w-4 h-4 text-amber-500 flex-shrink-0"/>}
                                        {alert.type === 'OPPORTUNITY' && <Zap className="w-4 h-4 text-green-500 flex-shrink-0"/>}
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground capitalize">{alert.platform}</p>
                                        <p className="text-muted-foreground">{alert.message}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>No critical alerts for the selected period.</p>
                            <p className="text-xs">Enable compare mode to see performance-based alerts.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    </div>
  )
}

    