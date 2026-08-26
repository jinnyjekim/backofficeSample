import { PRODUCTS } from '../products/productsData';

export const TODAY = '2026-08-25';
const SERIES_START = '2026-01-01';

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
export function dayOfWeek(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay(); // 0=Sun
}
export function fmtDate(date: string): string {
  return date.replace(/-/g, '.');
}
export function fmtDateShort(date: string): string {
  return date.slice(5).replace('-', '.');
}

export interface DayRecord {
  date: string;
  orderCount: number;
  orderAmount: number;
  cancelCount: number;
  paymentAttempt: number;
  paymentSuccess: number;
  paymentFail: number;
  paymentAmount: number;
  refundCount: number;
  refundFullCount: number;
  refundPartialCount: number;
  refundAmount: number;
  refundFailCount: number;
  settlementTarget: number;
  settlementDeduction: number;
  settlementAdjustment: number;
  settlementFinal: number;
}

function buildSeries(): DayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const records: DayRecord[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.82 + (i / (totalDays - 1)) * 0.36; // slow growth over the year
    const weekday = dow === 0 || dow === 6 ? 0.62 : 1.06;
    const wiggle = 1 + Math.sin(i * 1.7) * 0.07 + Math.cos(i * 0.85) * 0.04;
    const dayFactor = trend * weekday * wiggle;

    const orderCount = Math.max(0, Math.round(480 * dayFactor));
    const avgOrderValue = 62000 + Math.sin(i * 0.5) * 5500 + Math.cos(i * 0.23) * 2200;
    const orderAmount = Math.round(orderCount * avgOrderValue);

    const cancelRate = 0.028 + (Math.sin(i * 0.6) + 1) * 0.006; // ~2.8%~4%
    const cancelCount = Math.round(orderCount * cancelRate);

    const successRate = 0.975 + Math.sin(i * 1.1) * 0.008; // ~96.7%~98.3%
    const paymentSuccess = orderCount;
    const paymentAttempt = Math.round(paymentSuccess / successRate);
    const paymentFail = Math.max(0, paymentAttempt - paymentSuccess);
    const paymentAmount = orderAmount;

    const refundRateCount = 0.036 + (Math.sin(i * 0.7) + 1) * 0.007; // ~3.6%~5%
    const refundCount = Math.round(paymentSuccess * refundRateCount);
    const refundFullCount = Math.round(refundCount * 0.62);
    const refundPartialCount = refundCount - refundFullCount;
    const refundAmount = Math.round(refundFullCount * avgOrderValue * 0.92 + refundPartialCount * avgOrderValue * 0.36);
    const refundFailCount = i % 11 === 0 ? 1 : 0;

    const settlementTarget = paymentAmount - refundAmount;
    const settlementDeduction = Math.round(settlementTarget * 0.082);
    const settlementAdjustment = Math.round(Math.sin(i * 2.1) * settlementTarget * 0.004);
    const settlementFinal = settlementTarget - settlementDeduction + settlementAdjustment;

    records.push({
      date, orderCount, orderAmount, cancelCount,
      paymentAttempt, paymentSuccess, paymentFail, paymentAmount,
      refundCount, refundFullCount, refundPartialCount, refundAmount, refundFailCount,
      settlementTarget, settlementDeduction, settlementAdjustment, settlementFinal,
    });
  }
  return records;
}

export const DAILY_SERIES: DayRecord[] = buildSeries();

export function seriesInRange(start: string, end: string): DayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface PeriodAggregate {
  start: string;
  end: string;
  days: number;
  orderCount: number;
  orderAmount: number;
  cancelCount: number;
  paymentAttempt: number;
  paymentSuccess: number;
  paymentFail: number;
  paymentAmount: number;
  refundCount: number;
  refundFullCount: number;
  refundPartialCount: number;
  refundAmount: number;
  refundFailCount: number;
  settlementTarget: number;
  settlementDeduction: number;
  settlementAdjustment: number;
  settlementFinal: number;
  netAmount: number;
  avgOrderValue: number;
  paymentSuccessRate: number;
  refundRateByCount: number;
  refundRateByAmount: number;
  cancelRate: number;
}

