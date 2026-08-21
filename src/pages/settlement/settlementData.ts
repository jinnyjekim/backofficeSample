import { ACCENT } from '../../lib/theme';

export type SettlementStatus = '정산대기' | '정산확정' | '지급예정' | '지급완료' | '보류' | '지급실패';

export interface AdjustmentEntry {
  amount: number;
  reason: string;
  by: string;
  when: string;
}

export interface SettlementTx {
  orderId: string;
  date: string;
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
  period: string;
  due: string;
  gross: number;
  refund: number;
  fee: number;
  other: number;
  status: SettlementStatus;
  payAt: string;
  payMethod: string;
  payAccount: string;
  warn: string | null;
  adjustments: AdjustmentEntry[];
  tx: SettlementTx[];
  history: SettlementHistoryEntry[];
  memos: SettlementMemo[];
}

export const SETTLEMENTS: Settlement[] = [
  {
    id: 'S-00231', target: '대상 001', period: '2026.08.01 ~ 2026.08.07', due: '2026.08.14',
    gross: 1500000, refund: 120000, fee: 180000, other: 20000, status: '정산확정',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****1234', warn: null,
    adjustments: [{ amount: 30000, reason: '이전 정산 누락분 반영', by: 'admin01', when: '2026.08.09 10:20' }],
    tx: [
      { orderId: 'O-00391', date: '08.01', amount: '48,000원', reflected: '43,200원', status: '반영', fg: '#059669' },
      { orderId: 'O-00392', date: '08.01', amount: '22,000원', reflected: '19,800원', status: '반영', fg: '#059669' },
      { orderId: 'O-00393', date: '08.03', amount: '12,000원', reflected: '0원', status: '환불', fg: '#dc2626' },
    ],
    history: [
      { when: '08.08 02:00', title: '정산 생성', by: '시스템' },
      { when: '08.09 10:20', title: '조정금액 +30,000원', by: 'admin01' },
      { when: '08.09 11:05', title: '정산 확정', detail: '1,410,000원', by: 'admin02' },
    ],
    memos: [{ when: '08.08 15:10', by: 'admin02', text: '정산 근거 확인 완료.' }],
  },
  {
    id: 'S-00230', target: '대상 002', period: '2026.08.01 ~ 2026.08.07', due: '2026.08.14',
    gross: 820000, refund: 60000, fee: 90000, other: 0, status: '정산대기',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****5521', warn: null,
    adjustments: [],
    tx: [{ orderId: 'O-00401', date: '08.02', amount: '21,000원', reflected: '18,900원', status: '반영', fg: '#059669' }],
    history: [{ when: '08.08 02:00', title: '정산 생성', by: '시스템' }],
    memos: [],
  },
  {
    id: 'S-00229', target: '대상 003', period: '2026.07.25 ~ 2026.07.31', due: '2026.08.07',
    gross: 430000, refund: 10000, fee: 50000, other: 0, status: '지급완료',
    payAt: '2026.08.14 10:03', payMethod: '등록된 지급 방식', payAccount: '****8821', warn: null,
    adjustments: [],
    tx: [{ orderId: 'O-00300', date: '07.26', amount: '35,000원', reflected: '31,500원', status: '반영', fg: '#059669' }],
    history: [
      { when: '08.01 02:00', title: '정산 생성', by: '시스템' },
      { when: '08.02 09:00', title: '정산 확정', detail: '370,000원', by: 'admin01' },
      { when: '08.14 10:00', title: '지급 요청', by: 'system' },
      { when: '08.14 10:03', title: '지급 완료', detail: '370,000원', by: 'system' },
    ],
    memos: [],
  },
  {
    id: 'S-00226', target: '대상 006', period: '2026.08.01 ~ 2026.08.07', due: '2026.08.14',
    gross: 1650000, refund: 200000, fee: 190000, other: 0, status: '지급예정',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****2290', warn: null,
    adjustments: [],
    tx: [{ orderId: 'O-00420', date: '08.05', amount: '64,000원', reflected: '57,600원', status: '반영', fg: '#059669' }],
    history: [
      { when: '08.08 02:00', title: '정산 생성', by: '시스템' },
      { when: '08.09 09:20', title: '정산 확정', detail: '1,260,000원', by: 'admin01' },
    ],
    memos: [],
  },
  {
    id: 'S-00227', target: '대상 005', period: '2026.08.01 ~ 2026.08.07', due: '2026.08.14',
    gross: 210000, refund: 5000, fee: 25000, other: 0, status: '보류',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****7723', warn: '거래 데이터 확인 필요',
    adjustments: [],
    tx: [{ orderId: 'O-00410', date: '08.04', amount: '18,000원', reflected: '16,200원', status: '반영', fg: '#059669' }],
    history: [
      { when: '08.08 02:00', title: '정산 생성', by: '시스템' },
      { when: '08.09 09:00', title: '정산 보류', detail: '거래 데이터 확인 필요', by: 'admin01' },
    ],
    memos: [],
  },
  {
    id: 'S-00225', target: '대상 007', period: '2026.07.25 ~ 2026.07.31', due: '2026.08.07',
    gross: 390000, refund: 0, fee: 45000, other: 0, status: '지급실패',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****9987', warn: '지급 요청을 완료하지 못했습니다 (REFUND_FAILED)',
    adjustments: [],
    tx: [{ orderId: 'O-00301', date: '07.26', amount: '29,000원', reflected: '26,100원', status: '반영', fg: '#059669' }],
    history: [
      { when: '08.01 02:00', title: '정산 생성', by: '시스템' },
      { when: '08.02 09:00', title: '정산 확정', detail: '345,000원', by: 'admin02' },
      { when: '08.14 10:15', title: '지급 요청', by: 'system' },
      { when: '08.14 10:20', title: '지급 처리 실패', detail: 'REFUND_FAILED', by: 'system' },
    ],
    memos: [],
  },
  {
    id: 'S-00224', target: '대상 008', period: '2026.08.01 ~ 2026.08.07', due: '2026.08.14',
    gross: 560000, refund: 30000, fee: 65000, other: 10000, status: '정산대기',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****2290', warn: '정산금액 불일치',
    adjustments: [],
    tx: [{ orderId: 'O-00430', date: '08.06', amount: '42,000원', reflected: '37,800원', status: '반영', fg: '#059669' }],
    history: [{ when: '08.08 02:00', title: '정산 생성', by: '시스템' }],
    memos: [],
  },
  {
    id: 'S-00223', target: '대상 009', period: '2026.07.18 ~ 2026.07.24', due: '2026.08.07',
    gross: 275000, refund: 0, fee: 30000, other: 0, status: '정산확정',
    payAt: '-', payMethod: '등록된 지급 방식', payAccount: '****1234', warn: '지급 예정일 초과',
    adjustments: [],
    tx: [{ orderId: 'O-00280', date: '07.19', amount: '25,000원', reflected: '22,500원', status: '반영', fg: '#059669' }],
    history: [
      { when: '07.25 02:00', title: '정산 생성', by: '시스템' },
      { when: '07.26 09:00', title: '정산 확정', detail: '245,000원', by: 'admin01' },
    ],
    memos: [],
  },
];

