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
const MODE_FACTOR: Record<Mode, number> = { all: 1, b2c: 0.58, c2c: 0.2, b2b: 0.22 };

export const START_LABEL: Record<Mode, string> = { all: '거래 시작', b2c: '주문 생성', c2c: '거래 요청', b2b: '견적 요청' };
export const CONVERTED_LABEL: Record<Mode, string> = { all: '거래 성사', b2c: '주문 확정', c2c: '거래 완료', b2b: '주문/계약 확정' };
export const FOURTH_DIMENSION_LABEL: Record<Mode, string> = { all: '고객군별', b2c: '고객군별', c2c: '판매자별', b2b: '거래처별' };

export const STAGE_LABELS: Record<Mode, [string, string, string, string]> = {
  all: ['거래 시작', '중간 단계', '결제/승인', '거래 성사'],
  b2c: ['주문 생성', '결제 시도', '결제 완료', '주문 확정'],
  c2c: ['거래 요청', '판매자 수락', '결제 완료', '거래 완료'],
  b2b: ['견적 요청', '견적 발송', '승인', '주문 확정'],
};

interface FailureReasonSeed { label: string; weight: number; }
const FAILURE_REASONS: Record<Mode, FailureReasonSeed[]> = {
  all: [
    { label: '결제 실패', weight: 0.45 },
    { label: '고객 취소', weight: 0.3 },
    { label: '판매자 거절', weight: 0.17 },
    { label: '승인 반려', weight: 0.08 },
  ],
  b2c: [
    { label: '결제 실패', weight: 0.48 },
    { label: '고객 취소', weight: 0.34 },
    { label: '재고 부족', weight: 0.12 },
    { label: '시스템 오류', weight: 0.06 },
  ],
  c2c: [
    { label: '판매자 거절', weight: 0.36 },
    { label: '구매자 취소', weight: 0.28 },
    { label: '결제 실패', weight: 0.18 },
    { label: '판매자 미응답', weight: 0.18 },
  ],
  b2b: [
    { label: '견적 반려', weight: 0.38 },
    { label: '가격/조건 불일치', weight: 0.3 },
    { label: '재고 부족', weight: 0.17 },
    { label: '기한 만료', weight: 0.15 },
  ],
};
export function failureReasons(mode: Mode): FailureReasonSeed[] {
  return FAILURE_REASONS[mode];
}

export interface DayRecord {
  date: string;
  stage0: number;
  stage1: number;
  stage2: number;
  stage3: number;
  failed: number;
  inProgress: number;
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
    const weekday = dow === 0 || dow === 6 ? 0.62 : 1.07;
    const wiggle = 1 + Math.sin(i * 1.3) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const stage0 = Math.max(0, Math.round(280 * dayFactor));
    const r1 = mode === 'b2b' ? 0.9 + Math.sin(i * 0.4) * 0.03 : 0.92 + Math.sin(i * 0.4) * 0.03;
    const r2 = mode === 'b2b' ? 0.7 + Math.cos(i * 0.5) * 0.05 : 0.91 + Math.cos(i * 0.5) * 0.04;
    const r3 = mode === 'b2b' ? 0.82 + Math.sin(i * 0.6) * 0.04 : 0.95 + Math.sin(i * 0.6) * 0.02;
    const stage1 = Math.round(stage0 * r1);
    const stage2 = Math.round(stage1 * r2);
    const finalRate = mode === 'b2b' ? 0.62 + Math.cos(i * 0.7) * 0.05 : 0.85 + Math.cos(i * 0.7) * 0.04;
    const stage3 = Math.round(stage2 * Math.min(finalRate / r3, 1) * r3);

    const inProgress = Math.round(stage0 * 0.03);
    const failed = Math.max(0, stage0 - stage3 - inProgress);

    const avgLead = mode === 'b2b' ? 3.8 + Math.sin(i * 0.3) * 0.5 : mode === 'c2c' ? 1.6 + Math.cos(i * 0.4) * 0.3 : 0.4 + Math.sin(i * 0.5) * 0.1;

