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
  reportCount: number;
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
    const wiggle = 1 + Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const dealCount = Math.max(0, Math.round(730 * dayFactor));
    const reportRateDaily = 0.014 + (Math.sin(i * 0.5) + 1) * 0.005;
    const reportCount = Math.max(0, Math.round(dealCount * reportRateDaily));
    const resolveRateDaily = 0.8 + Math.sin(i * 0.9) * 0.08;
    const resolvedCount = Math.max(0, Math.round(reportCount * resolveRateDaily));

    records.push({ date, dealCount, reportCount, resolvedCount });
  }
  return records;
}

const SERIES = buildSeries();
export function trendSeries(start: string, end: string): DayRecord[] {
  return SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  dealCount: number;
  reportCount: number;
  resolvedCount: number;
  pendingCount: number;
  reportRate: number;
  resolveRate: number;
  avgResolveHours: number;
}

export function aggregate(start: string, end: string): PeriodAggregate {
  const rows = trendSeries(start, end);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);
  const dealCount = sum('dealCount');
  const reportCount = sum('reportCount');
  const resolvedCount = sum('resolvedCount');
  const days = Math.max(1, rows.length);
  const seed = daysBetween(SERIES_START, start) + days / 2;
  const avgResolveHours = Math.max(2, 14 + Math.sin(seed * 0.2) * 5);
  return {
    dealCount, reportCount, resolvedCount,
    pendingCount: Math.max(0, reportCount - resolvedCount),
    reportRate: dealCount ? (reportCount / dealCount) * 100 : 0,
    resolveRate: reportCount ? (resolvedCount / reportCount) * 100 : 0,
    avgResolveHours,
  };
}

export type ReportReason = '상품 문제' | '거래 태도' | '사기 의심' | '배송 문제' | '기타';
export const REPORT_REASONS: ReportReason[] = ['상품 문제', '거래 태도', '사기 의심', '배송 문제', '기타'];
const REASON_WEIGHTS: Record<ReportReason, number> = { '상품 문제': 0.42, '거래 태도': 0.22, '사기 의심': 0.14, '배송 문제': 0.12, 기타: 0.1 };

export interface CompositionItem { label: string; count: number; pct: number; }
export function reasonBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return REPORT_REASONS.map((label) => ({ label, count: Math.round(agg.reportCount * REASON_WEIGHTS[label]), pct: REASON_WEIGHTS[label] * 100 }));
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  reportCount: number;
  dealCount: number;
  reportRate: number;
  resolvedCount: number;
  resolveRate: number;
  prevReportCount: number;
}

export function reasonRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return REPORT_REASONS.map((reason, index) => {
    const reportCount = Math.round(agg.reportCount * REASON_WEIGHTS[reason]);
    const resolvedCount = Math.round(reportCount * (agg.resolveRate / 100));
    return {
      id: `reason-${reason}`,
      name: reason,
      subtitle: '신고 사유',
      reportCount,
      dealCount: agg.dealCount,
      reportRate: agg.dealCount ? (reportCount / agg.dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: reportCount ? (resolvedCount / reportCount) * 100 : 0,
      prevReportCount: Math.round(reportCount / (1 + (0.12 - index * 0.02))),
    };
  }).sort((a, b) => b.reportCount - a.reportCount);
}

const SELLER_NAMES = Array.from({ length: 8 }, (_, i) => `판매자 ${String(i + 1).padStart(2, '0')}`);
const SELLER_WEIGHTS = [0.26, 0.19, 0.15, 0.12, 0.1, 0.08, 0.06, 0.04];

export function sellerRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return SELLER_NAMES.map((name, index) => {
    const reportCount = Math.max(1, Math.round(agg.reportCount * SELLER_WEIGHTS[index] * 1.6));
    const dealCount = Math.max(reportCount * 8, Math.round(agg.dealCount * 0.05 * (1 - index * 0.08)));
    const resolvedCount = Math.round(reportCount * (0.5 + (index % 3) * 0.18));
    return {
      id: `seller-${name}`,
      name,
      subtitle: '판매자',
      reportCount,
      dealCount,
      reportRate: dealCount ? (reportCount / dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: reportCount ? (resolvedCount / reportCount) * 100 : 0,
      prevReportCount: Math.round(reportCount / (1 + (0.15 - index * 0.02))),
    };
  }).sort((a, b) => b.reportCount - a.reportCount);
}

function categoriesFromProducts(): string[] {
  return [...new Set(PRODUCTS.slice(0, 10).map((p) => p.category))];
}
const CATEGORY_WEIGHTS_BASE = [0.26, 0.2, 0.16, 0.13, 0.11, 0.08, 0.06];

export function categoryRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  const categories = categoriesFromProducts();
  return categories.map((category, index) => {
    const weight = CATEGORY_WEIGHTS_BASE[index] ?? 0.04;
    const reportCount = Math.max(0, Math.round(agg.reportCount * weight));
    const dealCount = Math.max(reportCount * 6, Math.round(agg.dealCount * weight));
    const resolvedCount = Math.round(reportCount * (agg.resolveRate / 100));
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: '카테고리',
      reportCount,
      dealCount,
      reportRate: dealCount ? (reportCount / dealCount) * 100 : 0,
      resolvedCount,
      resolveRate: reportCount ? (resolvedCount / reportCount) * 100 : 0,
      prevReportCount: Math.round(reportCount / (1 + (0.1 - index * 0.015))),
    };
  }).sort((a, b) => b.reportCount - a.reportCount);
}
