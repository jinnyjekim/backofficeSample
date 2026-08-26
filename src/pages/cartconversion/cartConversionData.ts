import { PRODUCTS } from '../products/productsData';

export const TODAY = '2026-08-26';
const SERIES_START = '2026-06-01';

export function addDays(date: string, n: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
export function daysBetween(a: string, b: string): number {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const db = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((db - da) / 86400000);
}
function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}
export function fmtDate(date: string): string {
  return date.replace(/-/g, '.');
}
export function fmtDateShort(date: string): string {
  return date.slice(5).replace('-', '.');
}
export function fmtCount(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}명`;
}
export function fmtItemCount(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}건`;
}
export function fmtWon(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}
export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
export function fmtSignedPct(n: number, digits = 1): string {
  if (Math.abs(n) < 0.05) return '0.0%p';
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(digits)}%p`;
}

export type QuickRange = '오늘' | '어제' | '최근 7일' | '최근 30일' | '이번 달' | '지난 달';
export function quickRangeDates(range: QuickRange): [string, string] {
  switch (range) {
    case '오늘': return [TODAY, TODAY];
    case '어제': { const y = addDays(TODAY, -1); return [y, y]; }
    case '최근 7일': return [addDays(TODAY, -6), TODAY];
    case '최근 30일': return [addDays(TODAY, -29), TODAY];
    case '이번 달': return [`${TODAY.slice(0, 7)}-01`, TODAY];
    case '지난 달': {
      const firstOfThisMonth = `${TODAY.slice(0, 7)}-01`;
      const lastOfPrevMonth = addDays(firstOfThisMonth, -1);
      const firstOfPrevMonth = `${lastOfPrevMonth.slice(0, 7)}-01`;
      return [firstOfPrevMonth, lastOfPrevMonth];
    }
  }
}

export function previousPeriod(start: string, end: string): [string, string] {
  const len = daysBetween(start, end) + 1;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(len - 1));
  return [prevStart, prevEnd];
}
export function delta(current: number, previous: number): { pct: number; hasPrevious: boolean } {
  if (previous === 0) return { pct: current === 0 ? 0 : 100, hasPrevious: previous !== 0 };
  return { pct: ((current - previous) / previous) * 100, hasPrevious: true };
}

export const CHANNELS = ['전체', '웹', '모바일 앱', '모바일 웹'] as const;
export type Channel = (typeof CHANNELS)[number];
const CHANNEL_SHARE: Record<Exclude<Channel, '전체'>, number> = { 웹: 0.42, '모바일 앱': 0.38, '모바일 웹': 0.2 };

export const CATEGORIES = ['전체', '카테고리 01', '카테고리 02', '카테고리 03'] as const;
export type Category = (typeof CATEGORIES)[number];
const CATEGORY_SHARE: Record<Exclude<Category, '전체'>, number> = { '카테고리 01': 0.45, '카테고리 02': 0.35, '카테고리 03': 0.2 };

export interface DayRecord {
  date: string;
  cartUsers: number;
  cartItems: number;
  buyUsers: number;
  buyOrders: number;
  productView: number;
  cartAdd: number;
  checkoutEnter: number;
  paymentAttempt: number;
  purchaseComplete: number;
}

function buildSeries(): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.86 + (i / (totalDays - 1)) * 0.28;
    const weekday = dow === 0 || dow === 6 ? 1.12 : 0.96;
    const wiggle = 1 + Math.sin(i * 1.4) * 0.08 + Math.cos(i * 0.9) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const productView = Math.max(0, Math.round(3400 * dayFactor));
    const cartAdd = Math.round(productView * (0.245 + Math.sin(i * 0.6) * 0.015));
    const cartUsers = Math.round(cartAdd * 0.92);
    const cartItems = Math.round(cartAdd * 1.35);
    const checkoutEnter = Math.round(cartAdd * (0.71 + Math.cos(i * 0.5) * 0.02));
    const paymentAttempt = Math.round(checkoutEnter * (0.823 + Math.sin(i * 0.4) * 0.015));
    const purchaseComplete = Math.round(paymentAttempt * (0.931 + Math.cos(i * 0.7) * 0.01));
    const buyUsers = Math.round(purchaseComplete * 0.94);
    const buyOrders = purchaseComplete;

    records.push({ date, cartUsers, cartItems, buyUsers, buyOrders, productView, cartAdd, checkoutEnter, paymentAttempt, purchaseComplete });
  }
  return records;
}

export const DAILY_SERIES: DayRecord[] = buildSeries();

function seriesInRange(start: string, end: string): DayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}

function scaleFor(channel: Channel, category: Category): number {
  const c = channel === '전체' ? 1 : CHANNEL_SHARE[channel];
  const g = category === '전체' ? 1 : CATEGORY_SHARE[category];
  return c * g;
}

export interface PeriodAggregate {
  start: string;
  end: string;
  days: number;
  cartUsers: number;
  cartItems: number;
  buyUsers: number;
  buyOrders: number;
  productView: number;
  cartAdd: number;
  checkoutEnter: number;
  paymentAttempt: number;
  purchaseComplete: number;
  conversionRate: number;
  dropoffRate: number;
  avgCartAmount: number;
}

export function aggregate(start: string, end: string, channel: Channel = '전체', category: Category = '전체'): PeriodAggregate {
  const rows = seriesInRange(start, end);
  const scale = scaleFor(channel, category);
  const sum = (key: keyof DayRecord) => Math.round(rows.reduce((s, r) => s + (r[key] as number), 0) * scale);

  const cartUsers = sum('cartUsers');
  const buyUsers = sum('buyUsers');

  return {
    start, end, days: rows.length,
    cartUsers, cartItems: sum('cartItems'), buyUsers, buyOrders: sum('buyOrders'),
    productView: sum('productView'), cartAdd: sum('cartAdd'), checkoutEnter: sum('checkoutEnter'),
    paymentAttempt: sum('paymentAttempt'), purchaseComplete: sum('purchaseComplete'),
    conversionRate: cartUsers ? (buyUsers / cartUsers) * 100 : 0,
    dropoffRate: cartUsers ? (1 - buyUsers / cartUsers) * 100 : 0,
    avgCartAmount: 62000 + Math.round(Math.sin(daysBetween(SERIES_START, start)) * 4800),
  };
}

export type Granularity = '일별' | '주별' | '월별';
export interface Bucket {
  label: string;
  start: string;
  end: string;
  cartUsers: number;
  buyUsers: number;
  conversionRate: number;
}

export function bucketSeries(start: string, end: string, granularity: Granularity, channel: Channel = '전체', category: Category = '전체'): Bucket[] {
  const rows = seriesInRange(start, end);
  const scale = scaleFor(channel, category);
  if (granularity === '일별') {
    return rows.map((r) => {
      const cartUsers = Math.round(r.cartUsers * scale);
      const buyUsers = Math.round(r.buyUsers * scale);
      return { label: fmtDateShort(r.date), start: r.date, end: r.date, cartUsers, buyUsers, conversionRate: cartUsers ? (buyUsers / cartUsers) * 100 : 0 };
    });
  }
  const buckets: Bucket[] = [];
  if (granularity === '월별') {
    let cursor = start;
    while (cursor <= end) {
      const monthEndOfCursor = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(monthEndOfCursor, -1) > end ? end : addDays(monthEndOfCursor, -1);
      const agg = aggregate(cursor, bucketEnd, channel, category);
      buckets.push({ label: cursor.slice(0, 7), start: cursor, end: bucketEnd, cartUsers: agg.cartUsers, buyUsers: agg.buyUsers, conversionRate: agg.conversionRate });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }
  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd, channel, category);
    buckets.push({ label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`, start: cursor, end: bucketEnd, cartUsers: agg.cartUsers, buyUsers: agg.buyUsers, conversionRate: agg.conversionRate });
    cursor = addDays(bucketEnd, 1);
  }
  return buckets;
}

