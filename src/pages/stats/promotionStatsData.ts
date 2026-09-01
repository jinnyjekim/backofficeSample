import { PRODUCTS } from '../products/productsData';
import { PROMOTIONS } from '../promotions/promotionsData';
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
const MODE_FACTOR: Record<Mode, number> = { all: 1, b2c: 0.58, c2c: 0.17, b2b: 0.25 };

export const REVENUE_LABEL: Record<Mode, string> = { all: '프로모션 매출', b2c: '프로모션 매출', c2c: '프로모션 거래액', b2b: '프로모션 주문금액' };
export const ORDER_LABEL: Record<Mode, string> = { all: '프로모션 주문', b2c: '프로모션 주문', c2c: '프로모션 거래', b2b: '프로모션 주문' };

export type PromotionType = '쿠폰' | '상품 할인' | '무료배송' | '포인트';
export const PROMOTION_TYPES: PromotionType[] = ['쿠폰', '상품 할인', '무료배송', '포인트'];
export const TYPE_META: Record<PromotionType, { bg: string; fg: string }> = {
  '쿠폰': { bg: '#eef2ff', fg: '#4338ca' },
  '상품 할인': { bg: '#ecfdf5', fg: '#059669' },
  '무료배송': { bg: '#fff7ed', fg: '#c2410c' },
  '포인트': { bg: '#f5f3ff', fg: '#7c3aed' },
};

export interface DayRecord {
  date: string;
  totalOrders: number;
  totalRevenue: number;
  promoOrders: number;
  grossAmount: number;
  discountCost: number;
  netRevenue: number;
}

function buildSeries(mode: Mode): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const factor = MODE_FACTOR[mode];
  const records: DayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.8 + (i / (totalDays - 1)) * 0.5;
    const weekday = dow === 0 || dow === 6 ? 0.72 : 1.05;
    const wiggle = 1 + Math.sin(i * 1.4) * 0.08 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle * factor;

    const totalOrders = Math.max(0, Math.round(520 * dayFactor));
    const avgOrderValue = 58000 + Math.sin(i * 0.4) * 4500;
    const totalRevenue = Math.round(totalOrders * avgOrderValue);

    const promoShare = 0.32 + (Math.sin(i * 0.5) + 1) * 0.05; // ~32%~42%
    const promoOrders = Math.round(totalOrders * promoShare);
    const promoAvgOrderValue = avgOrderValue * 1.08;
    const grossAmount = Math.round(promoOrders * promoAvgOrderValue);
    const discountRate = 0.095 + (Math.cos(i * 0.33) + 1) * 0.012; // ~9.5%~13.9%
    const discountCost = Math.round(grossAmount * discountRate);
    const netRevenue = grossAmount - discountCost;

    records.push({ date, totalOrders, totalRevenue, promoOrders, grossAmount, discountCost, netRevenue });
  }
  return records;
}

const SERIES_CACHE = new Map<Mode, DayRecord[]>();
function seriesFor(mode: Mode): DayRecord[] {
  if (!SERIES_CACHE.has(mode)) SERIES_CACHE.set(mode, buildSeries(mode));
  return SERIES_CACHE.get(mode)!;
}

export interface PeriodAggregate {
  totalOrders: number;
  totalRevenue: number;
  promoOrders: number;
  grossAmount: number;
  discountCost: number;
  netRevenue: number;
  avgOrderValue: number;
  nonPromoAvgOrderValue: number;
}

export function aggregate(mode: Mode, start: string, end: string): PeriodAggregate {
  const rows = seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
  const sum = (key: keyof DayRecord) => rows.reduce((total, r) => total + (r[key] as number), 0);
  const totalOrders = sum('totalOrders');
  const totalRevenue = sum('totalRevenue');
  const promoOrders = sum('promoOrders');
  const grossAmount = sum('grossAmount');
  const discountCost = sum('discountCost');
  const netRevenue = sum('netRevenue');
  const nonPromoOrders = Math.max(1, totalOrders - promoOrders);
  const nonPromoRevenue = Math.max(0, totalRevenue - grossAmount);
  return {
    totalOrders,
    totalRevenue,
    promoOrders,
    grossAmount,
    discountCost,
    netRevenue,
    avgOrderValue: promoOrders ? Math.round(grossAmount / promoOrders) : 0,
    nonPromoAvgOrderValue: Math.round(nonPromoRevenue / nonPromoOrders),
  };
}

export function trendSeries(mode: Mode, start: string, end: string): DayRecord[] {
  return seriesFor(mode).filter((r) => r.date >= start && r.date <= end);
}