export function aggregate(start: string, end: string): PeriodAggregate {
  const rows = seriesInRange(start, end);
  const sum = (key: keyof DayRecord) => rows.reduce((s, r) => s + (r[key] as number), 0);

  const orderCount = sum('orderCount');
  const orderAmount = sum('orderAmount');
  const paymentSuccess = sum('paymentSuccess');
  const paymentAmount = sum('paymentAmount');
  const refundAmount = sum('refundAmount');
  const paymentAttempt = sum('paymentAttempt');

  return {
    start, end, days: rows.length,
    orderCount, orderAmount, cancelCount: sum('cancelCount'),
    paymentAttempt, paymentSuccess, paymentFail: sum('paymentFail'), paymentAmount,
    refundCount: sum('refundCount'), refundFullCount: sum('refundFullCount'), refundPartialCount: sum('refundPartialCount'),
    refundAmount, refundFailCount: sum('refundFailCount'),
    settlementTarget: sum('settlementTarget'), settlementDeduction: sum('settlementDeduction'),
    settlementAdjustment: sum('settlementAdjustment'), settlementFinal: sum('settlementFinal'),
    netAmount: paymentAmount - refundAmount,
    avgOrderValue: orderCount ? Math.round(orderAmount / orderCount) : 0,
    paymentSuccessRate: paymentAttempt ? (paymentSuccess / paymentAttempt) * 100 : 0,
    refundRateByCount: paymentSuccess ? (sum('refundCount') / paymentSuccess) * 100 : 0,
    refundRateByAmount: paymentAmount ? (refundAmount / paymentAmount) * 100 : 0,
    cancelRate: orderCount ? (sum('cancelCount') / orderCount) * 100 : 0,
  };
}

export function previousPeriod(start: string, end: string): [string, string] {
  const len = daysBetween(start, end) + 1;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(len - 1));
  return [prevStart, prevEnd];
}

export function delta(current: number, previous: number): { pct: number; abs: number; hasPrevious: boolean } {
  if (previous === 0) return { pct: current === 0 ? 0 : 100, abs: current, hasPrevious: previous !== 0 };
  return { pct: ((current - previous) / previous) * 100, abs: current - previous, hasPrevious: true };
}

export type Granularity = '일별' | '주별' | '월별';

export interface Bucket {
  label: string;
  start: string;
  end: string;
  orderAmount: number;
  paymentAmount: number;
  refundAmount: number;
  netAmount: number;
  orderCount: number;
}

