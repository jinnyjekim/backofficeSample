import { ACCENT } from '../../lib/theme';
import { STATUS_META, fmtWon, type PartnerCalc, type Activity, type Collection, type Memo, type HistoryEntry } from './receivablesData';

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

export interface InvoiceCard {
  no: string;
  billed: string;
  collected: string;
  remaining: string;
  dueDate: string;
  status: string;
  bg: string;
  fg: string;
}

export interface ReceivableDetailUI {
  activeTab: string;
  showCollectPanel: boolean;
  showActivityPanel: boolean;
}

export interface ReceivableDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onToggleCollectPanel: () => void;
  onToggleActivityPanel: () => void;
  onConfirmActivity: () => void;
}

export interface ReceivableDetail {
  partner: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  totalAr: string;
  overdueAmount: string;
  maxOverdueDays: number;
  close: () => void;

  hasIssue: boolean;
  issueLabel: string;

  openInvoices: string[];
  showCollectPanel: boolean;
  showActivityPanel: boolean;
  toggleCollectPanel: () => void;
  toggleActivityPanel: () => void;
  confirmActivity: () => void;

  tabs: TabDef[];
  isSummary: boolean;
  isInvoices: boolean;
  isPlan: boolean;
  isActivity: boolean;
  isCredit: boolean;
  isMemo: boolean;

  summaryFields: FieldRow[];
  invoices: InvoiceCard[];

  hasPromise: boolean;
  noPromise: boolean;
  promiseDate: string;
  promiseAmount: string;
  promiseStatus: string;
  promiseFg: string;
  collections: Collection[];

  activities: Activity[];

  creditFields: FieldRow[];
  tradeRestriction: string;

  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['summary', '미수요약'],
  ['invoices', '청구별미수'],
  ['plan', '수금/약속'],
  ['activity', '독촉활동'],
  ['credit', '신용영향'],
  ['memo', '메모/이력'],
];

export function buildReceivableDetail(p: PartnerCalc, ui: ReceivableDetailUI, actions: ReceivableDetailActions): ReceivableDetail {
  const sm = STATUS_META[p.status] ?? STATUS_META['정상'];
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
  const promiseOverdue = !!p.promise && p.promise.status === '미이행';

  return {
    partner: p.name,
    statusLabel: p.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    totalAr: fmtWon(p.totalAr),
    overdueAmount: fmtWon(p.overdueAmount),
    maxOverdueDays: p.maxOverdueDays,
    close: actions.onClose,

    hasIssue: promiseOverdue || p.maxOverdueDays > 30,
    issueLabel: promiseOverdue
      ? `지급 약속 미이행 (${p.promise!.date})`
      : p.maxOverdueDays > 30
        ? `30일 이상 연체 (최장 ${p.maxOverdueDays}일)`
        : '',

    openInvoices: p.invoices.filter((i) => i.remaining > 0).map((i) => i.no),
    showCollectPanel: ui.showCollectPanel,
    showActivityPanel: ui.showActivityPanel,
    toggleCollectPanel: actions.onToggleCollectPanel,
    toggleActivityPanel: actions.onToggleActivityPanel,
    confirmActivity: actions.onConfirmActivity,

    tabs,
    isSummary: ui.activeTab === 'summary',
    isInvoices: ui.activeTab === 'invoices',
    isPlan: ui.activeTab === 'plan',
    isActivity: ui.activeTab === 'activity',
    isCredit: ui.activeTab === 'credit',
    isMemo: ui.activeTab === 'memo',

    summaryFields: [
      { label: '총 청구금액', value: fmtWon(p.totalBilled), weight: 600, color: '#18181b' },
      { label: '총 수금액', value: fmtWon(p.totalCollected), weight: 500, color: '#3f3f46' },
      { label: '총 미수금', value: fmtWon(p.totalAr), weight: 700, color: '#18181b' },
      { label: '정상 미수', value: fmtWon(p.totalAr - p.overdueAmount), weight: 500, color: '#059669' },
      { label: '연체 미수', value: fmtWon(p.overdueAmount), weight: 700, color: p.overdueAmount > 0 ? '#dc2626' : '#18181b' },
      { label: '최장 연체', value: p.maxOverdueDays + '일', weight: 500, color: '#3f3f46' },
      { label: '미수 청구건', value: p.openCount + '건', weight: 500, color: '#3f3f46' },
    ],

    invoices: p.invoices.filter((i) => i.remaining > 0).map((iv) => {
      const bg = iv.overdueDays > 0 ? '#fef2f2' : '#eef2ff';
      const fg = iv.overdueDays > 0 ? '#dc2626' : '#4f46e5';
      return { no: iv.no, billed: fmtWon(iv.billed), collected: fmtWon(iv.collected), remaining: fmtWon(iv.remaining), dueDate: iv.due, status: iv.status, bg, fg };
    }),

    hasPromise: !!p.promise,
    noPromise: !p.promise,
    promiseDate: p.promise ? p.promise.date : '',
    promiseAmount: p.promise ? fmtWon(p.promise.amount) : '',
    promiseStatus: p.promise ? p.promise.status : '',
    promiseFg: promiseOverdue ? '#dc2626' : '#d97706',
    collections: p.collections,

    activities: p.activities,

    creditFields: [
      { label: '신용한도', value: fmtWon(p.creditLimit), weight: 500, color: '#3f3f46' },
      { label: '현재 미수', value: fmtWon(p.totalAr), weight: 500, color: '#3f3f46' },
      { label: '미출고 주문', value: fmtWon(p.pendingOrders), weight: 500, color: '#3f3f46' },
      { label: '예상 사용액', value: fmtWon(p.totalAr + p.pendingOrders), weight: 700, color: p.totalAr + p.pendingOrders > p.creditLimit ? '#dc2626' : '#18181b' },
      { label: '잔여 한도', value: fmtWon(Math.max(0, p.creditLimit - p.totalAr - p.pendingOrders)), weight: 500, color: '#3f3f46' },
    ],
    tradeRestriction: p.maxOverdueDays > 30 ? '신규 주문 승인 필요 (연체 30일 초과)' : p.maxOverdueDays > 0 ? '정상 거래 가능 (경과 관찰)' : '제한 없음',

    memos: p.memos,
    history: p.history,
  };
}
