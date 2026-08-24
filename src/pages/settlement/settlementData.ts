import { ACCENT } from '../../lib/theme';

export type SettleStatus = '정산대기' | '검토중' | '정산확정' | '보류';
export type PayStatus = '지급전' | '지급예정' | '지급완료' | '지급실패' | '지급보류';

export interface FeeItem {
  label: string;
  amount: number;
}

export interface AdjustmentEntry {
  amount: number;
  reason: string;
  by: string;
  when: string;
}

export interface SettlementTx {
  orderId: string;
  date: string;
  type: '주문' | '환불';
  amount: string;
  reflected: string;
  status: string;
  fg: string;
}

export interface SettlementHistoryEntry {
  when: string;
  title: string;
  detail?: string;
  by?: string;
}

export interface SettlementMemo {
  when: string;
  by: string;
  text: string;
}

export interface Settlement {
  id: string;
  target: string;
  bizNo: string;
  period: string;
  txCount: number;
  gross: number;
  feeItems: FeeItem[];
  adjustments: AdjustmentEntry[];
  settleStatus: SettleStatus;
  payStatus: PayStatus;
  dueDate: string;
  payDate: string | null;
  payMethod: string;
  payAccount: string;
  assignee: string;
  taxInvoice: '발행완료' | '미발행';
  issues: string[];
  tx: SettlementTx[];
  history: SettlementHistoryEntry[];
  memos: SettlementMemo[];
}

