import { formatNumber } from '../../lib/theme';

export type ProcessingStatus = '처리 대기' | '처리중' | '보류' | '처리 완료';

export interface ProcessingItem {
  name: string;
  qty: number;
  done: number;
  due: string;
}

export interface SupplyRow {
  name: string;
  qty: number;
  avail: number;
  ok: boolean;
}

export interface ChangeInfo {
  from: number;
  to: number;
  note: string;
}

export interface MemoEntry {
  when: string;
  admin: string;
  text: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface ProcessingOrder {
  id: string;
  partner: string;
  amount: number;
  status: ProcessingStatus;
  owner: string;
  dueRequested: string;
  planned: string;
  paymentTerm: string;
  deliveryPlace: string;
  remark: string;
  items: ProcessingItem[];
  supply: SupplyRow[];
  change: ChangeInfo | null;
  holdReason: string | null;
  holdResume: string | null;
  memos: MemoEntry[];
  history: HistoryEntry[];
}

export const STATUS_META: Record<ProcessingStatus, { bg: string; fg: string }> = {
  '처리 대기': { bg: '#eff6ff', fg: '#2563eb' },
  처리중: { bg: '#eef2ff', fg: '#4f46e5' },
  보류: { bg: '#fef2f2', fg: '#dc2626' },
  '처리 완료': { bg: '#ecfdf5', fg: '#059669' },
};

export const FILTER_KEYS = ['처리 대기', '처리중', '보류', '지연', '처리 완료', '전체'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmt(n: number): string {
  return formatNumber(n) + '원';
}

const TODAY = new Date('2026-08-17');

export function isDelayed(o: ProcessingOrder): boolean {
  return o.planned !== '-' && o.status !== '처리 완료' && new Date(o.planned.replace(/\./g, '-')) < TODAY;
}

export const PROCESSING_ORDERS: ProcessingOrder[] = [
  {
    id: 'O-00582', partner: '회사 01', amount: 4820000, status: '처리중', owner: 'admin01', dueRequested: '2026.08.30', planned: '2026.08.16', paymentTerm: '후불 30일', deliveryPlace: '본사 물류창고', remark: '2층 입고',
    items: [
      { name: '상품명 01', qty: 100, done: 100, due: '2026.08.15' },
      { name: '상품명 02', qty: 50, done: 30, due: '2026.08.16' },
      { name: '상품명 03', qty: 50, done: 0, due: '2026.08.17' },
    ],
    supply: [
      { name: '상품 01', qty: 100, avail: 240, ok: true },
      { name: '상품 02', qty: 50, avail: 20, ok: false },
      { name: '상품 03', qty: 50, avail: 80, ok: true },
    ],
    change: null, holdReason: null, holdResume: null,
    memos: [{ when: '2026.08.14', admin: 'admin01', text: '상품02 공급 일정 08.16 확정.' }],
    history: [
      { when: '2026.08.14 09:10', action: '주문 확정', by: 'system' },
      { when: '2026.08.14 09:15', action: '처리 대기 등록', by: 'system' },
      { when: '2026.08.14 10:20', action: '처리 시작', by: 'admin01' },
      { when: '2026.08.14 14:30', action: '상품01 100개 처리 완료', by: 'admin01' },
      { when: '2026.08.15 09:40', action: '상품02 30개 처리', by: 'admin01' },
    ],
  },
  {
    id: 'O-00581', partner: '회사 02', amount: 8200000, status: '보류', owner: 'admin02', dueRequested: '2026.09.05', planned: '2026.08.15', paymentTerm: '후불 45일', deliveryPlace: '사업장 02', remark: '-',
    items: [
      { name: '상품명 03', qty: 80, done: 10, due: '2026.09.02' },
      { name: '상품명 04', qty: 30, done: 0, due: '2026.09.03' },
    ],
    supply: [
      { name: '상품 03', qty: 80, avail: 60, ok: false },
      { name: '상품 04', qty: 30, avail: 50, ok: true },
    ],
    change: null, holdReason: '재고/공급 부족', holdResume: '2026.08.18',
    memos: [],
    history: [
      { when: '2026.08.14 09:40', action: '처리 시작', by: 'admin02' },
      { when: '2026.08.15 11:10', action: '재고 부족으로 처리 보류', by: 'admin02', note: '재고/공급 부족' },
    ],
  },
  {
    id: 'O-00570', partner: '㈜한빛물산', amount: 1500000, status: '처리 대기', owner: '미배정', dueRequested: '2026.08.22', planned: '-', paymentTerm: '후불 30일', deliveryPlace: '본사', remark: '',
    items: [{ name: '상품명 05', qty: 25, done: 0, due: '2026.08.20' }],
    supply: [{ name: '상품 05', qty: 25, avail: 100, ok: true }],
    change: null, holdReason: null, holdResume: null,
    memos: [],
    history: [
      { when: '2026.08.12 13:20', action: '주문 확정', by: 'admin02' },
      { when: '2026.08.12 13:25', action: '처리 대기 등록', by: 'system' },
    ],
  },
  {
    id: 'O-00560', partner: '대성유통', amount: 900000, status: '처리 완료', owner: 'admin01', dueRequested: '2026.08.20', planned: '2026.08.18', paymentTerm: '선불', deliveryPlace: '본사', remark: '',
    items: [{ name: '상품명 01', qty: 30, done: 30, due: '2026.08.18' }],
    supply: [{ name: '상품 01', qty: 30, avail: 200, ok: true }],
    change: null, holdReason: null, holdResume: null,
    memos: [],
    history: [
      { when: '2026.08.10 15:00', action: '주문 확정', by: 'admin01' },
      { when: '2026.08.11 09:00', action: '처리 시작', by: 'admin01' },
      { when: '2026.08.18 10:00', action: '처리 완료', by: 'admin01' },
    ],
  },
  {
    id: 'O-00553', partner: '케이스퀘어', amount: 110000, status: '처리중', owner: 'admin03', dueRequested: '2026.08.06', planned: '2026.08.05', paymentTerm: '선불', deliveryPlace: '본사', remark: '',
    items: [{ name: '상품명 03', qty: 1, done: 0, due: '2026.08.05' }],
    supply: [{ name: '상품 03', qty: 1, avail: 20, ok: true }],
    change: { from: 1, to: 2, note: '거래처 요청으로 수량 1→2개 변경' }, holdReason: null, holdResume: null,
    memos: [],
    history: [
      { when: '2026.08.05 13:00', action: '처리 시작', by: 'admin03' },
      { when: '2026.08.05 15:00', action: '주문 변경 발생 (수량 +1)', by: '거래처' },
    ],
  },
];
