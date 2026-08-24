export type TradeStatus = '거래대기' | '거래중' | '거래중지' | '거래종료';

export interface TradeImpact {
  activeContracts: number;
  activeOrders: number;
  shippingInProgress: number;
  receivable: number;
  overdue: number;
  unsettled: number;
}

export interface TradeStatusChange {
  when: string;
  from: TradeStatus;
  to: TradeStatus;
  reason: string;
  detail?: string;
  by: string;
  snapshot: { receivable: number; overdue: number; activeOrders: number };
}

export interface TradeMemo {
  when: string;
  by: string;
  text: string;
}

export interface PendingChange {
  toStatus: TradeStatus;
  applyDate: string;
  reason: string;
}

export interface TradeStatusRecord {
  code: string;
  name: string;
  bizNo: string;
  status: TradeStatus;
  tradeStartDate: string;
  lastDealDate: string;
  statusChangedAt: string;
  statusReason: string;
  manager: string;
  issues: string[];
  impact: TradeImpact;
  creditLimit: number;
  creditUsed: number;
  pendingChange: PendingChange | null;
  history: TradeStatusChange[];
  memos: TradeMemo[];
}

export const TRADE_STATUSES: TradeStatus[] = ['거래대기', '거래중', '거래중지', '거래종료'];
export const QUICK_FILTER_LABELS = ['전체', ...TRADE_STATUSES] as const;

export const TRADE_STATUS_META: Record<TradeStatus, { bg: string; fg: string }> = {
  거래대기: { bg: '#fffbeb', fg: '#d97706' },
  거래중: { bg: '#ecfdf5', fg: '#059669' },
  거래중지: { bg: '#fef2f2', fg: '#dc2626' },
  거래종료: { bg: '#f4f4f5', fg: '#71717a' },
};

// 현재 상태에서 허용되는 다음 상태 목록 (거래종료에서는 일반 전환을 허용하지 않음)
export const ALLOWED_TRANSITIONS: Record<TradeStatus, TradeStatus[]> = {
  거래대기: ['거래중', '거래종료'],
  거래중: ['거래중지', '거래종료'],
  거래중지: ['거래중', '거래종료'],
  거래종료: [],
};

export const REASONS_BY_TARGET: Record<TradeStatus, string[]> = {
  거래대기: ['회사 등록 완료', '계약 검토중', '거래조건 설정중', '기타'],
  거래중: ['신규 거래 시작', '계약 체결 완료', '미수금 해소', '계약 갱신', '거래처 요청', '신용조건 정상화', '내부 검토 완료', '기타'],
  거래중지: ['미수금 / 연체', '신용한도 초과', '계약 검토', '거래처 요청', '내부 검토', '정산 문제', '법적/정책상 제한', '일시적 거래 중단', '기타'],
  거래종료: ['계약 종료', '거래처 요청', '장기 거래 없음', '사업 종료', '파트너 관계 종료', '정책상 종료', '기타'],
};

