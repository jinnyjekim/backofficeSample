import { GREEN_STRONG, RED } from '../../lib/theme';
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

export const STATS = [
  { label: '전체 회원', value: TOTAL_MEMBERS.toLocaleString('ko-KR'), color: '#18181b', delta: '', deltaColor: '#a1a1aa' },
  { label: '오늘 가입', value: '482', color: '#18181b', delta: '▲ 12%', deltaColor: GREEN_STRONG },
  { label: '7일 활성', value: (41208).toLocaleString('ko-KR'), color: '#18181b', delta: '▼ 3%', deltaColor: RED },
  { label: '정지·휴면', value: '320', color: '#b91c1c', delta: '', deltaColor: '#a1a1aa' },
];
