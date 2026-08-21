import { formatNumber } from '../../lib/theme';

export type PurchaseOrderStatus = '접수' | '검토중' | '확정' | '처리중' | '완료' | '취소';

export interface PurchaseOrderItem {
  name: string;
  code: string;
  qty: number;
  unit: string;
  unitPrice: number;
  priceBasis: string;
  moq: string;
  due: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface MemoEntry {
  when: string;
  admin: string;
  text: string;
}

export interface FileEntry {
  name: string;
  meta: string;
}

export interface CreditInfo {
  limit: number;
  used: number;
}

export interface PurchaseOrder {
  id: string;
  partner: string;
  contact: string;
  status: PurchaseOrderStatus;
  owner: string;
  amount: number;
  dueDate: string;
  created: string;
  basis: string;
  rfq: string | null;
  quote: string | null;
  contract: string | null;
  items: PurchaseOrderItem[];
  priceMismatch: boolean;
  paymentTerm: string;
  deliveryPlace: string;
  deliveryContact: string;
  remark: string;
  credit: CreditInfo;
  moqOk: boolean;
  contractOk: boolean;
  supplyOk: boolean;
  order?: string;
  files: FileEntry[];
  memos: MemoEntry[];
  history: HistoryEntry[];
}

export const STATUSES: Array<'전체' | PurchaseOrderStatus> = ['전체', '접수', '검토중', '확정', '처리중', '완료', '취소'];

export const STATUS_META: Record<PurchaseOrderStatus, { bg: string; fg: string }> = {
  접수: { bg: '#eff6ff', fg: '#2563eb' },
  검토중: { bg: '#fffbeb', fg: '#d97706' },
  확정: { bg: '#ecfdf5', fg: '#059669' },
  처리중: { bg: '#eef2ff', fg: '#4f46e5' },
  완료: { bg: '#f4f4f5', fg: '#71717a' },
  취소: { bg: '#fef2f2', fg: '#dc2626' },
};

export function fmt(n: number): string {
  return formatNumber(n) + '원';
}

export function shortDate(d: string): string {
  return d.slice(5).replace('-', '.');
}

export function issueOf(o: PurchaseOrder): string[] {
  const issues: string[] = [];
  if (o.priceMismatch) issues.push('가격 불일치');
  if (!o.moqOk) issues.push('MOQ 미충족');
  if (o.credit.used + o.amount > o.credit.limit) issues.push('신용한도 초과');
  if (!o.supplyOk) issues.push('공급 불가 상품');
  return issues;
}

export const PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'PO-00182', partner: '회사 01', contact: '김OO · 구매팀', status: '접수', owner: '미배정', amount: 4820000, dueDate: '2026.08.30', created: '2026.08.14', basis: '견적', rfq: 'RFQ-1028', quote: 'Q-00182', contract: null,
    items: [
      { name: '상품명 01', code: 'P-001238', qty: 100, unit: 'EA', unitPrice: 29000, priceBasis: '거래처별 가격', moq: '10개', due: '2026.08.30' },
      { name: '상품명 02', code: 'P-001239', qty: 50, unit: 'BOX', unitPrice: 35000, priceBasis: '기본 공급가', moq: '20개', due: '2026.08.30' },
    ],
    priceMismatch: false, paymentTerm: '후불 30일', deliveryPlace: '본사 물류창고', deliveryContact: '이OO', remark: '2층 입고',
    credit: { limit: 50000000, used: 44000000 }, moqOk: true, contractOk: true, supplyOk: true,
    files: [{ name: '발주서_회사01_0814.pdf', meta: '320KB' }],
    memos: [], history: [{ when: '2026.08.14 09:10', action: '발주 접수', by: '거래처' }],
  },
  {
    id: 'PO-00181', partner: '회사 02', contact: '박OO · 자재팀', status: '검토중', owner: 'admin01', amount: 8200000, dueDate: '2026.09.05', created: '2026.08.14', basis: '계약', rfq: null, quote: null, contract: 'CT-00120',
    items: [
      { name: '상품명 03', code: 'P-001240', qty: 80, unit: 'EA', unitPrice: 98000, priceBasis: '계약 단가', moq: '1개', due: '2026.09.05' },
      { name: '상품명 04', code: 'P-001241', qty: 30, unit: 'EA', unitPrice: 15000, priceBasis: '거래처별 가격', moq: '30개', due: '2026.09.05' },
    ],
    priceMismatch: true, paymentTerm: '후불 45일', deliveryPlace: '사업장 02', deliveryContact: '최OO', remark: '-',
    credit: { limit: 30000000, used: 26500000 }, moqOk: true, contractOk: true, supplyOk: true,
    files: [], memos: [{ when: '2026.08.14', admin: 'admin01', text: '단가 차이 거래처 확인 중.' }],
    history: [
      { when: '2026.08.14 09:40', action: '발주 접수', by: '거래처' },
      { when: '2026.08.14 10:20', action: '검토 시작', by: 'admin01' },
      { when: '2026.08.14 10:40', action: '가격 불일치 확인', by: 'admin01' },
    ],
  },
  {
    id: 'PO-00170', partner: '㈜한빛물산', contact: '최OO · 구매팀', status: '확정', owner: 'admin02', amount: 1500000, dueDate: '2026.08.22', created: '2026.08.12', basis: '견적', rfq: 'RFQ-0990', quote: 'Q-00170', contract: null,
    items: [{ name: '상품명 05', code: 'P-000982', qty: 25, unit: 'EA', unitPrice: 60000, priceBasis: '거래처별 가격', moq: '20개', due: '2026.08.22' }],
    priceMismatch: false, paymentTerm: '후불 30일', deliveryPlace: '본사', deliveryContact: '김OO', remark: '',
    credit: { limit: 20000000, used: 8000000 }, moqOk: true, contractOk: true, supplyOk: true,
    files: [], memos: [], history: [
      { when: '2026.08.12 09:00', action: '발주 접수', by: '거래처' },
      { when: '2026.08.12 10:20', action: '검토 시작', by: 'admin02' },
      { when: '2026.08.12 13:20', action: '발주 확정', by: 'admin02' },
    ],
  },
  {
    id: 'PO-00155', partner: '대성유통', contact: '한OO · 구매팀', status: '처리중', owner: 'admin01', amount: 900000, dueDate: '2026.08.20', created: '2026.08.10', basis: '직접 발주', rfq: null, quote: null, contract: null,
    items: [{ name: '상품명 01', code: 'P-001238', qty: 30, unit: 'EA', unitPrice: 30000, priceBasis: '기본 공급가', moq: '10개', due: '2026.08.20' }],
    priceMismatch: false, paymentTerm: '선불', deliveryPlace: '본사', deliveryContact: '한OO', remark: '',
    credit: { limit: 10000000, used: 9500000 }, moqOk: true, contractOk: true, supplyOk: true, order: 'O-00382',
    files: [], memos: [], history: [
      { when: '2026.08.10 14:00', action: '발주 접수', by: '거래처' },
      { when: '2026.08.10 15:00', action: '발주 확정', by: 'admin01' },
      { when: '2026.08.10 15:05', action: '주문 O-00382 생성', by: 'system' },
    ],
  },
  {
    id: 'PO-00098', partner: '케이스퀘어', contact: '정OO · 운영팀', status: '완료', owner: 'admin03', amount: 110000, dueDate: '2026.08.06', created: '2026.08.05', basis: '견적', rfq: 'RFQ-1015', quote: 'Q-00119', contract: null,
    items: [{ name: '상품명 03', code: 'P-001240', qty: 1, unit: 'EA', unitPrice: 100000, priceBasis: '거래처별 가격', moq: '1개', due: '2026.08.06' }],
    priceMismatch: false, paymentTerm: '선불', deliveryPlace: '본사', deliveryContact: '정OO', remark: '',
    credit: { limit: 15000000, used: 3000000 }, moqOk: true, contractOk: true, supplyOk: true, order: 'O-00192',
    files: [], memos: [], history: [
      { when: '2026.08.05 13:00', action: '발주 접수', by: '거래처' },
      { when: '2026.08.05 14:00', action: '발주 확정', by: 'admin03' },
      { when: '2026.08.06 09:30', action: '완료 처리', by: 'admin03' },
    ],
  },
  {
    id: 'PO-00060', partner: '회사 02', contact: '박OO · 자재팀', status: '취소', owner: 'admin01', amount: 640000, dueDate: '2026.07.30', created: '2026.07.22', basis: '직접 발주', rfq: null, quote: null, contract: null,
    items: [{ name: '상품명 02', code: 'P-001239', qty: 20, unit: 'BOX', unitPrice: 32000, priceBasis: '기본 공급가', moq: '20개', due: '2026.07.30' }],
    priceMismatch: false, paymentTerm: '후불 30일', deliveryPlace: '사업장 02', deliveryContact: '박OO', remark: '',
    credit: { limit: 30000000, used: 26500000 }, moqOk: true, contractOk: true, supplyOk: false,
    files: [], memos: [], history: [
      { when: '2026.07.22 10:00', action: '발주 접수', by: '거래처' },
      { when: '2026.07.23 09:00', action: '발주 취소', by: 'admin01', note: '상품 공급 불가' },
    ],
  },
];
