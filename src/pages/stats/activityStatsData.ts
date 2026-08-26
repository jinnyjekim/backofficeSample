import { addDays, daysBetween, dayOfWeek, fmtDateShort } from './transactionStatsData';
import { DAILY_SERIES as MEMBER_SERIES, aggregate as memberAggregate } from './memberStatsData';

export const TODAY = '2026-08-25';
const SERIES_START = '2026-01-01';

export interface ActivityDayRecord {
  date: string;
  activeUsers: number; // reused from member stats' daily active series
  events: number;
}

function buildSeries(): ActivityDayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  return Array.from({ length: totalDays }, (_, i) => {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const weekday = dow === 0 || dow === 6 ? 0.78 : 1.05;
    const wiggle = 1 + Math.sin(i * 1.2) * 0.07 + Math.cos(i * 0.55) * 0.04;
    const eventsPerUser = 19.5 * weekday * wiggle;
    const dailyActive = MEMBER_SERIES[i]?.dailyActive ?? 0;
    return { date, activeUsers: dailyActive, events: Math.round(dailyActive * eventsPerUser) };
  });
}

export const DAILY_SERIES: ActivityDayRecord[] = buildSeries();
export function seriesInRange(start: string, end: string): ActivityDayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}

export interface ActivityPeriodAggregate {
  start: string;
  end: string;
  days: number;
  activeUsers: number;
  events: number;
  avgEventsPerUser: number;
}

