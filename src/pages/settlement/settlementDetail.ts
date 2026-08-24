import { ACCENT } from '../../lib/theme';
import {
  PAY_STATUS_META,
  SETTLE_STATUS_META,
  calcAdjustTotal,
  calcFee,
  calcFinal,
  fmt,
  signed,
  type Settlement,
  type SettlementHistoryEntry,
  type SettlementMemo,
  type SettlementTx,
} from './settlementData';

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

export interface FeeItemView {
  label: string;
  amountLabel: string;
}

export interface SettlementDetail {
  no: string;
  target: string;
  period: string;
  due: string;
  settleStatusLabel: string;
  settleStatusBg: string;
  settleStatusFg: string;
  payStatusLabel: string;
  payStatusBg: string;
  payStatusFg: string;
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
  feeItems: FeeItemView[];
  feeTotal: string;
  noFee: boolean;
  hasAdjust: boolean;
  noAdjust: boolean;
  adjustments: AdjustmentView[];
  memos: SettlementMemo[];
  history: SettlementHistoryEntry[];
}

const TABS: [string, string][] = [
  ['summary', '정산요약'],
  ['tx', '정산거래'],
  ['fee', '공제'],
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
  const sm = SETTLE_STATUS_META[selected.settleStatus];
  const pm = PAY_STATUS_META[selected.payStatus];
  const fee = calcFee(selected);
  const adjustTotal = calcAdjustTotal(selected);
  const final = calcFinal(selected);

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
    due: selected.dueDate,
    settleStatusLabel: selected.settleStatus,
    settleStatusBg: sm.bg,
    settleStatusFg: sm.fg,
    payStatusLabel: selected.payStatus,
    payStatusBg: pm.bg,
    payStatusFg: pm.fg,
    finalAmount: fmt(final),
    close: handlers.close,
    hasIssue: selected.issues.length > 0,
    issueLabel: selected.issues.join(' · '),
    canConfirm: selected.settleStatus === '정산대기' || selected.settleStatus === '검토중',
    canPay: selected.settleStatus === '정산확정' && selected.payStatus !== '지급완료' && selected.payStatus !== '지급실패',
    canRetry: selected.payStatus === '지급실패',
    canResume: selected.settleStatus === '보류',
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
      { label: '사업자번호', value: selected.bizNo, weight: 500, color: '#3f3f46' },
      { label: '정산 기간', value: selected.period, weight: 500, color: '#3f3f46' },
      { label: '거래 건수', value: `${selected.txCount}건`, weight: 500, color: '#3f3f46' },
      { label: '총 거래금액', value: fmt(selected.gross), weight: 500, color: '#3f3f46' },
      { label: '공제 합계', value: fee ? '-' + fmt(fee) : fmt(0), weight: 500, color: fee ? '#dc2626' : '#3f3f46' },
      { label: '조정 합계', value: signed(adjustTotal), weight: 500, color: adjustTotal < 0 ? '#dc2626' : adjustTotal > 0 ? '#059669' : '#3f3f46' },
      { label: '최종 정산금액', value: fmt(final), weight: 700, color: '#18181b' },
      { label: '정산 상태', value: selected.settleStatus, weight: 600, color: sm.fg },
      { label: '지급 상태', value: selected.payStatus, weight: 600, color: pm.fg },
      { label: '담당자', value: selected.assignee, weight: 500, color: '#3f3f46' },
    ],
    payFields: [
      { label: '지급 방식', value: selected.payMethod },
      { label: '지급 계좌', value: selected.payAccount },
      { label: '지급 예정일', value: selected.dueDate },
      { label: '지급 완료일', value: selected.payDate ?? '-' },
      { label: '세금계산서', value: selected.taxInvoice },
    ],
    tx: selected.tx,
    feeItems: selected.feeItems.map((f) => ({ label: f.label, amountLabel: '-' + fmt(f.amount) })),
    feeTotal: fee ? '-' + fmt(fee) : fmt(0),
    noFee: selected.feeItems.length === 0,
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
