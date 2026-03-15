// Shared filter state used across all new tabs

export interface GlobalFilters {
  dateFrom: string;
  dateTo: string;
  channels: string[];       // empty = all
  warehouses: string[];     // empty = all
  skuSearch: string;
  statuses: string[];       // empty = all
  durationPreset: 'today' | '7d' | '30d' | '90d' | 'custom';
}

export const DEFAULT_FILTERS: GlobalFilters = {
  dateFrom: '',
  dateTo: '',
  channels: [],
  warehouses: [],
  skuSearch: '',
  statuses: [],
  durationPreset: '30d',
};

export const WAREHOUSES = [
  { code: 'Kol',  label: 'Kolkata',   facilities: ['kolkata'] },
  { code: 'Pith', label: 'Pithampur', facilities: ['kheda','amour'] },
  { code: 'Har',  label: 'Haryana',   facilities: ['gurgaon','gurugram'] },
  { code: 'Blr',  label: 'Bengaluru', facilities: ['bengaluru','bangalore'] },
];

export const CHANNEL_GROUPS_MAP: Record<string, string> = {
  meesho:   'Meesho',
  flipkart: 'Flipkart',
  jiomart:  'Jiomart',
  rk_world: 'RK World',
};

export function getChannelGroup(channel: string): string {
  const c = channel.toLowerCase();
  if (c.includes('meesho'))   return 'Meesho';
  if (c.includes('flipkart')) return 'Flipkart';
  if (c.includes('jiomart'))  return 'Jiomart';
  if (c.includes('rk_world') || c.includes('rk world')) return 'RK World';
  return 'Other';
}

export function getWarehouseCode(facility: string): string {
  const f = facility.toLowerCase();
  if (f.includes('kolkata'))                    return 'Kol';
  if (f.includes('kheda') || f.includes('amour')) return 'Pith';
  if (f.includes('gurgaon') || f.includes('gurugram')) return 'Har';
  if (f.includes('bengaluru') || f.includes('bangalore')) return 'Blr';
  return 'Other';
}

export const ORDER_STATUSES = ['PROCESSING','DISPATCHED','DELIVERED','CANCELLED','CREATED','PENDING_VERIFICATION','RETURN'];

export const DURATION_OPTIONS = [
  { value: 'today', label: 'Today' },
  { value: '7d',    label: 'Last 7 days' },
  { value: '30d',   label: 'Last 30 days' },
  { value: '90d',   label: 'Last 90 days' },
  { value: 'custom',label: 'Custom range' },
];

export function applyDatePreset(preset: GlobalFilters['durationPreset']): { from: Date; to: Date } {
  const to = new Date();
  const from = new Date();
  if (preset === 'today')  { from.setHours(0,0,0,0); }
  if (preset === '7d')     { from.setDate(from.getDate() - 7); }
  if (preset === '30d')    { from.setDate(from.getDate() - 30); }
  if (preset === '90d')    { from.setDate(from.getDate() - 90); }
  return { from, to };
}

export function fmtCr(n: number): string {
  if (n >= 1e7) return `₹${(n/1e7).toFixed(2)}Cr`;
  if (n >= 1e5) return `₹${(n/1e5).toFixed(1)}L`;
  if (n >= 1e3) return `₹${(n/1e3).toFixed(1)}K`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function fmtPct(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function fmtNum(n: number): string {
  return n.toLocaleString('en-IN');
}
