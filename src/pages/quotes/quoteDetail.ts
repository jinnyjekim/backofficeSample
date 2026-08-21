import { STATUS_META, fmt, issuesOf, type HistoryEntry, type Memo, type Quote, type QuoteItem, type SendLog } from './quotesData';
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
  color?: string;
  weight?: number;
  labelWeight?: number;
}

export interface QuoteDetailItem {
  name: string;
  code: string;
  qty: string;
  basePrice: string;
  unitPrice: string;
  amount: string;
  diffLabel: string;
  diffFg: string;
}

export interface QuoteDetailVersion {
  label: string;
  date: string;
  status: string;
  amount: string;
  bg: string;
}

export interface QuoteDetailUI {
  activeTab: string;
  showApprovePanel: boolean;
}

export interface QuoteDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onRequestApproval: () => void;
  onApprove: () => void;
  onSend: () => void;
  onMarkAccept: () => void;
  onMarkReject: () => void;
  onReQuote: () => void;
  onToggleApprovePanel: () => void;
  onReject: () => void;
}

export interface QuoteDetail {
  no: string;
  version: string;
  partner: string;
  contact: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  amount: string;
  validUntil: string;
  owner: string;
  close: () => void;

  tabs: TabDef[];
  isInfo: boolean;
  isItems: boolean;
  isAmount: boolean;
  isApproval: boolean;
  isSend: boolean;
  isVersion: boolean;
  isActivity: boolean;
  isHistory: boolean;

  canRequestApproval: boolean;
  canApprove: boolean;
  canSend: boolean;
  canMarkOutcome: boolean;
  canReQuote: boolean;
  requestApproval: () => void;
  approve: () => void;
  send: () => void;
  markAccept: () => void;
  markReject: () => void;
  reQuote: () => void;

  showApprovePanel: boolean;
  toggleApprovePanel: () => void;
  reject: () => void;

  infoFields: FieldRow[];
  linkFields: FieldRow[];

  itemCount: number;
  items: QuoteDetailItem[];

  amountFields: FieldRow[];
  showDiscountWarning: boolean;
  condFields: FieldRow[];

  approvalFields: FieldRow[];

  hasSendLogs: boolean;
  noSendLogs: boolean;
  sendLogs: SendLog[];

  versions: QuoteDetailVersion[];

  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['info', '견적정보'],
  ['items', '견적항목'],
  ['amount', '금액/조건'],
  ['approval', '승인'],
  ['send', '발송'],
  ['version', 'Version'],
  ['activity', '활동/메모'],
  ['history', '처리이력'],
];

export function buildQuoteDetail(q: Quote, ui: QuoteDetailUI, actions: QuoteDetailActions): QuoteDetail {
  const sm = STATUS_META[q.status];
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

  const supply = q.items.reduce((a, it) => a + (parseInt(it.qty, 10) || 0) * it.unitPrice, 0);
  const finalAmount = supply - q.discount + q.tax;
  const iss = issuesOf(q);

  const items: QuoteDetailItem[] = q.items.map((it: QuoteItem) => {
    const qty = parseInt(it.qty, 10) || 0;
    const diff = it.unitPrice - it.basePrice;
    const diffPct = it.basePrice ? (diff / it.basePrice) * 100 : 0;
    return {
      name: it.name,
      code: it.code,
      qty: it.qty,
      basePrice: fmt(it.basePrice),
      unitPrice: fmt(it.unitPrice),
      amount: fmt(qty * it.unitPrice),
      diffLabel: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('ko-KR')} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%)`,
      diffFg: diff < 0 ? '#dc2626' : diff > 0 ? '#059669' : '#71717a',
    };
  });

  return {
    no: q.id,
    version: q.version,
    partner: q.partner,
    contact: q.contact,
    statusLabel: q.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    amount: fmt(q.amount),
    validUntil: q.validUntil,
    owner: q.owner,
    close: actions.onClose,

    tabs,
    isInfo: ui.activeTab === 'info',
    isItems: ui.activeTab === 'items',
    isAmount: ui.activeTab === 'amount',
    isApproval: ui.activeTab === 'approval',
    isSend: ui.activeTab === 'send',
    isVersion: ui.activeTab === 'version',
    isActivity: ui.activeTab === 'activity',
    isHistory: ui.activeTab === 'history',

    canRequestApproval: q.status === '작성중',
    canApprove: q.status === '승인대기',
    canSend: q.status === '발송대기',
    canMarkOutcome: q.status === '발송완료',
    canReQuote: q.status === '만료' || q.status === '거절',
    requestApproval: actions.onRequestApproval,
    approve: actions.onApprove,
    send: actions.onSend,
    markAccept: actions.onMarkAccept,
    markReject: actions.onMarkReject,
    reQuote: actions.onReQuote,

    showApprovePanel: ui.showApprovePanel,
    toggleApprovePanel: actions.onToggleApprovePanel,
    reject: actions.onReject,

    infoFields: [
      { label: '견적번호', value: `${q.id} / ${q.version}` },
      { label: '거래처', value: q.partner },
      { label: '거래처 담당자', value: q.contact },
      { label: '견적일', value: '2026.' + q.created.replace('.', '.') },
      { label: '유효기간', value: q.validUntil },
      { label: '현재 상태', value: q.status },
      { label: '내부 담당자', value: q.owner },
    ],
    linkFields: [
      { label: '연결 견적 요청', value: q.rfq || '없음' },
      { label: '연결 계약', value: '없음' },
      { label: '연결 주문', value: q.status === '수락' ? 'O-00192' : '없음' },
    ],

    itemCount: q.items.length,
    items,

    amountFields: [
      { label: '공급가액', value: fmt(supply), weight: 500, color: '#3f3f46', labelWeight: 500 },
      { label: '할인', value: q.discount ? '-' + fmt(q.discount) : '없음', weight: 500, color: '#dc2626', labelWeight: 500 },
      { label: '세금', value: fmt(q.tax), weight: 500, color: '#3f3f46', labelWeight: 500 },
      { label: '최종 견적금액', value: fmt(finalAmount), weight: 700, color: '#18181b', labelWeight: 700 },
    ],
    showDiscountWarning: iss.length > 0,
    condFields: [
      { label: '납기', value: q.dueDate || '-' },
      { label: '결제조건', value: q.paymentTerm || '-' },
      { label: '유효기간', value: q.validUntil },
      { label: '특이사항', value: q.remark || '-' },
    ],

    approvalFields: [
      { label: '견적금액', value: fmt(finalAmount) },
      { label: '기준가 대비', value: iss.length ? '10% 이상 낮음' : '정상 범위' },
      { label: '승인 상태', value: q.status === '승인대기' ? '대기중' : q.status === '작성중' ? '요청 전' : '완료' },
      { label: '승인자', value: 'admin03' },
    ],

    hasSendLogs: q.sendLogs.length > 0,
    noSendLogs: q.sendLogs.length === 0,
    sendLogs: q.sendLogs,

    versions: q.versions.map((v) => ({
      label: v.v,
      date: v.date,
      status: v.status,
      amount: fmt(v.amount),
      bg: v.status.includes('현재') ? '#fafafa' : '#fff',
    })),

    memos: q.memos,
    history: q.history,
  };
}
