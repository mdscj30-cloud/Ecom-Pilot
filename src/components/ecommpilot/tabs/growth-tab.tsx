"use client";

import { ComposedChart, Area, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { BarChart2, Upload, Cloud, Download } from "lucide-react";
import React, { useMemo, useState } from 'react';
import type { MatrixData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider, TooltipTrigger as UiTooltipTrigger } from '@/components/ui/tooltip';
import * as RechartsPrimitive from "recharts";

interface GrowthTabProps {
  data: MatrixData | null;
  labels: string[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCloudImport: () => void;
}

const chartConfig = {
  gmv: { label: "GMV", color: "hsl(var(--chart-1))" },
  spend: { label: "Ad Spend", color: "hsl(var(--chart-2))" },
  roas: { label: "ROAS", color: "hsl(var(--chart-3))" },
};

export default function GrowthTab({ data, labels, onFileUpload, onCloudImport }: GrowthTabProps) {
  const [chartView, setChartView] = useState('gmv_vs_spend');
  
  const totalPlatformKey = useMemo(() => {
    if (!data) return null;
    return Object.keys(data).find(k => k.toLowerCase().includes('total')) || Object.keys(data)[0];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data || labels.length === 0 || !totalPlatformKey) return [];
    
    return labels.map((label, index) => {
      const entry: { name: string; [key: string]: any } = { name: label };
      const gmv = (data[totalPlatformKey]?.gmv[index] || 0) / 100000; // in Lakhs
      const spend = (data[totalPlatformKey]?.spend[index] || 0) / 100000; // in Lakhs
      entry.gmv = gmv;
      entry.spend = spend;
      entry.roas = spend > 0 ? (gmv / spend) : 0;
      return entry;
    });

  }, [data, labels, totalPlatformKey]);

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
            Import your growth data (e.g., from a spreadsheet) to see visualizations and analysis.
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
                Month-over-month performance overview.
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Select value={chartView} onValueChange={setChartView}>
                  <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select view" />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="gmv_vs_spend">GMV vs Ad Spend</SelectItem>
                      <SelectItem value="roas">ROAS Trend</SelectItem>
                  </SelectContent>
              </Select>
              <TooltipProvider>
                <UiTooltip>
                    <UiTooltipContent>Download Template</UiTooltipContent>
                    <UiTooltipTrigger asChild>
                        <Button size="icon" variant="outline" className='h-9 w-9' asChild>
                            <a href="/growth-template.csv" download><Download className="w-4 h-4" /></a>
                        </Button>
                    </UiTooltipTrigger>
                </UiTooltip>
                <UiTooltip>
                  <UiTooltipContent>Import from file</UiTooltipContent>
                  <UiTooltipTrigger asChild>
                    <Button size="icon" variant="outline" className='h-9 w-9' onClick={() => document.getElementById('growth-upload')?.click()}>
                        <Upload className="w-4 h-4" />
                    </Button>
                  </UiTooltipTrigger>
                </UiTooltip>
                <UiTooltip>
                    <UiTooltipContent>Import from Google Sheet</UiTooltipContent>
                    <UiTooltipTrigger asChild>
                        <Button size="icon" variant="outline" className='h-9 w-9' onClick={onCloudImport}>
                            <Cloud className="w-4 h-4" />
                        </Button>
                    </UiTooltipTrigger>
                </UiTooltip>
              </TooltipProvider>
              <input type="file" id="growth-upload" className="hidden" accept=".xlsx, .xls, .csv" onChange={onFileUpload}/>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={chartConfig}
            className="h-[300px] w-full"
          >
            <ComposedChart
                data={chartData}
            >
                <ChartLegend content={<ChartLegendContent />} />
                <RechartsPrimitive.CartesianGrid vertical={false} />
                <RechartsPrimitive.XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <RechartsPrimitive.YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tickFormatter={(value) => `₹${value}L`}
                    domain={['dataMin', 'dataMax']}
                    hide={chartView === 'roas'}
                />
                <RechartsPrimitive.YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    tickFormatter={(value) => value.toFixed(1)} 
                    domain={['dataMin', 'dataMax']}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        return payload?.[0]?.payload.name;
                      }}
                      formatter={(value, name) => {
                          const numValue = Number(value);
                          if (name === 'roas') return numValue.toFixed(2);
                          return `₹${numValue.toFixed(2)} L`;
                      }}
                    />
                  }
                />
                <defs>
                    <linearGradient id="fillGmv" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-gmv)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-gmv)" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="fillSpend" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-spend)" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="var(--color-spend)" stopOpacity={0.1}/>
                    </linearGradient>
                </defs>
                
                {chartView === 'gmv_vs_spend' ? (
                  <>
                    <Area type="monotone" dataKey="gmv" fill="url(#fillGmv)" stroke="var(--color-gmv)" yAxisId="left" />
                    <Area type="monotone" dataKey="spend" fill="url(#fillSpend)" stroke="var(--color-spend)" yAxisId="left" />
                  </>
                ) : null}

                <Line
                    dataKey="roas"
                    stroke="var(--color-roas)"
                    yAxisId="right"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{r: 6}}
                />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader><CardTitle className='text-base'>Raw Growth Data</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Platform</TableHead>
                        {labels.map(label => <TableHead key={label} className="text-right">{label} (GMV)</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(data).map(platformData => (
                      <TableRow key={platformData.name}>
                          <TableCell className="font-medium">{platformData.name.split(': ').slice(-1)[0]}</TableCell>
                          {labels.map((_, index) => {
                              const value = (platformData.gmv[index] || 0);
                              return (
                                  <TableCell key={index} className="text-right font-mono">
                                      {value.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
                                  </TableCell>
                              )
                          })}
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
