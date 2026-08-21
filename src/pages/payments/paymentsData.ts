export type PaymentStatus = '완료' | '확인대기' | '부분결제' | '실패' | '취소';
export type MatchStatus = '매칭완료' | '일부매칭' | '미매칭';

export interface PaymentAllocation {
  invoice: string;
  invoiceAmount: string;
  allocated: string;
}

export interface PaymentLink {
  label: string;
  value: string;
}

export interface Memo {
  when: string;
  admin: string;
  text: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
}

export interface Payment {
  id: string;
  partner: string;
  method: string;
  amount: number;
  paidAt: string;
  confirmedAt: string | null;
  confirmedBy: string | null;
  status: PaymentStatus;
  match: MatchStatus;
  depositor: string;
  bank: string;
  txId: string;
  owner: string;
  allocations: PaymentAllocation[];
  links: PaymentLink[];
  docs: string[];
  memos: Memo[];
  history: HistoryEntry[];
  issue: string | null;
}

export const STATUS_META: Record<PaymentStatus, { bg: string; fg: string }> = {
  완료: { bg: '#ecfdf5', fg: '#059669' },
  확인대기: { bg: '#fffbeb', fg: '#d97706' },
  부분결제: { bg: '#eef2ff', fg: '#4f46e5' },
  실패: { bg: '#fef2f2', fg: '#dc2626' },
  취소: { bg: '#f4f4f5', fg: '#71717a' },
};

export const MATCH_META: Record<MatchStatus, { bg: string; fg: string }> = {
  매칭완료: { bg: '#ecfdf5', fg: '#059669' },
  일부매칭: { bg: '#fffbeb', fg: '#d97706' },
  미매칭: { bg: '#fef2f2', fg: '#dc2626' },
};