    records.push({ date, stage0, stage1, stage2, stage3, failed, inProgress, totalLeadDays: avgLead * stage3 });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export interface PeriodAggregate {
  started: number;
  stage1: number;
  stage2: number;
  converted: number;
  failed: number;
  inProgress: number;
  resolved: number;
  conversionRate: number;
  overallRate: number;
  avgLeadDays: number;
  stageRate1: number;
  stageRate2: number;
  stageRate3: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const rows = seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
  const sum = (key: keyof DayRecord) => rows.reduce((total, r) => total + (r[key] as number), 0);
  const started = sum('stage0');
  const stage1 = sum('stage1');
  const stage2 = sum('stage2');
  const converted = sum('stage3');
  const failed = sum('failed');
  const inProgress = sum('inProgress');
  const resolved = converted + failed;
  const totalLeadDays = sum('totalLeadDays');
  return {
    started,
    stage1,
    stage2,
    converted,
    failed,
    inProgress,
    resolved,
    conversionRate: resolved ? (converted / resolved) * 100 : 0,
    overallRate: started ? (converted / started) * 100 : 0,
    avgLeadDays: converted ? totalLeadDays / converted : 0,
    stageRate1: started ? (stage1 / started) * 100 : 0,
    stageRate2: stage1 ? (stage2 / stage1) * 100 : 0,
    stageRate3: stage2 ? (converted / stage2) * 100 : 0,
  };
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export function conversionRateTrend(mode: Mode, start: string, end: string): number[] {
  return trendSeries(mode, start, end).map((r) => {
    const resolved = r.stage3 + r.failed;
    return resolved ? (r.stage3 / resolved) * 100 : 0;
  });
}

export interface FunnelStep { label: string; count: number; pctOfStart: number; dropRate: number | null; }
export function funnelSteps(mode: Mode, agg: PeriodAggregate): FunnelStep[] {
  const labels = STAGE_LABELS[mode];
  const counts = [agg.started, agg.stage1, agg.stage2, agg.converted];
  return labels.map((label, index) => ({
    label,
    count: counts[index],
    pctOfStart: agg.started ? (counts[index] / agg.started) * 100 : 0,
    dropRate: index === 0 ? null : (counts[index - 1] ? (counts[index] / counts[index - 1]) * 100 : 0),
  }));
}

export interface ReasonItem { label: string; count: number; }
export function failureBreakdown(mode: Mode, agg: PeriodAggregate): ReasonItem[] {
  const reasons = failureReasons(mode);
  return reasons.map((r) => ({ label: r.label, count: Math.round(agg.failed * r.weight) })).sort((a, b) => b.count - a.count);
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  started: number;
  converted: number;
  failed: number;
  inProgress: number;
  conversionRate: number;
  avgLeadDays: number;
  prevConverted: number;
}

const PRODUCT_SAMPLE = PRODUCTS.slice(0, 8);
export function productRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  const weights = [0.22, 0.18, 0.15, 0.12, 0.11, 0.09, 0.07, 0.06];
  return PRODUCT_SAMPLE.map((product, index) => {
    const started = Math.round(agg.started * weights[index]);
    const rate = (agg.conversionRate / 100) * (0.75 + (index % 4) * 0.1);
    const converted = Math.round(started * Math.min(rate, 0.98));
    const inProgress = Math.round(started * 0.03);
    const failed = Math.max(0, started - converted - inProgress);
    return {
      id: product.code,
      name: product.name,
      subtitle: `${product.code} · ${product.category}`,
      started,
      converted,
      failed,
      inProgress,
      conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
      avgLeadDays: agg.avgLeadDays * (0.85 + (index % 3) * 0.1),
      prevConverted: Math.round(converted / (1 + (0.16 - index * 0.03))),
    };
  }).sort((a, b) => b.started - a.started);
}

export function categoryRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const products = productRows(mode, start, end);
  const categories = [...new Set(PRODUCT_SAMPLE.map((p) => p.category))];
  return categories.map((category) => {
    const codes = new Set(PRODUCT_SAMPLE.filter((p) => p.category === category).map((p) => p.code));
    const matched = products.filter((r) => codes.has(r.id));
    const started = matched.reduce((s, r) => s + r.started, 0);
    const converted = matched.reduce((s, r) => s + r.converted, 0);
    const failed = matched.reduce((s, r) => s + r.failed, 0);
    const inProgress = matched.reduce((s, r) => s + r.inProgress, 0);
    const prevConverted = matched.reduce((s, r) => s + r.prevConverted, 0);
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: `${matched.length}개 상품`,
      started,
      converted,
      failed,
      inProgress,
      conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
      avgLeadDays: matched.length ? matched.reduce((s, r) => s + r.avgLeadDays, 0) / matched.length : 0,
      prevConverted,
    };
  }).filter((r) => r.started > 0).sort((a, b) => b.started - a.started);
}

