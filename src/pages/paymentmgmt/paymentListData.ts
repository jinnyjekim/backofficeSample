export type PaymentStatus = '결제 대기' | '처리중' | '결제 완료' | '결제 실패' | '결제 취소';
export type PaymentMethod = '카드' | '계좌이체' | '가상계좌' | '무통장입금' | '포인트' | '후불' | '기타';
export type ExternalMatchStatus = '정상' | '미매칭' | '상태 불일치' | '금액 불일치' | '외부 거래 없음';
export type OrderCoverage = '전액 결제' | '부분 결제';

export const PAYMENT_METHODS: PaymentMethod[] = ['카드', '계좌이체', '가상계좌', '무통장입금', '포인트', '후불', '기타'];
export const PAYMENT_STATUSES: PaymentStatus[] = ['결제 대기', '처리중', '결제 완료', '결제 실패', '결제 취소'];

const REQUIRES_EXTERNAL_MATCH = new Set<PaymentMethod>(['카드', '계좌이체', '가상계좌']);

export interface RefundRef {
  id: string;
  amount: number;
  status: '완료' | '처리중';
}

export interface AdminMemo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface PaymentEntry {
  id: string;
  orderId: string;
  customerName: string;
  requestedAt: string;
  approvedAt: string | null;
  method: PaymentMethod;
  amount: number;
  refundedAmount: number;
  status: PaymentStatus;

  pg: string | null;
  externalTxId: string | null;
  externalStatus: string | null;
  externalAmount: number | null;
  lastSyncedAt: string | null;

  processingStartedAt: string | null;

  failureInternalCode: string | null;
  failureExternalCode: string | null;
  customerMessage: string | null;
  adminMessage: string | null;

  cancelInfo: { canceledAt: string; reason: string; externalCancelId: string } | null;

  refunds: RefundRef[];
  memos: AdminMemo[];
  history: HistoryEntry[];
}

export const ORDER_TOTALS: Record<string, number> = {
  'O-00590': 1600000,
};