export const FILTER_KEYS = ['전체', '결제완료', '확인대기', '부분결제', '실패', '취소', '미매칭'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export const PAYMENTS: Payment[] = [
  {
    id: 'PAY-00182', partner: '회사 01', method: '계좌이체', amount: 4820000, paidAt: '2026.08.19 10:20', confirmedAt: '2026.08.19 10:32', confirmedBy: 'admin01',
    status: '완료', match: '매칭완료', depositor: '회사 01', bank: '국민은행', txId: 'TX-0082182', owner: 'admin01',
    allocations: [{ invoice: 'INV-00182', invoiceAmount: '4,820,000원', allocated: '4,820,000원' }],
    links: [{ label: '주문', value: 'O-00582' }, { label: '발주', value: 'PO-00182' }, { label: '계약', value: 'CT-00182' }, { label: '청구', value: 'INV-00182' }],
    docs: ['입금확인증.pdf'],
    memos: [{ when: '2026.08.19', admin: 'admin01', text: 'INV-00182에 매칭 완료.' }],
    history: [{ when: '2026.08.19 10:20', action: '결제정보 수신', by: 'system' }, { when: '2026.08.19 10:32', action: '회사 01 확인 · 결제 완료', by: 'admin01' }],
    issue: null,
  },
  {
    id: 'PAY-00181', partner: '회사 02', method: '무통장입금', amount: 3000000, paidAt: '2026.08.19 09:10', confirmedAt: null, confirmedBy: null,
    status: '확인대기', match: '미매칭', depositor: '회사이자재', bank: '신한은행', txId: 'TX-0082181', owner: 'admin02',
    allocations: [],
    links: [{ label: '주문', value: '-' }, { label: '발주', value: '-' }, { label: '계약', value: '-' }, { label: '청구', value: '-' }],
    docs: [],
    memos: [{ when: '2026.08.19', admin: 'admin02', text: '입금자명이 사업자명과 달라 전화 확인 중.' }],
    history: [{ when: '2026.08.19 09:10', action: '결제정보 수신', by: 'system' }, { when: '2026.08.19 09:15', action: '미매칭 등록', by: 'system' }],
    issue: '미매칭 · 결제 확인 대기',
  },
  {
    id: 'PAY-00179', partner: '㈜한빛물산', method: '계좌이체', amount: 1500000, paidAt: '2026.08.18 15:00', confirmedAt: '2026.08.18 15:20', confirmedBy: 'admin03',
    status: '완료', match: '매칭완료', depositor: '㈜한빛물산', bank: '우리은행', txId: 'TX-0082179', owner: 'admin03',
    allocations: [{ invoice: 'INV-00170', invoiceAmount: '1,500,000원', allocated: '1,500,000원' }],
    links: [{ label: '주문', value: 'O-00570' }, { label: '발주', value: 'PO-00170' }, { label: '계약', value: '없음' }, { label: '청구', value: 'INV-00170' }],
    docs: ['입금확인증.pdf'],
    memos: [],
    history: [{ when: '2026.08.18 15:00', action: '결제정보 수신', by: 'system' }, { when: '2026.08.18 15:20', action: '결제 완료', by: 'admin03' }],
    issue: null,
  },
  {
    id: 'PAY-00176', partner: '회사 02', method: '계좌이체', amount: 7000000, paidAt: '2026.08.17 11:00', confirmedAt: '2026.08.17 11:10', confirmedBy: 'admin02',
    status: '부분결제', match: '일부매칭', depositor: '회사 02', bank: '신한은행', txId: 'TX-0082176', owner: 'admin02',
    allocations: [{ invoice: 'INV-00181', invoiceAmount: '10,000,000원', allocated: '7,000,000원' }],
    links: [{ label: '주문', value: 'O-00581' }, { label: '발주', value: 'PO-00181' }, { label: '계약', value: 'CT-00181' }, { label: '청구', value: 'INV-00181' }],
    docs: ['입금확인증.pdf'],
    memos: [{ when: '2026.08.17', admin: 'admin02', text: '잔여 3,000,000원 8월말 입금 예정.' }],
    history: [{ when: '2026.08.17 11:00', action: '결제정보 수신', by: 'system' }, { when: '2026.08.17 11:10', action: 'INV-00181 부분 배분 · 결제 완료', by: 'admin02' }],
    issue: '청구금액 대비 부분 결제 (미수 3,000,000원)',
  },
  {
    id: 'PAY-00170', partner: '대성유통', method: '카드', amount: 900000, paidAt: '2026.08.10 09:00', confirmedAt: '2026.08.10 09:00', confirmedBy: 'system',
    status: '실패', match: '미매칭', depositor: '대성유통', bank: '-', txId: 'TID-00170', owner: 'admin01',
    allocations: [],
    links: [{ label: '주문', value: 'O-00560' }, { label: '발주', value: '-' }, { label: '계약', value: '-' }, { label: '청구', value: '-' }],
    docs: [],
    memos: [],
    history: [{ when: '2026.08.10 09:00', action: '카드 승인 요청', by: 'system' }, { when: '2026.08.10 09:00', action: '승인 거절 (E-102)', by: 'PG' }],
    issue: '결제 실패 (승인 거절)',
  },
  {
    id: 'PAY-00165', partner: '케이스퀘어', method: '계좌이체', amount: 110000, paidAt: '2026.07.30 14:00', confirmedAt: '2026.07.30 14:10', confirmedBy: 'admin02',
    status: '취소', match: '매칭완료', depositor: '케이스퀘어', bank: '국민은행', txId: 'TX-0082165', owner: 'admin02',
    allocations: [{ invoice: 'INV-00151', invoiceAmount: '110,000원', allocated: '0원' }],
    links: [{ label: '주문', value: 'O-00551' }, { label: '발주', value: 'PO-00151' }, { label: '계약', value: 'CT-00098' }, { label: '청구', value: 'INV-00151' }],
    docs: ['입금확인증.pdf'],
    memos: [{ when: '2026.08.01', admin: 'admin02', text: '거래처 요청으로 전액 취소 처리.' }],
    history: [{ when: '2026.07.30 14:00', action: '결제정보 수신', by: 'system' }, { when: '2026.07.30 14:10', action: '결제 완료', by: 'admin02' }, { when: '2026.08.01 10:00', action: '결제 전체 취소', by: 'admin03' }],
    issue: null,
  },
];
