
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Activity,
  AlertTriangle,
  BarChart2,
  Box,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  InventoryItem,
  Kpi,
  TabId,
  SortConfig,
  Channel,
  ProcessedSheetData,
  Recommendation
} from "@/lib/types";
import { masterData } from "@/lib/data";
import { format, parse, isValid } from 'date-fns';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Header from "./header";
import DailyOpsTab from "./tabs/daily-ops-tab";
import InventoryTab from "./tabs/inventory-tab";
import GrowthTab from "./tabs/growth-tab";
import PnlTab from "./tabs/pnl-tab";
import RecommendationsTab from "./tabs/recommendations-tab";
import { CloudImportModal, AddSkuModal } from "./modals";

const channelIcons = {
  daily: Activity,
  inventory: Box,
  growth: BarChart2,
  dailypnl: Calendar,
  recommendations: CheckCircle,
};

export default function MainView() {
  const { toast } = useToast();

  // === STATE MANAGEMENT ===
  const [activeTab, setActiveTab] = useState<TabId>("daily");
  const [displayData, setDisplayData] = useState<InventoryItem[]>([]);
  const [filteredData, setFilteredData] = useState<InventoryItem[]>([]);
  const [growthData, setGrowthData] = useState<ProcessedSheetData[] | null>(null);
  const [dailyData, setDailyData] = useState<ProcessedSheetData[] | null>(null);

  // Filters & Thresholds
  const [currentChannel, setCurrentChannel] = useState<Channel>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: "desc" });
  const [roasThreshold, setRoasThreshold] = useState(3.0);
  
  // UI State
  const [isClient, setIsClient] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAddSkuModalOpen, setAddSkuModalOpen] = useState(false);
  const [pendingCloudType, setPendingCloudType] = useState<TabId | null>(null);

  
  // === DATA PROCESSING & CALCULATIONS ===
  const kpis = useMemo<Kpi>(() => {
    return (filteredData || []).reduce(
      (acc, item) => {
        const revenue = (item.price || 0) * (item.orders || 0);
        acc.revenue += revenue;
        acc.spend += item.spend || 0;
        acc.stock += (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
        return acc;
      },
      { revenue: 0, spend: 0, stock: 0, skus: filteredData.length }
    );
  }, [filteredData]);
  
  // === EFFECTS ===
  useEffect(() => {
    setIsClient(true);
    resetData();
  }, []);

  useEffect(() => {
    let newFilteredData =
      currentChannel === "All"
        ? displayData
        : displayData.filter((item) => item.channel === currentChannel);

    if (searchTerm) {
      newFilteredData = newFilteredData.filter((item) =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredData(newFilteredData);
  }, [displayData, currentChannel, searchTerm]);
  
  // === HANDLERS ===
  const resetData = () => {
    const processed = masterData.map(d => ({
        ...d,
        drr: (d.drr_kol||0) + (d.drr_pith||0) + (d.drr_har||0) + (d.drr_blr||0)
    }));
    setDisplayData(processed);
    setGrowthData(null);
    setDailyData(null);
    toast({ title: "Data Reset", description: "Loaded initial dataset." });
  };
  
  const processSheetData = (data: ArrayBuffer, type: 'inventory' | 'growth' | 'daily') => {
    try {
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        if (type === 'inventory') {
            const jsonData = XLSX.utils.sheet_to_json<any>(worksheet);
            const mapped = jsonData.map((item, idx) => ({ 
                id: item.id || Date.now() + idx, 
                name: item['SKU Name'] || 'Unnamed SKU',
                channel: item['Channel'] || 'General',
                price: parseFloat(item['Price'])||0, 
                shipping: parseFloat(item['Shipping'])||0, 
                commission: parseFloat(item['Commission'])||0,
                stock_kol: parseInt(item['Kol Stock'])||0, 
                drr_kol: parseInt(item['Kol DRR'])||0,
                stock_pith: parseInt(item['Pith Stock'])||0,
                drr_pith: parseInt(item['Pith DRR'])||0,
                stock_har: parseInt(item['Har Stock'])||0,
                drr_har: parseInt(item['Har DRR'])||0,
                stock_blr: parseInt(item['Blr Stock'])||0,
                drr_blr: parseInt(item['Blr DRR'])||0,
                stock_unalloc: parseInt(item['Unalloc Stock'] || item['Unalloc']) || 0,
                stock_factory: parseInt(item['Factory Stock'] || item['Factory']) || 0,
                stock_wip: parseInt(item['WIP Stock'] || item['WIP']) || 0,
                spend: parseFloat(item['Ad Spend'])||0, 
                orders: parseInt(item['Orders'])||0, 
                returns: parseInt(item['Returns'])||0,
                impr: parseInt(item['Impressions']) || 0,
                clicks: parseInt(item['Clicks']) || 0,
                ads_active: !!item['Ads Active'],
                rating: parseFloat(item['Rating']) || 0, 
                reviews: parseInt(item['Reviews']) || 0,
                type: 'B2C'
            }));
            const processed = mapped.map(d => ({
                ...d,
                drr: (d.drr_kol||0) + (d.drr_pith||0) + (d.drr_har||0) + (d.drr_blr||0)
            }));
            setDisplayData(processed as InventoryItem[]);
        } else if (type === 'growth' || type === 'daily') {
            const json = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, defval: "" });
            
            if (json.length < 2) throw new Error("Sheet must have at least 2 header rows.");

            const platformHeaders = json[0] as string[];
            const metricHeaders = json[1] as string[];
            const dataRows = json.slice(2);

            const platformDetails: { name: string, startIndex: number, endIndex: number }[] = [];
            let currentPlatform: { name: string, startIndex: number } | null = null;
            
            for (let i = 1; i < platformHeaders.length; i++) {
                const header = platformHeaders[i]?.trim();
                if (header) {
                    if (currentPlatform) {
                        platformDetails.push({ ...currentPlatform, endIndex: i - 1 });
                    }
                    const platformName = header.replace(/^(\d+(\s*and\s*\d+)?\s*of\s+\d+:\s*)/i, '').trim();
                    currentPlatform = { name: platformName, startIndex: i };
                }
            }
            if (currentPlatform) {
                platformDetails.push({ ...currentPlatform, endIndex: platformHeaders.length - 1 });
            }
            
            const processedData: ProcessedSheetData[] = [];

            dataRows.forEach(row => {
                const dateRaw = row[0];
                if (!dateRaw) return;

                let date: Date | null = null;
                if (typeof dateRaw === 'number' && dateRaw > 1) {
                    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                    date = new Date(excelEpoch.getTime() + dateRaw * 86400000);
                } else if (typeof dateRaw === 'string') {
                    const formats = ["dd-MMM-yy", "dd-MMM", "yyyy-MM-dd", "MM/dd/yy", "M/d/yy", "MMM'yy", "MMMM", "MMM yyyy"];
                    for (const fmt of formats) {
                        const d = parse(dateRaw, fmt, new Date());
                        if (isValid(d)) {
                            date = d;
                            break;
                        }
                    }
                     if (!date && /^\d{5}$/.test(dateRaw)) {
                        const excelEpoch = new Date(Date.UTC(1899, 11, 30));
                        date = new Date(excelEpoch.getTime() + (parseInt(dateRaw, 10) -1) * 86400000);
                    }
                }
                
                if (!date || !isValid(date)) return;

                platformDetails.forEach(platform => {
                    const metricMap: { [key: string]: number } = { gmv: 0, units: 0, packets: 0, adsSpent: 0 };
                    let hasData = false;

                    for (let colIndex = platform.startIndex; colIndex <= platform.endIndex; colIndex++) {
                        const metricHeader = metricHeaders[colIndex]?.toLowerCase().trim();
                        const value = row[colIndex];

                        if (value === null || value === undefined || value === '-' || value === '' || !metricHeader) continue;

                        const numValue = (typeof value === 'string') ? parseFloat(value.replace(/[,₹]/g, '')) : (typeof value === 'number' ? value : 0);

                        if (isNaN(numValue)) continue;
                        hasData = true;

                        if (metricHeader.includes('gmv')) metricMap.gmv += numValue;
                        else if (metricHeader.includes('units')) metricMap.units += numValue;
                        else if (metricHeader.includes('packets')) metricMap.packets += numValue;
                        else if (metricHeader.includes('ads spent')) metricMap.adsSpent += numValue;
                    }

                    if (hasData) {
                         const { gmv, units, packets, adsSpent } = metricMap;
                         const avgAsp = units > 0 ? gmv / units : 0;
                         const tacos = gmv > 0 ? adsSpent / gmv : 0;
                         
                         processedData.push({
                            date: date,
                            channel: platform.name,
                            gmv,
                            units,
                            packets,
                            adsSpent,
                            avgAsp,
                            tacos,
                            month: format(date, 'MMM'),
                            year: format(date, 'yyyy'),
                            day: format(date, 'd'),
                            revenuePerUnit: units > 0 ? gmv / units : 0,
                            adsPerUnit: units > 0 ? adsSpent / units : 0,
                        });
                    }
                });
            });
            
            if (processedData.length === 0) {
                 throw new Error("No valid data was parsed from the sheet. Check the format and headers.");
            }
            
            if (type === 'growth') {
                setGrowthData(processedData);
            } else { // daily
                setDailyData(processedData);
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
    type: 'inventory' | 'growth' | 'daily'
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
  
  const handleCloudSync = async (url: string, type: TabId | null) => {
    if (!type) {
        toast({ variant: 'destructive', title: "Sync Error", description: "No data type specified for sync."});
        return;
    }

    toast({ title: "Sync Initiated", description: `Fetching data from Google Sheets...` });
    try {
        const response = await fetch(`/api/sheets?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch: ${response.statusText} - ${errorText}`);
        }
        const data = await response.arrayBuffer();
        
        let dataType: 'inventory' | 'growth' | 'daily' | null = null;
        if (type === 'daily') { // Maps to inventory sheet on Daily Ops tab
            dataType = 'inventory';
        } else if (type === 'growth') {
            dataType = 'growth';
        } else if (type === 'dailypnl') {
            dataType = 'daily';
        } else if (type === 'inventory') { // From inventory tab
             dataType = 'inventory';
        }

        if (dataType) {
            processSheetData(data, dataType);
        } else {
            throw new Error("Invalid data type for cloud sync.");
        }

    } catch (error) {
        console.error("Cloud sync error:", error);
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        toast({ variant: 'destructive', title: "Sync Failed", description: `Could not fetch or process data from URL. ${errorMessage}`});
    }
  };

  const openCloudImport = (type: TabId) => {
    setPendingCloudType(type);
    setModalOpen(true);
  };


  if (!isClient) {
    return null; // Or a loading skeleton
  }

  return (
    <>
      <Header onReset={resetData} />

      {alerts.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {alerts.map((alert, i) => (
                <li key={i}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-slate-100 dark:bg-slate-800 h-auto p-1 mb-6">
          {(Object.keys(channelIcons) as TabId[]).map(tab => {
            const Icon = channelIcons[tab];
            return (
              <TabsTrigger key={tab} value={tab} className="capitalize flex items-center gap-2 whitespace-nowrap data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md">
                <Icon className="w-4 h-4" />
                {tab === 'daily' ? 'Daily Ops' : tab === 'dailypnl' ? 'Daily P&L' : tab === 'recommendations' ? 'Action Center' : tab}
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
                onCloudImport={() => openCloudImport('daily')}
            />
        </TabsContent>
        <TabsContent value="inventory">
            <InventoryTab 
              data={displayData} 
              searchTerm={searchTerm}
              onCloudImport={() => openCloudImport('inventory')}
              onFileUpload={(e) => handleFileUpload(e, 'inventory')}
            />
        </TabsContent>
        <TabsContent value="growth">
             <GrowthTab 
                data={growthData} 
                onFileUpload={(e) => handleFileUpload(e, 'growth')} 
                onCloudImport={() => openCloudImport('growth')}
             />
        </TabsContent>
        <TabsContent value="dailypnl">
             <PnlTab 
                data={dailyData} 
                onFileUpload={(e) => handleFileUpload(e, 'daily')}
                onCloudImport={() => openCloudImport('dailypnl')}
             />
        </TabsContent>
        <TabsContent value="recommendations">
            <RecommendationsTab 
                inventoryData={displayData}
                roasThreshold={roasThreshold}
            />
        </TabsContent>
      </Tabs>

      <CloudImportModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSync={(url) => {
            handleCloudSync(url, pendingCloudType);
            setModalOpen(false);
        }}
        type={pendingCloudType}
      />
      
      <AddSkuModal
        isOpen={isAddSkuModalOpen}
        onClose={() => setAddSkuModalOpen(false)}
        onSave={(newSku) => {
            const fullSku: InventoryItem = {
                ...newSku,
                id: Date.now(),
                type: 'B2C',
                price: 0, shipping: 0, commission: 0,
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