export const SETTLEMENTS: Settlement[] = [
  {
    id: 'SET-0182', target: '회사 01', bizNo: '123-45-67890', period: '2026.08.01 ~ 2026.08.15',
    txCount: 42, gross: 12000000,
    feeItems: [
      { label: '플랫폼 수수료', amount: 300000 },
      { label: '결제 수수료', amount: 120000 },
      { label: '배송비', amount: 80000 },
    ],
    adjustments: [{ amount: 100000, reason: '정산 누락분 보정', by: 'admin01', when: '2026.08.18 11:00' }],
    settleStatus: '정산확정', payStatus: '지급예정',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 01 · ****1234',
    assignee: 'admin01', taxInvoice: '발행완료', issues: [],
    tx: [
      { orderId: 'O-00182', date: '08.02', type: '주문', amount: '2,000,000원', reflected: '1,900,000원', status: '반영', fg: '#059669' },
      { orderId: 'O-00191', date: '08.05', type: '주문', amount: '3,000,000원', reflected: '2,850,000원', status: '반영', fg: '#059669' },
      { orderId: 'REF-0012', date: '08.08', type: '환불', amount: '-500,000원', reflected: '-500,000원', status: '반영', fg: '#dc2626' },
      { orderId: 'O-00201', date: '08.12', type: '주문', amount: '5,000,000원', reflected: '4,750,000원', status: '반영', fg: '#059669' },
    ],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', detail: '정산기간 08.01 ~ 08.15', by: '시스템' },
      { when: '2026.08.18 09:02', title: '거래 42건 집계 완료', by: '시스템' },
      { when: '2026.08.18 10:20', title: '정산 검토 시작', by: 'admin01' },
      { when: '2026.08.18 11:00', title: '조정 +100,000원 등록', detail: '정산 누락분 보정', by: 'admin01' },
      { when: '2026.08.18 13:10', title: '정산 확정', detail: '11,600,000원', by: 'admin01' },
    ],
    memos: [
      { when: '2026.08.18 15:10', by: 'admin01', text: '환불 1건 반영 여부 확인 완료.' },
      { when: '2026.08.20 09:40', by: 'admin02', text: '세금계산서 발행 완료 확인.' },
    ],
  },
  {
    id: 'SET-0181', target: '회사 02', bizNo: '234-56-78901', period: '2026.08.01 ~ 2026.08.15',
    txCount: 28, gross: 8000000,
    feeItems: [{ label: '플랫폼 수수료', amount: 300000 }],
    adjustments: [],
    settleStatus: '검토중', payStatus: '지급전',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 02 · ****5521',
    assignee: 'admin02', taxInvoice: '미발행', issues: ['세금계산서 미발행'],
    tx: [
      { orderId: 'O-00210', date: '08.03', type: '주문', amount: '1,200,000원', reflected: '1,080,000원', status: '반영', fg: '#059669' },
      { orderId: 'O-00233', date: '08.09', type: '주문', amount: '900,000원', reflected: '810,000원', status: '반영', fg: '#059669' },
    ],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', detail: '정산기간 08.01 ~ 08.15', by: '시스템' },
      { when: '2026.08.19 10:00', title: '정산 검토 시작', by: 'admin02' },
    ],
    memos: [],
  },
  {
    id: 'SET-0180', target: '회사 03', bizNo: '345-67-89012', period: '2026.08.01 ~ 2026.08.15',
    txCount: 15, gross: 3200000,
    feeItems: [{ label: '플랫폼 수수료', amount: 150000 }],
    adjustments: [{ amount: -50000, reason: '이전 정산 과지급 조정', by: 'admin02', when: '2026.08.17 14:00' }],
    settleStatus: '정산대기', payStatus: '지급전',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 01 · ****7710',
    assignee: 'admin01', taxInvoice: '미발행', issues: ['정산 거래금액 불일치'],
    tx: [{ orderId: 'O-00240', date: '08.06', type: '주문', amount: '620,000원', reflected: '558,000원', status: '반영', fg: '#059669' }],
    history: [{ when: '2026.08.18 09:00', title: '정산 생성', detail: '정산기간 08.01 ~ 08.15', by: '시스템' }],
    memos: [{ when: '2026.08.18 16:00', by: 'admin01', text: '거래금액 불일치 원인 확인 중.' }],
  },
  {
    id: 'SET-0179', target: '회사 04', bizNo: '456-78-90123', period: '2026.07.16 ~ 2026.07.31',
    txCount: 33, gross: 5400000,
    feeItems: [{ label: '플랫폼 수수료', amount: 220000 }, { label: '결제 수수료', amount: 40000 }],
    adjustments: [],
    settleStatus: '정산확정', payStatus: '지급완료',
    dueDate: '2026.08.20', payDate: '2026.08.20 10:20',
    payMethod: '계좌이체', payAccount: '은행 03 · ****2290',
    assignee: 'admin03', taxInvoice: '발행완료', issues: [],
    tx: [{ orderId: 'O-00120', date: '07.20', type: '주문', amount: '1,800,000원', reflected: '1,690,000원', status: '반영', fg: '#059669' }],
    history: [
      { when: '2026.08.01 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.02 11:00', title: '정산 확정', detail: '5,140,000원', by: 'admin03' },
      { when: '2026.08.20 10:00', title: '지급 요청', by: 'system' },
      { when: '2026.08.20 10:20', title: '지급 완료', detail: '5,140,000원', by: 'system' },
    ],
    memos: [],
  },
  {
    id: 'SET-0178', target: '회사 05', bizNo: '567-89-01234', period: '2026.08.01 ~ 2026.08.15',
    txCount: 9, gross: 900000,
    feeItems: [{ label: '플랫폼 수수료', amount: 80000 }],
    adjustments: [],
    settleStatus: '보류', payStatus: '지급전',
    dueDate: '2026.08.22', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 02 · ****7723',
    assignee: 'admin01', taxInvoice: '미발행', issues: ['거래 데이터 확인 필요'],
    tx: [{ orderId: 'O-00250', date: '08.07', type: '주문', amount: '410,000원', reflected: '369,000원', status: '반영', fg: '#059669' }],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.19 09:00', title: '정산 보류', detail: '거래 데이터 확인 필요', by: 'admin01' },
    ],
    memos: [],
  },
  {
    id: 'SET-0177', target: '회사 06', bizNo: '678-90-12345', period: '2026.07.16 ~ 2026.07.31',
    txCount: 21, gross: 2100000,
    feeItems: [{ label: '플랫폼 수수료', amount: 150000 }, { label: '결제 수수료', amount: 40000 }],
    adjustments: [],
    settleStatus: '정산확정', payStatus: '지급실패',
    dueDate: '2026.08.20', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 04 · ****9987',
    assignee: 'admin02', taxInvoice: '발행완료', issues: ['지급계좌 오류'],
    tx: [{ orderId: 'O-00131', date: '07.22', type: '주문', amount: '900,000원', reflected: '810,000원', status: '반영', fg: '#059669' }],
    history: [
      { when: '2026.08.01 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.02 09:30', title: '정산 확정', detail: '1,910,000원', by: 'admin02' },
      { when: '2026.08.20 10:15', title: '지급 요청', by: 'system' },
      { when: '2026.08.20 10:20', title: '지급 처리 실패', detail: 'ACCOUNT_ERROR', by: 'system' },
    ],
    memos: [],
  },
  {
    id: 'SET-0176', target: '회사 07', bizNo: '789-01-23456', period: '2026.08.01 ~ 2026.08.15',
    txCount: 6, gross: 460000,
    feeItems: [{ label: '플랫폼 수수료', amount: 45000 }],
    adjustments: [],
    settleStatus: '정산확정', payStatus: '지급보류',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 01 · ****3312',
    assignee: 'admin03', taxInvoice: '미발행', issues: ['세금계산서 미발행'],
    tx: [{ orderId: 'O-00260', date: '08.09', type: '주문', amount: '460,000원', reflected: '415,000원', status: '반영', fg: '#059669' }],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.18 14:00', title: '정산 확정', detail: '415,000원', by: 'admin03' },
      { when: '2026.08.19 09:00', title: '지급 보류', detail: '세금계산서 미발행', by: 'admin03' },
    ],
    memos: [],
  },
  {
    id: 'SET-0175', target: '회사 08', bizNo: '890-12-34567', period: '2026.08.01 ~ 2026.08.15',
    txCount: 24, gross: 1650000,
    feeItems: [{ label: '플랫폼 수수료', amount: 150000 }, { label: '배송비', amount: 40000 }],
    adjustments: [{ amount: 80000, reason: '프로모션 부담금 환입', by: 'admin01', when: '2026.08.19 09:30' }],
    settleStatus: '정산확정', payStatus: '지급예정',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 03 · ****2201',
    assignee: 'admin01', taxInvoice: '발행완료', issues: [],
    tx: [{ orderId: 'O-00270', date: '08.10', type: '주문', amount: '640,000원', reflected: '576,000원', status: '반영', fg: '#059669' }],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.19 09:30', title: '조정 +80,000원 등록', detail: '프로모션 부담금 환입', by: 'admin01' },
      { when: '2026.08.19 10:00', title: '정산 확정', detail: '1,540,000원', by: 'admin01' },
    ],
    memos: [],
  },
  {
    id: 'SET-0174', target: '회사 09', bizNo: '901-23-45678', period: '2026.08.16 ~ 2026.08.31',
    txCount: 4, gross: 275000,
    feeItems: [{ label: '플랫폼 수수료', amount: 30000 }],
    adjustments: [],
    settleStatus: '정산대기', payStatus: '지급전',
    dueDate: '2026.09.01', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 02 · ****4410',
    assignee: 'admin02', taxInvoice: '미발행', issues: [],
    tx: [{ orderId: 'O-00281', date: '08.20', type: '주문', amount: '275,000원', reflected: '245,000원', status: '반영', fg: '#059669' }],
    history: [{ when: '2026.09.01 09:00', title: '정산 생성', by: '시스템' }],
    memos: [],
  },
  {
    id: 'SET-0173', target: '회사 10', bizNo: '012-34-56789', period: '2026.08.01 ~ 2026.08.15',
    txCount: 11, gross: 500000,
    feeItems: [{ label: '환불 차감', amount: 800000 }],
    adjustments: [],
    settleStatus: '정산확정', payStatus: '지급보류',
    dueDate: '2026.08.25', payDate: null,
    payMethod: '계좌이체', payAccount: '은행 04 · ****8890',
    assignee: 'admin03', taxInvoice: '미발행', issues: ['마이너스 정산 · 이월 검토 필요'],
    tx: [{ orderId: 'REF-0021', date: '08.11', type: '환불', amount: '-800,000원', reflected: '-800,000원', status: '반영', fg: '#dc2626' }],
    history: [
      { when: '2026.08.18 09:00', title: '정산 생성', by: '시스템' },
      { when: '2026.08.18 15:00', title: '정산 확정', detail: '-300,000원', by: 'admin03' },
      { when: '2026.08.19 09:00', title: '지급 보류', detail: '마이너스 정산 처리 방식 확인 필요', by: 'admin03' },
    ],
    memos: [{ when: '2026.08.19 09:10', by: 'admin03', text: '다음 정산으로 이월할지 별도 채권 처리할지 확인 필요.' }],
  },
];

