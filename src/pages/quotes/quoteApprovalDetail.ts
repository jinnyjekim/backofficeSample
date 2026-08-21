import { STATUS_META, fmt, type Approval, type ApprovalHistoryEntry } from './quoteApprovalData';
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
  value: string;
  color?: string;
  weight?: number;
}

export interface SummaryEntry {
  label: string;
  value: string;
  color: string;
}

export interface ApprovalDetailItem {
  name: string;
  amount: string;
  basePrice: string;
  unitPrice: string;
  diffLabel: string;
  diffFg: string;
}

export interface MoqCheckView {
  name: string;
  qty: number;
  moq: number;
  label: string;
  fg: string;
}

export interface CondCompareView {
  label: string;
  base: string;
  value: string;
  weight: number;
  fg: string;
}

export interface ChainView {
  stage: string;
  admin: string;
  when: string;
  status: string;
  bg: string;
  fg: string;
}

export interface ApprovalDetailUI {
  activeTab: string;
  showApprovePanel: boolean;
  showRejectPanel: boolean;
}

export interface ApprovalDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onToggleApprovePanel: () => void;
  onToggleRejectPanel: () => void;
  onApprove: () => void;
  onReject: () => void;
}

export interface ApprovalDetail {
  no: string;
  partner: string;
  amount: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  stageLabel: string;
  close: () => void;

  tabs: TabDef[];
  isItems: boolean;
  isMargin: boolean;
  isCond: boolean;
  isChain: boolean;
  isOpinion: boolean;
  isHistory: boolean;

  summary: SummaryEntry[];
  hasReasons: boolean;
  reasons: string[];

  canAct: boolean;
  canWithdraw: boolean;
  showApprovePanel: boolean;
  showRejectPanel: boolean;
  toggleApprovePanel: () => void;
  toggleRejectPanel: () => void;
  approve: () => void;
  reject: () => void;

  items: ApprovalDetailItem[];

  priceFields: FieldRow[];
  minMargin: string;
  marginLabel: string;
  marginFg: string;
  moqChecks: MoqCheckView[];

  condCompare: CondCompareView[];
  creditFields: FieldRow[];

  chain: ChainView[];

  opinion: string;
  requester: string;
  requestedAt: string;
  history: ApprovalHistoryEntry[];
}

const TABS: [string, string][] = [
  ['items', '견적 항목'],
  ['margin', '가격/마진'],
  ['cond', '거래조건/신용'],
  ['chain', '승인선'],
  ['opinion', '요청 의견'],
  ['history', '승인 이력'],
];

export function buildApprovalDetail(a: Approval, ui: ApprovalDetailUI, actions: ApprovalDetailActions): ApprovalDetail {
  const sm = STATUS_META[a.status];
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

  const expectedUsed = a.credit.used + a.amount;
  const usedPct = ((expectedUsed / a.credit.limit) * 100).toFixed(1);

  return {
    no: a.id,
    partner: a.partner,
    amount: fmt(a.amount),
    statusLabel: a.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    stageLabel: a.stageLabel,
    close: actions.onClose,

    tabs,
    isItems: ui.activeTab === 'items',
    isMargin: ui.activeTab === 'margin',
    isCond: ui.activeTab === 'cond',
    isChain: ui.activeTab === 'chain',
    isOpinion: ui.activeTab === 'opinion',
    isHistory: ui.activeTab === 'history',

    summary: [
      { label: '견적금액', value: fmt(a.amount), color: '#18181b' },
      { label: '기준금액', value: fmt(a.base), color: '#3f3f46' },
      { label: '차이', value: `${(a.amount - a.base).toLocaleString('ko-KR')}원 (${a.discount}%)`, color: a.discount <= -15 ? '#dc2626' : '#3f3f46' },
      { label: '예상 마진', value: `${a.margin}%`, color: a.margin < a.minMargin ? '#dc2626' : '#059669' },
    ],
    hasReasons: a.reasons.length > 0,
    reasons: a.reasons,

    canAct: a.status === '대기',
    canWithdraw: a.status === '대기' && a.mine,
    showApprovePanel: ui.showApprovePanel,
    showRejectPanel: ui.showRejectPanel,
    toggleApprovePanel: actions.onToggleApprovePanel,
    toggleRejectPanel: actions.onToggleRejectPanel,
    approve: actions.onApprove,
    reject: actions.onReject,

    items: a.items.map((it) => {
      const diff = it.unitPrice - it.basePrice;
      const pct = it.basePrice ? (diff / it.basePrice) * 100 : 0;
      return {
        name: it.name,
        amount: fmt(it.qty * it.unitPrice),
        basePrice: fmt(it.basePrice),
        unitPrice: fmt(it.unitPrice),
        diffLabel: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
        diffFg: pct <= -10 ? '#dc2626' : pct < 0 ? '#d97706' : '#059669',
      };
    }),

    priceFields: [
      { label: '기준 총액', value: fmt(a.base), weight: 500, color: '#3f3f46' },
      { label: '견적 총액', value: fmt(a.amount), weight: 600, color: '#18181b' },
      { label: '가격 차이', value: `${(a.amount - a.base).toLocaleString('ko-KR')}원`, weight: 600, color: '#dc2626' },
      { label: '할인율', value: `${a.discount}%`, weight: 600, color: a.discount <= -15 ? '#dc2626' : '#3f3f46' },
    ],
    minMargin: a.minMargin + '%',
    marginLabel: a.margin + '%',
    marginFg: a.margin < a.minMargin ? '#dc2626' : '#059669',
    moqChecks: a.moqChecks.map((mc) => ({
      name: mc.name,
      qty: mc.qty,
      moq: mc.moq,
      label: mc.ok ? '✓ 충족' : '⚠ 기준 미달',
      fg: mc.ok ? '#059669' : '#dc2626',
    })),

    condCompare: a.condCompare.map((cc) => ({
      label: cc.label,
      base: cc.base,
      value: cc.value,
      weight: cc.diff ? 700 : 500,
      fg: cc.diff ? '#d97706' : '#3f3f46',
    })),
    creditFields: [
      { label: '신용한도', value: fmt(a.credit.limit), weight: 500, color: '#3f3f46' },
      { label: '현재 사용', value: fmt(a.credit.used), weight: 500, color: '#3f3f46' },
      { label: '이번 견적', value: fmt(a.amount), weight: 500, color: '#3f3f46' },
      { label: '예상 사용률', value: usedPct + '%', weight: 700, color: Number(usedPct) >= 90 ? '#dc2626' : '#18181b' },
    ],

    chain: a.chain.map((c) => ({
      stage: c.stage,
      admin: c.admin,
      when: c.when,
      status: c.status,
      bg: c.status === '완료' ? '#ecfdf5' : c.status === '반려' ? '#fef2f2' : '#fffbeb',
      fg: c.status === '완료' ? '#059669' : c.status === '반려' ? '#dc2626' : '#d97706',
    })),

    opinion: a.opinion,
    requester: a.requester,
    requestedAt: a.requestedAt,
    history: a.history,
  };
}
