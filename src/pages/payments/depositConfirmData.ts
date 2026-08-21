export type ConfirmStatus = '확인대기' | '확인필요' | '확인완료' | '보류';
export type DepositMatchStatus = '자동매칭' | '수동매칭' | '일부매칭' | '매칭완료' | '미매칭';

export interface InvoiceCandidate {
  no: string;
  remaining: string;
  due: string;
  matchLabel: string;
  fg: string;
}

export interface DepositResult {
  payment: string;
  invoice: string;
  collection: string;
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

export interface Deposit {
  id: string;
  depositedAt: string;
  depositor: string;
  amount: number;
  bank: string;
  account: string;
  txId: string;
  confirmStatus: ConfirmStatus;
  matchStatus: DepositMatchStatus;
  candidatePartner: string | null;
  candidateInvoice: string | null;
  candidateAmount: string | null;
  owner: string;
  invoiceCandidates: InvoiceCandidate[];
  collectSource: string;
  docs: string[];
  memos: Memo[];
  history: HistoryEntry[];
  issue: string | null;
  result: DepositResult | null;
}

export const CONFIRM_META: Record<ConfirmStatus, { bg: string; fg: string }> = {
  확인대기: { bg: '#eff6ff', fg: '#2563eb' },
  확인필요: { bg: '#fffbeb', fg: '#d97706' },
  확인완료: { bg: '#ecfdf5', fg: '#059669' },
  보류: { bg: '#f4f4f5', fg: '#71717a' },
};

export const MATCH_META: Record<DepositMatchStatus, { bg: string; fg: string }> = {
  자동매칭: { bg: '#eef2ff', fg: '#4f46e5' },
  수동매칭: { bg: '#eef2ff', fg: '#4f46e5' },
  일부매칭: { bg: '#fffbeb', fg: '#d97706' },
  매칭완료: { bg: '#ecfdf5', fg: '#059669' },
  미매칭: { bg: '#fef2f2', fg: '#dc2626' },
};

export const FILTER_KEYS = ['확인대기', '자동매칭', '확인필요', '미매칭', '금액불일치', '처리완료'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export const DEPOSITS: Deposit[] = [
  {
    id: 'DEP-00182', depositedAt: '2026.08.19 10:20', depositor: '회사 01', amount: 4820000, bank: '국민은행', account: '은행01 · 운영계좌', txId: 'TX-00182291',
    confirmStatus: '확인대기', matchStatus: '자동매칭', candidatePartner: '회사 01', candidateInvoice: 'INV-00182', candidateAmount: '4,820,000원', owner: '-',
    invoiceCandidates: [{ no: 'INV-00182', remaining: '4,820,000원', due: '2026.08.19', matchLabel: '✓ 금액 일치', fg: '#059669' }],
    collectSource: '은행 연동', docs: ['은행 거래내역.pdf'],
    memos: [], history: [{ when: '08.19 10:20', action: '은행 입금 수신', by: 'system' }, { when: '08.19 10:21', action: '자동 매칭 후보 생성 (회사 01 / INV-00182)', by: 'system' }],
    issue: null, result: null,
  },
  {
    id: 'DEP-00181', depositedAt: '2026.08.19 09:42', depositor: 'ABC상사', amount: 3000000, bank: '신한은행', account: '은행02 · B2B수금계좌', txId: 'TX-00182281',
    confirmStatus: '확인필요', matchStatus: '미매칭', candidatePartner: null, candidateInvoice: null, candidateAmount: null, owner: 'admin01',
    invoiceCandidates: [],
    collectSource: '은행 연동', docs: [],
    memos: [{ when: '08.19', admin: 'admin01', text: '입금자명이 사업자명과 달라 유선 확인 중.' }],
    history: [{ when: '08.19 09:42', action: '은행 입금 수신', by: 'system' }, { when: '08.19 09:45', action: '미매칭 등록', by: 'system' }],
    issue: '거래처를 확인할 수 없습니다', result: null,
  },
  {
    id: 'DEP-00179', depositedAt: '2026.08.18 15:00', depositor: '㈜한빛물산', amount: 1500000, bank: '우리은행', account: '은행01 · 운영계좌', txId: 'TX-00182179',
    confirmStatus: '확인완료', matchStatus: '매칭완료', candidatePartner: '㈜한빛물산', candidateInvoice: 'INV-00170', candidateAmount: '1,500,000원', owner: 'admin03',
    invoiceCandidates: [{ no: 'INV-00170', remaining: '0원', due: '2026.08.22', matchLabel: '완료', fg: '#71717a' }],
    collectSource: '은행 연동', docs: ['은행 거래내역.pdf', '입금확인증.pdf'],
    memos: [], history: [{ when: '08.18 15:00', action: '은행 입금 수신', by: 'system' }, { when: '08.18 15:20', action: 'INV-00170 연결 · 입금 확인 완료', by: 'admin03' }],
    issue: null, result: { payment: 'PAY-00179', invoice: 'INV-00170', collection: 'COL-00179' },
  },
  {
    id: 'DEP-00176', depositedAt: '2026.08.17 11:00', depositor: '회사 02', amount: 7000000, bank: '신한은행', account: '은행02 · B2B수금계좌', txId: 'TX-00182176',
    confirmStatus: '확인완료', matchStatus: '일부매칭', candidatePartner: '회사 02', candidateInvoice: 'INV-00181', candidateAmount: '10,000,000원', owner: 'admin02',
    invoiceCandidates: [{ no: 'INV-00181', remaining: '3,000,000원', due: '2026.08.31', matchLabel: '부분 입금', fg: '#d97706' }],
    collectSource: '은행 연동', docs: ['은행 거래내역.pdf'],
    memos: [{ when: '08.17', admin: 'admin02', text: '잔여 3,000,000원은 8월말 입금 예정.' }],
    history: [{ when: '08.17 11:00', action: '은행 입금 수신', by: 'system' }, { when: '08.17 11:10', action: 'INV-00181 부분 배분 · 입금 확인 완료', by: 'admin02' }],
    issue: '부분 입금 (잔여 미수 3,000,000원)', result: { payment: 'PAY-00176', invoice: 'INV-00181', collection: 'COL-00176' },
  },
  {
    id: 'DEP-00174', depositedAt: '2026.08.16 14:10', depositor: '회사 01', amount: 4820000, bank: '국민은행', account: '은행01 · 운영계좌', txId: 'TX-00182174',
    confirmStatus: '확인필요', matchStatus: '미매칭', candidatePartner: '회사 01', candidateInvoice: null, candidateAmount: null, owner: 'admin01',
    invoiceCandidates: [],
    collectSource: '은행 연동', docs: [],
    memos: [], history: [{ when: '08.16 14:10', action: '은행 입금 수신', by: 'system' }, { when: '08.19 10:22', action: '중복 입금 가능성 감지 (DEP-00182와 동일 금액·거래처)', by: 'system' }],
    issue: '중복 입금 의심 (DEP-00182와 동일 금액)', result: null,
  },
  {
    id: 'DEP-00168', depositedAt: '2026.08.12 10:00', depositor: '대성유통', amount: 900000, bank: '국민은행', account: '은행01 · 운영계좌', txId: 'TX-00182168',
    confirmStatus: '보류', matchStatus: '수동매칭', candidatePartner: '대성유통', candidateInvoice: 'INV-00160', candidateAmount: '900,000원', owner: 'admin01',
    invoiceCandidates: [{ no: 'INV-00160', remaining: '900,000원', due: '2026.05.20', matchLabel: '금액 불일치', fg: '#dc2626' }],
    collectSource: '수동 등록', docs: [],
    memos: [{ when: '08.12', admin: 'admin01', text: '거래처 확인 후 재검토 예정.' }],
    history: [{ when: '08.12 10:00', action: '관리자 직접 등록', by: 'admin01' }, { when: '08.12 10:30', action: '확인 보류 (거래처 확인 필요)', by: 'admin01' }],
    issue: '확인 보류 · 재확인 예정 08.20', result: null,
  },
];
