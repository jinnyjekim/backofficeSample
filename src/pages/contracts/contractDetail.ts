import {
  fmtWon,
  STATUS_META,
  type Contract,
  type ContractHistoryEntry,
  type ContractMemo,
  type ContractOrderRow,
  type ContractPriceHistoryEntry,
  type ContractPriceRow,
  type ContractTermRow,
  type ContractVersion,
} from './contractsData';

export interface FieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface ItemView {
  name: string;
  qty: string;
  used: string;
  unitPrice: string;
  amount: string;
  moq: string;
  pct: number;
}

export interface ContractDetail {
  no: string;
  name: string;
  partner: string;
  statusLabel: Contract['status'];
  statusBg: string;
  statusFg: string;
  period: string;
  hasIssue: boolean;
  issueLabel: string | null;
  canEdit: boolean;
  canChange: boolean;
  canRenew: boolean;
  canTerminate: boolean;
  impactOrders: number;
  impactAr: string;
  summaryFields: FieldRow[];
  items: ItemView[];
  priceRows: ContractPriceRow[];
  priceHistory: ContractPriceHistoryEntry[];
  termRows: ContractTermRow[];
  specialTerms: string;
  fulfillFields: FieldRow[];
  fulfillPct: number;
  fulfillBarColor: string;
  showFulfillWarning: boolean;
  orderRows: ContractOrderRow[];
  docs: string[];
  linkedQuote: string;
  versions: ContractVersion[];
  memos: ContractMemo[];
  history: ContractHistoryEntry[];
}

export function buildContractDetail(selected: Contract): ContractDetail {
  const sm = STATUS_META[selected.status];
  const orderTotal = selected.orderRows.reduce((a, o) => a + parseFloat(o.amount) * 1000000, 0);
  const fulfillPct = selected.amount ? Math.min(100, Math.round((orderTotal / selected.amount) * 100)) : 0;

  return {
    no: selected.id,
    name: selected.name,
    partner: selected.partner,
    statusLabel: selected.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    period: `${selected.start} ~ ${selected.end}`,
    hasIssue: !!selected.issue,
    issueLabel: selected.issue,
    canEdit: selected.status === '계약 예정',
    canChange: selected.status === '계약중',
    canRenew: selected.status === '만료' || (selected.dday !== null && selected.dday <= 30 && selected.dday >= 0),
    canTerminate: selected.status === '계약중',
    impactOrders: selected.openOrders,
    impactAr: fmtWon(selected.arOutstanding),
    summaryFields: [
      { label: '거래처', value: selected.partner, weight: 600, color: '#18181b' },
      { label: '계약 유형', value: selected.type, weight: 500, color: '#3f3f46' },
      { label: '계약기간', value: `${selected.start} ~ ${selected.end}`, weight: 500, color: '#3f3f46' },
      { label: '계약금액', value: fmtWon(selected.amount), weight: 700, color: '#18181b' },
      { label: '주문 누계', value: fmtWon(orderTotal), weight: 500, color: '#3f3f46' },
      { label: '잔여 계약금액', value: fmtWon(selected.amount - orderTotal), weight: 500, color: '#3f3f46' },
      { label: '내부 담당자', value: selected.owner, weight: 500, color: '#3f3f46' },
      { label: '계약 상태', value: selected.status, weight: 600, color: sm.fg },
    ],
    items: selected.items.map((it) => ({
      name: it.name,
      qty: it.qty.toLocaleString('ko-KR'),
      used: it.used.toLocaleString('ko-KR'),
      unitPrice: fmtWon(it.unitPrice),
      amount: fmtWon(it.qty * it.unitPrice),
      moq: it.moq,
      pct: it.qty ? Math.round((it.used / it.qty) * 100) : 0,
    })),
    priceRows: selected.priceRows,
    priceHistory: selected.priceHistory,
    termRows: selected.termRows,
    specialTerms: selected.specialTerms,
    fulfillFields: [
      { label: '계약 총액', value: fmtWon(selected.amount), weight: 600, color: '#18181b' },
      { label: '주문 누계', value: fmtWon(orderTotal), weight: 500, color: '#3f3f46' },
      { label: '잔여 계약금액', value: fmtWon(selected.amount - orderTotal), weight: 500, color: '#3f3f46' },
      { label: '금액 이행률', value: fulfillPct + '%', weight: 700, color: fulfillPct >= 90 ? '#dc2626' : '#18181b' },
    ],
    fulfillPct,
    fulfillBarColor: fulfillPct >= 90 ? '#dc2626' : 'oklch(0.52 0.16 258)',
    showFulfillWarning: fulfillPct >= 90,
    orderRows: selected.orderRows,
    docs: selected.docs,
    linkedQuote: selected.linkedQuote,
    versions: selected.versions,
    memos: selected.memos,
    history: selected.history,
  };
}
