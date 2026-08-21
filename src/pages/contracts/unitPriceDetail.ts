import { fmtWon, type PriceHistoryEntry, type PriceUsage, type PriceVersion, type QtyTier, type UnitPriceCalc } from './unitPriceData';

export interface PriceFieldRow {
  label: string;
  value: string;
  weight: number;
  color: string;
}

export interface CompareFieldRow extends PriceFieldRow {
  strike: 'line-through' | 'none';
}

export interface UnitPriceDetail {
  id: string;
  contract: string;
  partner: string;
  product: string;
  statusLabel: UnitPriceCalc['status'];
  statusBg: string;
  statusFg: string;
  priceLabel: string;
  period: string;
  hasIssue: boolean;
  issueLabel: string;
  infoFields: PriceFieldRow[];
  compareFields: CompareFieldRow[];
  hasQuoteMismatch: boolean;
  quotePrice: string;
  conditionFields: PriceFieldRow[];
  periodExceeds: boolean;
  qtyTiers: QtyTier[];
  usageFields: PriceFieldRow[];
  usage: PriceUsage;
  versions: PriceVersion[];
  history: PriceHistoryEntry[];
}

export function buildUnitPriceDetail(selected: UnitPriceCalc): UnitPriceDetail {
  const partnerDiff = Math.round(((selected.price - selected.partnerPrice) / selected.partnerPrice) * 1000) / 10;
  const baseDiff = Math.round(((selected.price - selected.base) / selected.base) * 1000) / 10;

  return {
    id: selected.id,
    contract: selected.contract,
    partner: selected.partner,
    product: selected.product,
    statusLabel: selected.status,
    statusBg: selected.bg,
    statusFg: selected.fg,
    priceLabel: fmtWon(selected.price),
    period: `${selected.start} ~ ${selected.end}`,
    hasIssue: selected.hasIssue || !!selected.pendingChange,
    issueLabel:
      selected.issue ?? (selected.pendingChange ? `${selected.pendingChange.start}부터 ${fmtWon(selected.pendingChange.price)}로 변경 예정입니다.` : ''),
    infoFields: [
      { label: '단가 ID', value: selected.id, weight: 500, color: '#3f3f46' },
      { label: '계약', value: selected.contract, weight: 500, color: '#3f3f46' },
      { label: '거래처', value: selected.partner, weight: 500, color: '#3f3f46' },
      { label: '상품', value: `${selected.product} / ${selected.code}`, weight: 500, color: '#3f3f46' },
      { label: '현재 단가', value: fmtWon(selected.price), weight: 700, color: '#18181b' },
      { label: '적용기간', value: `${selected.start} ~ ${selected.end}`, weight: 500, color: '#3f3f46' },
      { label: '상태', value: selected.status, weight: 600, color: selected.fg },
      { label: '등록자', value: selected.owner, weight: 500, color: '#3f3f46' },
    ],
    compareFields: [
      { label: '기본 공급가', value: fmtWon(selected.base), weight: 500, color: '#a1a1aa', strike: 'line-through' },
      { label: '거래처별 가격', value: fmtWon(selected.partnerPrice), weight: 500, color: '#71717a', strike: 'none' },
      { label: '계약 단가', value: fmtWon(selected.price), weight: 700, color: 'oklch(0.52 0.16 258)', strike: 'none' },
      { label: '기본 공급가 대비', value: `${baseDiff}%`, weight: 600, color: baseDiff < 0 ? '#dc2626' : '#18181b', strike: 'none' },
      { label: '거래처별 가격 대비', value: `${partnerDiff}%`, weight: 600, color: partnerDiff < 0 ? '#dc2626' : '#18181b', strike: 'none' },
    ],
    hasQuoteMismatch: selected.quotePrice !== selected.price,
    quotePrice: fmtWon(selected.quotePrice),
    conditionFields: [
      { label: '적용 시작일', value: selected.start, weight: 500, color: '#3f3f46' },
      { label: '적용 종료일', value: selected.end, weight: 500, color: '#3f3f46' },
      { label: '계약 종료일까지 적용', value: '아니오', weight: 500, color: '#3f3f46' },
      { label: '통화', value: 'KRW', weight: 500, color: '#3f3f46' },
      { label: '변경 사유', value: '연간 거래조건 재협의', weight: 500, color: '#3f3f46' },
    ],
    periodExceeds: !!selected.issue && selected.issue.includes('계약기간'),
    qtyTiers: selected.qtyTiers,
    usageFields: [
      { label: '적용 주문', value: selected.usage.orders + '건', weight: 600, color: '#18181b' },
      { label: '누적 수량', value: selected.usage.qty.toLocaleString('ko-KR') + '개', weight: 500, color: '#3f3f46' },
      { label: '누적 주문금액', value: fmtWon(selected.usage.amount), weight: 500, color: '#3f3f46' },
      { label: '최근 적용', value: selected.usage.recent, weight: 500, color: '#3f3f46' },
    ],
    usage: selected.usage,
    versions: selected.versions,
    history: selected.history,
  };
}
