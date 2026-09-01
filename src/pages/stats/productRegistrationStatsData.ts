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

export type Mode = 'all' | 'b2c' | 'c2c' | 'b2b';
export const MODE_LABELS: Record<Mode, string> = { all: '통합', b2c: 'B2C', c2c: 'C2C', b2b: 'B2B' };
export const MODES: Mode[] = ['all', 'b2c', 'c2c', 'b2b'];
const MODE_FACTOR: Record<Mode, number> = { all: 1, b2c: 0.5, c2c: 0.34, b2b: 0.16 };

export const REGISTER_LABEL: Record<Mode, string> = { all: '신규 등록 상품', b2c: '신규 등록 상품', c2c: '신규 등록 매물', b2b: '신규 공급 상품' };
export const TOTAL_LABEL: Record<Mode, string> = { all: '누적 등록 상품', b2c: '누적 등록 상품', c2c: '누적 등록 매물', b2b: '누적 공급 상품' };
export const ACTIVE_LABEL: Record<Mode, string> = { all: '판매중 상품', b2c: '판매중 상품', c2c: '판매중 매물', b2b: '공급중 상품' };
export const INACTIVE_LABEL: Record<Mode, string> = { all: '비활성 상품', b2c: '비활성 상품', c2c: '판매완료 / 중지 매물', b2b: '공급중지 상품' };
export const SECOND_DIMENSION_LABEL: Record<Mode, string> = { all: '브랜드별', b2c: '브랜드별', c2c: '판매자별', b2b: '공급사별' };
export const UNIT: Record<Mode, string> = { all: '개', b2c: '개', c2c: '개', b2b: '개' };

export type StatusGroup = '판매중' | '판매대기' | '품절' | '판매중지' | '판매종료';
export const STATUS_GROUPS: StatusGroup[] = ['판매중', '판매대기', '품절', '판매중지', '판매종료'];
export const STATUS_META: Record<StatusGroup, { bg: string; fg: string }> = {
  판매중: { bg: '#ecfdf5', fg: '#059669' },
  판매대기: { bg: '#eef2ff', fg: '#4338ca' },
  품절: { bg: '#fef2f2', fg: '#b91c1c' },
  판매중지: { bg: '#fff7ed', fg: '#c2410c' },
  판매종료: { bg: '#f4f4f5', fg: '#71717a' },
};

export interface DayRecord {
  date: string;
  newRegistrations: number;
  saleStarted: number;
  saleEnded: number;
  deleted: number;
  activeTotal: number;
}

function buildSeries(mode: Mode): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const factor = MODE_FACTOR[mode];
  const records: DayRecord[] = [];
  let cumulativeActive = Math.round(9200 * factor);
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.75 + (i / (totalDays - 1)) * 0.6;
    const weekday = dow === 0 || dow === 6 ? 0.6 : 1.08;
    const wiggle = 1 + Math.sin(i * 1.2) * 0.1 + Math.cos(i * 0.7) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const newRegistrations = Math.max(0, Math.round(19 * dayFactor));
    const saleStarted = Math.max(0, Math.round(newRegistrations * 0.86));
    const saleEnded = Math.max(0, Math.round(6 * dayFactor));
    const deleted = Math.max(0, Math.round(1.4 * dayFactor));
    cumulativeActive += newRegistrations - saleEnded - deleted;

    records.push({ date, newRegistrations, saleStarted, saleEnded, deleted, activeTotal: Math.max(0, cumulativeActive) });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export interface PeriodAggregate {
  totalRegistered: number;
  newRegistrations: number;
  saleStarted: number;
  saleEnded: number;
  deleted: number;
  netGrowth: number;
  activeNow: number;
  inactiveNow: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const series = seriesFor(mode);
  const rows = series.filter((r) => r.date >= start && r.date <= end);
  const sum = (key: keyof DayRecord) => rows.reduce((total, r) => total + (r[key] as number), 0);
  const newRegistrations = sum('newRegistrations');
  const saleStarted = sum('saleStarted');
  const saleEnded = sum('saleEnded');
  const deleted = sum('deleted');
  const activeNow = series[series.length - 1]?.activeTotal ?? 0;
  const totalRegistered = Math.round(activeNow * 1.18);
  const inactiveNow = Math.max(0, totalRegistered - activeNow);
  return {
    totalRegistered,
    newRegistrations,
    saleStarted,
    saleEnded,
    deleted,
    netGrowth: newRegistrations - saleEnded - deleted,
    activeNow,
    inactiveNow,
  };
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export interface SellerMetrics {
  sellerCount: number;
  avgPerSeller: number;
  saleConversionRate: number;
}

export function sellerMetrics(agg: PeriodAggregate): SellerMetrics {
  const sellerCount = Math.max(1, Math.round(agg.newRegistrations / 4.2));
  const avgPerSeller = sellerCount ? agg.newRegistrations / sellerCount : 0;
  const saleConversionRate = agg.newRegistrations ? (agg.saleStarted / agg.newRegistrations) * 100 : 0;
  return { sellerCount, avgPerSeller, saleConversionRate };
}

export interface CompositionItem { label: string; count: number; pct: number; }

const STATUS_WEIGHTS: Record<StatusGroup, number> = { 판매중: 0.656, 판매대기: 0.124, 품절: 0.082, 판매중지: 0.068, 판매종료: 0.07 };
export function statusComposition(agg: PeriodAggregate): CompositionItem[] {
  return STATUS_GROUPS.map((label) => ({ label, count: Math.round(agg.totalRegistered * STATUS_WEIGHTS[label]), pct: STATUS_WEIGHTS[label] * 100 }));
}

export function registrationComposition(agg: PeriodAggregate): CompositionItem[] {
  const items = [
    { label: '신규 등록', count: agg.newRegistrations },
    { label: '재판매', count: Math.round(agg.newRegistrations * 0.17) },
    { label: '판매 종료', count: agg.saleEnded },
    { label: '삭제', count: agg.deleted },
  ];
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return items.map((i) => ({ ...i, pct: (i.count / total) * 100 }));
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  totalProducts: number;
  newRegistrations: number;
  activeProducts: number;
  endedProducts: number;
  prevNewRegistrations: number;
}

const CATEGORY_WEIGHTS_BASE = [0.24, 0.19, 0.16, 0.13, 0.11, 0.09, 0.05, 0.03];

function categoriesFromProducts(): string[] {
  return [...new Set(PRODUCTS.map((p) => p.category))];
}
function brandsFromProducts(): { code: string; name: string }[] {
  const seen = new Map<string, string>();
  PRODUCTS.forEach((p) => { if (!seen.has(p.brandCode)) seen.set(p.brandCode, p.brandName); });
  return [...seen.entries()].map(([code, name]) => ({ code, name }));
}

export function categoryRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  const categories = categoriesFromProducts();
  const weights = categories.map((_, i) => CATEGORY_WEIGHTS_BASE[i] ?? 0.03);
  const weightSum = weights.reduce((s, w) => s + w, 0) || 1;
  return categories.map((category, index) => {
    const share = (weights[index] ?? 0.03) / weightSum;
    const totalProducts = Math.round(agg.totalRegistered * share);
    const newRegistrations = Math.round(agg.newRegistrations * share);
    const endedProducts = Math.round(agg.saleEnded * share);
    const activeProducts = Math.round(totalProducts * (0.6 + (index % 3) * 0.05));
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: `${totalProducts.toLocaleString('ko-KR')}개 중 판매중 ${activeProducts.toLocaleString('ko-KR')}개`,
      totalProducts,
      newRegistrations,
      activeProducts,
      endedProducts,
      prevNewRegistrations: Math.round(newRegistrations / (1 + (0.18 - index * 0.05))),
    };
  }).sort((a, b) => b.totalProducts - a.totalProducts);
}