export interface PromotionRow {
  id: string;
  code: string;
  name: string;
  type: PromotionType;
  period: string;
  target: string;
  orders: number;
  grossAmount: number;
  discountCost: number;
  netRevenue: number;
  avgOrderValue: number;
  refundRate: number;
  prevNetRevenue: number;
}

interface PromotionSeed {
  name: string;
  type: PromotionType;
  weight: number;
  refundRate: number;
  changeRate: number;
}

const PROMOTION_SEEDS: PromotionSeed[] = [
  { name: '여름 할인 프로모션', type: '상품 할인', weight: 0.22, refundRate: 0.038, changeRate: 0.128 },
  { name: '신규가입 쿠폰팩', type: '쿠폰', weight: 0.18, refundRate: 0.022, changeRate: 0.064 },
  { name: '전상품 무료배송', type: '무료배송', weight: 0.15, refundRate: 0.045, changeRate: -0.032 },
  { name: '리뷰 작성 포인트 적립', type: '포인트', weight: 0.09, refundRate: 0.018, changeRate: 0.041 },
  { name: '주말 특가 쿠폰', type: '쿠폰', weight: 0.13, refundRate: 0.052, changeRate: 0.095 },
  { name: '카테고리 위크 할인', type: '상품 할인', weight: 0.1, refundRate: 0.061, changeRate: -0.018 },
  { name: '재구매 감사 포인트', type: '포인트', weight: 0.07, refundRate: 0.014, changeRate: 0.072 },
  { name: '무료배송 첫구매', type: '무료배송', weight: 0.06, refundRate: 0.181, changeRate: -0.24 },
];

function codeFor(name: string, index: number): string {
  const match = PROMOTIONS.find((p) => p.name === name);
  return match?.code ?? `PROMO-STAT-${String(index + 1).padStart(3, '0')}`;
}

export function promotionRows(mode: Mode, start: string, end: string): PromotionRow[] {
  const period = aggregate(mode, start, end);
  const periodDays = Math.max(1, daysBetween(start, end) + 1);
  const scale = periodDays / 30;
  return PROMOTION_SEEDS.map((seed, index) => {
    const grossAmount = Math.round(period.grossAmount * seed.weight * (0.85 + scale * 0.15) / PROMOTION_SEEDS.reduce((s, x) => s + x.weight, 0));
    const baseRate = seed.type === '무료배송' ? 0.028 : seed.type === '포인트' ? 0.052 : 0.12;
    const discountRate = baseRate * (0.82 + (index % 4) * 0.11);
    const discountCost = Math.round(grossAmount * discountRate);
    const netRevenue = grossAmount - discountCost;
    const orders = Math.max(1, Math.round((netRevenue / 58000) * (seed.type === '무료배송' ? 1.15 : 1)));
    return {
      id: `promo-${index}`,
      code: codeFor(seed.name, index),
      name: seed.name,
      type: seed.type,
      period: `${start.slice(5)} ~ ${end.slice(5)}`,
      target: seed.type === '무료배송' ? '전체 주문' : seed.type === '포인트' ? '리뷰 작성 회원' : '전체 상품',
      orders,
      grossAmount,
      discountCost,
      netRevenue,
      avgOrderValue: orders ? Math.round(grossAmount / orders) : 0,
      refundRate: seed.refundRate,
      prevNetRevenue: Math.round(netRevenue / (1 + seed.changeRate)),
    };
  }).sort((a, b) => b.netRevenue - a.netRevenue);
}

export function typeBreakdown(rows: PromotionRow[]) {
  return PROMOTION_TYPES.map((type) => {
    const matched = rows.filter((r) => r.type === type);
    const netRevenue = matched.reduce((s, r) => s + r.netRevenue, 0);
    const discountCost = matched.reduce((s, r) => s + r.discountCost, 0);
    const orders = matched.reduce((s, r) => s + r.orders, 0);
    return { type, netRevenue, discountCost, orders, efficiency: discountCost ? netRevenue / discountCost : 0 };
  }).filter((row) => row.netRevenue > 0).sort((a, b) => b.netRevenue - a.netRevenue);
}

export interface DimensionRow {
  id: string;
  name: string;
  subtitle: string;
  orders: number;
  grossAmount: number;
  discountCost: number;
  netRevenue: number;
  avgOrderValue: number;
  refundRate: number;
  prevNetRevenue: number;
}

const PRODUCT_SAMPLE = PRODUCTS.slice(0, 8);

