"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2 } from "lucide-react";

export default function GrowthTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-primary" />
          Growth Analysis
        </CardTitle>
        <CardDescription>
          This section is under construction. Advanced growth analytics and visualizations will be available here soon.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground py-16">
        <p>(Chart and data table for growth analysis will be displayed here)</p>
      </CardContent>
    </Card>
  );
}
