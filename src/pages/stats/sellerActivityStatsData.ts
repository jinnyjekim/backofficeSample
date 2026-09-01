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

export type Mode = 'c2c' | 'b2b';
export const MODES: Mode[] = ['c2c', 'b2b'];
export const MODE_LABELS: Record<Mode, string> = { c2c: 'C2C', b2b: 'B2B 공급자' };
export const ENTITY_LABEL: Record<Mode, string> = { c2c: '판매자', b2b: '공급사' };
const MODE_FACTOR: Record<Mode, number> = { c2c: 1, b2b: 0.42 };
const TOTAL_POOL: Record<Mode, number> = { c2c: 9500, b2b: 3600 };

export type ActivitySegment = '고활성' | '일반' | '저활성' | '휴면위험' | '휴면';
export const SEGMENTS: ActivitySegment[] = ['고활성', '일반', '저활성', '휴면위험', '휴면'];
export const SEGMENT_META: Record<ActivitySegment, { bg: string; fg: string }> = {
  고활성: { bg: '#ecfdf5', fg: '#059669' },
  일반: { bg: '#eef2ff', fg: '#4338ca' },
  저활성: { bg: '#fff7ed', fg: '#c2410c' },
  휴면위험: { bg: '#fef2f2', fg: '#b91c1c' },
  휴면: { bg: '#f4f4f5', fg: '#71717a' },
};

export type QualityGrade = '정상' | '주의' | '위험';
export const QUALITY_META: Record<QualityGrade, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  주의: { bg: '#fff7ed', fg: '#c2410c' },
  위험: { bg: '#fef2f2', fg: '#b91c1c' },
};

export interface DayRecord {
  date: string;
  activeSellers: number;
  newSellers: number;
  productRegSellers: number;
  dealSellers: number;
  saleCompleteSellers: number;
  dealCount: number;
  dealCompletedCount: number;
  gmv: number;
}

function buildSeries(mode: Mode): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const factor = MODE_FACTOR[mode];
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.78 + (i / (totalDays - 1)) * 0.5;
    const weekday = dow === 0 || dow === 6 ? 0.64 : 1.07;
    const wiggle = 1 + Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const activeSellers = Math.max(0, Math.round(280 * dayFactor));
    const newSellers = Math.max(0, Math.round(28 * dayFactor));
    const productRegSellers = Math.max(0, Math.round(activeSellers * 0.501));
    const dealSellers = Math.max(0, Math.round(activeSellers * 0.378));
    const saleCompleteSellers = Math.max(0, Math.round(dealSellers * 0.83));
    const dealCount = Math.max(0, Math.round(dealSellers * 2.6));
    const dealCompletedCount = Math.max(0, Math.round(dealCount * 0.82));
    const avgDealValue = 62000 + Math.sin(i * 0.4) * 8000;
    const gmv = Math.round(dealCompletedCount * avgDealValue);

    records.push({ date, activeSellers, newSellers, productRegSellers, dealSellers, saleCompleteSellers, dealCount, dealCompletedCount, gmv });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  activeSellers: number;
  newSellers: number;
  productRegSellers: number;
  dealSellers: number;
  saleCompleteSellers: number;
  dealCount: number;
  dealCompletedCount: number;
  gmv: number;
  dealSuccessRate: number;
  avgResponseMinutes: number;
  cancelRate: number;
  disputeRate: number;
  reportedSellers: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const rows = seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
  const days = Math.max(1, rows.length);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);
  const avgDailyActive = sum('activeSellers') / days;
  const totalPool = Math.round(TOTAL_POOL[mode]);
  const activeSellers = Math.min(totalPool, Math.round(avgDailyActive * Math.pow(days, 0.55)));
  const newSellers = sum('newSellers');
  const productRegSellers = Math.round(activeSellers * 0.501);
  const dealSellers = Math.round(activeSellers * 0.378);
  const saleCompleteSellers = Math.round(dealSellers * 0.83);
  const dealCount = sum('dealCount');
  const dealCompletedCount = sum('dealCompletedCount');
  const gmv = sum('gmv');
  const dealSuccessRate = dealCount ? (dealCompletedCount / dealCount) * 100 : 0;

  const seed = daysBetween(SERIES_START, start) + days / 2;
  const avgResponseMinutes = Math.max(8, 38 + Math.sin(seed * 0.13) * 9 + (mode === 'b2b' ? 46 : 0));
  const cancelRate = Math.max(0.5, 3.6 + Math.sin(seed * 0.21) * 1.1 + Math.cos(seed * 0.07) * 0.6);
  const disputeRate = Math.max(0.2, 1.4 + Math.sin(seed * 0.17) * 0.5 + Math.cos(seed * 0.09) * 0.3);
  const reportedSellers = Math.max(0, Math.round(activeSellers * (disputeRate / 100) * 0.72));

  return {
    activeSellers, newSellers, productRegSellers, dealSellers, saleCompleteSellers,
    dealCount, dealCompletedCount, gmv, dealSuccessRate,
    avgResponseMinutes, cancelRate, disputeRate, reportedSellers,
  };
}

export interface FunnelStep {
  label: string;
  count: number;
  pctOfStart: number;
  stepRate?: number;
}

