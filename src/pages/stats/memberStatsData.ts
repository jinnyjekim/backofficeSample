import { TOTAL_MEMBERS } from '../members/membersData';
import { addDays, daysBetween, dayOfWeek, fmtDateShort } from './transactionStatsData';

export const TODAY = '2026-08-25';
const SERIES_START = '2026-01-01';

export interface MemberDayRecord {
  date: string;
  newSignups: number;
  churned: number;
  totalMembers: number;
  dailyActive: number;
}

function buildSeries(): MemberDayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const raw: { date: string; newSignups: number; churned: number; dailyActiveRate: number }[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.86 + (i / (totalDays - 1)) * 0.28;
    const weekday = dow === 0 || dow === 6 ? 0.68 : 1.05;
    const wiggle = 1 + Math.sin(i * 1.4) * 0.08 + Math.cos(i * 0.7) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const newSignups = Math.max(0, Math.round(158 * dayFactor));
    const churnWiggle = 1 + Math.sin(i * 0.9 + 1) * 0.15;
    const churned = Math.max(0, Math.round(19 * (0.9 + (i / (totalDays - 1)) * 0.25) * (dow === 0 || dow === 6 ? 0.75 : 1.05) * churnWiggle));

    const activeWeekday = dow === 0 || dow === 6 ? 0.7 : 1.04;
    const activeWiggle = 1 + Math.sin(i * 1.2 + 0.5) * 0.06;
    const dailyActiveRate = 0.038 * activeWeekday * activeWiggle;

    raw.push({ date, newSignups, churned, dailyActiveRate });
  }

  let cumulativeNet = 0;
  const nets = raw.map((r) => { cumulativeNet += r.newSignups - r.churned; return cumulativeNet; });
  const startingBase = TOTAL_MEMBERS - nets[nets.length - 1];

  return raw.map((r, i) => {
    const totalMembers = startingBase + nets[i];
    return {
      date: r.date,
      newSignups: r.newSignups,
      churned: r.churned,
      totalMembers,
      dailyActive: Math.round(totalMembers * r.dailyActiveRate),
    };
  });
}

export const DAILY_SERIES: MemberDayRecord[] = buildSeries();

export function seriesInRange(start: string, end: string): MemberDayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}
function recordAt(date: string): MemberDayRecord | undefined {
  return DAILY_SERIES.find((r) => r.date === date);
}

export interface MemberPeriodAggregate {
  start: string;
  end: string;
  days: number;
  newSignups: number;
  churned: number;
  netGrowth: number;
  totalMembersAtEnd: number;
  totalMembersAtStart: number;
  activeMembers: number;
  activeRate: number;
  churnRate: number;
  avgDailySignups: number;
}

