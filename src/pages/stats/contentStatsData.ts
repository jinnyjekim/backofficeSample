import { addDays, daysBetween, dayOfWeek, fmtDateShort } from './transactionStatsData';

export const TODAY = '2026-08-25';
const SERIES_START = '2026-01-01';
const TOTAL_CONTENT_TARGET = 8420;

export interface ContentDayRecord {
  date: string;
  newContent: number;
  published: number;
  unpublished: number;
  totalContent: number;
  views: number;
  viewingUsers: number;
}

function buildSeries(): ContentDayRecord[] {
  const totalDays = daysBetween(SERIES_START, TODAY) + 1;
  const raw: { date: string; newContent: number; published: number; unpublished: number; viewingRate: number; viewsPerContentBase: number }[] = [];

  for (let i = 0; i < totalDays; i += 1) {
    const date = addDays(SERIES_START, i);
    const dow = dayOfWeek(date);
    const trend = 0.84 + (i / (totalDays - 1)) * 0.32;
    const weekday = dow === 0 || dow === 6 ? 0.6 : 1.06;
    const wiggle = 1 + Math.sin(i * 1.5) * 0.09 + Math.cos(i * 0.6) * 0.05;
    const dayFactor = trend * weekday * wiggle;

    const newContent = Math.max(0, Math.round(28 * dayFactor));
    const published = Math.max(0, Math.round(newContent * (0.82 + Math.sin(i * 0.4) * 0.06)));
    const unpublished = Math.max(0, Math.round(3.2 * (0.8 + Math.sin(i * 0.8 + 1) * 0.25) * (dow === 0 || dow === 6 ? 0.7 : 1.05)));

    const viewingRate = 1 + Math.sin(i * 1.1) * 0.14 + Math.cos(i * 0.5) * 0.08;
    const viewsPerContentBase = 92 * (dow === 0 || dow === 6 ? 0.72 : 1.05) * viewingRate;

    raw.push({ date, newContent, published, unpublished, viewingRate, viewsPerContentBase });
  }

  let cumulativeNet = 0;
  const totals = raw.map((r) => { cumulativeNet += r.newContent; return cumulativeNet; });
  const startingBase = TOTAL_CONTENT_TARGET - totals[totals.length - 1];

  return raw.map((r, i) => {
    const totalContent = startingBase + totals[i];
    const views = Math.round(totalContent * 0.62 * (r.viewsPerContentBase / 92) * 0.014);
    const viewingUsers = Math.round(views * (0.36 + Math.sin(i * 0.9) * 0.03));
    return {
      date: r.date, newContent: r.newContent, published: r.published, unpublished: r.unpublished,
      totalContent, views, viewingUsers,
    };
  });
}

export const DAILY_SERIES: ContentDayRecord[] = buildSeries();
export function seriesInRange(start: string, end: string): ContentDayRecord[] {
  return DAILY_SERIES.filter((r) => r.date >= start && r.date <= end);
}
function recordAt(date: string): ContentDayRecord | undefined {
  return DAILY_SERIES.find((r) => r.date === date);
}

export interface ContentPeriodAggregate {
  start: string;
  end: string;
  days: number;
  newContent: number;
  published: number;
  unpublished: number;
  totalContentAtEnd: number;
  views: number;
  viewingUsers: number;
  avgViewsPerContent: number;
  avgViewsPerUser: number;
}

