"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Area, ComposedChart } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Button } from '@/components/ui/button';
import { Calendar, Upload } from "lucide-react";
import React, { useMemo } from 'react';
import type { MatrixData } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PnlTabProps {
  data: MatrixData | null;
  labels: string[];
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const chartConfig = {
  revenue: { label: "Revenue", color: "hsl(var(--chart-1))" },
  costs: { label: "Total Costs", color: "hsl(var(--chart-2))" },
  profit: { label: "Net Profit", color: "hsl(var(--chart-4))" },
};

export default function PnlTab({ data, labels, onFileUpload }: PnlTabProps) {
  
  const chartData = useMemo(() => {
    if (!data || labels.length === 0) return [];
    
    return labels.map((label, index) => {
      const revenue = (data['Total GMV']?.gmv[index] || 0);
      // Assuming costs are an aggregation of spend and other potential cost metrics
      const costs = (data['Total Ad Spend']?.spend[index] || 0) + (data['Total Shipping']?.spend[index] || 0) + (data['Total Commission']?.spend[index] || 0);
      const profit = revenue - costs;

      return {
        name: label,
        revenue: revenue / 1000, // in thousands
        costs: costs / 1000,
        profit: profit / 1000,
      };
    });

  }, [data, labels]);

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-600" />
                Daily P&L
            </div>
            <Button size="sm" variant="outline" onClick={() => document.getElementById('daily-upload')?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Import Daily Data
            </Button>
            <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload}/>
          </CardTitle>
          <CardDescription>
            Import your daily P&L data (e.g., from a spreadsheet) to see visualizations.
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
                        <Calendar className="w-5 h-5 text-amber-600" />
                        Daily P&L
                    </CardTitle>
                    <CardDescription>
                        Daily breakdown of revenue, costs, and profit.
                    </CardDescription>
                </div>
                 <Button size="sm" variant="outline" onClick={() => document.getElementById('daily-upload')?.click()}>
                    <Upload className="w-4 h-4" />
                </Button>
                <input type="file" id="daily-upload" className="hidden" accept=".xlsx, .xls" onChange={onFileUpload}/>
            </div>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ComposedChart data={chartData}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={8} />
                <YAxis label={{ value: 'Thousands (₹)', angle: -90, position: 'insideLeft' }}/>
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent indicator="dot" />}
                />
                <Legend />
                <Bar dataKey="revenue" fill={chartConfig.revenue.color} radius={4} name="Revenue (k)" />
                <Bar dataKey="costs" fill={chartConfig.costs.color} radius={4} name="Costs (k)" />
                <Area type="monotone" dataKey="profit" fill={chartConfig.profit.color} stroke={chartConfig.profit.color} fillOpacity={0.3} name="Profit (k)" />
            </ComposedChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
          <CardHeader><CardTitle className='text-base'>Raw Daily Data</CardTitle></CardHeader>
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
                                      {value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
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

    