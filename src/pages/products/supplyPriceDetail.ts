import { fmtWon, STATUS_META, type SupplyPrice } from './supplyPriceData';

export interface FieldRow {
  label: string;
  value: string;
  color?: string;
  weight?: number;
}

export interface SupplyPriceDetail {
  priceId: string;
  name: string;
  code: string;
  target: string;
  priceType: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  priceLabel: string;
  cost: string;
  isContractLocked: boolean;
  canEdit: boolean;

  basicFields: FieldRow[];
  condFields: FieldRow[];
  hasTiers: boolean;
  tiers: SupplyPrice['tiers'];
  showsScheduled: boolean;
  scheduledPeriod: string;
  scheduledPrice: string;

  compareFields: FieldRow[];
  showDiscountWarning: boolean;
  showBelowCost: boolean;

  hasContract: boolean;
  noContract: boolean;
  contractFields: FieldRow[];

  history: SupplyPrice['history'];
}

export function buildSupplyPriceDetail(p: SupplyPrice): SupplyPriceDetail {
  const sm = STATUS_META[p.status];
  const isLocked = p.priceType === '계약 공급가';
  const diff = p.price - p.basePrice;
  const diffPct = p.basePrice ? (diff / p.basePrice) * 100 : 0;

  return {
    priceId: p.id,
    name: p.name,
    code: p.code,
    target: p.target,
    priceType: p.priceType,
    statusLabel: p.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    priceLabel: fmtWon(p.price),
    cost: fmtWon(p.cost),
    isContractLocked: isLocked,
    canEdit: !isLocked,

    basicFields: [
      { label: '가격 ID', value: p.id },
      { label: '상품', value: `${p.name} / ${p.code}` },
      { label: '가격 유형', value: p.priceType },
      { label: '적용 대상', value: p.target },
      { label: '통화', value: p.currency },
      { label: '등록일', value: p.registered },
      { label: '등록 관리자', value: p.admin },
    ],

    condFields: [
      { label: '공급가', value: p.status === '가격 미설정' ? '미설정' : fmtWon(p.price) },
      { label: '최소 주문수량', value: p.minQty ? String(p.minQty) : '-' },
      { label: '적용기간', value: p.period },
      { label: '상태', value: p.status },
      { label: '우선순위', value: String(p.priority) },
    ],
    hasTiers: p.hasTiers,
    tiers: p.tiers,
    showsScheduled: !!p.scheduled,
    scheduledPeriod: p.scheduled ? p.scheduled.period : '',
    scheduledPrice: p.scheduled ? fmtWon(p.scheduled.price) : '',

    compareFields: [
      { label: '기본 공급가', value: fmtWon(p.basePrice), weight: 500, color: '#3f3f46' },
      { label: '현재 공급가', value: fmtWon(p.price), weight: 700, color: '#18181b' },
      { label: '차액', value: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('ko-KR')}원`, weight: 600, color: diff < 0 ? '#dc2626' : '#059669' },
      { label: '할인율', value: `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%`, weight: 600, color: diffPct < 0 ? '#dc2626' : '#059669' },
    ],
    showDiscountWarning: diffPct <= -30,
    showBelowCost: p.cost > 0 && p.price < p.cost,

    hasContract: !!p.contract,
    noContract: !p.contract,
    contractFields: p.contract
      ? [
          { label: '계약', value: p.contract.no },
          { label: '계약기간', value: p.contract.period },
          { label: '계약 공급가', value: p.contract.price },
        ]
      : [],

    history: p.history,
  };
}
