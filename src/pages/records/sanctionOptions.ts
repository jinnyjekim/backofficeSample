export type SanctionMode = 'add' | 'change' | 'extend' | 'release';

export const SANCTION_TYPES = ['경고', '기능 제한', '7일 정지', '30일 정지', '영구정지'] as const;
export type SanctionType = (typeof SANCTION_TYPES)[number];

export const SANCTION_REASONS = ['욕설/비방', '스팸/광고', '부정 이용', '신고 누적', '기타'] as const;
export type SanctionReason = (typeof SANCTION_REASONS)[number];

export const SANCTION_LEVEL: Record<string, number> = {
  경고: 1,
  '기능 제한': 2,
  '7일 정지': 3,
  '30일 정지': 3,
  영구정지: 4,
};

export const MODE_TITLE: Record<SanctionMode, string> = {
  add: '제재 처리',
  change: '제재 변경',
  extend: '기간 연장',
  release: '즉시 해제',
};

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
export function isoToDot(iso: string): string {
  return iso.replaceAll('-', '.');
}
export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}
