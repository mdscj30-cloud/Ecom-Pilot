"use client";

import React, { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, CheckCircle2, AlertCircle, Loader2, X, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

// ── WAREHOUSE MAPPING ─────────────────────────────────────────────────────
const WH_MAP: Record<string, string> = {
  kolkata:   "Kol",
  kheda:     "Pith",
  amour:     "Pith",
  gurgaon:   "Har",
  gurugram:  "Har",
  bengaluru: "Blr",
  bangalore: "Blr",
};

const CANCEL_STATUSES = ["CANCELLED", "CANCEL", "CANCELLATION_REQUESTED"];

// Column positions (1-indexed → 0-indexed)
const COL = { SKU: 1, KOL_STK: 6, KOL_DRR: 7, PITH_STK: 8, PITH_DRR: 9, HAR_STK: 10, HAR_DRR: 11, BLR_STK: 12, BLR_DRR: 13 };

function detectWarehouse(facilityNames: string[]): string | null {
  for (const fac of facilityNames) {
    const f = fac.toLowerCase().trim();
    for (const [key, prefix] of Object.entries(WH_MAP)) {
      if (f.includes(key)) return prefix;
    }
  }
  return null;
}

function getSKUFromCell(val: any): string | null {
  if (!val) return null;
  const s = String(val);
  const m = s.match(/"([A-Za-z0-9_]+)"\s*\)/);
  return m ? m[1] : s.trim();
}

interface UploadedFile {
  name: string;
  type: "inventory" | "orders";
  warehouse: string | null;
  rows: number;
  status: "ok" | "error" | "unknown";
  error?: string;
  data: any[];
}

interface LogLine { msg: string; type: "success" | "warn" | "error" | "info"; }

interface UnicommerceUploadTabProps {
  onOrdersParsed?: (rows: any[], channels: string[]) => void;
}