export function productRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const promoTotal = promotionRows(mode, start, end).reduce((s, r) => s + r.netRevenue, 0);
  const weights = [0.24, 0.18, 0.15, 0.12, 0.11, 0.09, 0.07, 0.04];
  return PRODUCT_SAMPLE.map((product, index) => {
    const netRevenue = Math.round(promoTotal * (weights[index] ?? 0.03));
    const discountCost = Math.round(netRevenue * (0.1 + (index % 3) * 0.02));
    const grossAmount = netRevenue + discountCost;
    const orders = Math.max(1, Math.round(netRevenue / (product.price || 45000)));
    return {
      id: product.code,
      name: product.name,
      subtitle: `${product.code} · ${product.category}`,
      orders,
      grossAmount,
      discountCost,
      netRevenue,
      avgOrderValue: orders ? Math.round(grossAmount / orders) : 0,
      refundRate: 0.02 + (index % 4) * 0.015,
      prevNetRevenue: Math.round(netRevenue / (1 + (0.18 - index * 0.03))),
    };
  }).sort((a, b) => b.netRevenue - a.netRevenue);
}

export function categoryRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const products = productRows(mode, start, end);
  const categories = [...new Set(PRODUCT_SAMPLE.map((p) => p.category))];
  return categories.map((category) => {
    const codes = new Set(PRODUCT_SAMPLE.filter((p) => p.category === category).map((p) => p.code));
    const matched = products.filter((r) => codes.has(r.id));
    const netRevenue = matched.reduce((s, r) => s + r.netRevenue, 0);
    const discountCost = matched.reduce((s, r) => s + r.discountCost, 0);
    const orders = matched.reduce((s, r) => s + r.orders, 0);
    const prevNetRevenue = matched.reduce((s, r) => s + r.prevNetRevenue, 0);
    return {
      id: `cat-${category}`,
      name: category,
      subtitle: `${matched.length}개 상품`,
      orders,
      grossAmount: netRevenue + discountCost,
      discountCost,
      netRevenue,
      avgOrderValue: orders ? Math.round((netRevenue + discountCost) / orders) : 0,
      refundRate: matched.length ? matched.reduce((s, r) => s + r.refundRate, 0) / matched.length : 0,
      prevNetRevenue,
    };
  }).filter((row) => row.netRevenue > 0).sort((a, b) => b.netRevenue - a.netRevenue);
}

export const AUDIENCE_DIMENSION: Record<Mode, string> = { all: '고객/거래처별', b2c: '회원 등급별', c2c: '판매자별', b2b: '거래처별' };

export function audienceRows(mode: Mode, start: string, end: string): DimensionRow[] {
  const total = aggregate(mode, start, end);
  const groups = mode === 'c2c'
    ? ['판매자 01', '판매자 02', '판매자 03', '판매자 04']
    : mode === 'b2b'
      ? ['회사 01', '회사 02', '회사 03', '회사 04']
      : ['VIP', '골드', '실버', '일반'];
  const weights = [0.36, 0.27, 0.21, 0.16];
  return groups.map((name, index) => {
    const netRevenue = Math.round(total.netRevenue * weights[index]);
    const discountCost = Math.round(total.discountCost * weights[index]);
    const orders = Math.round(total.promoOrders * weights[index]);
    return {
      id: `aud-${name}`,
      name,
      subtitle: mode === 'b2c' || mode === 'all' ? '회원 등급' : mode === 'c2c' ? '판매자' : '거래처',
      orders,
      grossAmount: netRevenue + discountCost,
      discountCost,
      netRevenue,
      avgOrderValue: orders ? Math.round((netRevenue + discountCost) / orders) : 0,
      refundRate: 0.02 + index * 0.014,
      prevNetRevenue: Math.round(netRevenue / (1 + (0.14 - index * 0.04))),
    };
  });
}

export interface SummaryStat { label: string; value: string; }
export function summaryStats(mode: Mode, agg: PeriodAggregate, prevAgg: PeriodAggregate): SummaryStat[] {
  const revenueGrowth = prevAgg.netRevenue ? delta(agg.netRevenue, prevAgg.netRevenue).pct : 0;
  return [
    { label: '매출 증가 기여', value: fmtSignedPct(revenueGrowth) },
    { label: '전환율', value: fmtSignedPct(mode === 'c2c' ? 2.4 : mode === 'b2b' ? 1.8 : 3.1) },
    { label: '평균 할인율', value: fmtPct(agg.grossAmount ? (agg.discountCost / agg.grossAmount) * 100 : 0) },
    { label: mode === 'c2c' ? '재거래율' : '재구매율', value: fmtPct(mode === 'b2b' ? 41.2 : mode === 'c2c' ? 27.6 : 32.1) },
  ];
}

export function fmtEfficiency(n: number): string {
  return `${n.toFixed(1)}배`;
}
export function fmtDiscountRate(gross: number, cost: number): string {
  return fmtPct(gross ? (cost / gross) * 100 : 0);
}
