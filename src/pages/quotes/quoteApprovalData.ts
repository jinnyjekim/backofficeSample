export type ApprovalStatus = '대기' | '완료' | '반려';

export interface ApprovalItem {
  name: string;
  qty: number;
  basePrice: number;
  unitPrice: number;
}

export interface MoqCheck {
  name: string;
  qty: number;
  moq: number;
  ok: boolean;
}

export interface CondCompareEntry {
  label: string;
  base: string;
  value: string;
  diff: boolean;
}

export interface ChainEntry {
  stage: string;
  admin: string;
  status: string;
  when: string;
}

export interface ApprovalHistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface Credit {
  limit: number;
  used: number;
}

export interface Approval {
  id: string;
  partner: string;
  amount: number;
  base: number;
  discount: number;
  margin: number;
  minMargin: number;
  stage: string;
  stageLabel: string;
  requester: string;
  requestedAt: string;
  status: ApprovalStatus;
  mine: boolean;
  reasons: string[];
  items: ApprovalItem[];
  moqChecks: MoqCheck[];
  condCompare: CondCompareEntry[];
  credit: Credit;
  chain: ChainEntry[];
  opinion: string;
  history: ApprovalHistoryEntry[];
}

export const FILTER_KEYS = ['승인대기', '내 승인대기', '승인완료', '반려', '전체'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export const STATUS_META: Record<ApprovalStatus, { bg: string; fg: string }> = {
  대기: { bg: '#fffbeb', fg: '#d97706' },
  완료: { bg: '#ecfdf5', fg: '#059669' },
  반려: { bg: '#fef2f2', fg: '#dc2626' },
};

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export const APPROVALS: Approval[] = [
  {
    id: 'Q-00182',
    partner: '회사 01',
    amount: 4820000,
    base: 5250000,
    discount: -8.2,
    margin: 18.4,
    minMargin: 15,
    stage: '1/2',
    stageLabel: '1차 승인',
    requester: 'admin01',
    requestedAt: '2026.08.14 13:20',
    status: '대기',
    mine: true,
    reasons: ['기준 공급가 대비 8.2% 할인'],
    items: [
      { name: '상품명 01', qty: 100, basePrice: 29000, unitPrice: 27500 },
      { name: '상품명 02', qty: 50, basePrice: 35000, unitPrice: 32000 },
    ],
    moqChecks: [
      { name: '상품명 01', qty: 100, moq: 50, ok: true },
      { name: '상품명 02', qty: 50, moq: 50, ok: true },
    ],
    condCompare: [
      { label: '결제 방식', base: '후불', value: '후불', diff: false },
      { label: '결제 기한', base: '30일', value: '45일', diff: true },
      { label: '납기', base: '5영업일', value: '3영업일', diff: true },
    ],
    credit: { limit: 50000000, used: 42000000 },
    chain: [
      { stage: '1차 승인', admin: 'admin02', status: '대기중', when: '요청 2026.08.14 13:20' },
      { stage: '2차 승인', admin: 'admin03', status: '대기', when: '-' },
    ],
    opinion: '회사 01과 협의된 가격입니다. 연간 구매수량 증가 조건으로 8% 할인 적용했습니다.',
    history: [{ when: '2026.08.14 13:20', action: '승인 요청', by: 'admin01' }],
  },
  {
    id: 'Q-00181',
    partner: '회사 02',
    amount: 8200000,
    base: 10380000,
    discount: -21,
    margin: 9.8,
    minMargin: 15,
    stage: '2/2',
    stageLabel: '2차 승인',
    requester: 'admin02',
    requestedAt: '2026.08.14 11:00',
    status: '대기',
    mine: true,
    reasons: ['기준 공급가 대비 21% 할인', '최소 마진 기준 미달 (9.8% < 15%)'],
    items: [{ name: '상품명 03', qty: 10, basePrice: 120000, unitPrice: 82000 }],
    moqChecks: [{ name: '상품명 03', qty: 10, moq: 1, ok: true }],
    condCompare: [
      { label: '결제 방식', base: '후불', value: '후불', diff: false },
      { label: '결제 기한', base: '30일', value: '30일', diff: false },
      { label: '납기', base: '5영업일', value: '5영업일', diff: false },
    ],
    credit: { limit: 30000000, used: 26500000 },
    chain: [
      { stage: '1차 승인', admin: 'admin02', status: '완료', when: '2026.08.14 11:40' },
      { stage: '2차 승인', admin: 'admin05', status: '대기중', when: '요청 2026.08.14 11:40' },
    ],
    opinion: '대량 발주(연 500개 이상) 조건으로 할인 협의.',
    history: [
      { when: '2026.08.14 11:00', action: '승인 요청', by: 'admin02' },
      { when: '2026.08.14 11:40', action: '1차 승인', by: 'admin02', note: '가격 조건 확인 완료' },
    ],
  },
  {
    id: 'Q-00170',
    partner: '㈜한빛물산',
    amount: 1500000,
    base: 1550000,
    discount: -3.2,
    margin: 22.1,
    minMargin: 15,
    stage: '1/1',
    stageLabel: '단일 승인',
    requester: 'admin02',
    requestedAt: '2026.08.12 09:00',
    status: '완료',
    mine: false,
    reasons: [],
    items: [{ name: '상품명 05', qty: 25, basePrice: 64000, unitPrice: 61000 }],
    moqChecks: [{ name: '상품명 05', qty: 25, moq: 20, ok: true }],
    condCompare: [
      { label: '결제 방식', base: '후불', value: '후불', diff: false },
      { label: '결제 기한', base: '30일', value: '30일', diff: false },
      { label: '납기', base: '5영업일', value: '5영업일', diff: false },
    ],
    credit: { limit: 20000000, used: 8000000 },
    chain: [{ stage: '단일 승인', admin: 'admin03', status: '완료', when: '2026.08.12 10:20' }],
    opinion: '정상 범위 가격.',
    history: [
      { when: '2026.08.12 09:00', action: '승인 요청', by: 'admin02' },
      { when: '2026.08.12 10:20', action: '최종 승인', by: 'admin03', note: '정상 승인' },
    ],
  },
  {
    id: 'Q-00155',
    partner: '대성유통',
    amount: 900000,
    base: 1200000,
    discount: -25,
    margin: 6.5,
    minMargin: 15,
    stage: '1/1',
    stageLabel: '단일 승인',
    requester: 'admin01',
    requestedAt: '2026.08.10 14:00',
    status: '반려',
    mine: false,
    reasons: ['기준 공급가 대비 25% 할인', '최소 마진 기준 미달'],
    items: [{ name: '상품명 01', qty: 30, basePrice: 32000, unitPrice: 24000 }],
    moqChecks: [{ name: '상품명 01', qty: 30, moq: 10, ok: true }],
    condCompare: [
      { label: '결제 방식', base: '후불', value: '선불', diff: true },
      { label: '결제 기한', base: '30일', value: '-', diff: false },
      { label: '납기', base: '5영업일', value: '5영업일', diff: false },
    ],
    credit: { limit: 10000000, used: 9500000 },
    chain: [{ stage: '단일 승인', admin: 'admin03', status: '반려', when: '2026.08.10 15:00' }],
    opinion: '재고 소진 목적의 특가 요청.',
    history: [
      { when: '2026.08.10 14:00', action: '승인 요청', by: 'admin01' },
      { when: '2026.08.10 15:00', action: '반려', by: 'admin03', note: '할인율 과다' },
    ],
  },
];