export default function UnicommerceUploadTab({ onOrdersParsed }: UnicommerceUploadTabProps) {
  const { toast } = useToast();
  const [uploadedFiles, setUploadedFiles]   = useState<UploadedFile[]>([]);
  const [projectFile, setProjectFile]       = useState<{ name: string; wb: XLSX.WorkBook } | null>(null);
  const [processing, setProcessing]         = useState(false);
  const [logs, setLogs]                     = useState<LogLine[]>([]);
  const [outputBlob, setOutputBlob]         = useState<Uint8Array | null>(null);
  const [outputFilename, setOutputFilename] = useState("");

  const addLog = (msg: string, type: LogLine["type"] = "info") =>
    setLogs(p => [...p, { msg, type }]);

  // ── Handle Project Sheet upload ───────────────────────────────────────
  const handleProjectUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" });
      setProjectFile({ name: file.name, wb });
      toast({ title: "Project Sheet Loaded", description: file.name });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  // ── Handle CSV uploads (inventory or orders) ─────────────────────────
  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, fileType: "inventory" | "orders") => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const data: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

          // Detect warehouse
          const facilities = [...new Set(data.map((r: any) => String(r["Facility"] || r["facility"] || "")).filter(Boolean))];
          const warehouse = detectWarehouse(facilities);

          const uf: UploadedFile = {
            name: file.name,
            type: fileType,
            warehouse,
            rows: data.length,
            status: warehouse ? "ok" : "unknown",
            error: warehouse ? undefined : `Could not detect warehouse from facilities: ${facilities.join(", ")}`,
            data,
          };
          setUploadedFiles(p => [...p.filter(f => !(f.type === fileType && f.warehouse === warehouse)), uf]);
        } catch (err) {
          setUploadedFiles(p => [...p, { name: file.name, type: fileType, warehouse: null, rows: 0, status: "error", error: String(err), data: [] }]);
        }
      };
      reader.readAsArrayBuffer(file);
    });
    e.target.value = "";
  }, []);

  // ── Process everything ─────────────────────────────────────────────────
  const handleProcess = async () => {
    if (!projectFile) {
      toast({ variant: "destructive", title: "Missing Project Sheet", description: "Please upload the Project_sheet.xlsx first." });
      return;
    }
    setProcessing(true);
    setLogs([]);
    setOutputBlob(null);

    try {
      addLog("Starting processing...", "info");

      // ── Build inventory map ──────────────────────────────────────────
      const inventoryMap: Record<string, Record<string, number>> = {}; // {prefix: {sku: netStock}}
      const invFiles = uploadedFiles.filter(f => f.type === "inventory" && f.warehouse);
      invFiles.forEach(f => {
        const prefix = f.warehouse!;
        inventoryMap[prefix] = {};
        f.data.forEach((row: any) => {
          const sku = String(row["Item SkuCode"] || row["item skucode"] || "").trim();
          if (!sku) return;
          const inv = parseFloat(row["Inventory"] || 0) || 0;
          const pia = parseFloat(row["Pending Inventory Assessment"] || 0) || 0;
          inventoryMap[prefix][sku] = Math.max(0, Math.round(inv - pia));
        });
        addLog(`✅ Inventory ${f.name} → ${prefix} (${Object.keys(inventoryMap[prefix]).length} SKUs)`, "success");
      });

      // ── Build DRR map ────────────────────────────────────────────────
      const drrMap: Record<string, Record<string, number>> = {}; // {prefix: {sku: drr}}
      const ordFiles = uploadedFiles.filter(f => f.type === "orders" && f.warehouse);
      ordFiles.forEach(f => {
        const prefix = f.warehouse!;
        // Filter March invoices, exclude cancelled, deduplicate
        const marchRows = f.data.filter((row: any) => {
          const invDate = new Date(row["Invoice Created"] || "");
          if (isNaN(invDate.getTime()) || invDate.getMonth() !== 2) return false; // month 2 = March
          const status = String(row["Sale Order Item Status"] || "").toUpperCase();
          return !CANCEL_STATUSES.includes(status);
        });

        // Deduplicate by Sale Order Item Code
        const seen = new Set<string>();
        const deduped = marchRows.filter((row: any) => {
          const code = String(row["Sale Order Item Code"] || "");
          if (seen.has(code)) return false;
          seen.add(code);
          return true;
        });

        // Date range
        const dates = deduped.map((r: any) => new Date(r["Invoice Created"]).getTime()).filter(t => !isNaN(t));
        const days = dates.length > 0 ? Math.max(1, Math.round((Math.max(...dates) - Math.min(...dates)) / 86400000) + 1) : 30;

        // Count per SKU
        const skuCounts: Record<string, number> = {};
        deduped.forEach((row: any) => {
          const sku = String(row["Item SKU Code"] || "").trim();
          if (sku) skuCounts[sku] = (skuCounts[sku] || 0) + 1;
        });

        drrMap[prefix] = {};
        Object.entries(skuCounts).forEach(([sku, count]) => {
          drrMap[prefix][sku] = Math.round((count / days) * 100) / 100;
        });

        addLog(`✅ Orders ${f.name} → ${prefix} | ${deduped.length} orders | ${days} days | ${Object.keys(drrMap[prefix]).length} SKUs`, "success");
      });

      // ── Update project sheet ─────────────────────────────────────────
      const wb = projectFile.wb;
      const ws = wb.Sheets[wb.SheetNames[0]];
      const range = XLSX.utils.decode_range(ws["!ref"] || "A1");

      let updated = 0;
      for (let r = 1; r <= range.e.r; r++) {
        const skuCell = ws[XLSX.utils.encode_cell({ r, c: COL.SKU })];
        if (!skuCell?.v) continue;
        const sku = getSKUFromCell(skuCell.v);
        if (!sku || sku === "SKU Name") continue;

        const get = (map: Record<string, Record<string, number>>, prefix: string) =>
          map[prefix]?.[sku] ?? "";

        const updates: Record<number, any> = {
          [COL.KOL_STK]:  get(inventoryMap, "Kol"),
          [COL.KOL_DRR]:  get(drrMap, "Kol"),
          [COL.PITH_STK]: get(inventoryMap, "Pith"),
          [COL.PITH_DRR]: get(drrMap, "Pith"),
          [COL.HAR_STK]:  get(inventoryMap, "Har"),
          [COL.HAR_DRR]:  get(drrMap, "Har"),
          [COL.BLR_STK]:  get(inventoryMap, "Blr"),
          [COL.BLR_DRR]:  get(drrMap, "Blr"),
        };

        Object.entries(updates).forEach(([col, val]) => {
          if (val !== "") {
            const addr = XLSX.utils.encode_cell({ r, c: Number(col) });
            ws[addr] = { v: val, t: typeof val === "number" ? "n" : "s" };
          }
        });
        updated++;
      }

      addLog(`✅ Updated ${updated} SKUs in Project Sheet`, "success");

      // ── Write output ─────────────────────────────────────────────────
      const out = XLSX.write(wb, { type: "array", bookType: "xlsx" });
      const date = new Date().toLocaleDateString("en-IN").replace(/\//g, "");
      const fname = `Project_sheet_${date}.xlsx`;
      setOutputBlob(new Uint8Array(out));
      setOutputFilename(fname);
      addLog(`📁 Ready to download: ${fname}`, "success");

      // Emit parsed order rows for Cancellation and Platform Comparison tabs
      if (onOrdersParsed) {
        const allOrdRows: any[] = [];
        const channels = new Set<string>();
        ordFiles.forEach(f => {
          f.data.forEach((row: any) => {
            const invDate = new Date(row["Invoice Created"] || "");
            const orderDate = new Date(row["Order Date as dd/mm/yyyy hh:MM:ss"] || row["Created"] || "");
            const ch = String(row["Channel Name"] || row["channel"] || "");
            if (ch) channels.add(ch);
            allOrdRows.push({
              orderItemCode: String(row["Sale Order Item Code"] || ""),
              sku: String(row["Item SKU Code"] || "").trim(),
              skuName: String(row["SKU Name"] || row["Item Type Name"] || "").trim(),
              channel: ch,
              facility: String(row["Facility"] || "").trim(),
              status: String(row["Sale Order Status"] || "").toUpperCase(),
              itemStatus: String(row["Sale Order Item Status"] || "").toUpperCase(),
              cancellationReason: String(row["Cancellation Reason"] || ""),
              sellingPrice: parseFloat(row["Selling Price"] || 0) || 0,
              orderDate: isNaN(orderDate.getTime()) ? new Date() : orderDate,
              invoiceDate: isNaN(invDate.getTime()) ? undefined : invDate,
              returnDate: row["Return Date"] ? new Date(row["Return Date"]) : undefined,
            });
          });
        });
        onOrdersParsed(allOrdRows, Array.from(channels));
      }
      toast({ title: "Processing Complete!", description: `${updated} SKUs updated. Download your sheet.` });
    } catch (err) {
      addLog(`❌ Error: ${String(err)}`, "error");
      toast({ variant: "destructive", title: "Processing Failed", description: String(err) });
    } finally {
      setProcessing(false);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────
  const handleDownload = () => {
    if (!outputBlob) return;
    const blob = new Blob([outputBlob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = outputFilename; a.click();
    URL.revokeObjectURL(url);
  };

  const invFiles = uploadedFiles.filter(f => f.type === "inventory");
  const ordFiles = uploadedFiles.filter(f => f.type === "orders");
  const whPrefixes = ["Kol", "Pith", "Har", "Blr"];
  const missingInv = whPrefixes.filter(p => !invFiles.some(f => f.warehouse === p));
  const missingOrd = whPrefixes.filter(p => !ordFiles.some(f => f.warehouse === p));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Unicommerce → Project Sheet Automation</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload inventory snapshots + order exports from Unicommerce to auto-fill Stock & DRR columns
        </p>
      </div>

      {/* Warehouse Mapping Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Warehouse Mapping</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {[
              { label: "Kol (Kolkata)", facs: "Kolkata", col: "Kol Stock / DRR" },
              { label: "Pith (Pithampur)", facs: "KHEDA, Amour", col: "Pith Stock / DRR" },
              { label: "Har (Haryana)", facs: "Gurgaon, Gurugram", col: "Har Stock / DRR" },
              { label: "Blr (Bengaluru)", facs: "Bengaluru, Bangalore", col: "Blr Stock / DRR" },
            ].map(wh => (
              <div key={wh.label} className="bg-muted/50 rounded p-2">
                <p className="font-semibold">{wh.label}</p>
                <p className="text-muted-foreground">{wh.facs}</p>
                <p className="text-primary mt-1">{wh.col}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Stock = Inventory − Pending Inventory Assessment &nbsp;|&nbsp; DRR = March invoiced orders ÷ days
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Project Sheet */}
        <Card className={cn("border-2", projectFile ? "border-green-300 bg-green-50 dark:bg-green-950/20" : "border-dashed")}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              1. Project Sheet (Template)
            </CardTitle>
            <CardDescription className="text-xs">Upload your Project_sheet.xlsx</CardDescription>
          </CardHeader>
          <CardContent>
            {projectFile ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                  <span className="truncate max-w-[150px]">{projectFile.name}</span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setProjectFile(null)}>
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 cursor-pointer py-4 text-center">
                <Upload className="w-8 h-8 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Click to upload .xlsx</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleProjectUpload} />
              </label>
            )}
          </CardContent>
        </Card>

        {/* Inventory CSVs */}
        <Card className="border-2 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              2. Inventory Snapshots (4 CSVs)
            </CardTitle>
            <CardDescription className="text-xs">Kolkata · Kheda · Gurgaon · Bengaluru</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 hover:bg-muted/50 text-xs">
              <Upload className="w-3 h-3" />
              Add inventory CSVs
              <input type="file" accept=".csv,.xlsx" multiple className="hidden" onChange={e => handleCsvUpload(e, "inventory")} />
            </label>
            <div className="mt-2 space-y-1">
              {invFiles.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  {f.status === "ok" ? <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" /> : <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />}
                  <span className="truncate">{f.warehouse || "?"} — {f.rows} rows</span>
                </div>
              ))}
              {missingInv.length > 0 && (
                <p className="text-xs text-amber-600">Missing: {missingInv.join(", ")}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order CSVs */}
        <Card className="border-2 border-dashed">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Upload className="w-4 h-4" />
              3. Sale Orders (4 CSVs)
            </CardTitle>
            <CardDescription className="text-xs">March invoices — all 4 warehouses</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 cursor-pointer border rounded px-3 py-2 hover:bg-muted/50 text-xs">
              <Upload className="w-3 h-3" />
              Add order CSVs
              <input type="file" accept=".csv,.xlsx" multiple className="hidden" onChange={e => handleCsvUpload(e, "orders")} />
            </label>
            <div className="mt-2 space-y-1">
              {ordFiles.map(f => (
                <div key={f.name} className="flex items-center gap-2 text-xs">
                  {f.status === "ok" ? <CheckCircle2 className="w-3 h-3 text-green-600 shrink-0" /> : <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />}
                  <span className="truncate">{f.warehouse || "?"} — {f.rows} rows</span>
                </div>
              ))}
              {missingOrd.length > 0 && (
                <p className="text-xs text-amber-600">Missing: {missingOrd.join(", ")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Process Button */}
      <div className="flex gap-3">
        <Button
          size="lg"
          onClick={handleProcess}
          disabled={processing || !projectFile}
          className="flex-1"
        >
          {processing ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
          ) : (
            <><FileSpreadsheet className="w-4 h-4 mr-2" /> Generate Updated Project Sheet</>
          )}
        </Button>

        {outputBlob && (
          <Button size="lg" variant="outline" onClick={handleDownload} className="border-green-300 text-green-700 hover:bg-green-50">
            <Download className="w-4 h-4 mr-2" /> Download
          </Button>
        )}
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono">Processing Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black rounded p-3 font-mono text-xs space-y-1 max-h-48 overflow-y-auto">
              {logs.map((l, i) => (
                <div key={i} className={cn(
                  l.type === "success" ? "text-green-400" :
                  l.type === "error"   ? "text-red-400"   :
                  l.type === "warn"    ? "text-yellow-400" : "text-gray-300"
                )}>{l.msg}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