export const INITIAL_PAYMENTS: PaymentEntry[] = [
  {
    id: 'PAY-00182', orderId: 'O-00582', customerName: '회사 01', requestedAt: '2026-08-25 09:19:58', approvedAt: '2026-08-25 09:20:03',
    method: '카드', amount: 1000000, refundedAmount: 0, status: '결제 완료',
    pg: 'PG 01', externalTxId: 'TX-9281882', externalStatus: 'PAID', externalAmount: 1000000, lastSyncedAt: '2026-08-25 09:20:05',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:19:58', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:20:01', by: 'SYSTEM', action: 'PG 승인 요청' },
      { id: 'H3', at: '2026-08-25 09:20:03', by: 'SYSTEM', action: 'PG 승인 성공' },
      { id: 'H4', at: '2026-08-25 09:20:04', by: 'SYSTEM', action: '결제 완료 처리' },
      { id: 'H5', at: '2026-08-25 09:25:00', by: 'admin01', action: '결제 확인 완료 처리', after: '정상 확인' },
    ],
  },
  {
    id: 'PAY-00183', orderId: 'O-00583', customerName: '회사 02', requestedAt: '2026-08-25 09:24:50', approvedAt: null,
    method: '카드', amount: 500000, refundedAmount: 0, status: '결제 실패',
    pg: 'PG 01', externalTxId: 'TX-9281883', externalStatus: 'FAILED', externalAmount: null, lastSyncedAt: '2026-08-25 09:25:02',
    processingStartedAt: null, failureInternalCode: 'PAYMENT_DECLINED', failureExternalCode: 'CARD_DECLINED',
    customerMessage: '결제를 완료할 수 없습니다.', adminMessage: '카드사 승인 거절', cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:24:50', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:25:02', by: 'SYSTEM', action: 'PG 승인 실패', after: 'CARD_DECLINED' },
    ],
  },
  {
    id: 'PAY-00184', orderId: 'O-00584', customerName: '회사 03', requestedAt: '2026-08-25 09:12:00', approvedAt: null,
    method: '계좌이체', amount: 300000, refundedAmount: 0, status: '처리중',
    pg: 'PG 02', externalTxId: 'TX-9281884', externalStatus: 'PAID', externalAmount: 300000, lastSyncedAt: '2026-08-25 09:12:30',
    processingStartedAt: '2026-08-25 09:12:00', failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:12:00', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:12:30', by: 'SYSTEM', action: 'PG 승인 요청' },
    ],
  },
  {
    id: 'PAY-00185', orderId: 'O-00585', customerName: '회사 04', requestedAt: '2026-08-25 09:34:50', approvedAt: '2026-08-25 09:35:00',
    method: '가상계좌', amount: 700000, refundedAmount: 700000, status: '결제 완료',
    pg: 'PG 01', externalTxId: 'TX-9281885', externalStatus: 'PAID', externalAmount: 700000, lastSyncedAt: '2026-08-25 09:35:02',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [{ id: 'REF-0185', amount: 700000, status: '완료' }], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:34:50', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:35:00', by: 'SYSTEM', action: '결제 완료 처리' },
      { id: 'H3', at: '2026-08-25 09:36:00', by: 'admin01', action: '전액 환불 처리', after: '700,000원' },
    ],
  },
  {
    id: 'PAY-00186', orderId: 'O-00586', customerName: '회사 05', requestedAt: '2026-08-25 09:40:00', approvedAt: null,
    method: '무통장입금', amount: 1200000, refundedAmount: 0, status: '결제 대기',
    pg: null, externalTxId: null, externalStatus: null, externalAmount: null, lastSyncedAt: null,
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:40:00', by: 'SYSTEM', action: '결제 요청 생성 (입금 대기)' },
    ],
  },
  {
    id: 'PAY-00187', orderId: 'O-00587', customerName: '회사 06', requestedAt: '2026-08-25 09:40:50', approvedAt: '2026-08-25 09:41:03',
    method: '카드', amount: 250000, refundedAmount: 0, status: '결제 완료',
    pg: 'PG 01', externalTxId: 'TX-9281887', externalStatus: 'PAID', externalAmount: 200000, lastSyncedAt: '2026-08-25 09:41:05',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:40:50', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:41:03', by: 'SYSTEM', action: '결제 완료 처리' },
    ],
  },
  {
    id: 'PAY-00188', orderId: 'O-00588', customerName: '회사 07', requestedAt: '2026-08-25 09:41:50', approvedAt: '2026-08-25 09:42:03',
    method: '카드', amount: 400000, refundedAmount: 0, status: '결제 취소',
    pg: 'PG 01', externalTxId: 'TX-9281888', externalStatus: 'CANCELED', externalAmount: 400000, lastSyncedAt: '2026-08-25 09:42:20',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null,
    cancelInfo: { canceledAt: '2026-08-25 09:42:15', reason: '주문 전체 취소', externalCancelId: 'CXL-18291' },
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:41:50', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:42:03', by: 'SYSTEM', action: '결제 완료 처리' },
      { id: 'H3', at: '2026-08-25 09:42:15', by: 'admin01', action: '결제 취소 처리', after: 'CXL-18291' },
    ],
  },
  {
    id: 'PAY-00189', orderId: 'O-00589', customerName: '회사 08', requestedAt: '2026-08-25 09:43:30', approvedAt: null,
    method: '계좌이체', amount: 600000, refundedAmount: 0, status: '처리중',
    pg: 'PG 02', externalTxId: null, externalStatus: null, externalAmount: null, lastSyncedAt: null,
    processingStartedAt: '2026-08-25 09:43:30', failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:43:30', by: 'SYSTEM', action: '결제 요청 생성' },
    ],
  },
  {
    id: 'PAY-00190', orderId: 'O-00590', customerName: '회사 09', requestedAt: '2026-08-25 09:44:00', approvedAt: '2026-08-25 09:44:05',
    method: '카드', amount: 900000, refundedAmount: 300000, status: '결제 완료',
    pg: 'PG 01', externalTxId: 'TX-9281890', externalStatus: 'PAID', externalAmount: 900000, lastSyncedAt: '2026-08-25 09:44:07',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [{ id: 'REF-0190', amount: 300000, status: '완료' }], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:44:00', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:44:05', by: 'SYSTEM', action: '결제 완료 처리' },
      { id: 'H3', at: '2026-08-25 09:44:20', by: 'admin02', action: '부분 환불 처리', after: '300,000원' },
    ],
  },
  {
    id: 'PAY-00191', orderId: 'O-00590', customerName: '회사 09', requestedAt: '2026-08-25 09:44:30', approvedAt: '2026-08-25 09:44:35',
    method: '카드', amount: 400000, refundedAmount: 0, status: '결제 완료',
    pg: 'PG 01', externalTxId: 'TX-9281891', externalStatus: 'PAID', externalAmount: 400000, lastSyncedAt: '2026-08-25 09:44:37',
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 09:44:30', by: 'SYSTEM', action: '결제 요청 생성' },
      { id: 'H2', at: '2026-08-25 09:44:35', by: 'SYSTEM', action: '결제 완료 처리' },
    ],
  },
  {
    id: 'PAY-00192', orderId: 'O-00592', customerName: '회사 10', requestedAt: '2026-08-25 08:55:00', approvedAt: '2026-08-25 08:55:00',
    method: '후불', amount: 2000000, refundedAmount: 0, status: '결제 완료',
    pg: null, externalTxId: null, externalStatus: null, externalAmount: null, lastSyncedAt: null,
    processingStartedAt: null, failureInternalCode: null, failureExternalCode: null, customerMessage: null, adminMessage: null, cancelInfo: null,
    refunds: [], memos: [], history: [
      { id: 'H1', at: '2026-08-25 08:55:00', by: 'SYSTEM', action: '후불 청구 등록 및 결제 확정' },
    ],
  },
];

