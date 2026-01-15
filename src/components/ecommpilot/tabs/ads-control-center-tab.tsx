
"use client";

import React, { useState, useMemo } from 'react';
import type {
  Campaign,
  AdGroup,
  AdsDailyMetrics,
  InventorySnapshot,
  ControlThresholds,
  DecisionEngineOutput,
} from '@/lib/types';
import {
  controlThresholds as initialControlThresholds,
} from '@/lib/ads-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from '../kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Flame, GitCommit, AlertOctagon, Bot, ChevronsRight, Edit, Save, X, RadioTower, Zap, Upload, Cloud, Download, ChevronRight, ChevronDown } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';


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
    { key: 'impressions', name: 'Impressions', format: (val) => val.toLocaleString() },
    { key: 'clicks', name: 'Clicks', format: (val) => val.toLocaleString() },
    { key: 'orders', name: 'Orders', format: (val) => val.toLocaleString() },
    { key: 'gmv', name: 'GMV (₹)', format: (val) => val.toLocaleString() },
    { key: 'ads_spent', name: 'Ad Spend (₹)', format: (val) => val.toLocaleString() },
    { key: 'roas', name: 'ROAS', format: (val) => val.toFixed(2) },
    { key: 'acos', name: 'ACOS', format: (val) => val.toFixed(2) },
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
  const [controlThresholds, setControlThresholds] = useState<ControlThresholds[]>(initialControlThresholds);
  const [editingThresholdId, setEditingThresholdId] = useState<string | null>(null);
  const [editedThresholds, setEditedThresholds] = useState<Partial<ControlThresholds>>({});
  const [openPlatforms, setOpenPlatforms] = useState<string[]>([]);

  const { matrixData, dates, platforms } = useMemo(() => {
    const matrix: PlatformMatrix = {};
    const dateSet = new Set<string>();
    const platformSet = new Set<string>();

    adsDailyMetrics.forEach(metric => {
      const platform = metric.platform_id;
      const date = metric.date;

      dateSet.add(date);
      platformSet.add(platform);

      if (!matrix[platform]) {
        matrix[platform] = {};
      }

      METRIC_CONFIG.forEach(config => {
        const key = config.key;
        if (!matrix[platform][key]) {
          matrix[platform][key] = {};
        }
        matrix[platform][key][date] = (matrix[platform][key][date] || 0) + (metric[key] as number);
      });
    });

    const sortedDates = Array.from(dateSet).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return {
        matrixData: matrix,
        dates: sortedDates,
        platforms: Array.from(platformSet)
    };
  }, [adsDailyMetrics]);


  const overallKpis = useMemo(() => {
    return adsDailyMetrics.reduce((acc, item) => {
        acc.totalSpend += item.ads_spent || 0;
        acc.totalGmv += item.gmv || 0;
        return acc;
    }, { totalSpend: 0, totalGmv: 0 });
  }, [adsDailyMetrics]);


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

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <RadioTower className="w-6 h-6 text-primary" />
                        Ads Control Center
                    </CardTitle>
                    <CardDescription>Real-time, rules-based ad decisions across all platforms.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <TooltipProvider>
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" asChild>
                                    <a href="/ads-template.csv" download>
                                        <Download className="h-4 w-4" />
                                    </a>
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Download Template</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => document.getElementById('ads-upload')?.click()}><Upload className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Import from .xlsx</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={onCloudImport}><Cloud className="h-4 w-4" /></Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Import from Google Sheet</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <input type="file" id="ads-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
                </div>
            </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <KpiCard title="Total Ad Spend" value={`₹${overallKpis.totalSpend.toLocaleString()}`} />
            <KpiCard title="Total GMV" value={`₹${overallKpis.totalGmv.toLocaleString()}`} />
            <KpiCard title="Blended ROAS" value={(overallKpis.totalGmv / overallKpis.totalSpend || 0).toFixed(2)} className="text-primary" />
        </div>

        <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/>Platform-Level Daily Performance</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto custom-scrollbar border rounded-lg">
                <Table>
                    <TableHeader className="bg-muted/50">
                    <TableRow>
                        <TableHead className="sticky left-0 bg-muted/50 z-20 w-[200px] min-w-[200px]">Platform</TableHead>
                        {dates.map(date => (
                            <TableHead key={date} className="text-right min-w-[100px]">
                                {new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                            </TableHead>
                        ))}
                    </TableRow>
                    </TableHeader>
                    
                    {platforms.map(platform => {
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
                                                        const isGmv = metric.key === 'gmv';
                                                        return (
                                                            <TableCell key={`${platform}-${metric.key}-${date}`} className={cn("text-right font-mono", isGmv ? 'text-primary' : '')}>
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
                                <TableHead>Rule Set</TableHead>
                                <TableHead className="text-right">Min ROAS</TableHead>
                                <TableHead className="text-right">Target ROAS</TableHead>
                                <TableHead className="text-right">Max TACOS</TableHead>
                                <TableHead className="text-right">Pause Stock (d)</TableHead>
                                <TableHead className="text-center">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {controlThresholds.map(t => (
                                <TableRow key={t.id}>
                                    {editingThresholdId === t.id ? (
                                        <>
                                            <TableCell className="font-medium capitalize">{t.platform_id} {t.phase}</TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.min_roas} onChange={e => handleThresholdChange('min_roas', e.target.value)}/></TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.target_roas} onChange={e => handleThresholdChange('target_roas', e.target.value)}/></TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.max_tacos} onChange={e => handleThresholdChange('max_tacos', e.target.value)}/></TableCell>
                                            <TableCell><Input className="h-8 w-20 ml-auto" value={editedThresholds.pause_stock_cover} onChange={e => handleThresholdChange('pause_stock_cover', e.target.value)}/></TableCell>
                                            <TableCell className="flex gap-1 justify-center">
                                                <Button size="icon" className="h-8 w-8" onClick={() => handleSave(t.id)}><Save className="h-4 w-4"/></Button>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleCancel}><X className="h-4 w-4"/></Button>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-medium capitalize">{t.platform_id} {t.phase}</TableCell>
                                            <TableCell className="text-right font-mono">{t.min_roas.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{t.target_roas.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{t.max_tacos.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-mono">{t.pause_stock_cover}d</TableCell>
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
                    <ul className="space-y-3">
                         {decisionEngineOutputs.filter(d => d.decision !== 'MAINTAIN').slice(0, 5).map(alert => (
                            <li key={alert.ad_group_id} className="flex items-start gap-3 text-xs">
                                <AlertOctagon className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0"/>
                                <div>
                                    <p className="font-bold text-foreground">[{alert.ad_group_id}] {alert.decision}</p>
                                    <p className="text-muted-foreground capitalize">{alert.platform_id} • {alert.reason_codes.join(', ')}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
         <Card>
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><GitCommit className="w-5 h-5 text-muted-foreground"/>Action Logs</CardTitle>
                <CardDescription>Audit trail for all automated and manual ad changes.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-y-auto max-h-60 custom-scrollbar">
                    <ul className="space-y-4">
                        {decisionEngineOutputs.filter(d => d.decision !== 'MAINTAIN').map(log => (
                            <li key={log.ad_group_id} className="flex items-center gap-4 text-xs">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-medium text-foreground">
                                        <span className="font-bold capitalize">{log.decision}</span> on <span className="font-bold">{log.ad_group_id}</span>
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        Budget change: <span className="font-mono bg-muted p-0.5 rounded">{log.recommended_action.change_pct}%</span> <ChevronsRight className="h-3 w-3"/> <span className="font-mono bg-muted p-0.5 rounded">₹{log.recommended_action.new_daily_budget.toLocaleString()}</span>
                                    </p>
                                </div>
                                <div className="text-right text-muted-foreground">
                                    <p>{new Date(log.date).toLocaleDateString()}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}
