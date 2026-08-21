import { STATUS_META, fmt, type QuoteRecord, type ApprovalGroup, type HistorySendLog, type TimelineEvent } from './quoteHistoryData';
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
}

export interface VersionView {
  label: string;
  tag: string;
  date: string;
  admin: string;
  amount: string;
  changes: string;
  bg: string;
}

export interface CompareRow {
  label: string;
  from: string;
  to: string;
  weight: number;
  fg: string;
}

export interface HistoryDetailUI {
  activeTab: string;
  compareFrom: string;
  compareTo: string;
}

export interface HistoryDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onCompareFrom: (v: string) => void;
  onCompareTo: (v: string) => void;
}

export interface HistoryDetail {
  no: string;
  partner: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  firstAmount: string;
  finalAmount: string;
  versionCount: number;
  close: () => void;

  tabs: TabDef[];
  isSummary: boolean;
  isVersions: boolean;
  isCompare: boolean;
  isApproval: boolean;
  isSend: boolean;
  isResult: boolean;
  isTimeline: boolean;

  summaryFields: FieldRow[];

  versions: VersionView[];

  compareFrom: string;
  compareTo: string;
  versionOptions: string[];
  onCompareFrom: (v: string) => void;
  onCompareTo: (v: string) => void;
  compareRows: CompareRow[];

  approvalGroups: ApprovalGroup[];

  sendLogs: HistorySendLog[];

  resultFields: FieldRow[];
  linkFields: FieldRow[];

  timeline: TimelineEvent[];
}

const TABS: [string, string][] = [
  ['summary', '요약'],
  ['versions', 'Version 이력'],
  ['compare', 'Version 비교'],
  ['approval', '승인 이력'],
  ['send', '발송'],
  ['result', '최종 결과'],
  ['timeline', '전체 이력'],
];

export function buildHistoryDetail(r: QuoteRecord, ui: HistoryDetailUI, actions: HistoryDetailActions): HistoryDetail {
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

  const versionOptions = r.versions.map((v) => v.label);
  const vFrom = r.versions.find((v) => v.label === ui.compareFrom) || r.versions[0];
  const vTo = r.versions.find((v) => v.label === ui.compareTo) || r.versions[r.versions.length - 1];
  const allProducts = Array.from(new Set(r.versions.flatMap((v) => Object.keys(v.prices))));
  const compareRows: CompareRow[] = [
    ...allProducts.map((p) => {
      const fromP = vFrom.prices[p];
      const toP = vTo.prices[p];
      return {
        label: p + ' 단가',
        from: fromP ? fmt(fromP) : '-',
        to: toP ? fmt(toP) : '-',
        weight: fromP !== toP ? 700 : 500,
        fg: fromP !== toP ? '#d97706' : '#3f3f46',
      };
    }),
    { label: '최종 금액', from: fmt(vFrom.amount), to: fmt(vTo.amount), weight: vFrom.amount !== vTo.amount ? 700 : 500, fg: vFrom.amount !== vTo.amount ? '#d97706' : '#3f3f46' },
    { label: '납기', from: vFrom.due, to: vTo.due, weight: vFrom.due !== vTo.due ? 700 : 500, fg: vFrom.due !== vTo.due ? '#d97706' : '#3f3f46' },
    { label: '결제조건', from: vFrom.payment, to: vTo.payment, weight: vFrom.payment !== vTo.payment ? 700 : 500, fg: vFrom.payment !== vTo.payment ? '#d97706' : '#3f3f46' },
    { label: '유효기간', from: vFrom.validUntil, to: vTo.validUntil, weight: vFrom.validUntil !== vTo.validUntil ? 700 : 500, fg: vFrom.validUntil !== vTo.validUntil ? '#d97706' : '#3f3f46' },
  ];

  return {
    no: r.id,
    partner: r.partner,
    statusLabel: r.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    firstAmount: fmt(r.firstAmount),
    finalAmount: fmt(r.finalAmount),
    versionCount: r.versions.length,
    close: actions.onClose,

    tabs,
    isSummary: ui.activeTab === 'summary',
    isVersions: ui.activeTab === 'versions',
    isCompare: ui.activeTab === 'compare',
    isApproval: ui.activeTab === 'approval',
    isSend: ui.activeTab === 'send',
    isResult: ui.activeTab === 'result',
    isTimeline: ui.activeTab === 'timeline',

    summaryFields: [
      { label: '견적번호', value: r.id },
      { label: '거래처', value: r.partner },
      { label: '최초 작성일', value: r.versions[0].date },
      { label: '최종 처리일', value: r.finalized },
      { label: '최종 상태', value: r.status },
      { label: '최초 견적금액', value: fmt(r.firstAmount) },
      { label: '최종 견적금액', value: fmt(r.finalAmount) },
      { label: 'Version 수', value: r.versions.length },
      { label: '내부 담당자', value: r.owner },
    ],

    versions: r.versions.map((v, i) => ({
      label: v.label,
      tag: v.tag,
      date: v.date,
      admin: v.admin,
      amount: fmt(v.amount),
      changes: v.changes,
      bg: i === r.versions.length - 1 ? '#fafafa' : '#fff',
    })),

    compareFrom: ui.compareFrom,
    compareTo: ui.compareTo,
    versionOptions,
    onCompareFrom: actions.onCompareFrom,
    onCompareTo: actions.onCompareTo,
    compareRows,

    approvalGroups: r.approvalGroups,

    sendLogs: r.sendLogs,

    resultFields: [
      { label: '상태', value: r.status },
      { label: '처리일', value: r.resultDate },
      { label: '처리 담당', value: r.resultBy },
      { label: '사유', value: r.reason || '-' },
    ],
    linkFields: [
      { label: '연결 견적 요청', value: r.rfq || '없음', color: r.rfq ? ACCENT : '#71717a' },
      { label: '연결 계약', value: r.contract || '없음', color: r.contract ? ACCENT : '#71717a' },
      { label: '연결 주문', value: r.order || '없음', color: r.order ? ACCENT : '#71717a' },
    ],

    timeline: r.timeline,
  };
}
