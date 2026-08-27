import { ACCENT, GREEN_STRONG, RED } from '../../lib/theme';
import type { Member } from '../../data/members';

export type ViewKey = 'all' | 'new' | 'risk' | 'mkt';

export const VIEW_LABELS: Record<ViewKey, string> = {
  all: '전체 회원',
  new: '신규 가입',
  risk: '정지·휴면',
  mkt: '마케팅 동의',
};

export function viewCount(key: ViewKey, data: Member[]): number {
  if (key === 'all') return data.length;
  if (key === 'new') return data.filter((r) => r.fresh).length;
  if (key === 'risk') return data.filter((r) => r.status === '정지' || r.status === '휴면').length;
  return data.filter((r) => r.marketing).length;
}

export interface ChipDef {
  field: 'status' | 'provider' | 'marketing';
  value: string;
  hint: string;
}

export interface Chip extends ChipDef {
  label: string;
}

export const ADDABLE: Chip[] = [
  { label: '상태 = 정상', field: 'status', value: '정상', hint: '상태' },
  { label: '상태 = 정지', field: 'status', value: '정지', hint: '상태' },
  { label: '상태 = 휴면', field: 'status', value: '휴면', hint: '상태' },
  { label: '가입 경로 = Kakao', field: 'provider', value: 'Kakao', hint: '경로' },
  { label: '가입 경로 = Google', field: 'provider', value: 'Google', hint: '경로' },
  { label: '마케팅 수신 = 동의', field: 'marketing', value: 'true', hint: '수신' },
];

export const CHANNEL_ORDER = ['Google', 'Kakao', 'Naver', 'Apple', 'Email'];

export const TOTAL_MEMBERS = 128430;

export function daysAgo(seen: string): number | null {
  if (seen === '—') return null;
  if (seen.includes('방금') || seen.includes('분 전') || seen.includes('시간 전')) return 0;
  const m = seen.match(/(\d+)일 전/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export interface SparkBar {
  h: string;
  color: string;
  title: string;
}
export interface SparkResult {
  bars: SparkBar[];
  recentLabel: string;
  shareLabel: string;
}

export function buildSpark(rows: Member[]): SparkResult {
  const buckets = Array.from({ length: 14 }, () => 0);
  rows.forEach((r) => {
    const d = daysAgo(r.seen);
    if (d != null && d <= 13) buckets[13 - d] += 1;
  });
  const max = Math.max(1, ...buckets);
  const bars: SparkBar[] = buckets.map((count, i) => ({
    h: count ? `${Math.max(2, Math.round((count / max) * 24))}px` : '2px',
    color: count ? (i >= 11 ? ACCENT : 'oklch(0.78 0.07 258)') : '#ececef',
    title: `${13 - i}일 전 · ${count}명`,
  }));
  const recent = buckets.reduce((a, b) => a + b, 0);
  const pct = rows.length ? Math.round((recent / rows.length) * 100) : 0;
  return {
    bars,
    recentLabel: `${recent}명`,
    shareLabel: rows.length ? `세그먼트의 ${pct}%` : '',
  };
}

export const STATS = [
  { label: '전체 회원', value: TOTAL_MEMBERS.toLocaleString('ko-KR'), color: '#18181b', delta: '', deltaColor: '#a1a1aa' },
  { label: '오늘 가입', value: '482', color: '#18181b', delta: '▲ 12%', deltaColor: GREEN_STRONG },
  { label: '7일 활성', value: (41208).toLocaleString('ko-KR'), color: '#18181b', delta: '▼ 3%', deltaColor: RED },
  { label: '정지·휴면', value: '320', color: '#b91c1c', delta: '', deltaColor: '#a1a1aa' },
];