export const SETTLE_STATUS_META: Record<SettleStatus, { bg: string; fg: string }> = {
  정산대기: { bg: '#fffbeb', fg: '#b45309' },
  검토중: { bg: '#eff6ff', fg: '#2563eb' },
  정산확정: { bg: '#eef2ff', fg: '#4338ca' },
  보류: { bg: '#f4f4f5', fg: '#52525b' },
};

export const PAY_STATUS_META: Record<PayStatus, { bg: string; fg: string }> = {
  지급전: { bg: '#f4f4f5', fg: '#71717a' },
  지급예정: { bg: '#eef2ff', fg: '#4338ca' },
  지급완료: { bg: '#ecfdf5', fg: '#059669' },
  지급실패: { bg: '#fef2f2', fg: '#b91c1c' },
  지급보류: { bg: '#fff7ed', fg: '#c2410c' },
};

export const MAIN_QUICK_FILTERS = ['전체', '정산대기', '검토필요', '정산확정', '지급예정', '지급완료', '보류·실패'] as const;
export type MainQuickFilter = (typeof MAIN_QUICK_FILTERS)[number];

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function signed(n: number): string {
  return (n < 0 ? '-' : n > 0 ? '+' : '') + fmt(Math.abs(n));
}

export function calcFee(r: Settlement): number {
  return r.feeItems.reduce((a, x) => a + x.amount, 0);
}

