import { formatNumber } from '../../lib/theme';

export type CompletedType = '정상완료' | '부분완료' | '취소포함완료';
export type PaymentStatus = '수금완료' | '미수금' | '부분수금';

export interface CompletedItem {
  name: string;
  origQty: number;
  finalQty: number;
  unitPrice: number;
  result: '완료' | '부분취소' | '취소포함';
}

export interface DeliveryRound {
  label: string;
  when: string;
  qty: number;
}

export interface Revision {
  label: string;
  note: string;
  amount: string;
}

export interface CompletedLinks {
  rfq: string;
  quote: string;
  po: string;
  contract: string;
  delivery: string;
  invoice: string;
  payment: string;
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

export interface CompletedOrder {
  id: string;
  partner: string;
  type: CompletedType;
  completedAt: string;
  completedBy: string;
  method: string;
  owner: string;
  origAmount: number;
  changeAmount: number;
  cancelAmount: number;
  finalAmount: number;
  origQty: number;
  finalQty: number;
  items: CompletedItem[];
  processStart: string;
  processDone: string;
  shipDone: string;
  deliverDone: string;
  deliveryRounds: DeliveryRound[];
  billed: number;
  collected: number;
  paymentStatus: PaymentStatus;
  change: { note: string } | null;
  revisions: Revision[];
  links: CompletedLinks;
  docs: string[];
  issue: string | null;
  memos: MemoEntry[];
  history: HistoryEntry[];
}

export const TYPE_META: Record<CompletedType, { bg: string; fg: string; label: string }> = {
  정상완료: { bg: '#ecfdf5', fg: '#059669', label: '정상 완료' },
  부분완료: { bg: '#fffbeb', fg: '#d97706', label: '부분 완료' },
  취소포함완료: { bg: '#f4f4f5', fg: '#52525b', label: '취소 포함 완료' },
};

export const FILTER_KEYS = ['전체 완료', '이번 달 완료', '정상 완료', '부분 완료', '완료 후 이슈'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmt(n: number): string {
  return (n < 0 ? '-' : '') + formatNumber(Math.abs(n)) + '원';
}

export function fmtSigned(n: number): string {
  return (n > 0 ? '+' : n < 0 ? '-' : '') + formatNumber(Math.abs(n)) + '원';
}

export function isThisMonth(o: CompletedOrder): boolean {
  return o.completedAt.startsWith('2026.08');
}

export const COMPLETED_ORDERS: CompletedOrder[] = [
  {
    id: 'O-00582', partner: '회사 01', type: '정상완료', completedAt: '2026.08.18', completedBy: 'admin01', method: '수동 완료', owner: 'admin01',
    origAmount: 5000000, changeAmount: 0, cancelAmount: -180000, finalAmount: 4820000,
    origQty: 200, finalQty: 200,
    items: [
      { name: '상품명 01', origQty: 100, finalQty: 100, unitPrice: 29000, result: '완료' },
      { name: '상품명 02', origQty: 50, finalQty: 50, unitPrice: 35000, result: '완료' },
      { name: '상품명 03', origQty: 50, finalQty: 50, unitPrice: 8400, result: '완료' },
    ],
    processStart: '2026.08.14', processDone: '2026.08.16', shipDone: '2026.08.17', deliverDone: '2026.08.18',
    deliveryRounds: [{ label: '1차 납품', when: '08.16', qty: 120 }, { label: '2차 납품', when: '08.18', qty: 80 }],
    billed: 4820000, collected: 4820000, paymentStatus: '수금완료',
    change: null,
    revisions: [{ label: 'R1 최초', note: '최초 주문', amount: '5,000,000원' }, { label: 'R2 최종', note: '납품 확정 반영', amount: '4,820,000원' }],
    links: { rfq: 'RFQ-1028', quote: 'Q-00182 / V2', po: 'PO-00182', contract: 'CT-00128', delivery: 'DL-00291', invoice: 'INV-00128', payment: 'PAY-00291' },
    docs: ['원본 발주서.pdf', '거래명세서.pdf', '납품확인서.pdf'],
    issue: null,
    memos: [{ when: '2026.08.18', admin: 'admin01', text: '최종 납품 확인 후 완료 처리.' }],
    history: [
      { when: '08.10', action: '견적 요청 RFQ-1028', by: '회사 01' },
      { when: '08.11', action: '견적서 Q-00182 V1 작성', by: 'admin01' },
      { when: '08.12', action: '견적 승인', by: 'admin03' },
      { when: '08.14', action: '발주 PO-00182 접수', by: '회사 01' },
      { when: '08.14', action: '주문 승인', by: 'admin03' },
      { when: '08.15', action: '주문 처리 시작', by: 'admin01' },
      { when: '08.16', action: '1차 납품', by: 'admin01' },
      { when: '08.18', action: '최종 납품', by: 'admin01' },
      { when: '08.18', action: '주문 완료', by: 'admin01' },
    ],
  },
  {
    id: 'O-00581', partner: '회사 02', type: '부분완료', completedAt: '2026.08.17', completedBy: 'admin02', method: '수동 완료', owner: 'admin02',
    origAmount: 8000000, changeAmount: 0, cancelAmount: -400000, finalAmount: 7600000,
    origQty: 110, finalQty: 90,
    items: [
      { name: '상품명 03', origQty: 80, finalQty: 80, unitPrice: 95000, result: '완료' },
      { name: '상품명 04', origQty: 30, finalQty: 10, unitPrice: 15000, result: '부분취소' },
    ],
    processStart: '2026.08.12', processDone: '2026.08.15', shipDone: '2026.08.16', deliverDone: '2026.08.17',
    deliveryRounds: [{ label: '1차 납품', when: '08.16', qty: 60 }, { label: '2차 납품', when: '08.17', qty: 30 }],
    billed: 7600000, collected: 0, paymentStatus: '미수금',
    change: { note: '상품04 20개 거래처 협의로 공급 종료, 잔여수량 취소 반영.' },
    revisions: [{ label: 'R1 최초', note: '최초 주문', amount: '8,000,000원' }, { label: 'R2 최종', note: '상품04 부분 취소 반영', amount: '7,600,000원' }],
    links: { rfq: 'RFQ-1031', quote: 'Q-00185 / V1', po: 'PO-00181', contract: '없음', delivery: 'DL-00293', invoice: 'INV-00131', payment: '없음' },
    docs: ['원본 발주서.pdf', '거래명세서.pdf', '납품확인서.pdf'],
    issue: '미수금 7,600,000원',
    memos: [{ when: '2026.08.17', admin: 'admin02', text: '상품04 40개 거래처 요청으로 취소.' }],
    history: [
      { when: '08.09', action: '견적서 Q-00185 V1 작성', by: 'admin02' },
      { when: '08.11', action: '발주 PO-00181 접수', by: '회사 02' },
      { when: '08.12', action: '주문 승인', by: 'admin03' },
      { when: '08.12', action: '주문 처리 시작', by: 'admin02' },
      { when: '08.15', action: '상품04 수량 협의로 부분 취소', by: 'admin02', note: '거래처 협의' },
      { when: '08.16', action: '1차 납품', by: 'admin02' },
      { when: '08.17', action: '최종 납품', by: 'admin02' },
      { when: '08.17', action: '부분 완료 처리', by: 'admin02' },
    ],
  },
  {
    id: 'O-00575', partner: '㈜한빛물산', type: '취소포함완료', completedAt: '2026.08.15', completedBy: 'admin03', method: '수동 완료', owner: 'admin03',
    origAmount: 2000000, changeAmount: 0, cancelAmount: -500000, finalAmount: 1500000,
    origQty: 200, finalQty: 150,
    items: [{ name: '상품명 05', origQty: 200, finalQty: 150, unitPrice: 10000, result: '취소포함' }],
    processStart: '2026.08.10', processDone: '2026.08.12', shipDone: '2026.08.13', deliverDone: '2026.08.14',
    deliveryRounds: [{ label: '1차 납품', when: '08.14', qty: 150 }],
    billed: 1500000, collected: 1500000, paymentStatus: '수금완료',
    change: { note: '상품05 50개 취소(C-00182), 나머지 150개 정상 납품 후 완료.' },
    revisions: [{ label: 'R1 최초', note: '최초 주문', amount: '2,000,000원' }, { label: 'R2 최종', note: '50개 취소 반영', amount: '1,500,000원' }],
    links: { rfq: '없음', quote: '없음', po: 'PO-00175', contract: '없음', delivery: 'DL-00287', invoice: 'INV-00120', payment: 'PAY-00281' },
    docs: ['원본 발주서.pdf', '거래명세서.pdf'],
    issue: null,
    memos: [],
    history: [
      { when: '08.09', action: '발주 PO-00175 접수', by: '㈜한빛물산' },
      { when: '08.09', action: '주문 승인', by: 'admin03' },
      { when: '08.10', action: '주문 처리 시작', by: 'admin03' },
      { when: '08.11', action: '상품05 50개 취소 C-00182', by: '㈜한빛물산' },
      { when: '08.14', action: '최종 납품', by: 'admin03' },
      { when: '08.15', action: '취소 포함 완료 처리', by: 'admin03' },
    ],
  },
  {
    id: 'O-00560', partner: '대성유통', type: '정상완료', completedAt: '2026.08.10', completedBy: 'System', method: '자동 완료', owner: 'admin01',
    origAmount: 900000, changeAmount: 0, cancelAmount: 0, finalAmount: 900000,
    origQty: 30, finalQty: 30,
    items: [{ name: '상품명 01', origQty: 30, finalQty: 30, unitPrice: 30000, result: '완료' }],
    processStart: '2026.08.08', processDone: '2026.08.09', shipDone: '2026.08.09', deliverDone: '2026.08.10',
    deliveryRounds: [{ label: '1차 납품', when: '08.10', qty: 30 }],
    billed: 900000, collected: 900000, paymentStatus: '수금완료',
    change: null,
    revisions: [{ label: 'R1 최종', note: '최초 주문', amount: '900,000원' }],
    links: { rfq: '없음', quote: '없음', po: 'PO-00160', contract: '없음', delivery: 'DL-00278', invoice: 'INV-00110', payment: 'PAY-00270' },
    docs: ['거래명세서.pdf'],
    issue: null,
    memos: [],
    history: [
      { when: '08.07', action: '발주 PO-00160 접수', by: '대성유통' },
      { when: '08.07', action: '주문 승인', by: 'admin01' },
      { when: '08.08', action: '주문 처리 시작', by: 'admin01' },
      { when: '08.10', action: '최종 납품', by: 'admin01' },
      { when: '08.10', action: '주문 자동 완료', by: 'System', note: '모든 납품 완료' },
    ],
  },
  {
    id: 'O-00551', partner: '케이스퀘어', type: '정상완료', completedAt: '2026.07.30', completedBy: 'admin02', method: '수동 완료', owner: 'admin02',
    origAmount: 220000, changeAmount: 0, cancelAmount: 0, finalAmount: 220000,
    origQty: 2, finalQty: 2,
    items: [{ name: '상품명 03', origQty: 2, finalQty: 2, unitPrice: 110000, result: '완료' }],
    processStart: '2026.07.26', processDone: '2026.07.27', shipDone: '2026.07.28', deliverDone: '2026.07.29',
    deliveryRounds: [{ label: '1차 납품', when: '07.29', qty: 2 }],
    billed: 220000, collected: 220000, paymentStatus: '수금완료',
    change: null,
    revisions: [{ label: 'R1 최종', note: '최초 주문', amount: '220,000원' }],
    links: { rfq: '없음', quote: '없음', po: 'PO-00151', contract: '없음', delivery: 'DL-00260', invoice: 'INV-00098', payment: 'PAY-00255' },
    docs: ['거래명세서.pdf', '세금계산서.pdf'],
    issue: '재오픈 이력 있음',
    memos: [{ when: '2026.08.02', admin: 'admin03', text: '거래처 요청으로 세금계산서 재발행.' }],
    history: [
      { when: '07.25', action: '발주 PO-00151 접수', by: '케이스퀘어' },
      { when: '07.26', action: '주문 승인', by: 'admin02' },
      { when: '07.29', action: '최종 납품', by: 'admin02' },
      { when: '07.30', action: '주문 완료', by: 'admin02' },
      { when: '08.02', action: '주문 재오픈', by: 'admin03', note: '세금계산서 재발행 필요' },
      { when: '08.02', action: '주문 완료 (재처리)', by: 'admin03' },
    ],
  },
];
