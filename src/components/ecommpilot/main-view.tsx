
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertTriangle,
  Box,
  Building2,
  Calendar,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  InventoryItem,
  Kpi,
  TabId,
  SortConfig,
  Channel,
  ProcessedSheetData,
  Recommendation,
  GrowthData,
  B2BInventoryItem,
} from "@/lib/types";
import { masterData } from "@/lib/data";
import { growthMasterData } from "@/lib/growth-data";

import { format, parse, isValid } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "./header";
import DailyOpsTab from "./tabs/daily-ops-tab";
import InventoryTab from "./tabs/inventory-tab";
import B2BInventoryTab from "./tabs/b2b-inventory-tab";
import PnlTab from "./tabs/pnl-tab";
import RecommendationsTab from "./tabs/recommendations-tab";
import GrowthTab from "./tabs/growth-tab";
import { AddSkuModal } from "./modals";

const channelIcons = {
  daily: Activity,
  inventory: Box,
  b2b: Building2,
  dailypnl: Calendar,
  growth: TrendingUp,
  recommendations: CheckCircle,
};

// --- IMPORTANT: Paste your Google Sheet URLs here ---
const GOOGLE_SHEET_URLS: Record<'inventory' | 'b2b' | 'daily' | 'growth', string> = {
  inventory: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQVPsje-s9qGXGpNTxiYZhNa5laEtzl0FLnbhjF8DoP7xsnwWF7YfH2C0ysSQi_HNHvkcPCI8YdqX8G/pub?output=csv', // For Daily Ops & Inventory tabs
  b2b: 'YOUR_B2B_INVENTORY_SHEET_URL_HERE', // For B2B Inventory tab
  daily: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQXSEXlcVQfejFZ5SF7mBZbDXt-bnF9fBYbi8xfkQ_wOzFN6JeevfmFlhJhxOpTyAeNYbQeLKVr7pHv/pub?output=csv',    // For Daily P&L tab
  growth: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTVzF1bM5-_2rb-25uu4rHfDz-2wcp_O8FbDDr0JT4btPkRHJTMfj2_7ka2WVv8S255J_vdins3GhDv/pub?output=csv',      // For Growth tab
};
// ----------------------------------------------------


