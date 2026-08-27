import { ACCENT } from '../../lib/theme';
import type { Member } from '../../data/members';

export const TOTAL_MEMBERS = 128430;

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
    const d = r.seenDays;
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
