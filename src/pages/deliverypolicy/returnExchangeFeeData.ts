import { PRODUCTS, type Product } from '../products/productsData';
import { INITIAL_POLICY as BASE_SHIPPING_POLICY } from './shippingBaseFeeData';
import { INITIAL_OVERRIDES } from './productShippingOverrideData';
import { INITIAL_BASE_POLICY as JEJU_BASE_POLICY } from './jejuRemotePolicyData';

export type FreeShippingFullReturnPolicy = '최초 배송비 + 반품 배송비 부과' | '반품 배송비만 부과' | '배송비 부과하지 않음';
export type PaymentMethod = '환불금액에서 차감' | '별도 결제';
export type RemoteAreaTreatment = '기본 정책 사용' | '적용 안 함';
export type Fault = '고객 귀책' | '판매자 귀책';
export type ProcessType = '반품' | '교환';
export type Scope = '전체' | '부분';
export type ScenarioRegion = '일반' | '제주' | '도서산간';

export interface ReturnExchangeBasePolicy {
  customerReturnFee: number;
  sellerReturnFee: number;
  firstFeeRefundCustomerFault: boolean;
  firstFeeRefundSellerFault: boolean;
  freeShippingFullReturnPolicy: FreeShippingFullReturnPolicy;
  partialReturnFreeShippingRecalc: boolean;
  paymentMethod: PaymentMethod;
  remoteAreaTreatment: RemoteAreaTreatment;
  startDate: string;
  endDate: string | null;
  updatedAt: string;
  updatedBy: string;
}

export const INITIAL_POLICY: ReturnExchangeBasePolicy = {
  customerReturnFee: 3000,
  sellerReturnFee: 0,
  firstFeeRefundCustomerFault: false,
  firstFeeRefundSellerFault: false, // deliberate inconsistency: seller-fault returns should normally refund the original shipping fee too
  freeShippingFullReturnPolicy: '최초 배송비 + 반품 배송비 부과',
  partialReturnFreeShippingRecalc: true,
  paymentMethod: '환불금액에서 차감',
  remoteAreaTreatment: '기본 정책 사용',
  startDate: '2026-07-01',
  endDate: null,
  updatedAt: '2026-07-01',
  updatedBy: 'admin01',
};

export function customerExchangeFee(policy: ReturnExchangeBasePolicy): number {
  return policy.customerReturnFee * 2;
}
export function sellerExchangeFee(policy: ReturnExchangeBasePolicy): number {
  return policy.sellerReturnFee * 2;
}

export interface PolicyWarning {
  id: string;
  message: string;
}

