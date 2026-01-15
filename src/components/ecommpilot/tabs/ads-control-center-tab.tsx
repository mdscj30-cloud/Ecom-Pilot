
"use client";

import React, { useState, useMemo } from 'react';
import type {
  Campaign,
  AdGroup,
  AdsDailyMetrics,
  InventorySnapshot,
  ControlThresholds,
  DecisionEngineOutput,
  AdAlert,
  ActionLog
} from '@/lib/types';
import {
  controlThresholds as initialControlThresholds,
  adAlerts,
  actionLogs
} from '@/lib/ads-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import KpiCard from '../kpi-card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Flame, GitCommit, AlertOctagon, Bot, ChevronsRight, Edit, Save, X, RadioTower, Zap, CircleDollarSign, ArrowUp, ArrowDown, PauseCircle, PlayCircle, MinusCircle, Upload, Cloud, Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


interface AdsControlCenterTabProps {
    campaigns: Campaign[];
    adGroups: AdGroup[];
    adsDailyMetrics: AdsDailyMetrics[];
    inventorySnapshots: InventorySnapshot[];
    decisionEngineOutputs: DecisionEngineOutput[];
    onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCloudImport: () => void;
}

type PlatformDailySummary = {
  date: string;
  platform_id: string;
  impressions: number;
  clicks: number;
  orders: number;
  gmv: number;
  ads_spent: number;
  ctr: number;
  cvr: number;
  roas: number;
  tacos: number;
  acos: number;
};


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

  const platformDailySummary = useMemo(() => {
    const summary: { [key: string]: PlatformDailySummary } = {};

    adsDailyMetrics.forEach(metric => {
      const key = `${metric.date}-${metric.platform_id}`;
      if (!summary[key]) {
        summary[key] = {
          date: metric.date,
          platform_id: metric.platform_id,
          impressions: 0,
          clicks: 0,
          orders: 0,
          gmv: 0,
          ads_spent: 0,
          ctr: 0,
          cvr: 0,
          roas: 0,
          tacos: 0,
          acos: 0,
        };
      }
      summary[key].impressions += metric.impressions;
      summary[key].clicks += metric.clicks;
      summary[key].orders += metric.orders;
      summary[key].gmv += metric.gmv;
      summary[key].ads_spent += metric.ads_spent;
    });

    return Object.values(summary).map(s => {
      s.ctr = s.impressions > 0 ? s.clicks / s.impressions : 0;
      s.cvr = s.clicks > 0 ? s.orders / s.clicks : 0;
      s.roas = s.ads_spent > 0 ? s.gmv / s.ads_spent : 0;
      // Assuming TACOS requires total GMV, which might not be available at this level
      // For now, let's use the same logic as ROAS's denominator
      s.tacos = s.gmv > 0 ? s.ads_spent / s.gmv : 0;
      s.acos = s.gmv > 0 ? s.ads_spent / s.gmv : 0;
      return s;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="w-5 h-5 text-primary"/>Platform-Level Ads Control</CardTitle></CardHeader>
            <CardContent>
                <div className="overflow-x-auto custom-scrollbar">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead className="text-right">Impressions</TableHead>
                        <TableHead className="text-right">Clicks</TableHead>
                        <TableHead className="text-right">Orders</TableHead>
                        <TableHead className="text-right">Ad Spend (₹)</TableHead>
                        <TableHead className="text-right">GMV (₹)</TableHead>
                        <TableHead className="text-right">ROAS</TableHead>
                        <TableHead className="text-right">TACOS</TableHead>
                        <TableHead className="text-right">ACOS</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {platformDailySummary.map(item => (
                        <TableRow key={`${item.date}-${item.platform_id}`}>
                        <TableCell className="font-medium text-foreground">
                           {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </TableCell>
                        <TableCell className="font-medium capitalize">{item.platform_id}</TableCell>
                        <TableCell className="text-right font-mono">{(item.impressions || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{(item.clicks || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{(item.orders || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{(item.ads_spent || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono">{(item.gmv || 0).toLocaleString()}</TableCell>
                        <TableCell className={cn("text-right font-bold", (item.roas || 0) > 3 ? 'text-green-600' : (item.roas || 0) < 2 ? 'text-destructive' : '')}>{(item.roas || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{(item.tacos || 0).toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">{(item.acos || 0).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
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
                        {adAlerts.map(alert => (
                            <li key={alert.alert_id} className="flex items-start gap-3 text-xs">
                                <AlertOctagon className="w-4 h-4 mt-0.5 text-destructive flex-shrink-0"/>
                                <div>
                                    <p className="font-bold text-foreground">[{alert.sku_code}] {alert.message}</p>
                                    <p className="text-muted-foreground capitalize">{alert.platform_id} • {new Date(alert.timestamp).toLocaleString()}</p>
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
                        {actionLogs.map(log => (
                            <li key={log.action_id} className="flex items-center gap-4 text-xs">
                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary">
                                    <Bot className="h-4 w-4" />
                                </div>
                                <div className="flex-grow">
                                    <p className="font-medium text-foreground">
                                        <span className="font-bold capitalize">{log.action.replace('_', ' ')}</span> on <span className="font-bold">{log.entity_id}</span>
                                    </p>
                                    <p className="text-muted-foreground flex items-center gap-2">
                                        Value changed from <span className="font-mono bg-muted p-0.5 rounded">{log.old_value}</span> <ChevronsRight className="h-3 w-3"/> <span className="font-mono bg-muted p-0.5 rounded">{log.new_value}</span>
                                    </p>
                                </div>
                                <div className="text-right text-muted-foreground">
                                    <p>{new Date(log.timestamp).toLocaleDateString()}</p>
                                    <p>{new Date(log.timestamp).toLocaleTimeString()}</p>
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
