import { STATUS_META, type QuoteRequest, type RequestItem, type Memo, type HistoryEntry, type LinkedQuoteRef, type RequestFile } from './quoteRequestsData';
import { ACCENT } from '../../lib/theme';

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
  value: string | number;
}

export interface RequestDetailUI {
  activeTab: string;
  showSupplementPanel: boolean;
  showRejectPanel: boolean;
  showDraftPanel: boolean;
}

export interface RequestDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onStartReview: () => void;
  onToggleSupplement: () => void;
  onToggleReject: () => void;
  onToggleDraft: () => void;
  onConfirmSupplement: () => void;
  onConfirmReject: () => void;
  onConfirmDraft: () => void;
}

export interface RequestDetail {
  no: string;
  partner: string;
  partnerContact: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  urgent: boolean;
  requestedFull: string;
  dueDate: string;
  itemCount: number;
  totalQty: number | string;
  owner: string;
  close: () => void;

  tabs: TabDef[];
  isInfo: boolean;
  isItems: boolean;
  isCond: boolean;
  isFiles: boolean;
  isQuoteDoc: boolean;
  isActivity: boolean;
  isHistory: boolean;

  canReview: boolean;
  canAct: boolean;
  startReview: () => void;

  showSupplementPanel: boolean;
  showRejectPanel: boolean;
  showDraftPanel: boolean;
  toggleSupplement: () => void;
  toggleReject: () => void;
  toggleDraft: () => void;
  confirmSupplement: () => void;
  confirmReject: () => void;
  confirmDraft: () => void;

  infoFields: FieldRow[];
  items: RequestItem[];
  condFields: FieldRow[];
  remark: string;
  files: RequestFile[];
  noFiles: boolean;
  hasQuotes: boolean;
  noQuotes: boolean;
  quotes: LinkedQuoteRef[];
  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['info', '요청정보'],
  ['items', '요청항목'],
  ['cond', '조건/요청사항'],
  ['files', '첨부파일'],
  ['quotes', '견적서'],
  ['activity', '활동/메모'],
  ['history', '처리이력'],
];

export function buildRequestDetail(r: QuoteRequest, ui: RequestDetailUI, actions: RequestDetailActions): RequestDetail {
  const sm = STATUS_META[r.status];
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
  const totalQty = r.items.reduce((a, it) => a + (it.qty || 0), 0);

  return {
    no: r.id,
    partner: r.partner,
    partnerContact: r.contact,
    statusLabel: r.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    urgent: r.urgent,
    requestedFull: r.requestedFull,
    dueDate: r.due,
    itemCount: r.items.length,
    totalQty: totalQty || '-',
    owner: r.owner,
    close: actions.onClose,

    tabs,
    isInfo: ui.activeTab === 'info',
    isItems: ui.activeTab === 'items',
    isCond: ui.activeTab === 'cond',
    isFiles: ui.activeTab === 'files',
    isQuoteDoc: ui.activeTab === 'quotes',
    isActivity: ui.activeTab === 'activity',
    isHistory: ui.activeTab === 'history',

    canReview: r.status === '접수',
    canAct: r.status === '검토중',
    startReview: actions.onStartReview,

    showSupplementPanel: ui.showSupplementPanel,
    showRejectPanel: ui.showRejectPanel,
    showDraftPanel: ui.showDraftPanel,
    toggleSupplement: actions.onToggleSupplement,
    toggleReject: actions.onToggleReject,
    toggleDraft: actions.onToggleDraft,
    confirmSupplement: actions.onConfirmSupplement,
    confirmReject: actions.onConfirmReject,
    confirmDraft: actions.onConfirmDraft,

    infoFields: [
      { label: '요청번호', value: r.id },
      { label: '거래처', value: r.partner },
      { label: '요청 담당자', value: r.contact },
      { label: '요청일', value: r.requestedFull },
      { label: '요청 유형', value: r.type },
      { label: '현재 상태', value: r.status },
      { label: '내부 담당자', value: r.owner },
    ],

    items: r.items,

    condFields: [
      { label: '희망 납기', value: r.due },
      { label: '희망 가격', value: r.wishAmount },
      { label: '희망 결제조건', value: r.paymentTerm },
      { label: '요청 유형', value: r.type },
    ],
    remark: r.remark,

    files: r.files,
    noFiles: r.files.length === 0,

    hasQuotes: r.quotes.length > 0,
    noQuotes: r.quotes.length === 0,
    quotes: r.quotes,

    memos: r.memos,
    history: r.history,
  };
}
