import { ACCENT } from '../../lib/theme';
import { STATUS_META, calcFinal, fmt, signed, type Settlement, type SettlementHistoryEntry, type SettlementMemo, type SettlementTx } from './settlementData';

export interface TabItem {
  key: string;
  label: string;
  weight: number;
  fg: string;
  mark: string;
  pick: () => void;
}

export interface FieldRow {
  label: string;
  value: string;
  weight?: number;
  color?: string;
}

export interface AdjustmentView {
  amountLabel: string;
  fg: string;
  reason: string;
  by: string;
  when: string;
}

export interface SettlementDetail {
  no: string;
  target: string;
  period: string;
  due: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  finalAmount: string;
  close: () => void;
  hasIssue: boolean;
  issueLabel: string;
  canConfirm: boolean;
  canPay: boolean;
  canRetry: boolean;
  canResume: boolean;
  confirmSettle: () => void;
  requestPay: () => void;
  retryPay: () => void;
  resume: () => void;
  showHoldPanel: boolean;
  toggleHoldPanel: () => void;
  confirmHold: () => void;
  tabs: TabItem[];
  activeTab: string;
  summaryFields: FieldRow[];
  payFields: FieldRow[];
  tx: SettlementTx[];
  hasAdjust: boolean;
  noAdjust: boolean;
  adjustments: AdjustmentView[];
  memos: SettlementMemo[];
  history: SettlementHistoryEntry[];
}

const TABS: [string, string][] = [
  ['summary', '정산요약'],
  ['tx', '거래내역'],
  ['adjust', '조정내역'],
  ['history', '메모/이력'],
];

export interface SettlementDetailHandlers {
  close: () => void;
  setActiveTab: (tab: string) => void;
  toggleHoldPanel: () => void;
  confirmSettle: () => void;
  requestPay: () => void;
  retryPay: () => void;
  resume: () => void;
  confirmHold: () => void;
}

export function buildSettlementDetail(
  selected: Settlement,
  activeTab: string,
  showHoldPanel: boolean,
  handlers: SettlementDetailHandlers,
): SettlementDetail {
  const sm = STATUS_META[selected.status];
  const final = calcFinal(selected);
  const adjustTotal = selected.adjustments.reduce((a, x) => a + x.amount, 0);

  const tabs = TABS.map(([key, label]) => {
    const active = activeTab === key;
    return {
      key,
      label,
      weight: active ? 700 : 500,
      fg: active ? '#18181b' : '#8b8b93',
      mark: active ? `inset 0 -2px 0 ${ACCENT}` : 'none',
      pick: () => handlers.setActiveTab(key),
    };
  });

  return {
    no: selected.id,
    target: selected.target,
    period: selected.period,
    due: selected.due,
    statusLabel: selected.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    finalAmount: fmt(final),
    close: handlers.close,
    hasIssue: !!selected.warn,
    issueLabel: selected.warn ?? '',
    canConfirm: selected.status === '정산대기',
    canPay: selected.status === '정산확정' || selected.status === '지급예정',
    canRetry: selected.status === '지급실패',
    canResume: selected.status === '보류',
    confirmSettle: handlers.confirmSettle,
    requestPay: handlers.requestPay,
    retryPay: handlers.retryPay,
    resume: handlers.resume,
    showHoldPanel,
    toggleHoldPanel: handlers.toggleHoldPanel,
    confirmHold: handlers.confirmHold,
    tabs,
    activeTab,
    summaryFields: [
      { label: '정산 대상', value: selected.target, weight: 600, color: '#18181b' },
      { label: '정산 기간', value: selected.period, weight: 500, color: '#3f3f46' },
      { label: '총 거래액', value: fmt(selected.gross), weight: 500, color: '#3f3f46' },
      { label: '환불', value: '-' + fmt(selected.refund), weight: 500, color: '#dc2626' },
      { label: '수수료', value: '-' + fmt(selected.fee), weight: 500, color: '#dc2626' },
      { label: '기타 차감', value: '-' + fmt(selected.other), weight: 500, color: '#dc2626' },
      { label: '조정 합계', value: signed(adjustTotal), weight: 500, color: adjustTotal < 0 ? '#dc2626' : adjustTotal > 0 ? '#059669' : '#3f3f46' },
      { label: '최종 정산금액', value: fmt(final), weight: 700, color: '#18181b' },
      { label: '정산 상태', value: selected.status, weight: 600, color: sm.fg },
    ],
    payFields: [
      { label: '지급 방식', value: selected.payMethod },
      { label: '지급 계좌', value: selected.payAccount },
      { label: '지급 완료일', value: selected.payAt },
    ],
    tx: selected.tx,
    hasAdjust: selected.adjustments.length > 0,
    noAdjust: selected.adjustments.length === 0,
    adjustments: selected.adjustments.map((a) => ({
      amountLabel: signed(a.amount),
      fg: a.amount < 0 ? '#dc2626' : '#059669',
      reason: a.reason,
      by: a.by,
      when: a.when,
    })),
    memos: selected.memos,
    history: selected.history,
  };
}