export function bucketSeries(start: string, end: string, granularity: Granularity): Bucket[] {
  const rows = seriesInRange(start, end);
  if (granularity === '일별') {
    return rows.map((r) => ({
      label: fmtDateShort(r.date), start: r.date, end: r.date,
      orderAmount: r.orderAmount, paymentAmount: r.paymentAmount, refundAmount: r.refundAmount,
      netAmount: r.paymentAmount - r.refundAmount, orderCount: r.orderCount,
    }));
  }
  const buckets: Bucket[] = [];

  if (granularity === '월별') {
    // group by actual calendar month, not a fixed 30-day window, so ranges that don't start on the 1st still label correctly
    let cursor = start;
    while (cursor <= end) {
      const monthEndOfCursor = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(monthEndOfCursor, -1) > end ? end : addDays(monthEndOfCursor, -1);
      const agg = aggregate(cursor, bucketEnd);
      buckets.push({
        label: cursor.slice(0, 7),
        start: cursor, end: bucketEnd,
        orderAmount: agg.orderAmount, paymentAmount: agg.paymentAmount, refundAmount: agg.refundAmount,
        netAmount: agg.netAmount, orderCount: agg.orderCount,
      });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }

  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd);
    buckets.push({
      label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`,
      start: cursor, end: bucketEnd,
      orderAmount: agg.orderAmount, paymentAmount: agg.paymentAmount, refundAmount: agg.refundAmount,
      netAmount: agg.netAmount, orderCount: agg.orderCount,
    });
    cursor = addDays(bucketEnd, 1);
  }
  return buckets;
}

// ---- Entity breakdown (distributed from period totals via fixed weights) ----

export const COMPANIES = ['회사 01', '회사 02', '회사 03', '회사 04', '회사 05'];
const COMPANY_WEIGHTS = [0.3, 0.24, 0.19, 0.15, 0.12];

export const PAYMENT_METHOD_NAMES = ['신용카드', '계좌이체', '가상계좌', '포인트'];
const PAYMENT_METHOD_WEIGHTS = [0.65, 0.19, 0.12, 0.04];

export const REFUND_REASON_NAMES = ['고객 변심', '상품 불량', '배송 오류', '오배송', '결제 오류', '기타'];
const REFUND_REASON_WEIGHTS = [0.38, 0.24, 0.16, 0.1, 0.06, 0.06];

const PRODUCT_WEIGHTS = [0.28, 0.23, 0.2, 0.16, 0.13];

export interface WeightedRow {
  name: string;
  amount: number;
  count: number;
  share: number;
}

function distribute(names: string[], weights: number[], totalAmount: number, totalCount: number): WeightedRow[] {
  const rows = names.map((name, i) => {
    const jitter = 1 + Math.sin(i * 3.1 + totalAmount * 1e-9) * 0.03;
    return { name, weight: weights[i] * jitter };
  });
  const weightSum = rows.reduce((s, r) => s + r.weight, 0);
  const result: WeightedRow[] = rows.map((r) => ({
    name: r.name,
    amount: Math.round((r.weight / weightSum) * totalAmount),
    count: Math.round((r.weight / weightSum) * totalCount),
    share: (r.weight / weightSum) * 100,
  }));
  // fix rounding drift on the largest entity so amounts sum exactly to the period total
  const amountDrift = totalAmount - result.reduce((s, r) => s + r.amount, 0);
  const countDrift = totalCount - result.reduce((s, r) => s + r.count, 0);
  const largest = result.reduce((best, r, i) => (r.amount > result[best].amount ? i : best), 0);
  result[largest].amount += amountDrift;
  result[largest].count += countDrift;
  return result.sort((a, b) => b.amount - a.amount);
}

export function companyBreakdown(agg: PeriodAggregate): WeightedRow[] {
  return distribute(COMPANIES, COMPANY_WEIGHTS, agg.orderAmount, agg.orderCount);
}
export function productBreakdown(agg: PeriodAggregate): WeightedRow[] {
  const names = PRODUCTS.slice(0, 5).map((p) => p.name);
  return distribute(names, PRODUCT_WEIGHTS, agg.orderAmount, agg.orderCount);
}
export function paymentMethodBreakdown(agg: PeriodAggregate): WeightedRow[] {
  return distribute(PAYMENT_METHOD_NAMES, PAYMENT_METHOD_WEIGHTS, agg.paymentAmount, agg.paymentSuccess);
}
export function refundReasonBreakdown(agg: PeriodAggregate): WeightedRow[] {
  return distribute(REFUND_REASON_NAMES, REFUND_REASON_WEIGHTS, agg.refundAmount, agg.refundCount);
}

export interface OrderStatusRow {
  label: string;
  count: number;
}
export function orderStatusBreakdown(agg: PeriodAggregate): OrderStatusRow[] {
  const active = agg.orderCount - agg.cancelCount;
  const weights: [string, number][] = [
    ['결제 대기', 0.015],
    ['결제 완료', 0.67],
    ['배송 준비', 0.1],
    ['배송중', 0.067],
    ['완료', 0.148],
  ];
  const wSum = weights.reduce((s, [, w]) => s + w, 0);
  const rows = weights.map(([label, w]) => ({ label, count: Math.round((w / wSum) * active) }));
  const drift = active - rows.reduce((s, r) => s + r.count, 0);
  rows[1].count += drift;
  rows.push({ label: '취소', count: agg.cancelCount });
  return rows;
}

export interface SettlementStatusRow {
  label: string;
  amount: number;
  count: number;
}
export function settlementStatusBreakdown(start: string, end: string): { statusRows: SettlementStatusRow[]; payoutRows: SettlementStatusRow[] } {
  const rows = seriesInRange(start, end);
  let pending = { amount: 0, count: 0 };
  let review = { amount: 0, count: 0 };
  let confirmed = { amount: 0, count: 0 };
  rows.forEach((r) => {
    const lag = daysBetween(r.date, TODAY);
    const bucket = lag <= 2 ? pending : lag <= 5 ? review : confirmed;
    bucket.amount += r.settlementFinal;
    bucket.count += 1;
  });
  const payoutDone = { label: '지급 완료', amount: Math.round(confirmed.amount * 0.92), count: Math.round(confirmed.count * 0.92) };
  const payoutSoon = { label: '지급 예정', amount: confirmed.amount - payoutDone.amount, count: confirmed.count - payoutDone.count };
  return {
    statusRows: [
      { label: '정산 대기', amount: pending.amount, count: pending.count },
      { label: '검토중', amount: review.amount, count: review.count },
      { label: '확정', amount: confirmed.amount, count: confirmed.count },
    ],
    payoutRows: [payoutDone, payoutSoon],
  };
}

export function companySettlementBreakdown(agg: PeriodAggregate): { name: string; amount: number; deduction: number; final: number; payoutStatus: string }[] {
  const rows = distribute(COMPANIES, COMPANY_WEIGHTS, agg.settlementTarget, 0);
  return rows.map((r, i) => {
    const deduction = Math.round(r.amount * 0.082);
    return { name: r.name, amount: r.amount, deduction, final: r.amount - deduction, payoutStatus: i % 3 === 1 ? '지급 예정' : '지급 완료' };
  });
}

// ---- Formatting ----

export function fmtWon(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}원`;
}
export function fmtCount(n: number): string {
  return `${Math.round(n).toLocaleString('ko-KR')}건`;
}
export function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
export function fmtSignedPct(n: number, digits = 1): string {
  if (Math.abs(n) < 0.05) return '0.0%';
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(digits)}%`;
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