export interface ProductRow {
  code: string;
  name: string;
  category: string;
  cartUsers: number;
  buyUsers: number;
  conversionRate: number;
  dropoffRate: number;
  avgCartAmount: number;
}

const PRODUCT_WEIGHTS: Record<string, { share: number; conv: number }> = {
  'P-001238': { share: 0.32, conv: 0.453 },
  'P-001239': { share: 0.24, conv: 0.327 },
  'P-001240': { share: 0.2, conv: 0.265 },
  'P-001241': { share: 0.12, conv: 0.198 },
  'P-000982': { share: 0.12, conv: 0.301 },
};

export function productBreakdown(agg: PeriodAggregate): ProductRow[] {
  return PRODUCTS.filter((p) => PRODUCT_WEIGHTS[p.code]).map((p) => {
    const w = PRODUCT_WEIGHTS[p.code];
    const cartUsers = Math.round(agg.cartUsers * w.share);
    const buyUsers = Math.round(cartUsers * w.conv);
    return {
      code: p.code, name: p.name, category: p.category,
      cartUsers, buyUsers,
      conversionRate: cartUsers ? (buyUsers / cartUsers) * 100 : 0,
      dropoffRate: cartUsers ? (1 - buyUsers / cartUsers) * 100 : 0,
      avgCartAmount: p.price || 42000,
    };
  }).sort((a, b) => b.cartUsers - a.cartUsers);
}

export const DROPOFF_THRESHOLDS = ['1시간', '6시간', '24시간', '3일', '7일'] as const;
export type DropoffThreshold = (typeof DROPOFF_THRESHOLDS)[number];
export const THRESHOLD_FACTOR: Record<DropoffThreshold, number> = {
  '1시간': 1.35, '6시간': 1.15, '24시간': 1.0, '3일': 0.82, '7일': 0.68,
};

export interface FunnelStep {
  key: string;
  label: string;
  count: number;
}

export function funnelSteps(agg: PeriodAggregate): FunnelStep[] {
  return [
    { key: 'view', label: '상품 조회', count: agg.productView },
    { key: 'cart', label: '장바구니 담기', count: agg.cartAdd },
    { key: 'checkout', label: '주문서 진입', count: agg.checkoutEnter },
    { key: 'payment', label: '결제 시도', count: agg.paymentAttempt },
    { key: 'complete', label: '구매 완료', count: agg.purchaseComplete },
  ];
}
