import { ACCENT } from '../../lib/theme';
import { STATUS_META, MATCH_META, fmtWon, type Payment, type PaymentAllocation, type PaymentLink, type Memo, type HistoryEntry } from './paymentsData';

export interface TabDef {
  key: string;
  label: string;
  weight: number;
  fg: string;
  mark: string;
  active: boolean;
}

export interface FieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface PaymentDetailUI {
  activeTab: string;
  showAllocatePanel: boolean;
  showCancelPanel: boolean;
}

export interface PaymentDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onConfirmPayment: () => void;
  onToggleAllocatePanel: () => void;
  onToggleCancelPanel: () => void;
  onConfirmCancel: () => void;
}

export interface PaymentDetail {
  no: string;
  partner: string;
  method: string;
  amount: string;
  paidAt: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  matchLabel: string;
  matchBg: string;
  matchFg: string;
  close: () => void;

  hasIssue: boolean;
  issueLabel: string | null;

  canConfirm: boolean;
  canAllocate: boolean;
  canCancel: boolean;
  confirmPayment: () => void;

  showAllocatePanel: boolean;
  showCancelPanel: boolean;
  toggleAllocatePanel: () => void;
  toggleCancelPanel: () => void;
  confirmCancel: () => void;

  tabs: TabDef[];
  isInfo: boolean;
  isAllocation: boolean;
  isLinks: boolean;
  isDocs: boolean;
  isHistory: boolean;

  infoFields: FieldRow[];
  allocRows: PaymentAllocation[];
  unallocated: string;
  unallocatedColor: string;
  linkFields: PaymentLink[];
  docs: string[];
  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['info', '결제정보'],
  ['allocation', '배분내역'],
  ['links', '연결거래'],
  ['docs', '증빙/메모'],
  ['history', '처리이력'],
];

function parseWon(v: string): number {
  return parseInt(v.replace(/[^0-9]/g, '') || '0', 10);
}

export function buildPaymentDetail(p: Payment, ui: PaymentDetailUI, actions: PaymentDetailActions): PaymentDetail {
  const sm = STATUS_META[p.status];
  const mm = MATCH_META[p.match];
  const totalAllocated = p.allocations.reduce((a, al) => a + parseWon(al.allocated), 0);
  const unallocated = p.amount - totalAllocated;

  const tabs: TabDef[] = TABS.map(([key, label]) => {
    const active = ui.activeTab === key;
    return {
      key,
      label,
      weight: active ? 700 : 500,
      fg: active ? '#18181b' : '#8b8b93',
      mark: active ? `inset 0 -2px 0 ${ACCENT}` : 'none',
      active,
    };
  });

  return {
    no: p.id,
    partner: p.partner,
    method: p.method,
    amount: fmtWon(p.amount),
    paidAt: p.paidAt,
    statusLabel: p.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    matchLabel: p.match,
    matchBg: mm.bg,
    matchFg: mm.fg,
    close: actions.onClose,

    hasIssue: !!p.issue,
    issueLabel: p.issue,

    canConfirm: p.status === '확인대기',
    canAllocate: p.status === '완료' || p.status === '부분결제',
    canCancel: p.status === '완료' || p.status === '부분결제',
    confirmPayment: actions.onConfirmPayment,

    showAllocatePanel: ui.showAllocatePanel,
    showCancelPanel: ui.showCancelPanel,
    toggleAllocatePanel: actions.onToggleAllocatePanel,
    toggleCancelPanel: actions.onToggleCancelPanel,
    confirmCancel: actions.onConfirmCancel,

    tabs,
    isInfo: ui.activeTab === 'info',
    isAllocation: ui.activeTab === 'allocation',
    isLinks: ui.activeTab === 'links',
    isDocs: ui.activeTab === 'docs',
    isHistory: ui.activeTab === 'history',

    infoFields: [
      { label: '거래처', value: p.partner, weight: 600, color: '#18181b' },
      { label: '결제금액', value: fmtWon(p.amount), weight: 700, color: '#18181b' },
      { label: '결제수단', value: p.method, weight: 500, color: '#3f3f46' },
      { label: '입금자명', value: p.depositor, weight: 500, color: '#3f3f46' },
      { label: '은행', value: p.bank, weight: 500, color: '#3f3f46' },
      { label: '거래번호', value: p.txId, weight: 500, color: '#3f3f46' },
      { label: '결제일시', value: p.paidAt, weight: 500, color: '#3f3f46' },
      { label: '확인일시', value: p.confirmedAt || '-', weight: 500, color: '#3f3f46' },
      { label: '확인 담당자', value: p.confirmedBy || '-', weight: 500, color: '#3f3f46' },
    ],

    allocRows: p.allocations,
    unallocated: fmtWon(unallocated),
    unallocatedColor: unallocated > 0 ? '#d97706' : '#18181b',

    linkFields: p.links,
    docs: p.docs,
    memos: p.memos,
    history: p.history,
  };
}
