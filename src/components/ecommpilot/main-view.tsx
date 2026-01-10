
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
  LayoutDashboard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type {
  InventoryItem,
  Kpi,
  InventoryKpi,
  MatrixData,
  TabId,
  SortConfig,
  Channel,
} from "@/lib/types";
import { masterData } from "@/lib/data";
import { getAiRecommendations } from "@/lib/actions";
import {
  InventoryRecommendationsOutput,
  InventoryRecommendationsInput,
} from "@/ai/flows/generate-inventory-recommendations";

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
  const [growthData, setGrowthData] = useState<MatrixData | null>(null);
  const [dailyData, setDailyData] = useState<MatrixData | null>(null);
  const [growthLabels, setGrowthLabels] = useState<string[]>([]);
  const [dailyLabels, setDailyLabels] = useState<string[]>([]);

  // Filters & Thresholds
  const [currentChannel, setCurrentChannel] = useState<Channel>("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({ column: null, direction: "desc" });
  const [roasThreshold, setRoasThreshold] = useState(3.0);
  const [cvrThreshold, setCvrThreshold] = useState(7);
  const [recTargetRoas, setRecTargetRoas] = useState(3.0);

  // UI State
  const [isClient, setIsClient] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isAddSkuModalOpen, setAddSkuModalOpen] = useState(false);
  const [pendingCloudType, setPendingCloudType] = useState<TabId | null>(null);

  // Data State
  const [recommendations, setRecommendations] = useState<InventoryRecommendationsOutput>([]);
  const [isRecsLoading, setRecsLoading] = useState(false);

  // === DATA PROCESSING & CALCULATIONS ===
  const kpis = useMemo<Kpi>(() => {
    return displayData.reduce(
      (acc, item) => {
        const revenue = (item.price || 0) * (item.orders || 0);
        acc.revenue += revenue;
        acc.spend += item.spend || 0;
        acc.stock += (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0);
        return acc;
      },
      { revenue: 0, spend: 0, roas: 0, cvr: 0, returns: 0, stock: 0, skus: displayData.length }
    );
  }, [displayData]);
  
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
    toast({ title: "Data Reset", description: "Loaded initial dataset." });
  };
  
  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'inventory' | 'growth' | 'daily'
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        
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
                spend: parseFloat(item['Ad Spend'])||0, 
                orders: parseInt(item['Orders'])||0, 
                returns: parseInt(item['Returns'])||0,
                impr: 0,
                clicks: 0,
                ads_active: false,
                rating: parseFloat(item['Rating']) || 0, 
                reviews: parseInt(item['Reviews']) || 0,
                type: 'B2C',
                stock_unalloc: 0, stock_factory:0, stock_wip:0
            }));
            const processed = mapped.map(d => ({
                ...d,
                drr: (d.drr_kol||0) + (d.drr_pith||0) + (d.drr_har||0) + (d.drr_blr||0)
            }));
            setDisplayData(processed as InventoryItem[]);
        }
        
        toast({ title: "Import Successful", description: `${type.charAt(0).toUpperCase() + type.slice(1)} data has been loaded.` });
      } catch (error) {
        console.error("File processing error:", error);
        toast({
          variant: "destructive",
          title: "Import Failed",
          description: "Could not process the uploaded file.",
        });
      }
    };
    reader.readAsArrayBuffer(file);
    if(event.target) event.target.value = '';
  };
  
  const handleRecalculate = useCallback(async () => {
    setRecsLoading(true);
    const input: InventoryRecommendationsInput = {
        inventoryItems: displayData.map(item => ({
            sku: item.name,
            channel: item.channel,
            stockLevel: (item.stock_kol || 0) + (item.stock_pith || 0) + (item.stock_har || 0) + (item.stock_blr || 0),
            drr: item.drr,
            price: item.price,
            shipping: item.shipping,
            commission: item.commission,
        })),
        targetRoas: recTargetRoas,
    };

    const result = await getAiRecommendations(input);
    if (result.success && result.data) {
        setRecommendations(result.data);
        toast({ title: "Recommendations Generated", description: "AI has provided new action items." });
    } else {
        toast({ variant: 'destructive', title: "AI Error", description: result.error });
    }
    setRecsLoading(false);
  }, [displayData, recTargetRoas, toast]);


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
                {tab === 'daily' ? 'Daily Ops' : tab === 'dailypnl' ? 'Daily P&L' : tab === 'recommendations' ? 'Actions' : tab}
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
                cvrThreshold={cvrThreshold}
                setCvrThreshold={setCvrThreshold}
                currentChannel={currentChannel}
                setCurrentChannel={setCurrentChannel}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                onAddSku={() => setAddSkuModalOpen(true)}
                onFileUpload={(e) => handleFileUpload(e, 'inventory')}
            />
        </TabsContent>
        <TabsContent value="inventory">
            <InventoryTab data={displayData} searchTerm={searchTerm} />
        </TabsContent>
        <TabsContent value="growth">
             <GrowthTab />
        </TabsContent>
        <TabsContent value="dailypnl">
             <PnlTab />
        </TabsContent>
        <TabsContent value="recommendations">
            <RecommendationsTab 
                recommendations={recommendations}
                isLoading={isRecsLoading}
                targetRoas={recTargetRoas}
                setTargetRoas={setRecTargetRoas}
                onRecalculate={handleRecalculate}
            />
        </TabsContent>
      </Tabs>

      <CloudImportModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onSync={(url) => {
          // Placeholder for fetch logic
          console.log(`Syncing ${pendingCloudType} from ${url}`);
          toast({title: "Sync Initiated", description: `Fetching data from Google Sheets.`});
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

    