export function aggregate(start: string, end: string): ContentPeriodAggregate {
  const rows = seriesInRange(start, end);
  const newContent = rows.reduce((s, r) => s + r.newContent, 0);
  const published = rows.reduce((s, r) => s + r.published, 0);
  const unpublished = rows.reduce((s, r) => s + r.unpublished, 0);
  const views = rows.reduce((s, r) => s + r.views, 0);
  const totalContentAtEnd = recordAt(end)?.totalContent ?? DAILY_SERIES[DAILY_SERIES.length - 1].totalContent;

  const avgDailyViewingUsers = rows.length ? rows.reduce((s, r) => s + r.viewingUsers, 0) / rows.length : 0;
  const viewingUsers = Math.min(Math.round(totalContentAtEnd * 4), Math.round(avgDailyViewingUsers * rows.length ** 0.62));

  return {
    start, end, days: rows.length,
    newContent, published, unpublished,
    totalContentAtEnd, views, viewingUsers,
    avgViewsPerContent: published ? views / published : 0,
    avgViewsPerUser: viewingUsers ? views / viewingUsers : 0,
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
export interface Bucket { label: string; start: string; end: string; newContent: number; published: number; views: number; }

export function bucketSeries(start: string, end: string, granularity: Granularity): Bucket[] {
  const rows = seriesInRange(start, end);
  if (granularity === '일별') {
    return rows.map((r) => ({ label: fmtDateShort(r.date), start: r.date, end: r.date, newContent: r.newContent, published: r.published, views: r.views }));
  }
  const buckets: Bucket[] = [];
  if (granularity === '월별') {
    let cursor = start;
    while (cursor <= end) {
      const nextMonth = addDays(`${cursor.slice(0, 7)}-01`, 32).slice(0, 7) + '-01';
      const bucketEnd = addDays(nextMonth, -1) > end ? end : addDays(nextMonth, -1);
      const agg = aggregate(cursor, bucketEnd);
      buckets.push({ label: cursor.slice(0, 7), start: cursor, end: bucketEnd, newContent: agg.newContent, published: agg.published, views: agg.views });
      cursor = addDays(bucketEnd, 1);
    }
    return buckets;
  }
  let cursor = start;
  while (cursor <= end) {
    const bucketEnd = addDays(cursor, 6) > end ? end : addDays(cursor, 6);
    const agg = aggregate(cursor, bucketEnd);
    buckets.push({ label: `${fmtDateShort(cursor)}~${fmtDateShort(bucketEnd)}`, start: cursor, end: bucketEnd, newContent: agg.newContent, published: agg.published, views: agg.views });
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

const STATUS_NAMES = ['공개', '비공개', '임시저장', '예약', '삭제'];
const STATUS_WEIGHTS = [0.84, 0.08, 0.04, 0.02, 0.02];
export function statusBreakdown(agg: ContentPeriodAggregate): WeightedRow[] {
  return distributeCount(STATUS_NAMES, STATUS_WEIGHTS, agg.totalContentAtEnd);
}

const AUTHOR_TYPE_NAMES = ['회원', '관리자'];
const AUTHOR_TYPE_WEIGHTS = [0.78, 0.22];
export function authorTypeBreakdown(agg: ContentPeriodAggregate): WeightedRow[] {
  return distributeCount(AUTHOR_TYPE_NAMES, AUTHOR_TYPE_WEIGHTS, agg.totalContentAtEnd);
}

// mirrors top-level categories in src/pages/content/categoriesData.ts (self + descendant counts)
export const CATEGORY_NAMES = ['카테고리 01', '카테고리 02', '카테고리 03', '카테고리 04'];
const CATEGORY_WEIGHTS = [120, 80, 31, 1];
export function categoryContentBreakdown(agg: ContentPeriodAggregate): WeightedRow[] {
  return distributeCount(CATEGORY_NAMES, CATEGORY_WEIGHTS, agg.totalContentAtEnd);
}
export function categoryViewBreakdown(agg: ContentPeriodAggregate): WeightedRow[] {
  return distributeCount(CATEGORY_NAMES, CATEGORY_WEIGHTS, agg.views);
}

// TOP content: reuses real published titles/view counts from src/data/content.ts as relative weights
export interface TopContentRow { title: string; id: string; views: number; share: number; }
const TOP_CONTENT_SOURCE: { id: string; title: string; baseViews: number }[] = [
  { id: 'C10264', title: '도시의 밤을 걷다', baseViews: 21338 },
  { id: 'C10244', title: '8월 업데이트 노트', baseViews: 15701 },
  { id: 'C10284', title: '봄날의 이야기', baseViews: 12840 },
  { id: 'C10271', title: '조용한 새벽의 편지', baseViews: 8904 },
  { id: 'C10259', title: '고양이와 함께한 열두 달', baseViews: 6220 },
  { id: 'C10278', title: '무인도에서 살아남기', baseViews: 3182 },
  { id: 'C10250', title: '초보자를 위한 요리 안내서', baseViews: 1942 },
];
export function topContent(agg: ContentPeriodAggregate): TopContentRow[] {
  const weights = TOP_CONTENT_SOURCE.map((c) => c.baseViews);
  const wSum = weights.reduce((s, w) => s + w, 0);
  const rows = TOP_CONTENT_SOURCE.map((c, i) => ({ id: c.id, title: c.title, views: Math.round((weights[i] / wSum) * agg.views) }));
  const drift = agg.views - rows.reduce((s, r) => s + r.views, 0);
  const largest = rows.reduce((best, r, i) => (r.views > rows[best].views ? i : best), 0);
  rows[largest].views += drift;
  return rows.map((r) => ({ ...r, share: agg.views ? (r.views / agg.views) * 100 : 0 })).sort((a, b) => b.views - a.views);
}

// ---- Formatting ----

export function fmtCount(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}개`; }
export function fmtViews(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}회`; }
export function fmtUsers(n: number): string { return `${Math.round(n).toLocaleString('ko-KR')}명`; }
export function fmtPct(n: number, digits = 1): string { return `${n.toFixed(digits)}%`; }
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