export default function MainView() {
  const { toast } = useToast();

  // === STATE MANAGEMENT ===
  const [activeTab, setActiveTab] = useState<TabId>("daily");
  const [displayData, setDisplayData] = useState<InventoryItem[]>([]);
  const [b2bInventoryData, setB2bInventoryData] = useState<B2BInventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [dailyData, setDailyData] = useState<ProcessedSheetData[] | null>(null);
  const [growthData, setGrowthData] = useState<GrowthData[] | null>(null);

  // Filters & Thresholds
  const [currentChannel, setCurrentChannel] = useState<Channel>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: 'name', direction: 'asc' });
  const [roasThreshold, setRoasThreshold] = useState(1.5);

  // Modals
  const [isAddSkuModalOpen, setAddSkuModalOpen] = useState(false);

  const [isClient, setIsClient] = useState(false);
  useEffect(() => {
    setIsClient(true);
    initializeData();
  }, []);

  // === DATA INITIALIZATION & RESET ===
  const initializeData = useCallback(() => {
    setDisplayData(masterData);
    setB2bInventoryData([]);
    setDailyData(null);
    setGrowthData(growthMasterData);
  }, []);

  const handleReset = () => {
    initializeData();
    setSearchTerm("");
    setCurrentChannel("All");
    setRoasThreshold(1.5);
    setDailyData(null);
    setGrowthData(null);
    toast({ title: "View Reset", description: "All data has been reset to its initial state." });
  };

  // === DERIVED DATA & FILTERING ===
  const alerts = useMemo(() => {
    return filteredData
      .map(item => {
        const stockTotal = (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
        const stockDays = item.drr > 0 ? stockTotal / item.drr : 999;
        if (stockDays < 5) return `Critical stock for ${item.name} (${Math.round(stockDays)} days left).`;
        if (item.ads_active && stockDays < 7) return `Turn off ads for ${item.name} (low stock).`;
        return null;
      })
      .filter((alert): alert is string => alert !== null)
      .slice(0, 3);
  }, [filteredData]);

  const kpis = useMemo<Kpi>(() => {
    return filteredData.reduce(
      (acc, item) => {
        acc.revenue += item.price * item.orders;
        acc.spend += item.spend;
        acc.stock += (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
        return acc;
      },
      { revenue: 0, spend: 0, stock: 0, skus: filteredData.length }
    );
  }, [filteredData]);

  useEffect(() => {
    let channelFiltered =
      currentChannel === "All"
        ? displayData
        : displayData.filter(
            (item) => item.channel.toLowerCase() === currentChannel.toLowerCase()
          );

    if (searchTerm) {
        channelFiltered = channelFiltered.filter((item) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }
    
    setFilteredData(channelFiltered);
  }, [searchTerm, currentChannel, displayData]);


  // === DATA PROCESSING & IMPORT ===
  const processSheetData = (
    data: ArrayBuffer,
    type: 'inventory' | 'b2b' | 'daily' | 'growth'
  ) => {
    try {
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

      if (type === 'inventory') {
          const headers: string[] = json[0].map((h:string) => h.toLowerCase().replace(/\s+/g, '_'));
          const importedData: InventoryItem[] = json.slice(1).map((row: any[], index: number) => {
            const item: any = {};
            headers.forEach((header, i) => {
              item[header] = row[i];
            });

            const drr_kol = parseInt(item.kol_drr, 10) || 0;
            const drr_pith = parseInt(item.pith_drr, 10) || 0;
            const drr_har = parseInt(item.har_drr, 10) || 0;
            const drr_blr = parseInt(item.blr_drr, 10) || 0;

            return {
              id: Date.now() + index,
              channel: item.channel || 'Amazon',
              name: item.sku_name,
              type: 'B2C', 
              price: parseFloat(item.price) || 0,
              cost: parseFloat(item.cost) || 0,
              shipping: parseFloat(item.shipping) || 0,
              commission: parseFloat(item.commission) || 0,
              stock_kol: parseInt(item.kol_stock, 10) || 0,
              stock_pith: parseInt(item.pith_stock, 10) || 0,
              stock_har: parseInt(item.har_stock, 10) || 0,
              stock_blr: parseInt(item.blr_stock, 10) || 0,
              stock_unalloc: parseInt(item.unalloc_stock, 10) || 0,
              stock_factory: parseInt(item.factory_stock, 10) || 0,
              stock_wip: parseInt(item.wip_stock, 10) || 0,
              drr_kol,
              drr_pith,
              drr_har,
              drr_blr,
              drr: drr_kol + drr_pith + drr_har + drr_blr,
              spend: parseFloat(item.ad_spend) || 0,
              orders: parseInt(item.orders, 10) || 0,
              returns: parseInt(item.returns, 10) || 0,
              impr: parseInt(item.impressions, 10) || 0,
              clicks: parseInt(item.clicks, 10) || 0,
              ads_active: String(item.ads_active).toUpperCase() === 'TRUE',
              rating: parseFloat(item.rating) || 0,
              reviews: parseInt(item.reviews, 10) || 0
            };
          });
          if (importedData.length === 0 || !importedData.some(d => d.name)) {
             throw new Error("No valid inventory data was parsed. Check column headers like 'SKU Name', 'Price', 'Kol Stock', etc.");
          }
          setDisplayData(importedData);
      } else if (type === 'b2b') {
        const headers: string[] = json[0].map((h:string) => h.toLowerCase().replace(/\s+/g, '_'));
        const importedData: B2BInventoryItem[] = json.slice(1).map((row: any[], index: number) => {
            const item: any = {};
            headers.forEach((header, i) => {
              item[header] = row[i];
            });

            return {
              id: Date.now() + index,
              platform: item.platform || 'Amazon',
              sku_name: item.sku_name,
              asin: item.asin,
              listing_price: parseFloat(item.listing_price) || 0,
              b2b_price: parseFloat(item.b2b_price) || 0,
              stock: parseInt(item.stock, 10) || 0,
              inbound_stock: parseInt(item.inbound_stock, 10) || 0,
            };
        });
        if (importedData.length === 0 || !importedData.some(d => d.sku_name)) {
            throw new Error("No valid B2B inventory data was parsed. Check column headers like 'SKU Name', 'Platform', 'Stock', etc.");
        }
        setB2bInventoryData(importedData);
      } else if (type === 'daily' || type === 'growth') {
            const header1: string[] = json[0] || [];
            const header2: string[] = json[1] || [];
            
            const platformHeaders: { name: string, startIndex: number, endIndex: number }[] = [];
            let currentPlatform: string | null = null;
            let currentPlatformIndex = -1;

            header1.forEach((cell, index) => {
                if (cell && cell.trim() !== '') {
                    if (currentPlatform) {
                        platformHeaders.push({ name: currentPlatform, startIndex: currentPlatformIndex, endIndex: index - 1 });
                    }
                    const platformNameMatch = cell.match(/(\d+\s*of\s*\d+:\s*)?(.*)/);
                    currentPlatform = platformNameMatch ? platformNameMatch[2].trim() : cell.trim();
                    currentPlatformIndex = index;
                }
            });
            if (currentPlatform) {
                platformHeaders.push({ name: currentPlatform, startIndex: currentPlatformIndex, endIndex: header1.length - 1 });
            }
            
            if (type === 'daily') {
              const processedData: ProcessedSheetData[] = [];
              json.slice(2).forEach(row => {
                  const dateString = row[0];
                  if (!dateString) return;

                  let date: Date | null = null;
                  // Excel serial date number
                  if (typeof dateString === 'number') {
                      date = XLSX.SSF.parse_date_code(dateString);
                      date = new Date(Date.UTC(date.y, date.m - 1, date.d));
                  } else if (typeof dateString === 'string') {
                      const formatsToTry = ["d-MMM-yy", "MM/dd/yyyy", "yyyy-MM-dd", "dd-MM-yyyy", "MMM d, yyyy"];
                      for (const fmt of formatsToTry) {
                          const parsedDate = parse(dateString, fmt, new Date());
                          if (isValid(parsedDate)) {
                              date = parsedDate;
                              break;
                          }
                      }
                  }
                  if (!date) return;


                  platformHeaders.forEach(platform => {
                      if (platform.name.toLowerCase().includes('total')) return;

                      let gmv = 0, units = 0, packets = 0, adsSpent = 0;
                      for (let i = platform.startIndex; i <= platform.endIndex; i++) {
                          const metric = header2[i]?.toLowerCase() || '';
                          const value = typeof row[i] === 'string' ? parseFloat(row[i].replace(/[^0-9.-]+/g,"")) : row[i];
                          if (isNaN(value)) continue;

                          if (metric.includes('gmv')) gmv = value;
                          else if (metric.includes('units')) units = value;
                          else if (metric.includes('packets')) packets = value;
                          else if (metric.includes('ads spent')) adsSpent = value;
                      }
                    
                      if (gmv > 0 || units > 0 || packets > 0 || adsSpent > 0) {
                            const avgAsp = units > 0 ? gmv / units : 0;
                            const tacos = gmv > 0 ? adsSpent / gmv : 0;
                          
                            processedData.push({
                              date: date as Date,
                              channel: platform.name,
                              gmv, units, packets, adsSpent, avgAsp, tacos,
                              month: format(date as Date, 'MMM'),
                              year: format(date as Date, 'yyyy'),
                              day: format(date as Date, 'd'),
                              revenuePerUnit: units > 0 ? gmv / units : 0,
                              adsPerUnit: units > 0 ? adsSpent / units : 0,
                          });
                      }
                  });
              });
              if (processedData.length === 0) {
                  throw new Error("No valid data was parsed from the sheet. Check the format and headers.");
              }
              setDailyData(processedData);
            } else { // growth
              const processedData: GrowthData[] = [];
              json.slice(2).forEach(row => {
                  const monthString = row[0];
                  if (!monthString) return;

                  platformHeaders.forEach(platform => {
                      if (platform.name.toLowerCase().includes('total')) return;
                      let gmv = 0, units = 0, packets = 0, adsSpent = 0, mom = 0, channelShare = 0;

                      for (let i = platform.startIndex; i <= platform.endIndex; i++) {
                          const metric = header2[i]?.toLowerCase() || '';
                          const value = typeof row[i] === 'string' ? parseFloat(row[i].replace(/[^0-9.%-]+/g,"")) : row[i];
                           if (isNaN(value)) continue;

                          if (metric.includes('gmv')) gmv = value;
                          else if (metric.includes('units')) units = value;
                          else if (metric.includes('packets')) packets = value;
                          else if (metric.includes('ads spent')) adsSpent = value;
                          else if (metric.includes('mom')) mom = value;
                          else if (metric.includes('channel share')) channelShare = value;
                      }
                      if (gmv > 0 || units > 0 || packets > 0 || adsSpent > 0) {
                          const avgAsp = units > 0 ? gmv / units : 0;
                          const tacos = gmv > 0 ? adsSpent / gmv : 0;
                          processedData.push({
                              month: monthString,
                              channel: platform.name,
                              gmv, units, packets, adsSpent, avgAsp, tacos, mom, channelShare
                          });
                      }
                  });
              });
              if (processedData.length === 0) {
                  throw new Error("No valid data was parsed from the sheet. Check the format and headers.");
              }
              setGrowthData(processedData);
            }
        }
      
      toast({ title: "Import Successful", description: `${type.charAt(0).toUpperCase() + type.slice(1)} data has been loaded.` });
    } catch (error) {
      console.error("File processing error:", error);
      toast({
        variant: "destructive",
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Could not process the uploaded file.",
      });
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'inventory' | 'b2b' | 'daily' | 'growth'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (data instanceof ArrayBuffer) {
        processSheetData(data, type);
      }
    };
    reader.readAsArrayBuffer(file);

    if(event.target) event.target.value = '';
  };
  
  const handleCloudSync = async (dataType: 'inventory' | 'b2b' | 'daily' | 'growth') => {
    const url = GOOGLE_SHEET_URLS[dataType];

    if (!url || url.includes('YOUR_SHEET_URL_HERE')) {
        toast({ variant: 'destructive', title: "Sync Error", description: `URL for ${dataType} data is not configured.`});
        return;
    }

    toast({ title: "Sync Initiated", description: `Fetching ${dataType} data from Google Sheets...` });
    try {
        const response = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch: ${response.statusText} - ${errorText}`);
        }
        const data = await response.arrayBuffer();
        
        processSheetData(data, dataType);

    } catch (error) {
        console.error("Cloud sync error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: "Sync Failed", description: `Could not fetch or process data from URL. ${errorMessage}`});
    }
  };

  const handleSyncAll = async () => {
    await handleCloudSync('inventory');
    await handleCloudSync('b2b');
    await handleCloudSync('daily');
    await handleCloudSync('growth');
  };
  
  const handleDeleteSku = (id: number) => {
    setDisplayData(prev => prev.filter(item => item.id !== id));
    toast({ title: "SKU Removed", description: `The item has been removed from the list.` });
  };


  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      <Header onReset={handleReset} onSyncAll={handleSyncAll} />
      {alerts.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside">
              {alerts.map((alert, i) => (
                <li key={i}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabId)}>
        <TabsList className="mb-4">
          {(Object.keys(channelIcons) as TabId[]).map(tab => {
            const Icon = channelIcons[tab];
            return (
              <TabsTrigger key={tab} value={tab} className="capitalize text-xs sm:text-sm">
                <Icon className="w-4 h-4 mr-1.5" />
                {tab === 'daily' ? 'Daily Ops' : tab === 'dailypnl' ? 'Daily P&L' : tab === 'recommendations' ? 'Action Center' : tab === 'b2b' ? 'B2B Inventory' : tab}
              </TabsTrigger>
            )
          })}
        </TabsList>
        <TabsContent value="daily">
            <DailyOpsTab
                data={filteredData}
                kpis={kpis}
                roasThreshold={roasThreshold}
                setRoasThreshold={setRoasThreshold}
                currentChannel={currentChannel}
                setCurrentChannel={setCurrentChannel}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAddSku={() => setAddSkuModalOpen(true)}
                onFileUpload={(e) => handleFileUpload(e, 'inventory')}
                onCloudImport={() => handleCloudSync('inventory')}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                onDeleteSku={handleDeleteSku}
            />
        </TabsContent>
        <TabsContent value="inventory">
              <InventoryTab 
                data={displayData} 
                searchTerm={searchTerm}
                onFileUpload={(e) => handleFileUpload(e, 'inventory')}
                onCloudImport={() => handleCloudSync('inventory')}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
              />
            </TabsContent>
        <TabsContent value="b2b">
              <B2BInventoryTab 
                data={b2bInventoryData}
                searchTerm={searchTerm}
                onFileUpload={(e) => handleFileUpload(e, 'b2b')}
                onCloudImport={() => handleCloudSync('b2b')}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
              />
        </TabsContent>
        <TabsContent value="dailypnl">
                <PnlTab 
                    data={dailyData}
                    onFileUpload={(e) => handleFileUpload(e, 'daily')}
                    onCloudImport={() => handleCloudSync('daily')}
                 />
        </TabsContent>
         <TabsContent value="growth">
                <GrowthTab
                    data={growthData}
                    onFileUpload={(e) => handleFileUpload(e, 'growth')}
                    onCloudImport={() => handleCloudSync('growth')}
                 />
        </TabsContent>
        <TabsContent value="recommendations">
                <RecommendationsTab 
                  inventoryData={displayData} 
                  roasThreshold={roasThreshold} 
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                />
            </TabsContent>
      </Tabs>

      <AddSkuModal
        isOpen={isAddSkuModalOpen}
        onClose={() => setAddSkuModalOpen(false)}
        onSave={(newSku) => {
            const fullSku: InventoryItem = {
                ...newSku,
                id: Date.now(),
                type: 'B2C',
                shipping: 0, commission: 0,
                stock_kol: 0, stock_pith: 0, stock_har: 0, stock_blr: 0,
                stock_unalloc: 0, stock_factory: 0, stock_wip: 0,
                drr_kol: 0, drr_pith: 0, drr_har: 0, drr_blr: 0, drr: 0,
                spend: 0, orders: 0, returns: 0, impr: 0, clicks: 0,
                ads_active: false, rating: 0, reviews: 0
            };
            setDisplayData(prev => [fullSku, ...prev]);
            toast({title: "SKU Added", description: `${newSku.name} has been added to the list.`});
        }}
      />
    </>
  );
}