export function calcAdjustTotal(r: Settlement): number {
  return r.adjustments.reduce((a, x) => a + x.amount, 0);
}

export function calcFinal(r: Settlement): number {
  return r.gross - calcFee(r) + calcAdjustTotal(r);
}

export function matchesMainQuickFilter(r: Settlement, key: MainQuickFilter): boolean {
  switch (key) {
    case '전체':
      return true;
    case '정산대기':
      return r.settleStatus === '정산대기';
    case '검토필요':
      return r.settleStatus === '검토중';
    case '정산확정':
      return r.settleStatus === '정산확정';
    case '지급예정':
      return r.payStatus === '지급예정';
    case '지급완료':
      return r.payStatus === '지급완료';
    case '보류·실패':
      return r.settleStatus === '보류' || r.payStatus === '지급실패' || r.payStatus === '지급보류';
    default:
      return true;
  }
}

export function buildMainQuickCounts(list: Settlement[]): Record<string, number> {
  const counts: Record<string, number> = {};
  MAIN_QUICK_FILTERS.forEach((k) => {
    counts[k] = list.filter((r) => matchesMainQuickFilter(r, k)).length;
  });
  return counts;
}

export function matchesQuery(r: Settlement, q: string): boolean {
  if (!q) return true;
  return r.id.includes(q) || r.target.includes(q) || r.bizNo.includes(q) || r.assignee.includes(q);
}

export function filterSettlements(list: Settlement[], filter: MainQuickFilter, q: string): Settlement[] {
  return list.filter((r) => matchesMainQuickFilter(r, filter) && matchesQuery(r, q));
}

export interface FlatTx extends SettlementTx {
  settlementId: string;
  target: string;
}
export function flattenTx(list: Settlement[]): FlatTx[] {
  return list.flatMap((r) => r.tx.map((t) => ({ ...t, settlementId: r.id, target: r.target })));
}

export interface FlatAdjustment extends AdjustmentEntry {
  settlementId: string;
  target: string;
}
export function flattenAdjustments(list: Settlement[]): FlatAdjustment[] {
  return list.flatMap((r) => r.adjustments.map((a) => ({ ...a, settlementId: r.id, target: r.target })));
}

export const ACCENT_COLOR = ACCENT;