export function aggregate(start: string, end: string): MemberPeriodAggregate {
  const rows = seriesInRange(start, end);
  const newSignups = rows.reduce((s, r) => s + r.newSignups, 0);
  const churned = rows.reduce((s, r) => s + r.churned, 0);
  const totalMembersAtEnd = recordAt(end)?.totalMembers ?? DAILY_SERIES[DAILY_SERIES.length - 1].totalMembers;
  const dayBeforeStart = addDays(start, -1);
  const totalMembersAtStart = recordAt(dayBeforeStart)?.totalMembers ?? DAILY_SERIES[0].totalMembers;

  const avgDailyActive = rows.length ? rows.reduce((s, r) => s + r.dailyActive, 0) / rows.length : 0;
  const activeMembers = Math.min(Math.round(totalMembersAtEnd * 0.85), Math.round(avgDailyActive * rows.length ** 0.6));

  return {
    start, end, days: rows.length,
    newSignups, churned, netGrowth: newSignups - churned,
    totalMembersAtEnd, totalMembersAtStart,
    activeMembers,
    activeRate: totalMembersAtEnd ? (activeMembers / totalMembersAtEnd) * 100 : 0,
    churnRate: totalMembersAtStart ? (churned / totalMembersAtStart) * 100 : 0,
    avgDailySignups: rows.length ? newSignups / rows.length : 0,
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
export interface Bucket { label: string; start: string; end: string; newSignups: number; churned: number; netGrowth: number; totalMembers: number; }

export function bucketSeries(start: string, end: string, granularity: Granularity): Bucket[] {
  const rows = seriesInRange(start, end);
  if (granularity === '일별') {
    return rows.map((r) => ({ label: fmtDateShort(r.date), start: r.date, end: r.date, newSignups: r.newSignups, churned: r.churned, netGrowth: r.newSignups - r.churned, totalMembers: r.totalMembers }));
  }
  const buckets: Bucket[] = [];
  if (granularity === '월별') {
    let cursor = start;
    while (cursor <= end) {
      const nextMonth = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(nextMonth, -1) > end ? end : addDays(nextMonth, -1);
      const agg = aggregate(cursor, bucketEnd);
      buckets.push({ label: cursor.slice(0, 7), start: cursor, end: bucketEnd, newSignups: agg.newSignups, churned: agg.churned, netGrowth: agg.netGrowth, totalMembers: agg.totalMembersAtEnd });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }
  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd);
    buckets.push({ label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`, start: cursor, end: bucketEnd, newSignups: agg.newSignups, churned: agg.churned, netGrowth: agg.netGrowth, totalMembers: agg.totalMembersAtEnd });
    cursor = addDays(bucketEnd, 1);
  }
  return buckets;
}

// ---- Snapshot / period breakdowns ----

export interface WeightedRow { name: string; count: number; share: number; }

function distributeCount(names: string[], weights: number[], total: number): WeightedRow[] {
  const wSum = weights.reduce((s, w) => s + w, 0);
  const rows = names.map((name, i) => ({ name, count: Math.round((weights[i] / wSum) * total) }));
  const drift = total - rows.reduce((s, r) => s + r.count, 0);
  const largest = rows.reduce((best, r, i) => (r.count > rows[best].count ? i : best), 0);
  rows[largest].count += drift;
  return rows.map((r) => ({ ...r, share: total ? (r.count / total) * 100 : 0 })).sort((a, b) => b.count - a.count);
}

const STATUS_NAMES = ['정상', '휴면', '이용 제한', '탈퇴 처리중', '기타'];
const STATUS_WEIGHTS = [0.907, 0.066, 0.01, 0.001, 0.016];
export function statusBreakdown(agg: MemberPeriodAggregate): WeightedRow[] {
  return distributeCount(STATUS_NAMES, STATUS_WEIGHTS, agg.totalMembersAtEnd);
}

const TYPE_NAMES = ['일반 회원', '회사 관리자', '회사 사용자', '기타'];
const TYPE_WEIGHTS = [0.723, 0.066, 0.209, 0.002];
export function typeBreakdown(agg: MemberPeriodAggregate): WeightedRow[] {
  return distributeCount(TYPE_NAMES, TYPE_WEIGHTS, agg.totalMembersAtEnd);
}

export const SIGNUP_CHANNELS = ['Google', 'Kakao', 'Naver', 'Apple', 'Email'];
const CHANNEL_WEIGHTS = [0.32, 0.27, 0.19, 0.14, 0.08];
export function channelBreakdown(agg: MemberPeriodAggregate): WeightedRow[] {
  return distributeCount(SIGNUP_CHANNELS, CHANNEL_WEIGHTS, agg.newSignups);
}

// ---- Formatting ----

export function fmtCount(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}명`; }
export function fmtPct(n: number, digits = 1): string { return `${n.toFixed(digits)}%`; }
export function fmtSignedPct(n: number, digits = 1): string {
  if (Math.abs(n) < 0.05) return '0.0%';
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(digits)}%`;
}
export function fmtSignedCount(n: number): string {
  return `${n > 0 ? '+' : n < 0 ? '-' : ''}${Math.abs(n).toLocaleString('ko-KR')}명`;
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