export function aggregate(start: string, end: string): ActivityPeriodAggregate {
  const rows = seriesInRange(start, end);
  const events = rows.reduce((s, r) => s + r.events, 0);
  const activeUsers = memberAggregate(start, end).activeMembers;
  return { start, end, days: rows.length, activeUsers, events, avgEventsPerUser: activeUsers ? events / activeUsers : 0 };
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
export interface Bucket { label: string; start: string; end: string; activeUsers: number; events: number; }

export function bucketSeries(start: string, end: string, granularity: Granularity): Bucket[] {
  const rows = seriesInRange(start, end);
  if (granularity === '일별') {
    return rows.map((r) => ({ label: fmtDateShort(r.date), start: r.date, end: r.date, activeUsers: r.activeUsers, events: r.events }));
  }
  const buckets: Bucket[] = [];
  if (granularity === '월별') {
    let cursor = start;
    while (cursor <= end) {
      const nextMonth = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(nextMonth, -1) > end ? end : addDays(nextMonth, -1);
      const agg = aggregate(cursor, bucketEnd);
      buckets.push({ label: cursor.slice(0, 7), start: cursor, end: bucketEnd, activeUsers: agg.activeUsers, events: agg.events });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }
  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd);
    buckets.push({ label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`, start: cursor, end: bucketEnd, activeUsers: agg.activeUsers, events: agg.events });
    cursor = addDays(bucketEnd, 1);
  }
  return buckets;
}

// ---- Feature / category breakdown ----

export interface FeatureDef { name: string; category: string; eventWeight: number; reachWeight: number }

export const FEATURES: FeatureDef[] = [
  { name: '로그인', category: '계정', eventWeight: 0.12 * 0.55, reachWeight: 0.95 },
  { name: '로그아웃', category: '계정', eventWeight: 0.12 * 0.30, reachWeight: 0.40 },
  { name: '정보 수정', category: '계정', eventWeight: 0.12 * 0.15, reachWeight: 0.12 },
  { name: '검색', category: '탐색', eventWeight: 0.45 * 0.35, reachWeight: 0.57 },
  { name: '목록 조회', category: '탐색', eventWeight: 0.45 * 0.30, reachWeight: 0.64 },
  { name: '상세 조회', category: '탐색', eventWeight: 0.45 * 0.35, reachWeight: 0.77 },
  { name: '장바구니', category: '거래', eventWeight: 0.12 * 0.45, reachWeight: 0.22 },
  { name: '주문', category: '거래', eventWeight: 0.12 * 0.30, reachWeight: 0.14 },
  { name: '결제', category: '거래', eventWeight: 0.12 * 0.25, reachWeight: 0.13 },
  { name: '문의 등록', category: '고객지원', eventWeight: 0.03 * 0.40, reachWeight: 0.035 },
  { name: 'FAQ 조회', category: '고객지원', eventWeight: 0.03 * 0.45, reachWeight: 0.18 },
  { name: '파일 첨부', category: '고객지원', eventWeight: 0.03 * 0.15, reachWeight: 0.02 },
  { name: '다운로드', category: '기타', eventWeight: 0.28 * 0.40, reachWeight: 0.20 },
  { name: '공유', category: '기타', eventWeight: 0.28 * 0.25, reachWeight: 0.09 },
  { name: '설정 변경', category: '기타', eventWeight: 0.28 * 0.35, reachWeight: 0.11 },
];
export const CATEGORIES = ['계정', '탐색', '거래', '고객지원', '기타'];

export interface FeatureRow { name: string; category: string; users: number; events: number; avgPerUser: number; share: number; }

export function featureBreakdown(agg: ActivityPeriodAggregate): FeatureRow[] {
  const wSum = FEATURES.reduce((s, f) => s + f.eventWeight, 0);
  const rows = FEATURES.map((f) => ({
    name: f.name,
    category: f.category,
    events: Math.round((f.eventWeight / wSum) * agg.events),
    users: Math.round(f.reachWeight * agg.activeUsers),
  }));
  const drift = agg.events - rows.reduce((s, r) => s + r.events, 0);
  const largest = rows.reduce((best, r, i) => (r.events > rows[best].events ? i : best), 0);
  rows[largest].events += drift;
  return rows.map((r) => ({ ...r, avgPerUser: r.users ? r.events / r.users : 0, share: agg.events ? (r.events / agg.events) * 100 : 0 })).sort((a, b) => b.events - a.events);
}

export interface CategoryRow { name: string; users: number; events: number; avgPerUser: number; share: number; }

export function categoryBreakdown(agg: ActivityPeriodAggregate): CategoryRow[] {
  const features = featureBreakdown(agg);
  return CATEGORIES.map((cat) => {
    const rows = features.filter((f) => f.category === cat);
    const events = rows.reduce((s, r) => s + r.events, 0);
    const users = Math.round(Math.max(...rows.map((r) => r.users), 0) * 1.1); // category reach is at least the max single-feature reach, plus overlap allowance
    return { name: cat, users: Math.min(users, agg.activeUsers), events, avgPerUser: users ? events / users : 0, share: agg.events ? (events / agg.events) * 100 : 0 };
  }).sort((a, b) => b.events - a.events);
}

// mirrors the member type weights used in memberStatsData.ts's typeBreakdown, applied here to active users instead of total members
const MEMBER_TYPE_NAMES = ['일반 회원', '회사 관리자', '회사 사용자', '기타'];
const MEMBER_TYPE_WEIGHTS = [0.723, 0.066, 0.209, 0.002];

export interface MemberTypeActivityRow { name: string; users: number; events: number; avgPerUser: number; }

export function memberTypeActivityBreakdown(agg: ActivityPeriodAggregate): MemberTypeActivityRow[] {
  const wSum = MEMBER_TYPE_WEIGHTS.reduce((s, w) => s + w, 0);
  const rows = MEMBER_TYPE_NAMES.map((name, i) => ({ name, users: Math.round((MEMBER_TYPE_WEIGHTS[i] / wSum) * agg.activeUsers) }));
  const drift = agg.activeUsers - rows.reduce((s, r) => s + r.users, 0);
  const largest = rows.reduce((best, r, i) => (r.users > rows[best].users ? i : best), 0);
  rows[largest].users += drift;
  return rows
    .map((r) => ({ ...r, events: Math.round((r.users / Math.max(1, agg.activeUsers)) * agg.events) }))
    .map((r) => ({ ...r, avgPerUser: r.users ? r.events / r.users : 0 }))
    .sort((a, b) => b.events - a.events);
}

// ---- Formatting ----

export function fmtUsers(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}명`; }
export function fmtEvents(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}회`; }
export function fmtPct(n: number, digits = 1): string { return `${n.toFixed(digits)}%`; }
export function fmtSignedPct(n: number, digits = 1): string {
  if (Math.abs(n) < 0.05) return '0.0%';
  return `${n > 0 ? '▲' : '▼'} ${Math.abs(n).toFixed(digits)}%`;
}
export function fmtDate(date: string): string { return date.replace(/-/g, '.'); }

export function josaEunNeun(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '은';
  return (code - 0xac00) % 28 !== 0 ? '은' : '는';
}
export function josaIGa(word: string): string {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '이';
  return (code - 0xac00) % 28 !== 0 ? '이' : '가';
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
