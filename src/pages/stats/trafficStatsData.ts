import { addDays, daysBetween, dayOfWeek, fmtDateShort } from './transactionStatsData';
import { DAILY_SERIES as TX_SERIES } from './transactionStatsData';
import { DAILY_SERIES as MEMBER_SERIES } from './memberStatsData';

export const TODAY = '2026-08-25';
const SERIES_START = '2026-01-01';

export interface TrafficDayRecord {
  date: string;
  visitors: number;
  sessions: number;
  newVisitors: number;
  inquiries: number;
}

function buildSeries(): TrafficDayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const rows: TrafficDayRecord[] = [];
  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.82 + (i / (totalDays - 1)) * 0.34;
    const weekday = dow === 0 || dow === 6 ? 0.66 : 1.06;
    const wiggle = 1 + Math.sin(i * 1.3) * 0.09 + Math.cos(i * 0.65) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const visitors = Math.max(1, Math.round(3420 * dayFactor));
    const sessionMult = 1.42 + Math.sin(i * 0.7) * 0.08;
    const sessions = Math.round(visitors * sessionMult);
    const newRatio = 0.58 + Math.sin(i * 0.9 + 0.4) * 0.05;
    const newVisitors = Math.round(visitors * newRatio);

    const inquiries = Math.max(0, Math.round(9 * dayFactor * (0.85 + Math.sin(i * 1.6) * 0.2)));

    rows.push({ date, visitors, sessions, newVisitors, inquiries });
  }
  return rows;
}

export const DAILY_SERIES: TrafficDayRecord[] = buildSeries();
export function seriesInRange(start: string, end: string): TrafficDayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}

export type ConversionGoal = '회원 가입' | '문의 등록' | '주문 완료' | '결제 완료';
export const CONVERSION_GOALS: ConversionGoal[] = ['회원 가입', '문의 등록', '주문 완료', '결제 완료'];

function conversionsInRange(goal: ConversionGoal, start: string, end: string): number {
  if (goal === '회원 가입') return MEMBER_SERIES.filter((r) => r.date >= start && r.date <= end).reduce((s, r) => s + r.newSignups, 0);
  if (goal === '주문 완료') return TX_SERIES.filter((r) => r.date >= start && r.date <= end).reduce((s, r) => s + r.orderCount, 0);
  if (goal === '결제 완료') return TX_SERIES.filter((r) => r.date >= start && r.date <= end).reduce((s, r) => s + r.paymentSuccess, 0);
  return seriesInRange(start, end).reduce((s, r) => s + r.inquiries, 0);
}

const FUNNEL_STEPS: Record<ConversionGoal, string[]> = {
  '회원 가입': ['방문', '가입 시작', '가입 완료'],
  '문의 등록': ['방문', '문의 페이지 진입', '문의 등록'],
  '주문 완료': ['방문', '상품 조회', '장바구니', '주문서 진입', '주문 완료'],
  '결제 완료': ['방문', '주문서 진입', '결제 시도', '결제 완료'],
};

export interface TrafficPeriodAggregate {
  start: string;
  end: string;
  days: number;
  visitors: number;
  sessions: number;
  newVisitors: number;
  returningVisitors: number;
  conversions: number;
  conversionUsers: number;
  conversionRate: number;
  goal: ConversionGoal;
}

