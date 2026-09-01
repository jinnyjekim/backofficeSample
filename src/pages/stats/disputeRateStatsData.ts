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
  disputeCount: number;
  resolvedCount: number;
}

function buildSeries(): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.78 + (i / (totalDays - 1)) * 0.5;
    const weekday = dow === 0 || dow === 6 ? 0.64 : 1.07;
    const wiggle = 1 + Math.sin(i * 1.1) * 0.08 + Math.cos(i * 0.5) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const dealCount = Math.max(0, Math.round(730 * dayFactor));
    const disputeRateDaily = 0.009 + (Math.sin(i * 0.4) + 1) * 0.004;
    const disputeCount = Math.max(0, Math.round(dealCount * disputeRateDaily));
    const resolveRateDaily = 0.72 + Math.sin(i * 0.8) * 0.1;
    const resolvedCount = Math.max(0, Math.round(disputeCount * resolveRateDaily));

    records.push({ date, dealCount, disputeCount, resolvedCount });
  }
  return records;
}

const SERIES = buildSeries();
export function trendSeries(start: string, end: string): DayRecord[] {
  return SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  dealCount: number;
  disputeCount: number;
  resolvedCount: number;
  pendingCount: number;
  disputeRate: number;
  resolveRate: number;
  avgResolveDays: number;
}

export function aggregate(start: string, end: string): PeriodAggregate {
  const rows = trendSeries(start, end);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);
  const dealCount = sum('dealCount');
  const disputeCount = sum('disputeCount');
  const resolvedCount = sum('resolvedCount');
  const days = Math.max(1, rows.length);
  const seed = daysBetween(SERIES_START, start) + days / 2;
  const avgResolveDays = Math.max(0.5, 2.6 + Math.sin(seed * 0.18) * 0.9);
  return {
    dealCount, disputeCount, resolvedCount,
    pendingCount: Math.max(0, disputeCount - resolvedCount),
    disputeRate: dealCount ? (disputeCount / dealCount) * 100 : 0,
    resolveRate: disputeCount ? (resolvedCount / disputeCount) * 100 : 0,
    avgResolveDays,
  };
}

export type DisputeReason = '상품 상이' | '미배송' | '사기 의심' | '환불 거부' | '기타';
export const DISPUTE_REASONS: DisputeReason[] = ['상품 상이', '미배송', '사기 의심', '환불 거부', '기타'];
const REASON_WEIGHTS: Record<DisputeReason, number> = { '상품 상이': 0.36, 미배송: 0.24, '사기 의심': 0.16, '환불 거부': 0.14, 기타: 0.1 };

export interface CompositionItem { label: string; count: number; pct: number; }
export function reasonBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return DISPUTE_REASONS.map((label) => ({ label, count: Math.round(agg.disputeCount * REASON_WEIGHTS[label]), pct: REASON_WEIGHTS[label] * 100 }));
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  disputeCount: number;
  disputeRate: number;
  resolvedCount: number;
  resolveRate: number;
  prevDisputeCount: number;
}

export function reasonRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return DISPUTE_REASONS.map((reason, index) => {
    const disputeCount = Math.round(agg.disputeCount * REASON_WEIGHTS[reason]);
    const resolvedCount = Math.round(disputeCount * (agg.resolveRate / 100));
    return {
      id: `reason-${reason}`,
      name: reason,
      subtitle: '분쟁 사유',
      disputeCount,
      disputeRate: agg.dealCount ? (disputeCount / agg.dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: disputeCount ? (resolvedCount / disputeCount) * 100 : 0,
      prevDisputeCount: Math.round(disputeCount / (1 + (0.1 - index * 0.015))),
    };
  }).sort((a, b) => b.disputeCount - a.disputeCount);
}

const SELLER_NAMES = Array.from({ length: 8 }, (_, i) => `판매자 ${String(i + 1).padStart(2, '0')}`);
const SELLER_WEIGHTS = [0.27, 0.2, 0.15, 0.12, 0.1, 0.07, 0.05, 0.04];

export function sellerRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return SELLER_NAMES.map((name, index) => {
    const disputeCount = Math.max(1, Math.round(agg.disputeCount * SELLER_WEIGHTS[index] * 1.6));
    const dealCount = Math.max(disputeCount * 10, Math.round(agg.dealCount * 0.05 * (1 - index * 0.08)));
    const resolvedCount = Math.round(disputeCount * (0.45 + (index % 3) * 0.18));
    return {
      id: `seller-${name}`,
      name,
      subtitle: '판매자',
      disputeCount,
      disputeRate: dealCount ? (disputeCount / dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: disputeCount ? (resolvedCount / disputeCount) * 100 : 0,
      prevDisputeCount: Math.round(disputeCount / (1 + (0.14 - index * 0.02))),
    };
  }).sort((a, b) => b.disputeCount - a.disputeCount);
}

function categoriesFromProducts(): string[] {
  return [...new Set(PRODUCTS.slice(0, 10).map((p) => p.category))];
}
const CATEGORY_WEIGHTS_BASE = [0.24, 0.2, 0.17, 0.14, 0.11, 0.08, 0.06];

export function categoryRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  const categories = categoriesFromProducts();
  return categories.map((category, index) => {
    const weight = CATEGORY_WEIGHTS_BASE[index] ?? 0.04;
    const disputeCount = Math.max(0, Math.round(agg.disputeCount * weight));
    const dealCount = Math.max(disputeCount * 8, Math.round(agg.dealCount * weight));
    const resolvedCount = Math.round(disputeCount * (agg.resolveRate / 100));
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: '카테고리',
      disputeCount,
      disputeRate: dealCount ? (disputeCount / dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: disputeCount ? (resolvedCount / disputeCount) * 100 : 0,
      prevDisputeCount: Math.round(disputeCount / (1 + (0.09 - index * 0.012))),
    };
  }).sort((a, b) => b.disputeCount - a.disputeCount);
}