const SELLER_NAMES = ['판매자 01', '판매자 02', '판매자 03', '판매자 04', '판매자 05'];
const SUPPLIER_NAMES = ['워크핏 공급사', '키웍스', '페이퍼온', '클라우드원', '오피스픽'];

export function secondDimensionRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  if (mode === 'c2c') {
    const weights = [0.28, 0.24, 0.19, 0.16, 0.13];
    return SELLER_NAMES.map((name, index) => {
      const totalProducts = Math.round(agg.totalRegistered * 0.12 * weights[index]);
      const newRegistrations = Math.round(agg.newRegistrations * 0.12 * weights[index] * 4);
      const activeProducts = Math.round(totalProducts * 0.58);
      return {
        id: `seller-${name}`,
        name,
        subtitle: '판매자',
        totalProducts,
        newRegistrations,
        activeProducts,
        endedProducts: Math.max(0, totalProducts - activeProducts),
        prevNewRegistrations: Math.round(newRegistrations / (1 + (0.2 - index * 0.04))),
      };
    }).sort((a, b) => b.totalProducts - a.totalProducts);
  }
  if (mode === 'b2b') {
    const weights = [0.3, 0.24, 0.19, 0.15, 0.12];
    return SUPPLIER_NAMES.map((name, index) => {
      const totalProducts = Math.round(agg.totalRegistered * weights[index]);
      const newRegistrations = Math.round(agg.newRegistrations * weights[index]);
      const activeProducts = Math.round(totalProducts * 0.78);
      return {
        id: `supplier-${name}`,
        name,
        subtitle: '공급사',
        totalProducts,
        newRegistrations,
        activeProducts,
        endedProducts: Math.max(0, totalProducts - activeProducts),
        prevNewRegistrations: Math.round(newRegistrations / (1 + (0.15 - index * 0.03))),
      };
    }).sort((a, b) => b.totalProducts - a.totalProducts);
  }
  const brands = brandsFromProducts();
  const weights = [0.34, 0.26, 0.2, 0.12, 0.08];
  return brands.map((brand, index) => {
    const w = weights[index] ?? 0.05;
    const totalProducts = Math.round(agg.totalRegistered * w);
    const newRegistrations = Math.round(agg.newRegistrations * w);
    const activeProducts = Math.round(totalProducts * 0.64);
    return {
      id: `brand-${brand.code}`,
      name: brand.name,
      subtitle: '브랜드',
      totalProducts,
      newRegistrations,
      activeProducts,
      endedProducts: Math.max(0, totalProducts - activeProducts),
      prevNewRegistrations: Math.round(newRegistrations / (1 + (0.16 - index * 0.03))),
    };
  }).sort((a, b) => b.totalProducts - a.totalProducts);
}

export function statusRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const agg = aggregate(mode, start, end);
  return STATUS_GROUPS.map((status) => {
    const totalProducts = Math.round(agg.totalRegistered * STATUS_WEIGHTS[status]);
    return {
      id: `status-${status}`,
      name: status,
      subtitle: STATUS_META[status] ? '상품 상태' : '',
      totalProducts,
      newRegistrations: status === '판매중' ? agg.newRegistrations : Math.round(agg.newRegistrations * 0.04),
      activeProducts: status === '판매중' ? totalProducts : 0,
      endedProducts: status === '판매종료' ? totalProducts : 0,
      prevNewRegistrations: Math.round(totalProducts * 0.94),
    };
  });
}
