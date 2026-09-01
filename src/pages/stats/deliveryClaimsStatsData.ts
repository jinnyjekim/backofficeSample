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
  type QuickRange,
} from './transactionStatsData';

export { TODAY, addDays, daysBetween, fmtDate, quickRangeDates, previousPeriod, delta, fmtWon, fmtCount, fmtPct, fmtSignedPct };
export type { QuickRange };

const SERIES_START = '2026-01-01';

export type Mode = 'all' | 'b2c' | 'c2c' | 'b2b';
export const MODE_LABELS: Record<Mode, string> = { all: '통합', b2c: 'B2C', c2c: 'C2C', b2b: 'B2B' };
export const MODES: Mode[] = ['all', 'b2c', 'c2c', 'b2b'];
const MODE_FACTOR: Record<Mode, number> = { all: 1, b2c: 0.6, c2c: 0.17, b2b: 0.23 };

export type ClaimType = '취소' | '반품' | '교환';
export const CLAIM_TYPES: ClaimType[] = ['취소', '반품', '교환'];
export const CLAIM_TYPE_META: Record<ClaimType, { bg: string; fg: string }> = {
  취소: { bg: '#f4f4f5', fg: '#52525b' },
  반품: { bg: '#fff7ed', fg: '#c2410c' },
  교환: { bg: '#eef2ff', fg: '#4338ca' },
};

export type DeliveryStatus = '출고대기' | '출고완료' | '배송중' | '배송완료' | '배송지연';
export const DELIVERY_STATUSES: DeliveryStatus[] = ['출고대기', '출고완료', '배송중', '배송완료', '배송지연'];
export const DELIVERY_STATUS_META: Record<DeliveryStatus, { bg: string; fg: string }> = {
  출고대기: { bg: '#eef2ff', fg: '#4338ca' },
  출고완료: { bg: '#f0f9ff', fg: '#0369a1' },
  배송중: { bg: '#fefce8', fg: '#a16207' },
  배송완료: { bg: '#ecfdf5', fg: '#059669' },
  배송지연: { bg: '#fef2f2', fg: '#b91c1c' },
};

export interface DayRecord {
  date: string;
  shipped: number;
  delivered: number;
  delayed: number;
  claimCancel: number;
  claimReturn: number;
  claimExchange: number;
  totalLeadDays: number;
}

