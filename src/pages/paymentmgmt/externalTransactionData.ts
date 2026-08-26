import { INITIAL_PAYMENTS, expectedExternalStatus, type PaymentEntry, type PaymentMethod } from './paymentListData';

export type MatchStatus = '정상' | '미매칭' | '상태 불일치' | '금액 불일치' | '중복 의심';
export type ExternalRawStatus = 'PAID' | 'FAILED' | 'CANCELED' | 'PROCESSING';

export const STATUS_LABEL: Record<ExternalRawStatus, string> = {
  PAID: '승인 완료',
  FAILED: '승인 실패',
  CANCELED: '취소 완료',
  PROCESSING: '처리중',
};

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
  detail?: string;
}

export interface ExternalTransaction {
  id: string;
  pg: string;
  method: PaymentMethod;
  occurredAt: string;
  receivedAt: string;
  amount: number;
  externalStatus: ExternalRawStatus;
  linkedPaymentId: string | null;
  lastSyncedAt: string;
  memos: AdminMemo[];
  history: HistoryEntry[];
}

function buildFromPayments(): ExternalTransaction[] {
  return INITIAL_PAYMENTS
    .filter((p): p is PaymentEntry & { externalTxId: string; pg: string; externalStatus: string; lastSyncedAt: string } =>
      !!p.externalTxId && !!p.pg && !!p.externalStatus && !!p.lastSyncedAt)
    .map((p) => ({
      id: p.externalTxId,
      pg: p.pg,
      method: p.method,
      occurredAt: p.approvedAt ?? p.requestedAt,
      receivedAt: p.lastSyncedAt,
      amount: p.externalAmount ?? p.amount,
      externalStatus: p.externalStatus as ExternalRawStatus,
      linkedPaymentId: p.id,
      lastSyncedAt: p.lastSyncedAt,
      memos: [],
      history: [
        { id: `H-${p.externalTxId}-1`, at: p.requestedAt, by: 'SYSTEM', action: '외부 거래 수신' },
        { id: `H-${p.externalTxId}-2`, at: p.lastSyncedAt, by: 'SYSTEM', action: '내부 결제 자동 매칭', detail: p.id },
      ],
    }));
}

export const INITIAL_EXTERNAL_TX: ExternalTransaction[] = [
  ...buildFromPayments(),
  {
    id: 'TX-9281999', pg: 'PG 01', method: '카드', occurredAt: '2026-08-25 09:21:10', receivedAt: '2026-08-25 09:21:12',
    amount: 250000, externalStatus: 'PAID', linkedPaymentId: null, lastSyncedAt: '2026-08-25 09:30:00',
    memos: [], history: [
      { id: 'H-TX999-1', at: '2026-08-25 09:21:10', by: 'SYSTEM', action: '외부 거래 수신' },
      { id: 'H-TX999-2', at: '2026-08-25 09:21:12', by: 'SYSTEM', action: '내부 결제 자동 매칭 실패' },
    ],
  },
  {
    id: 'TX-9281890B', pg: 'PG 01', method: '카드', occurredAt: '2026-08-25 09:44:10', receivedAt: '2026-08-25 09:44:12',
    amount: 900000, externalStatus: 'PAID', linkedPaymentId: 'PAY-00190', lastSyncedAt: '2026-08-25 09:44:15',
    memos: [], history: [
      { id: 'H-TX890B-1', at: '2026-08-25 09:44:10', by: 'SYSTEM', action: '외부 거래 수신' },
      { id: 'H-TX890B-2', at: '2026-08-25 09:44:12', by: 'SYSTEM', action: '내부 결제 자동 매칭', detail: 'PAY-00190' },
    ],
  },
];

export function computeMatchStatus(tx: ExternalTransaction, all: ExternalTransaction[], payments: PaymentEntry[]): MatchStatus {
  if (!tx.linkedPaymentId) return '미매칭';
  const dupCount = all.filter((t) => t.linkedPaymentId === tx.linkedPaymentId).length;
  if (dupCount > 1) return '중복 의심';
  const payment = payments.find((p) => p.id === tx.linkedPaymentId);
  if (!payment) return '미매칭';
  if (tx.amount !== payment.amount) return '금액 불일치';
  if (tx.externalStatus !== expectedExternalStatus(payment.status)) return '상태 불일치';
  return '정상';
}

