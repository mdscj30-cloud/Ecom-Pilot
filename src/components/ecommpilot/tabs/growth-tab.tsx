
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { BarChart2, Upload, Cloud } from "lucide-react";
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
import { Tooltip as UiTooltip, TooltipContent as UiTooltipContent, TooltipProvider } from '@/components/ui/tooltip';

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
  
  const chartData = useMemo(() => {
    if (!data || labels.length === 0) return [];
    
    return labels.map((label, index) => {
      const entry: { name: string; [key: string]: any } = { name: label };
      const gmv = (data['Total GMV']?.gmv[index] || 0) / 100000; // in Lakhs
      const spend = (data['Total Ad Spend']?.spend[index] || 0) / 100000; // in Lakhs
      entry.gmv = gmv;
      entry.spend = spend;
      entry.roas = spend > 0 ? gmv / spend : 0;
      return entry;
    });

  }, [data, labels]);

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
                <Button size="sm" variant="outline" onClick={() => document.getElementById('growth-upload')?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Import from File
                </Button>
                <Button size="sm" variant="outline" onClick={onCloudImport}>
                    <Cloud className="w-4 h-4 mr-2" />
                    Import from Sheet
                </Button>
            </div>
            <input type="file" id="growth-upload" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload}/>
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

  const renderChart = () => {
    switch (chartView) {
      case 'roas':
        return (
          <BarChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar dataKey="roas" fill={chartConfig.roas.color} radius={4} name="ROAS" />
          </BarChart>
        );
      case 'gmv_vs_spend':
      default:
        return (
          <ComposedChart data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis yAxisId="left" orientation="left" label={{ value: 'Lakhs (₹)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'ROAS', angle: 90, position: 'insideRight' }} />
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
            <Bar yAxisId="left" dataKey="gmv" fill={chartConfig.gmv.color} radius={4} name="GMV (Lakhs)" />
            <Bar yAxisId="left" dataKey="spend" fill={chartConfig.spend.color} radius={4} name="Ad Spend (Lakhs)" />
            <Line yAxisId="right" type="monotone" dataKey="roas" stroke={chartConfig.roas.color} strokeWidth={2} name="ROAS" />
          </ComposedChart>
        );
    }
  };

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
              <input type="file" id="growth-upload" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload}/>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            {renderChart()}
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
                        <TableHead>Metric</TableHead>
                        {labels.map(label => <TableHead key={label} className="text-right">{label}</TableHead>)}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.values(data).map(metricData => (
                      <TableRow key={metricData.name}>
                          <TableCell className="font-medium">{metricData.name}</TableCell>
                          {labels.map((_, index) => {
                              const value = (metricData.gmv[index] || metricData.spend[index] || metricData.asp[index] || 0);
                              return (
                                  <TableCell key={index} className="text-right font-mono">
                                      {value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
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


    