export const TRADE_STATUS_RECORDS: TradeStatusRecord[] = [
  {
    code: 'C-00123', name: '회사 01', bizNo: '***-**-***', status: '거래중',
    tradeStartDate: '2024.03.01', lastDealDate: '2026.08.13', statusChangedAt: '2024.03.01', statusReason: '신규 거래 시작',
    manager: 'admin01', issues: [],
    impact: { activeContracts: 2, activeOrders: 4, shippingInProgress: 1, receivable: 0, overdue: 0, unsettled: 0 },
    creditLimit: 50000000, creditUsed: 32000000, pendingChange: null,
    history: [
      { when: '2024.03.01 09:10', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin01', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [{ when: '2026.08.13', by: 'admin01', text: '하반기 단가 재협의 예정.' }],
  },
  {
    code: 'C-00122', name: '회사 02', bizNo: '***-**-***', status: '거래대기',
    tradeStartDate: '-', lastDealDate: '-', statusChangedAt: '2026.07.28', statusReason: '회사 등록 완료',
    manager: 'admin02', issues: ['필수 회사정보 미등록'],
    impact: { activeContracts: 0, activeOrders: 0, shippingInProgress: 0, receivable: 1200000, overdue: 0, unsettled: 0 },
    creditLimit: 20000000, creditUsed: 0, pendingChange: null,
    history: [
      { when: '2026.07.28 10:00', from: '거래대기', to: '거래대기', reason: '회사 등록 완료', by: 'admin02', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [],
  },
  {
    code: 'C-00119', name: '㈜한빛물산', bizNo: '***-**-***', status: '거래중',
    tradeStartDate: '2025.03.12', lastDealDate: '2026.08.10', statusChangedAt: '2025.03.12', statusReason: '신규 거래 시작',
    manager: 'admin01', issues: ['계약 만료 예정'],
    impact: { activeContracts: 1, activeOrders: 1, shippingInProgress: 0, receivable: 0, overdue: 0, unsettled: 3400000 },
    creditLimit: 30000000, creditUsed: 18000000,
    pendingChange: { toStatus: '거래종료', applyDate: '2026.09.01', reason: '계약 종료' },
    history: [
      { when: '2025.03.12 09:00', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin01', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [{ when: '2026.08.18', by: 'admin01', text: '계약 갱신 여부 회신 대기 중. 미회신 시 예정대로 거래 종료.' }],
  },
  {
    code: 'C-00107', name: '대성유통', bizNo: '***-**-***', status: '거래중지',
    tradeStartDate: '2025.11.05', lastDealDate: '2026.06.02', statusChangedAt: '2026.07.01', statusReason: '미수금 / 연체',
    manager: 'admin03', issues: ['거래 중지', '미수금 발생'],
    impact: { activeContracts: 0, activeOrders: 0, shippingInProgress: 0, receivable: 3400000, overdue: 2000000, unsettled: 0 },
    creditLimit: 5000000, creditUsed: 3400000, pendingChange: null,
    history: [
      { when: '2026.07.01 15:40', from: '거래중', to: '거래중지', reason: '미수금 / 연체', detail: '30일 이상 미수금 발생', by: 'admin03', snapshot: { receivable: 3400000, overdue: 2000000, activeOrders: 1 } },
      { when: '2025.11.05 09:00', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin03', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [{ when: '2026.07.01', by: 'admin03', text: '미수금 장기 연체로 거래 중지 처리.' }, { when: '2026.08.20', by: 'admin01', text: '거래처에서 25일까지 입금 예정이라고 전달받음.' }],
  },
  {
    code: 'C-00098', name: '원일테크', bizNo: '***-**-***', status: '거래중',
    tradeStartDate: '2025.05.20', lastDealDate: '2026.08.05', statusChangedAt: '2025.05.20', statusReason: '신규 거래 시작',
    manager: 'admin02', issues: ['신용한도 초과'],
    impact: { activeContracts: 1, activeOrders: 2, shippingInProgress: 1, receivable: 10000000, overdue: 0, unsettled: 5100000 },
    creditLimit: 20000000, creditUsed: 22000000, pendingChange: null,
    history: [
      { when: '2025.05.20 09:00', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin02', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [],
  },
  {
    code: 'C-00081', name: '늘푸른상사', bizNo: '***-**-***', status: '거래종료',
    tradeStartDate: '2024.09.01', lastDealDate: '2026.02.14', statusChangedAt: '2026.02.14', statusReason: '장기 거래 없음',
    manager: 'admin01', issues: [],
    impact: { activeContracts: 0, activeOrders: 0, shippingInProgress: 0, receivable: 0, overdue: 0, unsettled: 0 },
    creditLimit: 0, creditUsed: 0, pendingChange: null,
    history: [
      { when: '2026.02.14 09:00', from: '거래중', to: '거래종료', reason: '장기 거래 없음', detail: '13개월간 거래 없음', by: 'admin01', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
      { when: '2024.09.01 10:00', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin01', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [],
  },
  {
    code: 'C-00076', name: '케이스퀘어', bizNo: '***-**-***', status: '거래중',
    tradeStartDate: '2025.01.15', lastDealDate: '2026.08.12', statusChangedAt: '2025.01.15', statusReason: '신규 거래 시작',
    manager: 'admin03', issues: [],
    impact: { activeContracts: 1, activeOrders: 1, shippingInProgress: 0, receivable: 0, overdue: 0, unsettled: 0 },
    creditLimit: 80000000, creditUsed: 21000000, pendingChange: null,
    history: [
      { when: '2025.01.15 09:00', from: '거래대기', to: '거래중', reason: '신규 거래 시작', by: 'admin03', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [],
  },
  {
    code: 'C-00061', name: '정성무역', bizNo: '***-**-***', status: '거래대기',
    tradeStartDate: '-', lastDealDate: '-', statusChangedAt: '2026.08.10', statusReason: '회사 등록 완료',
    manager: 'admin02', issues: ['필수 회사정보 미등록'],
    impact: { activeContracts: 0, activeOrders: 0, shippingInProgress: 0, receivable: 0, overdue: 0, unsettled: 0 },
    creditLimit: 0, creditUsed: 0, pendingChange: null,
    history: [
      { when: '2026.08.10 16:20', from: '거래대기', to: '거래대기', reason: '회사 등록 완료', by: 'admin02', snapshot: { receivable: 0, overdue: 0, activeOrders: 0 } },
    ],
    memos: [],
  },
];

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export interface TradeFilterDef {
  key: (typeof QUICK_FILTER_LABELS)[number];
  match: (r: TradeStatusRecord) => boolean;
}

export const TRADE_FILTERS: TradeFilterDef[] = QUICK_FILTER_LABELS.map((label) => ({
  key: label,
  match: (r: TradeStatusRecord) => label === '전체' || r.status === label,
}));
