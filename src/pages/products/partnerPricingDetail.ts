import { fmtWon, STATUS_META, type PartnerPrice } from './partnerPricingData';

export interface FieldRow {
  label: string;
  value: string;
  color?: string;
  weight?: number;
}

export interface PartnerPricingDetail {
  id: string;
  name: string;
  partner: string;
  statusLabel: string;
  statusBg: string;
  statusFg: string;
  finalPriceLabel: string;
  basisLabel: string;
  priceLabel: string;
  baseLabel: string;
  isContractLocked: boolean;
  canEdit: boolean;

  infoFields: FieldRow[];
  condFields: FieldRow[];
  showsScheduled: boolean;
  scheduledLabel: string;

  compareFields: FieldRow[];
  showDiscountWarning: boolean;

  hasContract: boolean;
  noContract: boolean;
  contractFields: FieldRow[];

  history: PartnerPrice['history'];
}

export function buildPartnerPricingDetail(p: PartnerPrice): PartnerPricingDetail {
  const sm = STATUS_META[p.status];
  const isLocked = p.basis === '계약 적용';
  const diff = p.price - p.basePrice;
  const diffPct = p.basePrice ? (diff / p.basePrice) * 100 : 0;
  const finalPrice = p.contract ? p.contract.price : fmtWon(p.price);

  return {
    id: p.id,
    name: p.name,
    partner: p.partner,
    statusLabel: p.status,
    statusBg: sm.bg,
    statusFg: sm.fg,
    finalPriceLabel: finalPrice,
    basisLabel: p.basis,
    priceLabel: fmtWon(p.price),
    baseLabel: fmtWon(p.basePrice),
    isContractLocked: isLocked,
    canEdit: !isLocked,

    infoFields: [
      { label: '거래처', value: `${p.partner} / ${p.partnerCode}` },
      { label: '상품', value: `${p.name} / ${p.code}` },
      { label: '가격 유형', value: p.basis },
      { label: '현재 적용가', value: fmtWon(p.price) },
      { label: '통화', value: p.currency },
      { label: '상태', value: p.status },
      { label: '등록일', value: p.registered },
      { label: '등록자', value: p.admin },
    ],

    condFields: [
      { label: '최소 주문수량', value: String(p.minQty) },
      { label: '최대 주문수량', value: p.maxQty },
      { label: '적용 시작일', value: p.start },
      { label: '적용 종료일', value: p.end || '없음' },
    ],
    showsScheduled: !!p.scheduled,
    scheduledLabel: p.scheduled ? `${p.scheduled.date} ~ · ${fmtWon(p.scheduled.price)}` : '',

    compareFields: [
      { label: '기본 공급가', value: fmtWon(p.basePrice), weight: 500, color: '#3f3f46' },
      { label: '거래처 가격', value: fmtWon(p.price), weight: 600, color: '#18181b' },
      { label: '차액', value: `${diff >= 0 ? '+' : ''}${diff.toLocaleString('ko-KR')}원`, weight: 600, color: diff < 0 ? '#dc2626' : '#059669' },
      { label: '가격 차이', value: `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%`, weight: 600, color: diffPct < 0 ? '#dc2626' : '#059669' },
      { label: '원가', value: fmtWon(p.cost), weight: 500, color: '#3f3f46' },
    ],
    showDiscountWarning: diffPct <= -30,

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
