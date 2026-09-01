import { PRODUCTS } from '../products/productsData';
import {
  TODAY,
  addDays,
  daysBetween,
  dayOfWeek,
  fmtCount,
  fmtDate,
  fmtPct,
  fmtSignedPct,
  fmtWon,
  quickRangeDates,
  previousPeriod,
  delta,
  COMPANIES,
  type QuickRange,
} from './transactionStatsData';

export { TODAY, addDays, daysBetween, fmtDate, quickRangeDates, previousPeriod, delta, fmtWon, fmtCount, fmtPct, fmtSignedPct };
export type { QuickRange };

const SERIES_START = '2026-01-01';

export type Mode = 'all' | 'b2c' | 'c2c' | 'b2b';
export const MODE_LABELS: Record<Mode, string> = { all: '통합', b2c: 'B2C', c2c: 'C2C', b2b: 'B2B' };
export const MODES: Mode[] = ['all', 'b2c', 'c2c', 'b2b'];
const MODE_FACTOR: Record<Mode, number> = { all: 1, b2c: 0.62, c2c: 0.16, b2b: 0.22 };

export const CUSTOMER_LABEL: Record<Mode, string> = { all: '구매 고객', b2c: '구매 고객', c2c: '구매 거래자', b2b: '구매 거래처' };
export const NEW_CUSTOMER_LABEL: Record<Mode, string> = { all: '신규 구매 고객', b2c: '신규 구매 고객', c2c: '신규 구매자', b2b: '신규 거래처' };
export const REPURCHASE_LABEL: Record<Mode, string> = { all: '재구매율', b2c: '재구매율', c2c: '재거래율', b2b: '재주문율' };
export const AOV_LABEL: Record<Mode, string> = { all: '고객당 구매금액', b2c: '고객당 구매금액', c2c: '구매자당 거래금액', b2b: '거래처당 주문금액' };
export const AUDIENCE_TAB_LABEL: Record<Mode, string> = { all: '고객별', b2c: '고객별', c2c: '구매자별', b2b: '거래처별' };
export const AUDIENCE_UNIT: Record<Mode, string> = { all: '명', b2c: '명', c2c: '명', b2b: '개' };

export type Segment = 'VIP' | '충성 고객' | '신규 유망' | '이탈 위험' | '휴면';
export const SEGMENTS: Segment[] = ['VIP', '충성 고객', '신규 유망', '이탈 위험', '휴면'];
export const SEGMENT_META: Record<Segment, { bg: string; fg: string }> = {
  VIP: { bg: '#eef2ff', fg: '#4338ca' },
  '충성 고객': { bg: '#ecfdf5', fg: '#059669' },
  '신규 유망': { bg: '#fff7ed', fg: '#c2410c' },
  '이탈 위험': { bg: '#fef2f2', fg: '#b91c1c' },
  휴면: { bg: '#f4f4f5', fg: '#71717a' },
};

export interface DayRecord {
  date: string;
  customers: number;
  newCustomers: number;
  repeatCustomers: number;
  orders: number;
  amount: number;
}

function buildSeries(mode: Mode): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const factor = MODE_FACTOR[mode];
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.78 + (i / (totalDays - 1)) * 0.55;
    const weekday = dow === 0 || dow === 6 ? 0.68 : 1.06;
    const wiggle = 1 + Math.sin(i * 1.3) * 0.07 + Math.cos(i * 0.5) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const customers = Math.max(0, Math.round(360 * dayFactor));
    const newShare = 0.2 + (Math.sin(i * 0.45) + 1) * 0.035;
    const newCustomers = Math.round(customers * newShare);
    const repeatCustomers = customers - newCustomers;
    const ordersPerCustomer = 1.12 + Math.sin(i * 0.28) * 0.06;
    const orders = Math.round(customers * ordersPerCustomer);
    const avgOrderValue = 54000 + Math.cos(i * 0.4) * 4200;
    const amount = Math.round(orders * avgOrderValue);

    records.push({ date, customers, newCustomers, repeatCustomers, orders, amount });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export interface PeriodAggregate {
  customers: number;
  newCustomers: number;
  repeatCustomers: number;
  orders: number;
  amount: number;
  avgOrderValue: number;
  amountPerCustomer: number;
  repurchaseRate: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const rows = seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
  const sum = (key: keyof DayRecord) => rows.reduce((total, r) => total + (r[key] as number), 0);
  const customers = sum('customers');
  const newCustomers = sum('newCustomers');
  const repeatCustomers = sum('repeatCustomers');
  const orders = sum('orders');
  const amount = sum('amount');
  return {
    customers,
    newCustomers,
    repeatCustomers,
    orders,
    amount,
    avgOrderValue: orders ? Math.round(amount / orders) : 0,
    amountPerCustomer: customers ? Math.round(amount / customers) : 0,
    repurchaseRate: customers ? (repeatCustomers / customers) * 100 : 0,
  };
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export interface CompositionItem { label: string; count: number; pct: number; }
export function newVsExisting(agg: PeriodAggregate): CompositionItem[] {
  return [
    { label: '신규 구매', count: agg.newCustomers, pct: agg.customers ? (agg.newCustomers / agg.customers) * 100 : 0 },
    { label: '기존 구매', count: agg.repeatCustomers, pct: agg.customers ? (agg.repeatCustomers / agg.customers) * 100 : 0 },
  ];
}

const FREQUENCY_WEIGHTS = [
  { label: '1회', weight: 0.44 },
  { label: '2~3회', weight: 0.29 },
  { label: '4~5회', weight: 0.15 },
  { label: '6회 이상', weight: 0.12 },
];
export function frequencyBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return FREQUENCY_WEIGHTS.map((f) => ({ label: f.label, count: Math.round(agg.customers * f.weight), pct: f.weight * 100 }));
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  customers: number;
  orders: number;
  amount: number;
  avgOrderValue: number;
  repurchaseRate: number;
  share: number;
  prevAmount: number;
}