function buildSeries(mode: Mode): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const factor = MODE_FACTOR[mode];
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.8 + (i / (totalDays - 1)) * 0.5;
    const weekday = dow === 0 || dow === 6 ? 0.58 : 1.08;
    const wiggle = 1 + Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const shipped = Math.max(0, Math.round(430 * dayFactor));
    const delayRate = 0.045 + (Math.sin(i * 0.5) + 1) * 0.02;
    const delayed = Math.round(shipped * delayRate);
    const delivered = Math.max(0, shipped - Math.round(shipped * 0.03));
    const avgLeadDays = 2.1 + delayRate * 6 + Math.cos(i * 0.4) * 0.2;

    const orderBase = shipped * 1.08;
    const cancelRate = 0.024 + (Math.sin(i * 0.7) + 1) * 0.006;
    const returnRate = 0.018 + (Math.cos(i * 0.5) + 1) * 0.005;
    const exchangeRate = 0.009 + (Math.sin(i * 0.9) + 1) * 0.003;
    const claimCancel = Math.round(orderBase * cancelRate);
    const claimReturn = Math.round(orderBase * returnRate);
    const claimExchange = Math.round(orderBase * exchangeRate);

    records.push({ date, shipped, delivered, delayed, claimCancel, claimReturn, claimExchange, totalLeadDays: avgLeadDays * shipped });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export interface PeriodAggregate {
  shipped: number;
  delivered: number;
  delayed: number;
  claimCancel: number;
  claimReturn: number;
  claimExchange: number;
  claimTotal: number;
  avgLeadDays: number;
  delayRate: number;
  claimRate: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const rows = seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
  const sum = (key: keyof DayRecord) => rows.reduce((total, r) => total + (r[key] as number), 0);
  const shipped = sum('shipped');
  const delivered = sum('delivered');
  const delayed = sum('delayed');
  const claimCancel = sum('claimCancel');
  const claimReturn = sum('claimReturn');
  const claimExchange = sum('claimExchange');
  const claimTotal = claimCancel + claimReturn + claimExchange;
  const totalLeadDays = sum('totalLeadDays');
  const orderBase = shipped * 1.08;
  return {
    shipped,
    delivered,
    delayed,
    claimCancel,
    claimReturn,
    claimExchange,
    claimTotal,
    avgLeadDays: shipped ? totalLeadDays / shipped : 0,
    delayRate: shipped ? (delayed / shipped) * 100 : 0,
    claimRate: orderBase ? (claimTotal / orderBase) * 100 : 0,
  };
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export interface CompositionItem { label: string; count: number; pct: number; }

const STATUS_WEIGHTS: Record<DeliveryStatus, number> = { 출고대기: 0.09, 출고완료: 0.06, 배송중: 0.07, 배송완료: 0.72, 배송지연: 0.06 };
export function statusComposition(agg: PeriodAggregate): CompositionItem[] {
  return DELIVERY_STATUSES.map((label) => ({ label, count: Math.round(agg.shipped * STATUS_WEIGHTS[label]), pct: STATUS_WEIGHTS[label] * 100 }));
}

export function claimComposition(agg: PeriodAggregate): CompositionItem[] {
  const items = [
    { label: '취소', count: agg.claimCancel },
    { label: '반품', count: agg.claimReturn },
    { label: '교환', count: agg.claimExchange },
  ];
  const total = agg.claimTotal || 1;
  return items.map((i) => ({ ...i, pct: (i.count / total) * 100 }));
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  shippedCount: number;
  avgLeadDays: number;
  delayRate: number;
  claimCount: number;
  claimRate: number;
  prevClaimCount: number;
}

const REGIONS = ['수도권', '충청권', '영남권', '호남권', '강원권', '제주/도서산간'];
const REGION_WEIGHTS = [0.42, 0.14, 0.18, 0.13, 0.06, 0.07];
const REGION_DELAY = [0.03, 0.05, 0.04, 0.05, 0.07, 0.16];

export function regionRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return REGIONS.map((region, index) => {
    const shippedCount = Math.round(agg.shipped * REGION_WEIGHTS[index]);
    const delayRate = REGION_DELAY[index] * 100;
    const claimCount = Math.round(agg.claimTotal * REGION_WEIGHTS[index] * (1 + REGION_DELAY[index]));
    return {
      id: `region-${region}`,
      name: region,
      subtitle: '배송 권역',
      shippedCount,
      avgLeadDays: agg.avgLeadDays * (1 + REGION_DELAY[index] * 2),
      delayRate,
      claimCount,
      claimRate: shippedCount ? (claimCount / (shippedCount * 1.08)) * 100 : 0,
      prevClaimCount: Math.round(claimCount / (1 + (0.12 - index * 0.03))),
    };
  }).sort((a, b) => b.shippedCount - a.shippedCount);
}

const CARRIERS = ['CJ대한통운', '한진택배', '롯데택배', '로젠택배', '우체국택배'];
const CARRIER_WEIGHTS = [0.38, 0.24, 0.18, 0.12, 0.08];
const CARRIER_DELAY = [0.035, 0.05, 0.045, 0.07, 0.03];

export function carrierRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return CARRIERS.map((carrier, index) => {
    const shippedCount = Math.round(agg.shipped * CARRIER_WEIGHTS[index]);
    const delayRate = CARRIER_DELAY[index] * 100;
    const claimCount = Math.round(agg.claimTotal * CARRIER_WEIGHTS[index] * (1 + CARRIER_DELAY[index]));
    return {
      id: `carrier-${carrier}`,
      name: carrier,
      subtitle: '배송사',
      shippedCount,
      avgLeadDays: agg.avgLeadDays * (1 + CARRIER_DELAY[index] * 1.5),
      delayRate,
      claimCount,
      claimRate: shippedCount ? (claimCount / (shippedCount * 1.08)) * 100 : 0,
      prevClaimCount: Math.round(claimCount / (1 + (0.1 - index * 0.02))),
    };
  }).sort((a, b) => b.shippedCount - a.shippedCount);
}

const CLAIM_REASONS = ['단순 변심', '상품 불량', '배송 지연', '오배송', '사이즈/색상 불만족', '기타'];
const CLAIM_REASON_WEIGHTS = [0.32, 0.22, 0.16, 0.12, 0.1, 0.08];

export function claimReasonRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return CLAIM_REASONS.map((reason, index) => {
    const claimCount = Math.round(agg.claimTotal * CLAIM_REASON_WEIGHTS[index]);
    const shippedCount = Math.round(agg.shipped * CLAIM_REASON_WEIGHTS[index]);
    return {
      id: `reason-${reason}`,
      name: reason,
      subtitle: '클레임 사유',
      shippedCount,
      avgLeadDays: agg.avgLeadDays,
      delayRate: agg.delayRate,
      claimCount,
      claimRate: shippedCount ? (claimCount / (shippedCount * 1.08)) * 100 : 0,
      prevClaimCount: Math.round(claimCount / (1 + (0.15 - index * 0.03))),
    };
  }).sort((a, b) => b.claimCount - a.claimCount);
}
