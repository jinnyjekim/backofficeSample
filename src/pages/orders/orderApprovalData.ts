import { formatNumber } from '../../lib/theme';

export type ApprovalStatus = '대기' | '완료' | '반려';

export interface ApprovalItem {
  name: string;
  qty: number;
  unitPrice: number;
  priceBasis: string;
  verifyOk: boolean;
}

export interface MoqCheck {
  name: string;
  qty: number;
  moq: number;
  ok: boolean;
}

export interface ContractInfo {
  no: string;
  unitPrice: number;
  orderPrice: number;
  remainQty: number;
  orderQty: number;
}

export interface CreditInfo {
  limit: number;
  used: number;
}

export interface SupplyCheck {
  name: string;
  status: string;
}

export interface ChainStep {
  stage: string;
  admin: string;
  status: '완료' | '대기중' | '반려';
  when: string;
}

export interface HistoryEntry {
  when: string;
  action: string;
  by: string;
  note?: string;
}

export interface Approval {
  id: string;
  poNo: string;
  partner: string;
  amount: number;
  quoteAmount: number;
  dueRequested: string;
  dueConfirmed: string;
  stage: string;
  stageLabel: string;
  requester: string;
  approver: string;
  requestedAt: string;
  status: ApprovalStatus;
  mine: boolean;
  reasons: string[];
  items: ApprovalItem[];
  moqChecks: MoqCheck[];
  contract: ContractInfo | null;
  credit: CreditInfo;
  overdue: number;
  tradeStatus: string;
  supplyChecks: SupplyCheck[];
  chain: ChainStep[];
  opinion: string;
  history: HistoryEntry[];
}

export const STATUS_META: Record<ApprovalStatus, { bg: string; fg: string }> = {
  대기: { bg: '#fffbeb', fg: '#d97706' },
  완료: { bg: '#ecfdf5', fg: '#059669' },
  반려: { bg: '#fef2f2', fg: '#dc2626' },
};

export const FILTER_KEYS = ['승인대기', '내 승인대기', '승인완료', '반려', '전체'] as const;
export type FilterKey = (typeof FILTER_KEYS)[number];

export function fmt(n: number): string {
  return formatNumber(n) + '원';
}

