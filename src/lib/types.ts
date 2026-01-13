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
  warehouse_stock: number;
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
  totalCostValue: number;
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
  roas: number;
  returns: number;
  reviews: number;
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

export type TabId = 'daily' | 'inventory' | 'b2b' | 'dailypnl' | 'recommendations' | 'growth' | 'ads';

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

// --- Ads Control Center Types ---

export interface Platform {
  platform_id: string;
  platform_name: string;
  currency: string;
  timezone: string;
  status: 'active' | 'inactive';
  ads_supported: boolean;
}

export interface ChannelAccount {
  account_id: string;
  platform_id: string;
  account_name: string;
  daily_budget_limit: number;
  monthly_budget_limit: number;
  status: 'active' | 'inactive';
}

export interface Campaign {
  campaign_id: string;
  platform_id: string;
  account_id: string;
  phase: string;
  objective: string;
  status: 'active' | 'paused' | 'ended';
  daily_budget: number;
  auto_scale: boolean;
  created_at: string;
}

export interface AdGroup {
  ad_group_id: string;
  campaign_id: string;
  sku_code: string;
  pack_size: number;
  status: 'active' | 'paused';
  bid_type: 'auto' | 'manual';
  max_cpc: number;
}

export interface AdsDailyMetrics {
  date: string;
  platform_id: string;
  campaign_id: string;
  ad_group_id: string;
  sku_code: string;
  impressions: number;
  clicks: number;
  orders: number;
  gmv: number;
  ads_spent: number;
  ctr: number;
  cvr: number;
  roas: number;
  tacos: number;
}

export interface InventorySnapshot {
  sku_code: string;
  current_stock: number;
  drr: number;
  stock_cover_days: number;
  last_updated: string;
}

export interface ControlThresholds {
  id: string; // e.g., meesho_phase_3
  platform_id: string;
  phase: string;
  min_roas: number;
  target_roas: number;
  max_tacos: number;
  min_stock_cover: number;
  pause_stock_cover: number;
  scale_budget_pct: number;
  cut_budget_pct: number;
}

export interface DecisionEngineOutput {
  date: string;
  platform_id: string;
  ad_group_id: string;
  decision: 'SCALE' | 'MAINTAIN' | 'CUT' | 'PAUSE';
  reason_codes: string[];
  recommended_action: {
    new_daily_budget: number;
    change_pct: number;
  };
}

export interface AdAlert {
  alert_id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  type: 'AUTO_PAUSE' | 'BUDGET_CAP' | 'PERFORMANCE_DROP';
  platform_id: string;
  sku_code: string;
  message: string;
  timestamp: string;
}

export interface ActionLog {
  action_id: string;
  entity: 'ad_group' | 'campaign';
  entity_id: string;
  action: 'BUDGET_INCREASE' | 'BUDGET_DECREASE' | 'STATUS_PAUSE' | 'STATUS_ACTIVE';
  old_value: number | string;
  new_value: number | string;
  triggered_by: 'AUTO_ENGINE' | 'MANUAL_OVERRIDE';
  timestamp: string;
}
