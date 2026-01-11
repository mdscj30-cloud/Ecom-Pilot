import type {
  Campaign,
  AdGroup,
  AdsDailyMetrics,
  InventorySnapshot,
  ControlThresholds,
  DecisionEngineOutput,
  AdAlert,
  ActionLog,
} from './types';

export const campaigns: Campaign[] = [
  {
    campaign_id: 'MEE_DIAPER_M_JAN25',
    platform_id: 'meesho',
    account_id: 'meesho_ads_01',
    phase: 'Phase 3',
    objective: 'Conversions',
    status: 'active',
    daily_budget: 12000,
    auto_scale: true,
    created_at: '2026-01-01',
  },
  {
    campaign_id: 'AMA_BABYWIPE_Q1',
    platform_id: 'amazon',
    account_id: 'amazon_ads_01',
    phase: 'Launch',
    objective: 'Awareness',
    status: 'active',
    daily_budget: 8000,
    auto_scale: false,
    created_at: '2026-01-15',
  },
];

export const adGroups: AdGroup[] = [
  {
    ad_group_id: 'DIAPER_M_PK20',
    campaign_id: 'MEE_DIAPER_M_JAN25',
    sku_code: 'ADP-M-20',
    pack_size: 20,
    status: 'active',
    bid_type: 'auto',
    max_cpc: 12,
  },
  {
    ad_group_id: 'DIAPER_L_PK50',
    campaign_id: 'MEE_DIAPER_M_JAN25',
    sku_code: 'ADP-L-50',
    pack_size: 50,
    status: 'paused',
    bid_type: 'auto',
    max_cpc: 15,
  },
  {
    ad_group_id: 'WIPE_SENSITIVE_PK80',
    campaign_id: 'AMA_BABYWIPE_Q1',
    sku_code: 'ABW-S-80',
    pack_size: 80,
    status: 'active',
    bid_type: 'manual',
    max_cpc: 9,
  },
];

export const adsDailyMetrics: AdsDailyMetrics[] = [
  {
    date: '2026-01-08',
    platform_id: 'meesho',
    campaign_id: 'MEE_DIAPER_M_JAN25',
    ad_group_id: 'DIAPER_M_PK20',
    sku_code: 'ADP-M-20',
    impressions: 24500,
    clicks: 920,
    orders: 63,
    gmv: 18900,
    ads_spent: 5200,
    ctr: 0.037,
    cvr: 0.068,
    roas: 3.63,
    tacos: 0.27,
  },
  {
    date: '2026-01-08',
    platform_id: 'amazon',
    campaign_id: 'AMA_BABYWIPE_Q1',
    ad_group_id: 'WIPE_SENSITIVE_PK80',
    sku_code: 'ABW-S-80',
    impressions: 15000,
    clicks: 300,
    orders: 15,
    gmv: 4500,
    ads_spent: 2000,
    ctr: 0.02,
    cvr: 0.05,
    roas: 2.25,
    tacos: 0.44,
  },
   {
    date: '2026-01-08',
    platform_id: 'meesho',
    campaign_id: 'MEE_DIAPER_M_JAN25',
    ad_group_id: 'DIAPER_L_PK50',
    sku_code: 'ADP-L-50',
    impressions: 500,
    clicks: 10,
    orders: 0,
    gmv: 0,
    ads_spent: 150,
    ctr: 0.02,
    cvr: 0.0,
    roas: 0.0,
    tacos: 1.0,
  },
];

export const inventorySnapshots: InventorySnapshot[] = [
  {
    sku_code: 'ADP-M-20',
    current_stock: 820,
    drr: 78,
    stock_cover_days: 10.5,
    last_updated: '2026-01-08T11:00',
  },
  {
    sku_code: 'ADP-L-50',
    current_stock: 40,
    drr: 10,
    stock_cover_days: 4.0,
    last_updated: '2026-01-08T11:00',
  },
  {
    sku_code: 'ABW-S-80',
    current_stock: 1500,
    drr: 50,
    stock_cover_days: 30,
    last_updated: '2026-01-08T11:00',
  },
];

export const controlThresholds: ControlThresholds[] = [
  {
    id: 'meesho_phase_3',
    platform_id: 'meesho',
    phase: 'Phase 3',
    min_roas: 2.5,
    target_roas: 3.5,
    max_tacos: 0.28,
    min_stock_cover: 7,
    pause_stock_cover: 5,
    scale_budget_pct: 0.25,
    cut_budget_pct: 0.3,
  },
  {
    id: 'amazon_launch',
    platform_id: 'amazon',
    phase: 'Launch',
    min_roas: 1.8,
    target_roas: 2.5,
    max_tacos: 0.5,
    min_stock_cover: 10,
    pause_stock_cover: 7,
    scale_budget_pct: 0.20,
    cut_budget_pct: 0.25,
  },
];

export const decisionEngineOutputs: DecisionEngineOutput[] = [
  {
    date: '2026-01-08',
    platform_id: 'meesho',
    ad_group_id: 'DIAPER_M_PK20',
    decision: 'SCALE',
    reason_codes: ['ROAS_ABOVE_TARGET', 'STOCK_OK'],
    recommended_action: {
      new_daily_budget: 15000,
      change_pct: 25,
    },
  },
  {
    date: '2026-01-08',
    platform_id: 'amazon',
    ad_group_id: 'WIPE_SENSITIVE_PK80',
    decision: 'CUT',
    reason_codes: ['ROAS_BELOW_MIN'],
    recommended_action: {
      new_daily_budget: 6000,
      change_pct: -25,
    },
  },
   {
    date: '2026-01-08',
    platform_id: 'meesho',
    ad_group_id: 'DIAPER_L_PK50',
    decision: 'PAUSE',
    reason_codes: ['STOCK_BELOW_PAUSE_THRESHOLD'],
    recommended_action: {
      new_daily_budget: 0,
      change_pct: -100,
    },
  },
];

export const adAlerts: AdAlert[] = [
  {
    alert_id: 'AL_90291',
    severity: 'HIGH',
    type: 'AUTO_PAUSE',
    platform_id: 'meesho',
    sku_code: 'ADP-L-50',
    message: 'Ads paused due to stock < 5 days',
    timestamp: '2026-01-08T11:05',
  },
  {
    alert_id: 'AL_90292',
    severity: 'MEDIUM',
    type: 'PERFORMANCE_DROP',
    platform_id: 'amazon',
    sku_code: 'ABW-S-80',
    message: 'ROAS dropped below minimum threshold of 1.8',
    timestamp: '2026-01-08T10:30',
  },
];

export const actionLogs: ActionLog[] = [
  {
    action_id: 'ACT_5512',
    entity: 'ad_group',
    entity_id: 'DIAPER_M_PK20',
    action: 'BUDGET_INCREASE',
    old_value: 12000,
    new_value: 15000,
    triggered_by: 'AUTO_ENGINE',
    timestamp: '2026-01-08T11:06',
  },
   {
    action_id: 'ACT_5513',
    entity: 'ad_group',
    entity_id: 'DIAPER_L_PK50',
    action: 'STATUS_PAUSE',
    old_value: 'active',
    new_value: 'paused',
    triggered_by: 'AUTO_ENGINE',
    timestamp: '2026-01-08T11:05',
  },
];
