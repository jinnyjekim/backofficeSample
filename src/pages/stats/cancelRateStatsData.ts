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
  quickRangeDates,
  previousPeriod,
  delta,
  type QuickRange,
} from './transactionStatsData';

export { TODAY, addDays, daysBetween, fmtDate, quickRangeDates, previousPeriod, delta, fmtCount, fmtPct, fmtSignedPct };
export type { QuickRange };

const SERIES_START = '2026-01-01';

export interface DayRecord {
  date: string;
  dealCount: number;
  cancelCount: number;
  sellerFaultCount: number;
  buyerFaultCount: number;
}

function buildSeries(): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.78 + (i / (totalDays - 1)) * 0.5;
    const weekday = dow === 0 || dow === 6 ? 0.64 : 1.07;
    const wiggle = 1 + Math.sin(i * 1.2) * 0.08 + Math.cos(i * 0.55) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const dealCount = Math.max(0, Math.round(730 * dayFactor));
    const cancelRateDaily = 0.062 + (Math.sin(i * 0.6) + 1) * 0.015;
    const cancelCount = Math.max(0, Math.round(dealCount * cancelRateDaily));
    const sellerFaultShare = 0.46 + Math.sin(i * 0.9) * 0.06;
    const sellerFaultCount = Math.round(cancelCount * sellerFaultShare);
    const buyerFaultCount = cancelCount - sellerFaultCount;

    records.push({ date, dealCount, cancelCount, sellerFaultCount, buyerFaultCount });
  }
  return records;
}

const SERIES = buildSeries();
export function trendSeries(start: string, end: string): DayRecord[] {
  return SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  dealCount: number;
  cancelCount: number;
  sellerFaultCount: number;
  buyerFaultCount: number;
  cancelRate: number;
  sellerFaultRate: number;
  buyerFaultRate: number;
  avgProcessHours: number;
}

export function aggregate(start: string, end: string): PeriodAggregate {
  const rows = trendSeries(start, end);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);
  const dealCount = sum('dealCount');
  const cancelCount = sum('cancelCount');
  const sellerFaultCount = sum('sellerFaultCount');
  const buyerFaultCount = sum('buyerFaultCount');
  const days = Math.max(1, rows.length);
  const seed = daysBetween(SERIES_START, start) + days / 2;
  const avgProcessHours = Math.max(1, 6 + Math.sin(seed * 0.22) * 2.2);
  return {
    dealCount, cancelCount, sellerFaultCount, buyerFaultCount,
    cancelRate: dealCount ? (cancelCount / dealCount) * 100 : 0,
    sellerFaultRate: cancelCount ? (sellerFaultCount / cancelCount) * 100 : 0,
    buyerFaultRate: cancelCount ? (buyerFaultCount / cancelCount) * 100 : 0,
    avgProcessHours,
  };
}

export type CancelReason = '품절' | '단순 변심' | '가격 문제' | '판매자 미응답' | '구매자 미입금' | '기타';
export const CANCEL_REASONS: CancelReason[] = ['품절', '단순 변심', '가격 문제', '판매자 미응답', '구매자 미입금', '기타'];
const REASON_WEIGHTS: Record<CancelReason, number> = { 품절: 0.26, '단순 변심': 0.24, '가격 문제': 0.14, '판매자 미응답': 0.16, '구매자 미입금': 0.12, 기타: 0.08 };

export interface CompositionItem { label: string; count: number; pct: number; }
export function reasonBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return CANCEL_REASONS.map((label) => ({ label, count: Math.round(agg.cancelCount * REASON_WEIGHTS[label]), pct: REASON_WEIGHTS[label] * 100 }));
}

export function faultBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return [
    { label: '판매자 귀책', count: agg.sellerFaultCount, pct: agg.sellerFaultRate },
    { label: '구매자 귀책', count: agg.buyerFaultCount, pct: agg.buyerFaultRate },
  ];
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  cancelCount: number;
  cancelRate: number;
  sellerFaultCount: number;
  sellerFaultRate: number;
  prevCancelCount: number;
}

export function reasonRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return CANCEL_REASONS.map((reason, index) => {
    const cancelCount = Math.round(agg.cancelCount * REASON_WEIGHTS[reason]);
    const sellerFaultCount = ['품절', '판매자 미응답'].includes(reason) ? cancelCount : reason === '기타' ? Math.round(cancelCount * 0.5) : 0;
    return {
      id: `reason-${reason}`,
      name: reason,
      subtitle: '취소 사유',
      cancelCount,
      cancelRate: agg.dealCount ? (cancelCount / agg.dealCount) * 100 : 0,
      sellerFaultCount,
      sellerFaultRate: cancelCount ? (sellerFaultCount / cancelCount) * 100 : 0,
      prevCancelCount: Math.round(cancelCount / (1 + (0.1 - index * 0.012))),
    };
  }).sort((a, b) => b.cancelCount - a.cancelCount);
}

const SELLER_NAMES = Array.from({ length: 8 }, (_, i) => `판매자 ${String(i + 1).padStart(2, '0')}`);
const SELLER_WEIGHTS = [0.24, 0.19, 0.16, 0.13, 0.11, 0.08, 0.06, 0.03];

export function sellerRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return SELLER_NAMES.map((name, index) => {
    const cancelCount = Math.max(1, Math.round(agg.cancelCount * SELLER_WEIGHTS[index] * 1.5));
    const dealCount = Math.max(cancelCount * 4, Math.round(agg.dealCount * 0.05 * (1 - index * 0.08)));
    const sellerFaultCount = Math.round(cancelCount * (0.3 + (index % 4) * 0.15));
    return {
      id: `seller-${name}`,
      name,
      subtitle: '판매자',
      cancelCount,
      cancelRate: dealCount ? (cancelCount / dealCount) * 100 : 0,
      sellerFaultCount,
      sellerFaultRate: cancelCount ? (sellerFaultCount / cancelCount) * 100 : 0,
      prevCancelCount: Math.round(cancelCount / (1 + (0.13 - index * 0.015))),
    };
  }).sort((a, b) => b.cancelCount - a.cancelCount);
}

function categoriesFromProducts(): string[] {
  return [...new Set(PRODUCTS.slice(0, 10).map((p) => p.category))];
}
const CATEGORY_WEIGHTS_BASE = [0.25, 0.2, 0.17, 0.13, 0.11, 0.08, 0.06];

export function categoryRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  const categories = categoriesFromProducts();
  return categories.map((category, index) => {
    const weight = CATEGORY_WEIGHTS_BASE[index] ?? 0.04;
    const cancelCount = Math.max(0, Math.round(agg.cancelCount * weight));
    const dealCount = Math.max(cancelCount * 4, Math.round(agg.dealCount * weight));
    const sellerFaultCount = Math.round(cancelCount * (agg.sellerFaultRate / 100));
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: '카테고리',
      cancelCount,
      cancelRate: dealCount ? (cancelCount / dealCount) * 100 : 0,
      sellerFaultCount,
      sellerFaultRate: cancelCount ? (sellerFaultCount / cancelCount) * 100 : 0,
      prevCancelCount: Math.round(cancelCount / (1 + (0.08 - index * 0.01))),
    };
  }).sort((a, b) => b.cancelCount - a.cancelCount);
}