export function aggregate(start: string, end: string, goal: ConversionGoal): TrafficPeriodAggregate {
  const rows = seriesInRange(start, end);
  const visitors = rows.reduce((s, r) => s + r.visitors, 0);
  const sessions = rows.reduce((s, r) => s + r.sessions, 0);
  const newVisitors = rows.reduce((s, r) => s + r.newVisitors, 0);
  const conversions = conversionsInRange(goal, start, end);
  const conversionUsers = Math.round(conversions * 0.94); // a small share of converting users convert more than once
  return {
    start, end, days: rows.length,
    visitors, sessions, newVisitors, returningVisitors: Math.max(0, visitors - newVisitors),
    conversions, conversionUsers,
    conversionRate: visitors ? (conversionUsers / visitors) * 100 : 0,
    goal,
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
export interface Bucket { label: string; start: string; end: string; visitors: number; sessions: number; conversions: number; conversionRate: number; }

export function bucketSeries(start: string, end: string, goal: ConversionGoal, granularity: Granularity): Bucket[] {
  const rows = seriesInRange(start, end);
  const withRate = (start2: string, end2: string, visitors: number) => {
    const conv = conversionsInRange(goal, start2, end2);
    return { conversions: conv, conversionRate: visitors ? (conv / visitors) * 100 : 0 };
  };
  if (granularity === '일별') {
    return rows.map((r) => ({ label: fmtDateShort(r.date), start: r.date, end: r.date, visitors: r.visitors, sessions: r.sessions, ...withRate(r.date, r.date, r.visitors) }));
  }
  const buckets: Bucket[] = [];
  if (granularity === '월별') {
    let cursor = start;
    while (cursor <= end) {
      const nextMonth = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(nextMonth, -1) > end ? end : addDays(nextMonth, -1);
      const agg = aggregate(cursor, bucketEnd, goal);
      buckets.push({ label: cursor.slice(0, 7), start: cursor, end: bucketEnd, visitors: agg.visitors, sessions: agg.sessions, conversions: agg.conversions, conversionRate: agg.visitors ? (agg.conversions / agg.visitors) * 100 : 0 });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }
  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd, goal);
    buckets.push({ label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`, start: cursor, end: bucketEnd, visitors: agg.visitors, sessions: agg.sessions, conversions: agg.conversions, conversionRate: agg.visitors ? (agg.conversions / agg.visitors) * 100 : 0 });
    cursor = addDays(bucketEnd, 1);
  }
  return buckets;
}

// ---- Channel / landing breakdown ----

export const CHANNELS = ['Organic Search', 'Direct', 'Paid Search', 'Referral', 'Social'];
const CHANNEL_VISITOR_WEIGHTS = [0.338, 0.228, 0.156, 0.111, 0.098, 0.069];
const CHANNEL_NAMES_WITH_ETC = [...CHANNELS, '기타'];
const CHANNEL_CONV_MULT = [1.05, 0.89, 1.42, 0.87, 0.59, 0.7]; // relative conversion efficiency per channel

const SOURCE_MEDIUM: Record<string, { source: string; medium: string }> = {
  'Organic Search': { source: 'google / naver', medium: 'organic' },
  Direct: { source: '(direct)', medium: '(none)' },
  'Paid Search': { source: 'google', medium: 'cpc' },
  Referral: { source: 'partner-site.com', medium: 'referral' },
  Social: { source: 'instagram', medium: 'social' },
  기타: { source: '기타', medium: '기타' },
};

export interface ChannelRow { name: string; source: string; medium: string; visitors: number; sessions: number; conversions: number; conversionRate: number; share: number; }

export function channelBreakdown(agg: TrafficPeriodAggregate): ChannelRow[] {
  const wSum = CHANNEL_VISITOR_WEIGHTS.reduce((s, w) => s + w, 0);
  const rows = CHANNEL_NAMES_WITH_ETC.map((name, i) => {
    const visitors = Math.round((CHANNEL_VISITOR_WEIGHTS[i] / wSum) * agg.visitors);
    return { name, visitors, weightIdx: i };
  });
  const visitorDrift = agg.visitors - rows.reduce((s, r) => s + r.visitors, 0);
  const largestV = rows.reduce((best, r, i) => (r.visitors > rows[best].visitors ? i : best), 0);
  rows[largestV].visitors += visitorDrift;

  const convWeights = rows.map((r) => r.visitors * CHANNEL_CONV_MULT[r.weightIdx]);
  const convSum = convWeights.reduce((s, w) => s + w, 0);
  const convRows = rows.map((r, i) => ({ ...r, conversions: Math.round((convWeights[i] / convSum) * agg.conversions) }));
  const convDrift = agg.conversions - convRows.reduce((s, r) => s + r.conversions, 0);
  const largestC = convRows.reduce((best, r, i) => (r.conversions > convRows[best].conversions ? i : best), 0);
  convRows[largestC].conversions += convDrift;

  return convRows.map((r) => ({
    name: r.name,
    source: SOURCE_MEDIUM[r.name].source,
    medium: SOURCE_MEDIUM[r.name].medium,
    visitors: r.visitors,
    sessions: Math.round(r.visitors * (agg.sessions / Math.max(1, agg.visitors))),
    conversions: r.conversions,
    conversionRate: r.visitors ? (r.conversions / r.visitors) * 100 : 0,
    share: agg.visitors ? (r.visitors / agg.visitors) * 100 : 0,
  })).sort((a, b) => b.visitors - a.visitors);
}

export const LANDING_PAGES = ['/', '/products', '/pricing', '/content', '/signup'];
const LANDING_WEIGHTS = [0.34, 0.24, 0.18, 0.14, 0.1];
const LANDING_CONV_MULT = [0.62, 1.18, 1.55, 0.71, 2.4];

export interface LandingRow { page: string; sessions: number; visitors: number; conversions: number; conversionRate: number; share: number; }

export function landingBreakdown(agg: TrafficPeriodAggregate): LandingRow[] {
  const wSum = LANDING_WEIGHTS.reduce((s, w) => s + w, 0);
  const rows = LANDING_PAGES.map((page, i) => {
    const sessions = Math.round((LANDING_WEIGHTS[i] / wSum) * agg.sessions);
    return { page, sessions, idx: i };
  });
  const drift = agg.sessions - rows.reduce((s, r) => s + r.sessions, 0);
  const largest = rows.reduce((best, r, i) => (r.sessions > rows[best].sessions ? i : best), 0);
  rows[largest].sessions += drift;

  const convWeights = rows.map((r) => r.sessions * LANDING_CONV_MULT[r.idx]);
  const convSum = convWeights.reduce((s, w) => s + w, 0);
  const convRows = rows.map((r, i) => ({ ...r, conversions: Math.round((convWeights[i] / convSum) * agg.conversions) }));
  const convDrift = agg.conversions - convRows.reduce((s, r) => s + r.conversions, 0);
  const largestC = convRows.reduce((best, r, i) => (r.conversions > convRows[best].conversions ? i : best), 0);
  convRows[largestC].conversions += convDrift;

  return convRows.map((r) => ({
    page: r.page,
    sessions: r.sessions,
    visitors: Math.round(r.sessions / Math.max(1, agg.sessions / Math.max(1, agg.visitors))),
    conversions: r.conversions,
    conversionRate: r.sessions ? (r.conversions / r.sessions) * 100 : 0,
    share: agg.sessions ? (r.sessions / agg.sessions) * 100 : 0,
  })).sort((a, b) => b.sessions - a.sessions);
}

// ---- Funnel ----

export interface FunnelStep { label: string; count: number; pctOfFirst: number; pctOfPrev: number | null; }

export function computeFunnel(agg: TrafficPeriodAggregate): FunnelStep[] {
  const labels = FUNNEL_STEPS[agg.goal];
  const steps = labels.length;
  const first = agg.visitors;
  const last = agg.conversions;
  const ratio = first > 0 && last > 0 ? Math.pow(last / first, 1 / (steps - 1)) : 0;

  const counts = labels.map((_, i) => {
    if (i === 0) return first;
    if (i === steps - 1) return last;
    return Math.round(first * Math.pow(ratio, i));
  });
  // keep monotonic non-increasing even after rounding
  for (let i = 1; i < counts.length; i += 1) counts[i] = Math.min(counts[i], counts[i - 1]);

  return labels.map((label, i) => ({
    label,
    count: counts[i],
    pctOfFirst: first ? (counts[i] / first) * 100 : 0,
    pctOfPrev: i === 0 ? null : (counts[i - 1] ? (counts[i] / counts[i - 1]) * 100 : 0),
  }));
}

// ---- Formatting ----

export function fmtUsers(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}명`; }
export function fmtSessions(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}회`; }
export function fmtCases(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}건`; }
export function fmtPct(n: number, digits = 2): string { return `${n.toFixed(digits)}%`; }
export function fmtSignedPct(n: number, digits = 1): string {
  if (Math.abs(n) < 0.05) return '0.0%';
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(digits)}%`;
}
export function fmtDate(date: string): string { return date.replace(/-/g, '.'); }

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
