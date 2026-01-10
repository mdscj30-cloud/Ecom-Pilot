"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

export default function PnlTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600" />
          Daily P&L
        </CardTitle>
        <CardDescription>
          This section is under construction. Detailed daily Profit & Loss tracking will be available here soon.
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center text-muted-foreground py-16">
        <p>(Chart and data table for daily P&L will be displayed here)</p>
      </CardContent>
    </Card>
  );
}