export const NOW = '2026-08-25 09:45:00';

export function expectedExternalStatus(status: PaymentStatus): string {
  return status === '결제 완료' ? 'PAID' : status === '결제 실패' ? 'FAILED' : status === '결제 취소' ? 'CANCELED' : status === '처리중' ? 'PROCESSING' : 'PENDING';
}

export function computeExternalMatch(p: PaymentEntry): ExternalMatchStatus {
  if (!REQUIRES_EXTERNAL_MATCH.has(p.method)) return '정상';
  if (!p.externalTxId || !p.externalStatus) return '외부 거래 없음';
  if (p.externalStatus !== expectedExternalStatus(p.status)) return '상태 불일치';
  if (p.externalAmount !== null && p.externalAmount !== p.amount) return '금액 불일치';
  return '정상';
}

function minutesBetween(a: string, b: string): number {
  return Math.round((new Date(b.replace(' ', 'T')).getTime() - new Date(a.replace(' ', 'T')).getTime()) / 60000);
}

export function computeIssues(p: PaymentEntry, now: string = NOW): string[] {
  const issues: string[] = [];
  const match = computeExternalMatch(p);
  if (match === '상태 불일치') issues.push('상태 불일치');
  else if (match === '금액 불일치') issues.push('금액 불일치');
  else if (match === '외부 거래 없음' && p.status !== '결제 대기') issues.push('외부 거래 미매칭');

  if (p.status === '처리중' && p.processingStartedAt && minutesBetween(p.processingStartedAt, now) >= 5) {
    issues.push('장시간 처리중');
  }
  return issues;
}

export function remainingAmount(p: PaymentEntry): number {
  return p.amount - p.refundedAmount;
}

export function computeOrderCoverage(orderId: string, all: PaymentEntry[]): OrderCoverage {
  const total = ORDER_TOTALS[orderId];
  if (total === undefined) return '전액 결제';
  const paid = all.filter((p) => p.orderId === orderId && p.status === '결제 완료').reduce((sum, p) => sum + p.amount, 0);
  return paid >= total ? '전액 결제' : '부분 결제';
}

export type QuickFilter = '전체' | '결제 대기' | '결제 완료' | '부분 결제' | '결제 실패' | '결제 취소' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '결제 대기', '결제 완료', '부분 결제', '결제 실패', '결제 취소', '확인 필요'];

export function matchesQuickFilter(p: PaymentEntry, filter: QuickFilter, all: PaymentEntry[]): boolean {
  if (filter === '전체') return true;
  if (filter === '부분 결제') return computeOrderCoverage(p.orderId, all) === '부분 결제';
  if (filter === '확인 필요') return computeIssues(p).length > 0;
  return p.status === filter;
}

function externalToInternalStatus(external: string): PaymentStatus {
  return external === 'PAID' ? '결제 완료' : external === 'FAILED' ? '결제 실패' : external === 'CANCELED' ? '결제 취소' : external === 'PROCESSING' ? '처리중' : '결제 대기';
}

export interface RecheckResult {
  updated: PaymentEntry;
  message: string;
}

export function applyRecheck(p: PaymentEntry, now: string = NOW): RecheckResult {
  const match = computeExternalMatch(p);
  const historyBase = { id: `H-${p.id}-${Date.now()}`, at: now, by: 'admin01' };

  if (match === '상태 불일치' && p.externalStatus) {
    const newStatus = externalToInternalStatus(p.externalStatus);
    const updated: PaymentEntry = {
      ...p,
      status: newStatus,
      lastSyncedAt: now,
      history: [...p.history, { ...historyBase, action: '결제 상태 재조회', before: p.status, after: newStatus }],
    };
    return { updated, message: `상태가 '${p.status}' → '${newStatus}'로 갱신되었습니다.` };
  }
  if (match === '금액 불일치') {
    const updated: PaymentEntry = {
      ...p,
      lastSyncedAt: now,
      history: [...p.history, { ...historyBase, action: '결제 상태 재조회 (금액 불일치 유지)' }],
    };
    return { updated, message: '외부 결제금액이 일치하지 않아 상태를 자동으로 변경하지 않았습니다. 관리자 확인이 필요합니다.' };
  }
  if (match === '외부 거래 없음') {
    const updated: PaymentEntry = {
      ...p,
      history: [...p.history, { ...historyBase, action: '결제 상태 재조회 (외부 거래 없음)' }],
    };
    return { updated, message: '외부 거래를 찾을 수 없습니다.' };
  }
  const updated: PaymentEntry = {
    ...p,
    lastSyncedAt: now,
    history: [...p.history, { ...historyBase, action: '결제 상태 재조회 (변경 없음)' }],
  };
  return { updated, message: '내부/외부 상태가 일치합니다.' };
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function splitAt(value: string): [string, string] {
  const [date, time] = value.split(' ');
  return [date.replace(/-/g, '.'), time ?? ''];
}
