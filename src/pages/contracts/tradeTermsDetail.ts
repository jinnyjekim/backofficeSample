import type { TermsHistoryEntry, TermsVersion, TradeTermsCalc } from './tradeTermsData';

export interface TermsFieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface CompareRow {
  label: string;
  base: string;
  override: string;
  weight: number;
  fg: string;
}

export interface TradeTermsDetail {
  id: string;
  contract: string;
  partner: string;
  statusLabel: TradeTermsCalc['status'];
  statusBg: string;
  statusFg: string;
  period: string;
  summaryLine1: string;
  summaryLine2: string;
  hasIssue: boolean;
  issueLabel: string;
  compareRows: CompareRow[];
  paymentFields: TermsFieldRow[];
  orderFields: TermsFieldRow[];
  creditFields: TermsFieldRow[];
  taxFields: { label: string; value: string }[];
  versions: TermsVersion[];
  history: TermsHistoryEntry[];
}

function diffFg(base: string, override: string): string {
  return base !== override ? '#d97706' : '#3f3f46';
}

function diffWeight(base: string, override: string): number {
  return base !== override ? 700 : 500;
}

export function buildTradeTermsDetail(selected: TradeTermsCalc): TradeTermsDetail {
  return {
    id: selected.id,
    contract: selected.contract,
    partner: selected.partner,
    statusLabel: selected.status,
    statusBg: selected.bg,
    statusFg: selected.fg,
    period: `${selected.start} ~ ${selected.end}`,
    summaryLine1: `${selected.payOverride} · MOQ ${selected.moqOverride} · ${selected.unitOverride} 단위`,
    summaryLine2: `발주 후 ${selected.leadOverride} 납품`,
    hasIssue: selected.hasIssue || !!selected.pendingChange,
    issueLabel: selected.issue ?? (selected.pendingChange ? `${selected.pendingChange.applyAt}부터 변경 조건이 적용 예정입니다.` : ''),
    compareRows: [
      {
        label: '결제조건',
        base: selected.payBase,
        override: selected.payOverride,
        weight: diffWeight(selected.payBase, selected.payOverride),
        fg: diffFg(selected.payBase, selected.payOverride),
      },
      {
        label: '최소 주문수량',
        base: selected.moqBase,
        override: selected.moqOverride,
        weight: diffWeight(selected.moqBase, selected.moqOverride),
        fg: diffFg(selected.moqBase, selected.moqOverride),
      },
      {
        label: '주문 단위',
        base: selected.unitBase,
        override: selected.unitOverride,
        weight: diffWeight(selected.unitBase, selected.unitOverride),
        fg: diffFg(selected.unitBase, selected.unitOverride),
      },
      {
        label: '납기',
        base: selected.leadBase,
        override: selected.leadOverride,
        weight: diffWeight(selected.leadBase, selected.leadOverride),
        fg: diffFg(selected.leadBase, selected.leadOverride),
      },
      {
        label: '최소 주문금액',
        base: selected.minAmountBase,
        override: selected.minAmountOverride,
        weight: diffWeight(selected.minAmountBase, selected.minAmountOverride),
        fg: diffFg(selected.minAmountBase, selected.minAmountOverride),
      },
      {
        label: '신용한도',
        base: selected.creditBase,
        override: selected.creditOverride,
        weight: diffWeight(selected.creditBase, selected.creditOverride),
        fg: diffFg(selected.creditBase, selected.creditOverride),
      },
    ],
    paymentFields: [
      { label: '결제 방식', value: selected.payOverride, weight: 700, color: '#18181b' },
      { label: '거래처 기본조건', value: selected.payBase, weight: 500, color: '#a1a1aa' },
      { label: '마감 기준', value: '월말 마감', weight: 500, color: '#3f3f46' },
      { label: '지급 기준', value: selected.payOverride.includes('후불') ? '익월 15일' : '주문 확정 전', weight: 500, color: '#3f3f46' },
      { label: '연체 시 처리', value: selected.overdueRule, weight: 500, color: '#3f3f46' },
    ],
    orderFields: [
      { label: '최소 주문수량', value: selected.moqOverride, weight: 700, color: '#18181b' },
      { label: '주문 단위', value: selected.unitOverride, weight: 500, color: '#3f3f46' },
      { label: '최소 주문금액', value: selected.minAmountOverride, weight: 500, color: '#3f3f46' },
      { label: '기본 납기', value: selected.leadOverride, weight: 700, color: '#18181b' },
      { label: '납품 방식', value: '지정 장소 납품', weight: 500, color: '#3f3f46' },
      { label: '운임 부담', value: '공급자 부담', weight: 500, color: '#3f3f46' },
    ],
    creditFields: [
      { label: '신용거래', value: selected.creditOverride === '미사용' ? '미사용' : '사용', weight: 600, color: '#18181b' },
      { label: '적용 한도', value: selected.creditOverride, weight: 500, color: '#3f3f46' },
      { label: '거래처 기본한도', value: selected.creditBase, weight: 500, color: '#a1a1aa' },
      { label: '한도 초과 시', value: '승인 요청', weight: 500, color: '#3f3f46' },
    ],
    taxFields: [
      { label: '세금 방식', value: selected.taxType },
      { label: '세금계산서', value: selected.invoicing },
      { label: '정산 조건', value: selected.settlement },
    ],
    versions: selected.versions,
    history: selected.history,
  };
}