interface SegmentSeed { segment: Segment; weight: number; repurchaseRate: number; avgOrders: number; recencyDays: number; changeRate: number; }
const SEGMENT_SEEDS: SegmentSeed[] = [
  { segment: 'VIP', weight: 0.06, repurchaseRate: 0.92, avgOrders: 9.2, recencyDays: 6, changeRate: 0.14 },
  { segment: '충성 고객', weight: 0.16, repurchaseRate: 0.71, avgOrders: 5.4, recencyDays: 18, changeRate: 0.08 },
  { segment: '신규 유망', weight: 0.24, repurchaseRate: 0.22, avgOrders: 1.4, recencyDays: 9, changeRate: 0.21 },
  { segment: '이탈 위험', weight: 0.14, repurchaseRate: 0.18, avgOrders: 6.1, recencyDays: 96, changeRate: -0.18 },
  { segment: '휴면', weight: 0.4, repurchaseRate: 0.04, avgOrders: 2.1, recencyDays: 168, changeRate: -0.09 },
];

export function segmentRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return SEGMENT_SEEDS.map((seed) => {
    const customers = Math.max(1, Math.round(agg.customers * seed.weight * 3.4));
    const orders = Math.round(customers * seed.avgOrders);
    const amount = Math.round(orders * agg.avgOrderValue * (seed.segment === 'VIP' ? 1.4 : seed.segment === '휴면' ? 0.55 : 1));
    return {
      id: `seg-${seed.segment}`,
      name: seed.segment,
      subtitle: `최근 구매 평균 ${seed.recencyDays}일 전`,
      customers,
      orders,
      amount,
      avgOrderValue: orders ? Math.round(amount / orders) : 0,
      repurchaseRate: seed.repurchaseRate * 100,
      share: 0,
      prevAmount: Math.round(amount / (1 + seed.changeRate)),
    };
  }).map((row, _, all) => {
    const total = all.reduce((s, r) => s + r.amount, 0);
    return { ...row, share: total ? (row.amount / total) * 100 : 0 };
  });
}

const CYCLE_BUCKETS = [
  { label: '30일 이내', weight: 0.28, repurchaseRate: 0.58 },
  { label: '31~60일', weight: 0.36, repurchaseRate: 0.41 },
  { label: '61~90일', weight: 0.19, repurchaseRate: 0.24 },
  { label: '90일 초과', weight: 0.17, repurchaseRate: 0.09 },
];
export function cycleRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  const rows = CYCLE_BUCKETS.map((bucket) => {
    const customers = Math.max(1, Math.round(agg.repeatCustomers * bucket.weight));
    const orders = Math.round(customers * (1.8 + bucket.repurchaseRate));
    const amount = Math.round(orders * agg.avgOrderValue);
    return {
      id: `cycle-${bucket.label}`,
      name: bucket.label,
      subtitle: '평균 재구매 주기',
      customers,
      orders,
      amount,
      avgOrderValue: orders ? Math.round(amount / orders) : 0,
      repurchaseRate: bucket.repurchaseRate * 100,
      share: 0,
      prevAmount: Math.round(amount * 0.94),
    };
  });
  const total = rows.reduce((s, r) => s + r.amount, 0);
  return rows.map((r) => ({ ...r, share: total ? (r.amount / total) * 100 : 0 }));
}

const PRODUCT_SAMPLE = PRODUCTS.slice(0, 8);
export function productPreferenceRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  const weights = [0.22, 0.17, 0.14, 0.12, 0.11, 0.09, 0.08, 0.07];
  return PRODUCT_SAMPLE.map((product, index) => {
    const customers = Math.max(1, Math.round(agg.customers * weights[index] * 0.9));
    const orders = Math.round(customers * (1.3 + (index % 3) * 0.25));
    const amount = orders * (product.price || 45000);
    return {
      id: product.code,
      name: product.name,
      subtitle: `${product.code} · ${product.category}`,
      customers,
      orders,
      amount,
      avgOrderValue: orders ? Math.round(amount / orders) : 0,
      repurchaseRate: 15 + ((index * 7) % 40),
      share: 0,
      prevAmount: Math.round(amount / (1 + (0.2 - index * 0.03))),
    };
  }).map((row, _, all) => {
    const total = all.reduce((s, r) => s + r.amount, 0);
    return { ...row, share: total ? (row.amount / total) * 100 : 0 };
  }).sort((a, b) => b.amount - a.amount);
}