export function computeIssues(tx: ExternalTransaction, all: ExternalTransaction[], payments: PaymentEntry[]): string[] {
  const match = computeMatchStatus(tx, all, payments);
  if (match === '정상') return [];
  if (match === '미매칭') return ['내부 결제를 찾을 수 없습니다.'];
  if (match === '중복 의심') return ['동일한 내부 결제와 연결된 외부 거래가 2건 이상입니다.'];
  if (match === '금액 불일치') return ['금액 불일치'];
  return ['상태 불일치'];
}

export type QuickFilter = '전체' | '정상 매칭' | '미매칭' | '상태 불일치' | '금액 불일치' | '중복 의심' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '정상 매칭', '미매칭', '상태 불일치', '금액 불일치', '중복 의심', '확인 필요'];

export function matchesQuickFilter(tx: ExternalTransaction, filter: QuickFilter, all: ExternalTransaction[], payments: PaymentEntry[]): boolean {
  if (filter === '전체') return true;
  const match = computeMatchStatus(tx, all, payments);
  if (filter === '정상 매칭') return match === '정상';
  if (filter === '확인 필요') return match !== '정상';
  return match === filter;
}

export const NOW = '2026-08-25 09:45:00';

export interface RecheckOutcome {
  updated: ExternalTransaction;
  message: string;
}

export function applyRecheck(tx: ExternalTransaction, all: ExternalTransaction[], payments: PaymentEntry[], now: string = NOW): RecheckOutcome {
  const match = computeMatchStatus(tx, all, payments);
  const historyEntry: HistoryEntry = { id: `H-${tx.id}-${Date.now()}`, at: now, by: 'admin01', action: '외부 거래 상태 재조회' };
  const updated: ExternalTransaction = { ...tx, lastSyncedAt: now, history: [...tx.history, historyEntry] };

  if (match === '정상') return { updated, message: '외부 거래와 내부 결제 상태가 일치합니다.' };
  if (match === '미매칭') return { updated, message: '내부 결제를 찾을 수 없습니다. 결제 목록에서 Webhook 누락 여부를 확인해 주세요.' };
  if (match === '중복 의심') return { updated, message: '동일한 내부 결제에 연결된 외부 거래가 2건 이상 있습니다. 결제 목록에서 확인해 주세요.' };
  if (match === '금액 불일치') return { updated, message: '외부 금액과 내부 결제금액이 일치하지 않습니다. 자동으로 반영되지 않으며, 관리자 확인이 필요합니다.' };
  return { updated, message: '외부 상태와 내부 결제 상태가 일치하지 않습니다. 결제 목록에서 상태를 다시 확인해 주세요.' };
}

export interface SyncWarning {
  pg: string;
  lastSyncedAt: string;
}

export function computeStaleSyncWarnings(all: ExternalTransaction[], now: string = NOW, thresholdMinutes = 20): SyncWarning[] {
  const latestByPg = new Map<string, string>();
  all.forEach((tx) => {
    const current = latestByPg.get(tx.pg);
    if (!current || tx.lastSyncedAt > current) latestByPg.set(tx.pg, tx.lastSyncedAt);
  });
  const warnings: SyncWarning[] = [];
  latestByPg.forEach((lastSyncedAt, pg) => {
    const diffMin = Math.round((new Date(now.replace(' ', 'T')).getTime() - new Date(lastSyncedAt.replace(' ', 'T')).getTime()) / 60000);
    if (diffMin >= thresholdMinutes) warnings.push({ pg, lastSyncedAt });
  });
  return warnings;
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function splitAt(value: string): [string, string] {
  const [date, time] = value.split(' ');
  return [date.replace(/-/g, '.'), time ?? ''];
}