export const APPROVALS: Approval[] = [
  {
    id: 'O-00582', poNo: 'PO-00182', partner: '회사 01', amount: 4820000, quoteAmount: 4500000, dueRequested: '08.30', dueConfirmed: '09.02', stage: '1/2', stageLabel: '1차 승인', requester: 'admin01', approver: 'admin03', requestedAt: '2026.08.14 13:20', status: '대기', mine: true,
    reasons: ['신용한도 사용률 기준 초과', '상품 02 최소 주문수량(MOQ) 미충족'],
    items: [
      { name: '상품명 01', qty: 100, unitPrice: 29000, priceBasis: '계약단가', verifyOk: true },
      { name: '상품명 02', qty: 30, unitPrice: 35000, priceBasis: '개별단가', verifyOk: false },
    ],
    moqChecks: [{ name: '상품명 01', qty: 100, moq: 50, ok: true }, { name: '상품명 02', qty: 30, moq: 50, ok: false }],
    contract: { no: 'CT-00128', unitPrice: 29000, orderPrice: 29000, remainQty: 500, orderQty: 100 },
    credit: { limit: 50000000, used: 45500000 }, overdue: 0, tradeStatus: '거래중 · 신용거래 사용 · 거래 제한 없음',
    supplyChecks: [{ name: '상품 01', status: '공급가능' }, { name: '상품 02', status: '공급가능' }],
    chain: [
      { stage: '1차 승인', admin: 'admin02', status: '완료', when: '2026.08.14 13:40' },
      { stage: '2차 승인', admin: 'admin03', status: '대기중', when: '요청 2026.08.14 13:20' },
    ],
    opinion: '회사 01과 협의된 예외 주문입니다. 다음 달 정산 시 신용한도 조정 예정입니다.',
    history: [
      { when: '2026.08.14 13:20', action: '승인 요청', by: 'admin01' },
      { when: '2026.08.14 13:40', action: '1차 승인', by: 'admin02' },
    ],
  },
  {
    id: 'O-00581', poNo: 'PO-00181', partner: '회사 02', amount: 12400000, quoteAmount: 0, dueRequested: '09.05', dueConfirmed: '09.05', stage: '2/2', stageLabel: '2차 승인', requester: 'admin02', approver: 'admin05', requestedAt: '2026.08.14 11:00', status: '대기', mine: true,
    reasons: ['계약단가와 주문단가 불일치', '신용한도 초과 예상'],
    items: [
      { name: '상품명 03', qty: 80, unitPrice: 95000, priceBasis: '예외단가', verifyOk: false },
      { name: '상품명 04', qty: 30, unitPrice: 15000, priceBasis: '개별단가', verifyOk: true },
    ],
    moqChecks: [{ name: '상품명 03', qty: 80, moq: 1, ok: true }, { name: '상품명 04', qty: 30, moq: 30, ok: true }],
    contract: { no: 'CT-00120', unitPrice: 98000, orderPrice: 95000, remainQty: 200, orderQty: 80 },
    credit: { limit: 30000000, used: 26500000 }, overdue: 2000000, tradeStatus: '거래중 · 21일 연체 발생 · 승인 필요',
    supplyChecks: [{ name: '상품 03', status: '공급가능' }, { name: '상품 04', status: '공급가능' }],
    chain: [
      { stage: '1차 승인', admin: 'admin02', status: '완료', when: '2026.08.14 11:40' },
      { stage: '2차 승인', admin: 'admin05', status: '대기중', when: '요청 2026.08.14 11:40' },
    ],
    opinion: '대량 발주 조건으로 단가 인하 협의, 연체 건은 별도 확인 중.',
    history: [
      { when: '2026.08.14 11:00', action: '승인 요청', by: 'admin02' },
      { when: '2026.08.14 11:40', action: '1차 승인', by: 'admin02' },
    ],
  },
  {
    id: 'O-00570', poNo: 'PO-00170', partner: '㈜한빛물산', amount: 1500000, quoteAmount: 1500000, dueRequested: '08.22', dueConfirmed: '08.22', stage: '1/1', stageLabel: '단일 승인', requester: 'admin02', approver: 'admin03', requestedAt: '2026.08.12 10:20', status: '완료', mine: false,
    reasons: [], items: [{ name: '상품명 05', qty: 25, unitPrice: 60000, priceBasis: '거래처별 가격', verifyOk: true }],
    moqChecks: [{ name: '상품명 05', qty: 25, moq: 20, ok: true }],
    contract: null, credit: { limit: 20000000, used: 8000000 }, overdue: 0, tradeStatus: '거래중 · 정상',
    supplyChecks: [{ name: '상품 05', status: '공급가능' }],
    chain: [{ stage: '단일 승인', admin: 'admin03', status: '완료', when: '2026.08.12 10:20' }],
    opinion: '정상 범위 주문.',
    history: [
      { when: '2026.08.12 09:00', action: '승인 요청', by: 'admin02' },
      { when: '2026.08.12 10:20', action: '승인', by: 'admin03' },
    ],
  },
  {
    id: 'O-00560', poNo: 'PO-00155', partner: '대성유통', amount: 900000, quoteAmount: 0, dueRequested: '08.20', dueConfirmed: '08.20', stage: '1/1', stageLabel: '단일 승인', requester: 'admin01', approver: 'admin03', requestedAt: '2026.08.10 15:00', status: '반려', mine: false,
    reasons: ['공급 불가 상품 포함'], items: [{ name: '상품명 01', qty: 30, unitPrice: 30000, priceBasis: '기본 공급가', verifyOk: true }],
    moqChecks: [{ name: '상품명 01', qty: 30, moq: 10, ok: true }],
    contract: null, credit: { limit: 10000000, used: 9500000 }, overdue: 0, tradeStatus: '거래중 · 정상',
    supplyChecks: [{ name: '상품 01', status: '일시 공급중지' }],
    chain: [{ stage: '단일 승인', admin: 'admin03', status: '반려', when: '2026.08.10 16:00' }],
    opinion: '재고 소진 목적 발주.',
    history: [
      { when: '2026.08.10 15:00', action: '승인 요청', by: 'admin01' },
      { when: '2026.08.10 16:00', action: '반려', by: 'admin03', note: '상품 공급 불가' },
    ],
  },
];