export function computeWarnings(policy: ReturnExchangeBasePolicy): PolicyWarning[] {
  const warnings: PolicyWarning[] = [];
  if (!policy.firstFeeRefundSellerFault) {
    warnings.push({ id: 'seller-first-fee', message: '판매자 귀책 반품인데 최초 배송비를 환불하지 않도록 설정되어 있습니다. 일반적으로 판매자 귀책은 최초 배송비도 함께 환불합니다.' });
  }
  if (policy.endDate && policy.endDate < policy.startDate) {
    warnings.push({ id: 'date-range', message: '적용 종료일이 시작일보다 빠릅니다.' });
  }
  return warnings;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const FIELD_LABELS: { key: keyof ReturnExchangeBasePolicy; label: string; format: (p: ReturnExchangeBasePolicy) => string }[] = [
  { key: 'customerReturnFee', label: '고객 귀책 반품비', format: (p) => fmtWon(p.customerReturnFee) },
  { key: 'sellerReturnFee', label: '판매자 귀책 반품비', format: (p) => fmtWon(p.sellerReturnFee) },
  { key: 'firstFeeRefundCustomerFault', label: '고객 귀책 최초배송비 환불', format: (p) => (p.firstFeeRefundCustomerFault ? '환불' : '환불하지 않음') },
  { key: 'firstFeeRefundSellerFault', label: '판매자 귀책 최초배송비 환불', format: (p) => (p.firstFeeRefundSellerFault ? '환불' : '환불하지 않음') },
  { key: 'freeShippingFullReturnPolicy', label: '무료배송 전체반품 정책', format: (p) => p.freeShippingFullReturnPolicy },
  { key: 'partialReturnFreeShippingRecalc', label: '부분반품 무료배송 재계산', format: (p) => (p.partialReturnFreeShippingRecalc ? '재부과' : '기존 무료배송 유지') },
  { key: 'paymentMethod', label: '배송비 납부 방식', format: (p) => p.paymentMethod },
  { key: 'remoteAreaTreatment', label: '제주/도서산간 연동', format: (p) => p.remoteAreaTreatment },
  { key: 'endDate', label: '적용 종료일', format: (p) => p.endDate ?? '상시' },
];

export function describePolicyChanges(before: ReturnExchangeBasePolicy, after: ReturnExchangeBasePolicy): FieldDiff[] {
  return FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export interface LastModified {
  at: string;
  by: string;
}

export const INITIAL_LAST_MODIFIED: LastModified = { at: '2026-07-01', by: '운영 관리자' };

export interface PolicyHistoryEntry {
  id: string;
  at: string;
  by: string;
  field: string;
  before: string;
  after: string;
  reason: string;
}

export const INITIAL_HISTORY: PolicyHistoryEntry[] = [
  { id: 'H-1', at: '2026-07-01 10:00', by: 'admin01', field: '고객 귀책 반품비', before: '2,500원', after: '3,000원', reason: '택배 기본 운임 변경 반영' },
];

export function fmtWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}
export function fmtSigned(n: number): string {
  if (n === 0) return '0원';
  return `${n > 0 ? '+' : '-'}${Math.abs(n).toLocaleString('ko-KR')}원`;
}

// ---- Product-level override (read-only view; edited in 상품별 배송 정책) ----

export interface ProductOverrideRow {
  code: string;
  name: string;
  returnFeeOverride: number;
  exchangeFeeOverride: number;
}

export function productReturnExceptions(): ProductOverrideRow[] {
  return PRODUCTS
    .filter((p) => INITIAL_OVERRIDES[p.code]?.usesOverride && INITIAL_OVERRIDES[p.code]?.returnFeePolicy === '상품별 설정')
    .map((p) => ({ code: p.code, name: p.name, returnFeeOverride: INITIAL_OVERRIDES[p.code].returnFeeOverride, exchangeFeeOverride: INITIAL_OVERRIDES[p.code].exchangeFeeOverride }));
}

// ---- Shipping fee calculation preview ----

export interface TestScenario {
  id: string;
  label: string;
  processType: ProcessType;
  fault: Fault;
  scope: Scope;
  region: ScenarioRegion;
  originalShippingPaid: boolean;
  orderAmount: number;
  returnAmount: number;
  productCode?: string;
}

export const TEST_SCENARIOS: TestScenario[] = [
  { id: 'RE-1', label: '일반 유료배송 전체반품 · 고객 귀책', processType: '반품', fault: '고객 귀책', scope: '전체', region: '일반', originalShippingPaid: true, orderAmount: 30000, returnAmount: 30000 },
  { id: 'RE-2', label: '무료배송 전체반품 · 고객 귀책', processType: '반품', fault: '고객 귀책', scope: '전체', region: '일반', originalShippingPaid: false, orderAmount: 55000, returnAmount: 55000 },
  { id: 'RE-3', label: '제주 교환 · 고객 귀책', processType: '교환', fault: '고객 귀책', scope: '전체', region: '제주', originalShippingPaid: true, orderAmount: 40000, returnAmount: 40000 },
  { id: 'RE-4', label: '부분반품 · 무료배송 조건 재계산', processType: '반품', fault: '고객 귀책', scope: '부분', region: '일반', originalShippingPaid: false, orderAmount: 60000, returnAmount: 20000 },
  { id: 'RE-5', label: '판매자 귀책 반품 (상품 불량)', processType: '반품', fault: '판매자 귀책', scope: '전체', region: '일반', originalShippingPaid: true, orderAmount: 30000, returnAmount: 30000 },
  { id: 'RE-6', label: '상품별 예외 적용 · 상품명 03 반품', processType: '반품', fault: '고객 귀책', scope: '전체', region: '일반', originalShippingPaid: true, orderAmount: 120000, returnAmount: 120000, productCode: 'P-001240' },
];

export interface FeeLine {
  label: string;
  amount: number;
  note?: string;
}

export interface PreviewResult {
  source: string;
  lines: FeeLine[];
  total: number;
  firstFeeRefundNote: string;
}

export function computeReturnExchangeFee(scenario: TestScenario, policy: ReturnExchangeBasePolicy): PreviewResult {
  const legs = scenario.processType === '교환' ? 2 : 1;
  const legLabel = scenario.processType === '교환' ? '교환(회수+재배송)' : '반품 회수';

  const firstFeeRefundNote = scenario.fault === '고객 귀책'
    ? `최초 배송비는 정책상 ${policy.firstFeeRefundCustomerFault ? '환불 대상입니다.' : '환불하지 않습니다.'}`
    : `최초 배송비는 정책상 ${policy.firstFeeRefundSellerFault ? '환불 대상입니다.' : '환불하지 않습니다.'}`;

  if (scenario.fault === '판매자 귀책') {
    return {
      source: '기본 정책 (판매자 귀책)',
      lines: [{ label: `${legLabel} 배송비 (판매자 귀책)`, amount: 0 }],
      total: 0,
      firstFeeRefundNote,
    };
  }

  if (scenario.productCode) {
    const override = INITIAL_OVERRIDES[scenario.productCode];
    const product = PRODUCTS.find((p) => p.code === scenario.productCode);
    if (override?.usesOverride && override.returnFeePolicy === '상품별 설정') {
      const amount = scenario.processType === '교환' ? override.exchangeFeeOverride : override.returnFeeOverride;
      return {
        source: `상품별 예외 (${product?.name ?? scenario.productCode})`,
        lines: [{ label: `${legLabel} 배송비 (상품별 예외)`, amount }],
        total: amount,
        firstFeeRefundNote,
      };
    }
  }

  const baseLegFee = policy.customerReturnFee;
  const lines: FeeLine[] = [];

  if (scenario.processType === '교환') {
    lines.push({ label: '회수 배송비', amount: baseLegFee });
    lines.push({ label: '재배송 배송비', amount: baseLegFee });
  } else {
    lines.push({ label: '반품 회수 배송비', amount: baseLegFee });
  }

  if (scenario.region !== '일반' && policy.remoteAreaTreatment === '기본 정책 사용') {
    const regionFee = scenario.region === '제주' ? JEJU_BASE_POLICY.jejuExtraFee : JEJU_BASE_POLICY.remoteExtraFee;
    for (let i = 0; i < legs; i += 1) {
      lines.push({ label: `${scenario.processType === '교환' ? (i === 0 ? '회수' : '재배송') : '회수'} 지역 추가비 (${scenario.region})`, amount: regionFee });
    }
  }

  if (scenario.scope === '전체' && !scenario.originalShippingPaid) {
    if (policy.freeShippingFullReturnPolicy === '최초 배송비 + 반품 배송비 부과') {
      lines.push({ label: '최초 배송비 재부과', amount: BASE_SHIPPING_POLICY.baseFee, note: '무료배송 주문이었던 전체 반품/교환은 최초 배송비도 함께 부과합니다.' });
    } else if (policy.freeShippingFullReturnPolicy === '배송비 부과하지 않음') {
      return { source: '기본 정책 (무료배송 전체반품 면제)', lines: [{ label: '배송비 부과 없음', amount: 0 }], total: 0, firstFeeRefundNote };
    }
  }

  if (scenario.scope === '부분') {
    const wasFreeShippingEligible = scenario.orderAmount >= BASE_SHIPPING_POLICY.freeShippingThreshold;
    const remaining = scenario.orderAmount - scenario.returnAmount;
    const stillEligible = remaining >= BASE_SHIPPING_POLICY.freeShippingThreshold;
    if (wasFreeShippingEligible && !stillEligible) {
      if (policy.partialReturnFreeShippingRecalc) {
        lines.push({
          label: '최초 배송비 재부과',
          amount: BASE_SHIPPING_POLICY.baseFee,
          note: `남은 주문금액(${fmtWon(remaining)})이 무료배송 기준(${fmtWon(BASE_SHIPPING_POLICY.freeShippingThreshold)}) 미만이라 재부과됩니다.`,
        });
      }
    }
  }

  const total = lines.reduce((sum, l) => sum + l.amount, 0);
  return { source: '기본 정책', lines, total, firstFeeRefundNote };
}

export { PRODUCTS };
export type { Product };
