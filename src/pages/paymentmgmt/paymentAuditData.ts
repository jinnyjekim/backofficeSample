import { INITIAL_PAYMENTS } from './paymentListData';
import { INITIAL_EXTERNAL_TX } from './externalTransactionData';

export type AuditCategory = '상태 변경' | '상태 재조회' | '외부 매칭' | '취소·환불' | '수동 처리';
export type ActorType = 'ADMIN' | 'SYSTEM';
export type AuditResult = '성공' | '실패' | '변경 없음';
export type AuditSource = 'Backoffice' | 'PG API' | 'PG Webhook';

export interface PaymentAuditLog {
  id: string;
  at: string;
  paymentId: string;
  orderId: string | null;
  externalTxId: string | null;
  action: string;
  category: AuditCategory;
  before?: string;
  after?: string;
  actor: string;
  actorType: ActorType;
  source: AuditSource;
  result: AuditResult;
  important: boolean;
}

function classifyCategory(action: string, actorType: ActorType): AuditCategory {
  if (action.includes('재조회')) return '상태 재조회';
  if (action.includes('매칭')) return '외부 매칭';
  if (action.includes('취소') || action.includes('환불')) return '취소·환불';
  if (action.includes('메모')) return '수동 처리';
  if (actorType === 'ADMIN') return '수동 처리';
  return '상태 변경';
}

function classifySource(action: string, actorType: ActorType): AuditSource {
  if (actorType === 'ADMIN') return 'Backoffice';
  if (action.includes('수신')) return 'PG Webhook';
  if (action.includes('PG') || action.includes('승인') || action.includes('매칭')) return 'PG API';
  return 'Backoffice';
}

function classifyResult(action: string): AuditResult {
  if (action.includes('실패')) return '실패';
  if (action.includes('변경 없음')) return '변경 없음';
  return '성공';
}

function buildLogs(): PaymentAuditLog[] {
  const logs: PaymentAuditLog[] = [];

  INITIAL_PAYMENTS.forEach((p) => {
    p.history.forEach((h) => {
      const actorType: ActorType = h.by === 'SYSTEM' ? 'SYSTEM' : 'ADMIN';
      logs.push({
        id: `LOG-PAY-${p.id}-${h.id}`,
        at: h.at,
        paymentId: p.id,
        orderId: p.orderId,
        externalTxId: p.externalTxId,
        action: h.action,
        category: classifyCategory(h.action, actorType),
        before: h.before,
        after: h.after,
        actor: h.by,
        actorType,
        source: classifySource(h.action, actorType),
        result: classifyResult(h.action),
        important: actorType === 'ADMIN',
      });
    });
  });

  INITIAL_EXTERNAL_TX.forEach((tx) => {
    tx.history.forEach((h) => {
      const actorType: ActorType = h.by === 'SYSTEM' ? 'SYSTEM' : 'ADMIN';
      logs.push({
        id: `LOG-TX-${tx.id}-${h.id}`,
        at: h.at,
        paymentId: tx.linkedPaymentId ?? '-',
        orderId: null,
        externalTxId: tx.id,
        action: h.action,
        category: classifyCategory(h.action, actorType),
        after: h.detail,
        actor: h.by,
        actorType,
        source: classifySource(h.action, actorType),
        result: classifyResult(h.action),
        important: actorType === 'ADMIN',
      });
    });
  });

  return logs.sort((a, b) => b.at.localeCompare(a.at));
}

export const PAYMENT_AUDIT_LOGS: PaymentAuditLog[] = buildLogs();

export type QuickFilter = '전체' | '오늘 처리' | '상태 변경' | '상태 재조회' | '외부 매칭' | '취소·환불' | '수동 처리' | '실패';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '오늘 처리', '상태 변경', '상태 재조회', '외부 매칭', '취소·환불', '수동 처리', '실패'];

const TODAY = '2026-08-25';

export function matchesQuickFilter(log: PaymentAuditLog, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '오늘 처리') return log.at.startsWith(TODAY);
  if (filter === '실패') return log.result === '실패';
  return log.category === filter;
}

export function splitAt(value: string): [string, string] {
  const [date, time] = value.split(' ');
  return [date.replace(/-/g, '.'), time ?? ''];
}

export function actorLabel(type: ActorType): string {
  return type === 'ADMIN' ? '관리자' : '자동';
}

export function actorColor(type: ActorType): { bg: string; fg: string } {
  return type === 'ADMIN' ? { bg: '#eef2ff', fg: '#4338ca' } : { bg: '#f4f4f5', fg: '#52525b' };
}

export function categoryColor(category: AuditCategory): { bg: string; fg: string } {
  switch (category) {
    case '상태 변경': return { bg: '#eff6ff', fg: '#2563eb' };
    case '상태 재조회': return { bg: '#f0fdfa', fg: '#0f766e' };
    case '외부 매칭': return { bg: '#fdf4ff', fg: '#a21caf' };
    case '취소·환불': return { bg: '#fef2f2', fg: '#dc2626' };
    case '수동 처리': return { bg: '#fffbeb', fg: '#b45309' };
  }
}

export function resultColor(result: AuditResult): { dot: string; fg: string } {
  if (result === '성공') return { dot: '#10b981', fg: '#047857' };
  if (result === '실패') return { dot: '#ef4444', fg: '#dc2626' };
  return { dot: '#a1a1aa', fg: '#71717a' };
}