export function funnelSteps(mode: Mode, agg: PeriodAggregate): FunnelStep[] {
  const raw = [
    { label: `활성 ${ENTITY_LABEL[mode]}`, count: agg.activeSellers },
    { label: '상품 등록', count: agg.productRegSellers },
    { label: '거래 발생', count: agg.dealSellers },
    { label: '판매 성사', count: agg.saleCompleteSellers },
  ];
  return raw.map((step, index) => ({
    label: step.label,
    count: step.count,
    pctOfStart: agg.activeSellers ? (step.count / agg.activeSellers) * 100 : 0,
    stepRate: index === 0 ? undefined : (raw[index - 1].count ? (step.count / raw[index - 1].count) * 100 : 0),
  }));
}

export type SellerStatus = '활동중' | '휴면';

export interface SellerRow {
  id: string;
  name: string;
  status: SellerStatus;
  segment: ActivitySegment;
  lastActiveDate: string;
  cumulativeProducts: number;
  newProducts: number;
  dealCount: number;
  dealCompleted: number;
  gmv: number;
  successRate: number;
  avgResponseMinutes: number;
  cancelRate: number;
  disputeRate: number;
  reportCount: number;
  qualityGrade: QualityGrade;
}

const SELLER_COUNT = 14;
function sellerBaseNames(mode: Mode): string[] {
  const label = ENTITY_LABEL[mode];
  return Array.from({ length: SELLER_COUNT }, (_, i) => `${label} ${String(i + 1).padStart(2, '0')}`);
}

export function sellerRows(mode: Mode, start: string, end: string): SellerRow[] {
  const agg = aggregate(mode, start, end);
  const names = sellerBaseNames(mode);
  const weights = names.map((_, i) => 1 / (i + 1.6));
  const wSum = weights.reduce((s, w) => s + w, 0);
  const periodDays = daysBetween(start, end) + 1;

  const draft = names.map((name, i) => {
    const share = weights[i] / wSum;
    const dealCount = Math.max(1, Math.round(agg.dealCount * share * 1.4));
    const successRateBase = 92 - i * 2.6 + Math.sin(i * 1.7) * 4;
    const successRate = Math.max(28, Math.min(98, successRateBase));
    const dealCompleted = Math.round(dealCount * (successRate / 100));
    const cumulativeProducts = Math.max(1, Math.round(agg.productRegSellers * share * 6));
    const newProducts = Math.max(0, Math.round(cumulativeProducts * 0.14));
    const avgDealValue = 58000 + (i % 5) * 4200;
    const gmv = dealCompleted * avgDealValue;
    const avgResponseMinutes = Math.max(8, 22 + i * 14 + Math.sin(i * 2) * 10);
    const cancelRate = Math.max(0.4, 2.4 + i * 0.9 + Math.cos(i) * 1.1);
    const disputeRate = Math.max(0, 0.4 + i * 0.42 + Math.sin(i * 1.3) * 0.6);
    const reportCount = Math.round(dealCount * (disputeRate / 100) * 0.6);
    const lastActiveOffset = i < 4 ? i : i < 9 ? 5 + i * 2 : 35 + i * 6;
    const lastActiveDate = addDays(end, -Math.min(periodDays + 40, lastActiveOffset));
    const daysSinceActive = daysBetween(lastActiveDate, end);
    const qualityGrade: QualityGrade = disputeRate >= 6 || cancelRate >= 10 ? '위험' : disputeRate >= 3 || cancelRate >= 6 ? '주의' : '정상';
    const status: SellerStatus = daysSinceActive > 60 ? '휴면' : '활동중';

    return {
      id: `seller-${mode}-${i}`, name, status, lastActiveDate, daysSinceActive,
      cumulativeProducts, newProducts, dealCount, dealCompleted, gmv,
      successRate: dealCount ? (dealCompleted / dealCount) * 100 : 0,
      avgResponseMinutes, cancelRate, disputeRate, reportCount, qualityGrade,
    };
  });

  // segment by relative activity rank among non-dormant sellers, so the distribution
  // stays meaningful regardless of the absolute deal volume represented by this sample
  const activeOrder = draft
    .filter((row) => row.daysSinceActive <= 30)
    .sort((a, b) => b.dealCount - a.dealCount)
    .map((row) => row.id);
  const rankOf = new Map(activeOrder.map((id, index) => [id, index]));
  const activeTotal = activeOrder.length || 1;

  return draft.map((row) => {
    let segment: ActivitySegment;
    if (row.daysSinceActive > 60) segment = '휴면';
    else if (row.daysSinceActive > 30) segment = '휴면위험';
    else {
      const rank = rankOf.get(row.id) ?? 0;
      const pct = rank / activeTotal;
      segment = pct < 0.35 ? '고활성' : pct < 0.75 ? '일반' : '저활성';
    }
    return { ...row, segment };
  });
}

export interface SegmentSummaryRow {
  segment: ActivitySegment;
  count: number;
  pct: number;
}

export function segmentSummary(rows: SellerRow[]): SegmentSummaryRow[] {
  const total = rows.length || 1;
  return SEGMENTS.map((segment) => {
    const count = rows.filter((r) => r.segment === segment).length;
    return { segment, count, pct: (count / total) * 100 };
  });
}
