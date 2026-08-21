export type CreditStatus = '정상' | '임박' | '초과' | '연체';

export interface CreditHistory {
  when: string;
  field: string;
  from: string;
  to: string;
  reason: string;
  admin: string;
}
export interface CreditMemo {
  when: string;
  admin: string;
  text: string;
}

export interface CreditCompany {
  code: string;
  name: string;
  credit: boolean;
  limit: number;
  used: number;
  receivable: number;
  overdue: number;
  method: string;
  dueDays: string;
  cutoff: string;
  collectDay: string;
  minOrder: number;
  unit: string;
  currency: string;
  tax: string;
  priceBasis: string;
  arLimit: number;
  overduePeriod: string;
  overAction: string;
  hasConflict: boolean;
  conflictContract?: string;
  conflictTerms?: string;
  history: CreditHistory[];
  memos: CreditMemo[];
}

export const CREDIT_COMPANIES: CreditCompany[] = [
  {
    code: 'C-00123', name: '회사 01', credit: true, limit: 50000000, used: 32000000, receivable: 0, overdue: 0,
    method: '후불', dueDays: '30일', cutoff: '월말 마감', collectDay: '익월 15일', minOrder: 500000, unit: '-', currency: 'KRW', tax: '별도', priceBasis: '계약 단가',
    arLimit: 10000000, overduePeriod: '30일', overAction: '신규 주문 제한', hasConflict: false,
    history: [
      { when: '2026.08.13 14:20', field: '신용한도', from: '30,000,000원', to: '50,000,000원', reason: '거래 규모 확대', admin: 'admin01' },
      { when: '2026.07.01 09:10', field: '결제 방식', from: '선결제', to: '후불 30일', reason: '거래처 요청', admin: 'admin02' },
    ],
    memos: [{ when: '2026.08.13', admin: 'admin01', text: '3분기 거래량 증가로 한도 상향 검토.' }],
  },
  {
    code: 'C-00122', name: '회사 02', credit: true, limit: 20000000, used: 22500000, receivable: 3000000, overdue: 0,
    method: '후불', dueDays: '30일', cutoff: '월말 마감', collectDay: '익월 10일', minOrder: 300000, unit: '-', currency: 'KRW', tax: '포함', priceBasis: '기본 공급가',
    arLimit: 5000000, overduePeriod: '15일', overAction: '승인 필요', hasConflict: false,
    history: [{ when: '2026.07.28 10:00', field: '신용거래', from: '미사용', to: '사용', reason: '거래 개시', admin: 'admin02' }],
    memos: [],
  },
  {
    code: 'C-00119', name: '㈜한빛물산', credit: true, limit: 30000000, used: 18000000, receivable: 0, overdue: 0,
    method: '후불', dueDays: '10일', cutoff: '월말 마감', collectDay: '익월 10일', minOrder: 500000, unit: '-', currency: 'KRW', tax: '별도', priceBasis: '계약 단가',
    arLimit: 8000000, overduePeriod: '30일', overAction: '경고', hasConflict: true, conflictContract: 'CT-0009', conflictTerms: '후불 45일',
    history: [{ when: '2026.03.12 09:00', field: '신용한도', from: '-', to: '30,000,000원', reason: '거래 개시', admin: 'admin01' }],
    memos: [],
  },
  {
    code: 'C-00107', name: '대성유통', credit: true, limit: 5000000, used: 3400000, receivable: 3400000, overdue: 2000000,
    method: '후불', dueDays: '-', cutoff: '익월 말 결제', collectDay: '-', minOrder: 200000, unit: '-', currency: 'KRW', tax: '별도', priceBasis: '기본 공급가',
    arLimit: 3000000, overduePeriod: '15일', overAction: '제한', hasConflict: false,
    history: [{ when: '2026.07.01 15:40', field: '신용거래', from: '사용', to: '거래 제한', reason: '연체 발생', admin: 'admin03' }],
    memos: [{ when: '2026.07.01', admin: 'admin03', text: '연체 장기화로 거래 제한 처리.' }],
  },
  {
    code: 'C-00098', name: '원일테크', credit: true, limit: 20000000, used: 22000000, receivable: 10000000, overdue: 0,
    method: '후불', dueDays: '15일', cutoff: '월말 마감', collectDay: '익월 15일', minOrder: 1000000, unit: '-', currency: 'KRW', tax: '별도', priceBasis: '거래처별 단가',
    arLimit: 15000000, overduePeriod: '30일', overAction: '승인 필요', hasConflict: false,
    history: [{ when: '2026.08.05 10:15', field: '신용한도', from: '20,000,000원', to: '20,000,000원 (초과)', reason: '한도 초과 경고', admin: 'admin02' }],
    memos: [],
  },
  {
    code: 'C-00081', name: '늘푸른상사', credit: false, limit: 0, used: 0, receivable: 0, overdue: 0,
    method: '선결제', dueDays: '-', cutoff: '-', collectDay: '-', minOrder: 100000, unit: '-', currency: 'KRW', tax: '포함', priceBasis: '기본 공급가',
    arLimit: 0, overduePeriod: '-', overAction: '허용', hasConflict: false,
    history: [{ when: '2024.09.01 10:00', field: '신용거래', from: '-', to: '미사용', reason: '선결제 거래처', admin: 'admin01' }],
    memos: [],
  },
  {
    code: 'C-00076', name: '케이스퀘어', credit: true, limit: 80000000, used: 21000000, receivable: 0, overdue: 0,
    method: '후불', dueDays: '10일', cutoff: '월말 마감', collectDay: '익월 10일', minOrder: 1000000, unit: '-', currency: 'KRW', tax: '별도', priceBasis: '계약 단가',
    arLimit: 20000000, overduePeriod: '30일', overAction: '경고', hasConflict: true, conflictContract: 'CT-0030', conflictTerms: '후불 60일',
    history: [{ when: '2026.02.01 09:00', field: '신용한도', from: '50,000,000원', to: '80,000,000원', reason: '거래 규모 확대', admin: 'admin03' }],
    memos: [],
  },
  {
    code: 'C-00061', name: '정성무역', credit: false, limit: 0, used: 0, receivable: 0, overdue: 0,
    method: '선결제', dueDays: '-', cutoff: '-', collectDay: '-', minOrder: 0, unit: '-', currency: 'KRW', tax: '-', priceBasis: '기본 공급가',
    arLimit: 0, overduePeriod: '-', overAction: '허용', hasConflict: false,
    history: [{ when: '2026.08.10 16:20', field: '신용거래', from: '-', to: '미사용', reason: '회사 등록', admin: 'admin02' }],
    memos: [],
  },
];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function statusOf(c: CreditCompany): CreditStatus {
  if (!c.credit) return '정상';
  if (c.used > c.limit) return '초과';
  if (c.overdue > 0) return '연체';
  if (c.limit > 0 && c.used / c.limit >= 0.8) return '임박';
  return '정상';
}

export const CREDIT_STATUS_META: Record<CreditStatus, { bg: string; fg: string }> = {
  정상: { bg: '#ecfdf5', fg: '#059669' },
  임박: { bg: '#fffbeb', fg: '#d97706' },
  초과: { bg: '#fef2f2', fg: '#dc2626' },
  연체: { bg: '#fef2f2', fg: '#dc2626' },
};

export interface CreditFilterDef {
  key: string;
  match: (c: CreditCompany) => boolean;
}

export const CREDIT_FILTERS: CreditFilterDef[] = [
  { key: '전체', match: () => true },
  { key: '신용거래', match: (c) => c.credit },
  { key: '한도초과', match: (c) => statusOf(c) === '초과' },
  { key: '연체', match: (c) => c.overdue > 0 },
  { key: '거래제한', match: (c) => c.overAction === '제한' },
];
