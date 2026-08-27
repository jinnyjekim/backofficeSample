export const ACCENT = 'oklch(0.52 0.16 258)';
export const ACCENT_HOVER = 'oklch(0.46 0.16 258)';

export const GREEN = 'oklch(0.65 0.15 155)';
export const GREEN_STRONG = 'oklch(0.55 0.14 155)';
export const RED = 'oklch(0.58 0.19 25)';
export const AMBER = 'oklch(0.78 0.14 70)';

export const AV: Array<[string, string]> = [
  ['#eef2ff', '#4f46e5'],
  ['#ecfdf5', '#059669'],
  ['#fef3c7', '#b45309'],
  ['#fae8ff', '#a21caf'],
  ['#e0f2fe', '#0369a1'],
  ['#fee2e2', '#b91c1c'],
];

export function avatarColors(id: number): [string, string] {
  return AV[id % AV.length];
}

export type MemberStatus = '정상' | '정지' | '휴면' | '탈퇴';

export const STATUS_STYLE: Record<MemberStatus, { fg: string; dot: string }> = {
  정상: { fg: '#3f3f46', dot: GREEN },
  정지: { fg: '#b91c1c', dot: RED },
  휴면: { fg: '#b45309', dot: AMBER },
  탈퇴: { fg: '#a1a1aa', dot: '#d4d4d8' },
};

export function formatNumber(x: number): string {
  return x.toLocaleString('ko-KR');
}

export function formatWon(x: number): string {
  return x.toLocaleString('ko-KR') + '원';
}
