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
  type QuickRange,
} from './transactionStatsData';

export { TODAY, addDays, daysBetween, fmtDate, quickRangeDates, previousPeriod, delta, fmtWon, fmtCount, fmtPct, fmtSignedPct };
export type { QuickRange };

const SERIES_START = '2026-01-01';
const FEE_RATE = 0.082;

export interface DayRecord {
  date: string;
  dealCount: number;
  gmv: number;
  settlementTarget: number;
  fee: number;
  settlementFinal: number;
  payoutDone: number;
}

function buildSeries(): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.76 + (i / (totalDays - 1)) * 0.6;
    const weekday = dow === 0 || dow === 6 ? 0.66 : 1.06;
    const wiggle = 1 + Math.sin(i * 1.15) * 0.08 + Math.cos(i * 0.5) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const dealCount = Math.max(0, Math.round(600 * dayFactor));
    const avgDealValue = 61000 + Math.sin(i * 0.35) * 8500;
    const gmv = Math.round(dealCount * avgDealValue);
    const refundRate = 0.018 + (Math.sin(i * 0.5) + 1) * 0.006;
    const settlementTarget = Math.round(gmv * (1 - refundRate));
    const fee = Math.round(settlementTarget * FEE_RATE);
    const settlementFinal = settlementTarget - fee;
    const lag = daysBetween(date, TODAY);
    const payoutDone = lag > 5 ? Math.round(settlementFinal * 0.94) : 0;

    records.push({ date, dealCount, gmv, settlementTarget, fee, settlementFinal, payoutDone });
  }
  return records;
}

const SERIES = buildSeries();
export function trendSeries(start: string, end: string): DayRecord[] {
  return SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  dealCount: number;
  gmv: number;
  settlementTarget: number;
  fee: number;
  settlementFinal: number;
  payoutDone: number;
  payoutPending: number;
  avgDealValue: number;
  feeRate: number;
}

export function aggregate(start: string, end: string): PeriodAggregate {
  const rows = trendSeries(start, end);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);
  const dealCount = sum('dealCount');
  const gmv = sum('gmv');
  const settlementTarget = sum('settlementTarget');
  const fee = sum('fee');
  const settlementFinal = sum('settlementFinal');
  const payoutDone = sum('payoutDone');
  return {
    dealCount, gmv, settlementTarget, fee, settlementFinal, payoutDone,
    payoutPending: Math.max(0, settlementFinal - payoutDone),
    avgDealValue: dealCount ? Math.round(gmv / dealCount) : 0,
    feeRate: settlementTarget ? (fee / settlementTarget) * 100 : 0,
  };
}

export type SettlementStatus = '정산 대기' | '검토중' | '확정';
export const SETTLEMENT_STATUSES: SettlementStatus[] = ['정산 대기', '검토중', '확정'];
const STATUS_WEIGHTS: Record<SettlementStatus, number> = { '정산 대기': 0.1, 검토중: 0.14, 확정: 0.76 };

export interface CompositionItem { label: string; count: number; amount: number; pct: number; }
export function statusBreakdown(agg: PeriodAggregate): CompositionItem[] {
  return SETTLEMENT_STATUSES.map((label) => ({ label, count: 0, amount: Math.round(agg.settlementFinal * STATUS_WEIGHTS[label]), pct: STATUS_WEIGHTS[label] * 100 }));
}

export function payoutBreakdown(agg: PeriodAggregate): CompositionItem[] {
  const total = agg.settlementFinal || 1;
  return [
    { label: '지급 완료', count: 0, amount: agg.payoutDone, pct: (agg.payoutDone / total) * 100 },
    { label: '지급 예정', count: 0, amount: agg.payoutPending, pct: (agg.payoutPending / total) * 100 },
  ];
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  dealCount: number;
  gmv: number;
  fee: number;
  settlementFinal: number;
  payoutDone: number;
  prevGmv: number;
}

const SELLER_NAMES = Array.from({ length: 10 }, (_, i) => `판매자 ${String(i + 1).padStart(2, '0')}`);
const SELLER_WEIGHTS = [0.22, 0.17, 0.14, 0.11, 0.09, 0.08, 0.07, 0.05, 0.04, 0.03];

export function sellerRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return SELLER_NAMES.map((name, index) => {
    const gmv = Math.max(1, Math.round(agg.gmv * SELLER_WEIGHTS[index]));
    const dealCount = Math.max(1, Math.round(agg.dealCount * SELLER_WEIGHTS[index]));
    const fee = Math.round(gmv * FEE_RATE);
    const settlementFinal = gmv - fee;
    const payoutDone = Math.round(settlementFinal * (0.6 + (index % 4) * 0.12));
    return {
      id: `seller-${name}`,
      name,
      subtitle: '판매자',
      dealCount,
      gmv,
      fee,
      settlementFinal,
      payoutDone,
      prevGmv: Math.round(gmv / (1 + (0.15 - index * 0.012))),
    };
  }).sort((a, b) => b.gmv - a.gmv);
}

export function statusRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  return SETTLEMENT_STATUSES.map((status) => {
    const settlementFinal = Math.round(agg.settlementFinal * STATUS_WEIGHTS[status]);
    const gmv = Math.round(settlementFinal / (1 - FEE_RATE));
    const fee = gmv - settlementFinal;
    return {
      id: `status-${status}`,
      name: status,
      subtitle: '정산 상태',
      dealCount: Math.round(agg.dealCount * STATUS_WEIGHTS[status]),
      gmv,
      fee,
      settlementFinal,
      payoutDone: status === '확정' ? agg.payoutDone : 0,
      prevGmv: Math.round(gmv * 0.94),
    };
  }).sort((a, b) => b.gmv - a.gmv);
}

function categoriesFromProducts(): string[] {
  return [...new Set(PRODUCTS.slice(0, 10).map((p) => p.category))];
}
const CATEGORY_WEIGHTS_BASE = [0.24, 0.19, 0.16, 0.13, 0.11, 0.09, 0.05];

export function categoryRows(start: string, end: string): DimensionRow[] {
  const agg = aggregate(start, end);
  const categories = categoriesFromProducts();
  return categories.map((category, index) => {
    const weight = CATEGORY_WEIGHTS_BASE[index] ?? 0.04;
    const gmv = Math.max(0, Math.round(agg.gmv * weight));
    const fee = Math.round(gmv * FEE_RATE);
    const settlementFinal = gmv - fee;
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: '카테고리',
      dealCount: Math.round(agg.dealCount * weight),
      gmv,
      fee,
      settlementFinal,
      payoutDone: Math.round(settlementFinal * 0.82),
      prevGmv: Math.round(gmv / (1 + (0.12 - index * 0.015))),
    };
  }).sort((a, b) => b.gmv - a.gmv);
}
