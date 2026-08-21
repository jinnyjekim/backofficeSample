import { ACCENT } from '../../lib/theme';
import { CALC_META, ISSUE_META, fmtWon, type TaxRecord, type TaxItem, type Version, type Memo, type HistoryEntry } from './taxInvoicesData';

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

export interface TaxDetailUI {
  activeTab: string;
}

export interface TaxDetailActions {
  onClose: () => void;
  onTabChange: (tab: string) => void;
  onRecalc: () => void;
  onConfirmCalc: () => void;
  onIssueTaxInvoice: () => void;
}

export interface TaxDetail {
  id: string;
  invoice: string;
  partner: string;
  calcLabel: string;
  calcBg: string;
  calcFg: string;
  issueBadge: string;
  issueBg: string;
  issueFg: string;
  total: string;
  supply: string;
  vat: string;
  taxType: string;
  rate: string;
  close: () => void;

  hasIssue: boolean;
  issueLabel: string;

  canConfirm: boolean;
  canIssue: boolean;
  recalc: () => void;
  confirmCalc: () => void;
  issueTaxInvoice: () => void;

  tabs: TabDef[];
  isSummary: boolean;
  isItems: boolean;
  isPartnerTax: boolean;
  isIssuance: boolean;
  isAdjust: boolean;
  isHistory: boolean;

  summaryFields: FieldRow[];

  items: TaxItem[];
  itemsSummary: FieldRow[];

  partnerTaxFields: FieldRow[];
  missingInfo: boolean;
  missingLabel: string;
  taxBasis: string;

  issuanceFields: FieldRow[];
  hasCorrection: boolean;
  correctionFrom: string;
  correctionTo: string;

  hasAdjustment: boolean;
  noAdjustment: boolean;
  adjustmentNote: string;
  versions: Version[];

  memos: Memo[];
  history: HistoryEntry[];
}

const TABS: [string, string][] = [
  ['summary', '계산요약'],
  ['items', '거래항목'],
  ['partnerTax', '거래처세금정보'],
  ['issuance', '발행정보'],
  ['adjust', '조정/Version'],
  ['history', '메모/이력'],
];

function parseWon(v: string): number {
  return parseInt(v.replace(/[^0-9]/g, '') || '0', 10);
}

export function buildTaxDetail(r: TaxRecord, ui: TaxDetailUI, actions: TaxDetailActions): TaxDetail {
  const cm = CALC_META[r.calcStatus];
  const im = ISSUE_META[r.issueStatus];
  const total = r.supply + r.vat;
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

  const issues: string[] = [];
  if (r.missing.length) issues.push('사업자정보 누락');
  if (r.calcStatus === '조정필요') issues.push('조정 필요');
  if (r.calcStatus === '검토필요') issues.push('검토 필요');

  return {
    id: r.id,
    invoice: r.invoice,
    partner: r.partner,
    calcLabel: r.calcStatus,
    calcBg: cm.bg,
    calcFg: cm.fg,
    issueBadge: r.issueStatus,
    issueBg: im.bg,
    issueFg: im.fg,
    total: fmtWon(total),
    supply: fmtWon(r.supply),
    vat: fmtWon(r.vat),
    taxType: r.taxType,
    rate: r.rate,
    close: actions.onClose,

    hasIssue: issues.length > 0,
    issueLabel: issues.join(' · ') + (r.adjustment ? ' — ' + r.adjustment : ''),
    canConfirm: r.calcStatus === '계산대기' || r.calcStatus === '검토필요',
    canIssue: r.calcStatus === '계산완료' && r.issueStatus === '발행대기',
    recalc: actions.onRecalc,
    confirmCalc: actions.onConfirmCalc,
    issueTaxInvoice: actions.onIssueTaxInvoice,

    tabs,
    isSummary: ui.activeTab === 'summary',
    isItems: ui.activeTab === 'items',
    isPartnerTax: ui.activeTab === 'partnerTax',
    isIssuance: ui.activeTab === 'issuance',
    isAdjust: ui.activeTab === 'adjust',
    isHistory: ui.activeTab === 'history',

    summaryFields: [
      { label: '청구번호', value: r.invoice, weight: 600, color: '#18181b' },
      { label: '거래처', value: r.partner, weight: 500, color: '#3f3f46' },
      { label: '공급가액', value: fmtWon(r.supply), weight: 600, color: '#18181b' },
      { label: '부가세', value: fmtWon(r.vat), weight: 600, color: '#18181b' },
      { label: '과세유형', value: r.taxType, weight: 600, color: r.taxType === '미확정' ? '#dc2626' : '#3f3f46' },
      { label: '세율', value: r.rate, weight: 500, color: '#3f3f46' },
      { label: '계산 기준일', value: r.txDate, weight: 500, color: '#3f3f46' },
      { label: '계산 상태', value: r.calcStatus, weight: 600, color: cm.fg },
    ],

    items: r.items,
    itemsSummary: [
      { label: '과세 공급가액', value: fmtWon(r.items.filter((i) => i.taxType === '과세').reduce((a, i) => a + parseWon(i.supply), 0)), weight: 500, color: '#3f3f46' },
      { label: '면세 공급가액', value: fmtWon(r.items.filter((i) => i.taxType === '면세').reduce((a, i) => a + parseWon(i.supply), 0)), weight: 500, color: '#3f3f46' },
      { label: '세액', value: fmtWon(r.vat), weight: 600, color: '#18181b' },
      { label: '총액', value: fmtWon(total), weight: 700, color: '#18181b' },
    ],

    partnerTaxFields: [
      { label: '사업자등록번호', value: r.bizNo || '미등록', weight: r.bizNo ? 500 : 700, color: r.bizNo ? '#3f3f46' : '#dc2626' },
      { label: '대표자', value: r.rep || '-', weight: 500, color: '#3f3f46' },
      { label: '사업장', value: r.biz || '-', weight: 500, color: '#3f3f46' },
      { label: '업태', value: r.bizType || '-', weight: 500, color: '#3f3f46' },
      { label: '종목', value: r.item || '-', weight: 500, color: '#3f3f46' },
      { label: '세금계산서 이메일', value: r.taxEmail || '미등록', weight: r.taxEmail ? 500 : 700, color: r.taxEmail ? '#3f3f46' : '#dc2626' },
    ],
    missingInfo: r.missing.length > 0,
    missingLabel: r.missing.join(', '),
    taxBasis: r.basis,

    issuanceFields: [
      { label: '발행 방식', value: '건별 발행', weight: 500, color: '#3f3f46' },
      { label: '발행 상태', value: r.issueStatus, weight: 700, color: im.fg },
      { label: '발행 예정일', value: r.issueStatus === '발행대기' ? '즉시' : '-', weight: 500, color: '#3f3f46' },
      { label: '세금계산서 번호', value: r.issueStatus === '발행완료' ? 'TAXINV-' + r.id.slice(4) : '-', weight: 500, color: '#3f3f46' },
    ],
    hasCorrection: !!r.correction,
    correctionFrom: r.correction ? r.correction.from : '',
    correctionTo: r.correction ? r.correction.to : '',

    hasAdjustment: !!r.adjustment,
    noAdjustment: !r.adjustment,
    adjustmentNote: r.adjustment || '',
    versions: r.versions,

    memos: r.memos,
    history: r.history,
  };
}