const TX_TYPES = ['신규 거래', '재거래', '프로모션 적용', '일반'];
const TX_TYPE_WEIGHTS = [0.28, 0.34, 0.16, 0.22];
export function transactionTypeRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return TX_TYPES.map((type, index) => {
    const started = Math.round(agg.started * TX_TYPE_WEIGHTS[index]);
    const rate = (agg.conversionRate / 100) * (0.8 + (index % 3) * 0.08);
    const converted = Math.round(started * Math.min(rate, 0.98));
    const inProgress = Math.round(started * 0.03);
    const failed = Math.max(0, started - converted - inProgress);
    return {
      id: `type-${type}`,
      name: type,
      subtitle: '거래 유형',
      started,
      converted,
      failed,
      inProgress,
      conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
      avgLeadDays: agg.avgLeadDays,
      prevConverted: Math.round(converted / (1 + (0.1 - index * 0.02))),
    };
  }).sort((a, b) => b.started - a.started);
}

const B2C_GROUPS = ['신규 고객', '기존 고객'];
const C2C_SELLERS = ['판매자 01', '판매자 02', '판매자 03', '판매자 04', '판매자 05'];
export function fourthDimensionRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  if (mode === 'b2b') {
    const weights = [0.3, 0.24, 0.19, 0.15, 0.12];
    return COMPANIES.map((name, index) => {
      const started = Math.round(agg.started * (weights[index] ?? 0.05));
      const rate = (agg.conversionRate / 100) * (0.7 + (index % 3) * 0.12);
      const converted = Math.round(started * Math.min(rate, 0.97));
      const inProgress = Math.round(started * 0.04);
      const failed = Math.max(0, started - converted - inProgress);
      return {
        id: `co-${name}`, name, subtitle: '거래처', started, converted, failed, inProgress,
        conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
        avgLeadDays: agg.avgLeadDays * (0.8 + (index % 3) * 0.15),
        prevConverted: Math.round(converted / (1 + (0.14 - index * 0.03))),
      };
    }).sort((a, b) => b.started - a.started);
  }
  if (mode === 'c2c') {
    const weights = [0.28, 0.24, 0.19, 0.16, 0.13];
    return C2C_SELLERS.map((name, index) => {
      const started = Math.round(agg.started * weights[index]);
      const rate = (agg.conversionRate / 100) * (0.75 + (index % 3) * 0.1);
      const converted = Math.round(started * Math.min(rate, 0.97));
      const inProgress = Math.round(started * 0.03);
      const failed = Math.max(0, started - converted - inProgress);
      return {
        id: `seller-${name}`, name, subtitle: '판매자', started, converted, failed, inProgress,
        conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
        avgLeadDays: agg.avgLeadDays * (0.7 + (index % 4) * 0.2),
        prevConverted: Math.round(converted / (1 + (0.12 - index * 0.03))),
      };
    }).sort((a, b) => b.started - a.started);
  }
  const weights = [0.42, 0.58];
  return B2C_GROUPS.map((name, index) => {
    const started = Math.round(agg.started * weights[index]);
    const rate = index === 0 ? (agg.conversionRate / 100) * 0.78 : (agg.conversionRate / 100) * 1.12;
    const converted = Math.round(started * Math.min(rate, 0.98));
    const inProgress = Math.round(started * 0.03);
    const failed = Math.max(0, started - converted - inProgress);
    return {
      id: `grp-${name}`, name, subtitle: '고객군', started, converted, failed, inProgress,
      conversionRate: (converted + failed) ? (converted / (converted + failed)) * 100 : 0,
      avgLeadDays: agg.avgLeadDays,
      prevConverted: Math.round(converted / (1 + (index === 0 ? 0.08 : 0.04))),
    };
  });
}
