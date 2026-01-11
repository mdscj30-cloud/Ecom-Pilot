export interface InventoryItem {
  id: number;
  channel: "Meesho" | "Amazon" | string;
  type: string;
  name: string;
  price: number;
  cost: number;
  shipping: number;
  commission: number;
  stock_kol: number;
  stock_pith: number;
  stock_har: number;
  stock_blr: number;
  stock_unalloc: number;
  stock_factory: number;
  stock_wip: number;
  drr_kol: number;
  drr_pith: number;
  drr_har: number;
  drr_blr: number;
  drr: number;
  spend: number;
  orders: number;
  returns: number;
  impr: number;
  clicks: number;
  ads_active: boolean;
  rating: number;
  reviews: number;
}

export interface B2BInventoryItem {
  id: number;
  platform: 'Amazon' | 'Flipkart' | string;
  sku_name: string;
  asin: string;
  listing_price: number;
  b2b_price: number;
  stock: number;
  inbound_stock: number;
  drr: number;
}


export interface Kpi {
  revenue: number;
  spend: number;
  stock: number;
  skus: number;
}

export interface InventoryKpi {
  sellableValue: number;
  capitalNeeded: number;

  avgCover: number;
  stockouts: number;
  stuckCapital: number;
}

export interface ProcessedSheetData {
  date: Date;
  channel: string;
  gmv: number;
  units: number;
  packets: number;
  adsSpent: number;
  avgAsp: number;
  tacos: number;
  month: string;
  year: string;
  day: string;
  revenuePerUnit: number;
  adsPerUnit: number;
}

export interface Recommendation {
  sku: string;
  inventoryAction: string;
  adAction: string;
  remarks: string;
  stockDays: number;
  netValue: number;
}

export interface MatrixData {
  [key: string]: {
    name: string;
    gmv: number[];
    units: number[];
    packets: number[];
    spend: number[];
    asp: number[];
    tacos: number[];
    share: number[];
    roas: number[];
    merged?: number[]; // For combined views like Rev/Ads
  };
}

export type TabId = 'daily' | 'inventory' | 'b2b' | 'dailypnl' | 'recommendations' | 'growth';

export type InventorySortColumn = 
  | 'name'
  | 'cost'
  | 'cover'
  | 'rop'
  | 'reorderIn'
  | 'planReq'
  | 'stock_kol'
  | 'drr_kol'
  | 'stock_pith'
  | 'drr_pith'
  | 'stock_har'
  | 'drr_har'
  | 'stock_blr'
  | 'drr_blr'
  | keyof InventoryItem;


export type SortConfig = {
    column: string | null;
    direction: 'asc' | 'desc';
};

export type Channel = 'All' | 'Meesho' | 'Amazon';

export interface GrowthData {
    month: string;
    channel: string;
    gmv: number;
    units: number;
    packets: number;
    adsSpent: number;
    avgAsp: number;
    tacos: number;
    mom: number;
    channelShare: number;
}