export function categoryPreferenceRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const products = productPreferenceRows(mode, start, end);
  const categories = [...new Set(PRODUCT_SAMPLE.map((p) => p.category))];
  return categories.map((category) => {
    const codes = new Set(PRODUCT_SAMPLE.filter((p) => p.category === category).map((p) => p.code));
    const matched = products.filter((r) => codes.has(r.id));
    const amount = matched.reduce((s, r) => s + r.amount, 0);
    const orders = matched.reduce((s, r) => s + r.orders, 0);
    const customers = matched.reduce((s, r) => s + r.customers, 0);
    const prevAmount = matched.reduce((s, r) => s + r.prevAmount, 0);
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: `${matched.length}개 상품`,
      customers,
      orders,
      amount,
      avgOrderValue: orders ? Math.round(amount / orders) : 0,
      repurchaseRate: matched.length ? matched.reduce((s, r) => s + r.repurchaseRate, 0) / matched.length : 0,
      share: 0,
      prevAmount,
    };
  }).filter((r) => r.amount > 0).map((row, _, all) => {
    const total = all.reduce((s, r) => s + r.amount, 0);
    return { ...row, share: total ? (row.amount / total) * 100 : 0 };
  }).sort((a, b) => b.amount - a.amount);
}

const B2C_CUSTOMER_NAMES = ['회원 00182', '회원 00241', '회원 00318', '회원 00402', '회원 00489', '회원 00517'];
const C2C_CUSTOMER_NAMES = ['구매자 01', '구매자 02', '구매자 03', '구매자 04', '구매자 05', '구매자 06'];

export function audienceRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  const names = mode === 'b2b' ? COMPANIES : mode === 'c2c' ? C2C_CUSTOMER_NAMES : B2C_CUSTOMER_NAMES;
  const weights = [0.26, 0.21, 0.18, 0.14, 0.12, 0.09];
  return names.slice(0, 6).map((name, index) => {
    const amount = Math.round(agg.amount * 0.18 * (weights[index] ?? 0.05));
    const orders = Math.max(1, Math.round(amount / agg.avgOrderValue));
    return {
      id: `aud-${name}`,
      name,
      subtitle: mode === 'b2b' ? '거래처' : '고객',
      customers: 1,
      orders,
      amount,
      avgOrderValue: orders ? Math.round(amount / orders) : 0,
      repurchaseRate: 40 + ((index * 11) % 55),
      share: 0,
      prevAmount: Math.round(amount / (1 + (0.16 - index * 0.03))),
    };
  }).map((row, _, all) => {
    const total = all.reduce((s, r) => s + r.amount, 0);
    return { ...row, share: total ? (row.amount / total) * 100 : 0 };
  }).sort((a, b) => b.amount - a.amount);
}

export function fmtOrders(n: number): string {
  return `${n.toFixed(1)}회`;
}

export interface FunnelStep {
  label: string;
  count: number;
  pctOfStart: number;
  stepRate?: number;
}

const REPEAT_FUNNEL_WEIGHTS = [
  { label: '첫 구매', cumWeight: 1 },
  { label: '2회 이상 구매', cumWeight: 0.56 },
  { label: '4회 이상 구매', cumWeight: 0.27 },
  { label: '6회 이상 구매', cumWeight: 0.12 },
];

export function repeatPurchaseFunnel(agg: PeriodAggregate): FunnelStep[] {
  const raw = REPEAT_FUNNEL_WEIGHTS.map((step) => ({ label: step.label, count: Math.round(agg.customers * step.cumWeight) }));
  return raw.map((step, index) => ({
    label: step.label,
    count: step.count,
    pctOfStart: agg.customers ? (step.count / agg.customers) * 100 : 0,
    stepRate: index === 0 ? undefined : (raw[index - 1].count ? (step.count / raw[index - 1].count) * 100 : 0),
  }));
}

const HISTORICAL_POOL_FACTOR = 3.4;
const DORMANCY_BUCKETS = [
  { label: '30일 이상 미구매', weight: 0.33 },
  { label: '60일 이상 미구매', weight: 0.17 },
  { label: '90일 이상 미구매', weight: 0.066 },
  { label: '180일 이상 미구매', weight: 0.026 },
];

export interface DormancyRow { label: string; count: number; }
export function dormancyBreakdown(agg: PeriodAggregate): DormancyRow[] {
  const buyerPool = Math.round(agg.customers * HISTORICAL_POOL_FACTOR);
  return DORMANCY_BUCKETS.map((bucket) => ({ label: bucket.label, count: Math.round(buyerPool * bucket.weight) }));
}