export const STATUS_META: Record<SettlementStatus, { bg: string; fg: string }> = {
  정산대기: { bg: '#fffbeb', fg: '#b45309' },
  정산확정: { bg: '#eef2ff', fg: '#4338ca' },
  지급예정: { bg: '#eef2ff', fg: '#4338ca' },
  지급완료: { bg: '#ecfdf5', fg: '#059669' },
  보류: { bg: '#f4f4f5', fg: '#52525b' },
  지급실패: { bg: '#fef2f2', fg: '#b91c1c' },
};

export const FILTER_KEYS: readonly ('전체' | SettlementStatus)[] = ['전체', '정산대기', '정산확정', '지급예정', '지급완료', '보류', '지급실패'];

export function fmt(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function signed(n: number): string {
  return (n < 0 ? '-' : n > 0 ? '+' : '') + fmt(Math.abs(n));
}

export function calcFinal(r: Settlement): number {
  return r.gross - r.refund - r.fee - r.other + r.adjustments.reduce((a, x) => a + x.amount, 0);
}

export function buildCounts(list: Settlement[]): Record<string, number> {
  const counts: Record<string, number> = { 전체: list.length };
  (FILTER_KEYS.slice(1) as SettlementStatus[]).forEach((k) => {
    counts[k] = list.filter((r) => r.status === k).length;
  });
  return counts;
}

export function filterSettlements(list: Settlement[], filter: string, q: string): Settlement[] {
  return list.filter((r) => {
    if (filter !== '전체' && r.status !== filter) return false;
    if (q && !(r.id.includes(q) || r.target.includes(q))) return false;
    return true;
  });
}

export const ACCENT_COLOR = ACCENT;
