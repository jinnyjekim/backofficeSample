import { INITIAL_POLICY as BASE_SHIPPING_POLICY } from './shippingBaseFeeData';

export type ComparisonBasis = '할인 전 상품금액' | '할인 후 상품금액' | '배송비 제외 주문금액' | '최종 결제대상 상품금액';
export type Compare = '이상' | '초과';
export type ExemptionScope = '기본 배송비' | '전체 배송비';
export type RegionalFeeTreatment = '별도 부과' | '무료배송에 포함';
export type DeliveryMethod = '전체' | '일반배송' | '당일배송';
export type PolicyStatus = '적용중' | '적용 예정' | '종료' | '비활성';

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface FreeShippingPolicy {
  id: string;
  name: string;
  code: string;
  description: string;

  threshold: number;
  compare: Compare;
  basis: ComparisonBasis;

  exemptionScope: ExemptionScope;
  regionalFeeTreatment: RegionalFeeTreatment;
  deliveryMethod: DeliveryMethod;
  priority: number;

  startDate: string;
  endDate: string | null;
  active: boolean;
  usageCount: number;
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
}

const TODAY = '2026-08-25';

export function computeStatus(p: FreeShippingPolicy, today: string = TODAY): PolicyStatus {
  if (!p.active) return '비활성';
  if (p.startDate > today) return '적용 예정';
  if (p.endDate && p.endDate < today) return '종료';
  return '적용중';
}

export const DELIVERY_METHODS: DeliveryMethod[] = ['전체', '일반배송', '당일배송'];
export const COMPARISON_BASES: ComparisonBasis[] = ['할인 전 상품금액', '할인 후 상품금액', '배송비 제외 주문금액', '최종 결제대상 상품금액'];

export function newFreeShippingPolicy(): FreeShippingPolicy {
  return {
    id: `NEW-${Date.now()}`,
    name: '',
    code: '',
    description: '',
    threshold: 50000,
    compare: '이상',
    basis: '할인 후 상품금액',
    exemptionScope: '기본 배송비',
    regionalFeeTreatment: '별도 부과',
    deliveryMethod: '전체',
    priority: 5,
    startDate: TODAY,
    endDate: null,
    active: true,
    usageCount: 0,
    adminMemo: '',
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [],
  };
}

export const INITIAL_POLICIES: FreeShippingPolicy[] = [
  {
    id: 'FS-001', name: '기본 무료배송', code: 'DEFAULT_FREE_SHIPPING', description: '전체 주문에 적용되는 기본 무료배송 조건입니다.',
    threshold: 50000, compare: '이상', basis: '할인 후 상품금액',
    exemptionScope: '기본 배송비', regionalFeeTreatment: '별도 부과', deliveryMethod: '전체', priority: 5,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 4820,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'FS-002', name: '9월 무료배송 이벤트', code: 'SEP_EVENT_FREE_SHIPPING', description: '9월 한시 프로모션으로 기준금액을 낮춘 무료배송 조건입니다.',
    threshold: 30000, compare: '이상', basis: '할인 후 상품금액',
    exemptionScope: '기본 배송비', regionalFeeTreatment: '별도 부과', deliveryMethod: '전체', priority: 2,
    startDate: '2026-09-01', endDate: '2026-09-30', active: true, usageCount: 0,
    adminMemo: '', updatedAt: '2026-08-10', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-08-10 10:00', by: 'admin02', action: '정책 등록' }],
  },
  {
    id: 'FS-003', name: '당일배송 무료 프로모션', code: 'SAMEDAY_FREE', description: '당일배송 고액 주문에 대해 배송비 전체를 면제합니다.',
    threshold: 100000, compare: '이상', basis: '할인 후 상품금액',
    exemptionScope: '전체 배송비', regionalFeeTreatment: '무료배송에 포함', deliveryMethod: '당일배송', priority: 3,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 18,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'FS-004', name: '기본 무료배송 (구)', code: 'DEFAULT_FREE_SHIPPING_OLD', description: '개편 전 기본 무료배송 조건입니다.',
    threshold: 40000, compare: '이상', basis: '할인 전 상품금액',
    exemptionScope: '기본 배송비', regionalFeeTreatment: '별도 부과', deliveryMethod: '전체', priority: 5,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 3,
    adminMemo: '신규 정책(DEFAULT_FREE_SHIPPING) 등록 후 종료 처리가 누락된 것으로 보입니다.', updatedAt: '2026-01-01', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin02', action: '정책 등록' }],
  },
  {
    id: 'FS-005', name: '봄 프로모션 무료배송 (종료)', code: 'SPRING_PROMO_OLD', description: '2025년 봄 시즌 한시 무료배송 조건입니다.',
    threshold: 20000, compare: '이상', basis: '할인 후 상품금액',
    exemptionScope: '기본 배송비', regionalFeeTreatment: '별도 부과', deliveryMethod: '전체', priority: 1,
    startDate: '2025-03-01', endDate: '2025-03-31', active: true, usageCount: 612,
    adminMemo: '', updatedAt: '2025-03-31', updatedBy: 'admin01',
    history: [
      { id: 'H1', at: '2025-03-01 09:00', by: 'admin01', action: '정책 등록' },
      { id: 'H2', at: '2025-03-31 18:00', by: 'admin01', action: '정책 종료', before: '2025.03.31까지', after: '종료' },
    ],
  },
  {
    id: 'FS-006', name: '대량구매 무료배송', code: 'BULK_FREE_DRAFT', description: '고액 대량구매 주문에 대해 배송비 전체를 면제할 예정인 정책입니다.',
    threshold: 200000, compare: '이상', basis: '배송비 제외 주문금액',
    exemptionScope: '전체 배송비', regionalFeeTreatment: '무료배송에 포함', deliveryMethod: '전체', priority: 1,
    startDate: '2026-12-01', endDate: null, active: true, usageCount: 0,
    adminMemo: '', updatedAt: '2026-08-15', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-08-15 11:00', by: 'admin02', action: '정책 등록' }],
  },
  {
    id: 'FS-007', name: '옛 무료배송 정책', code: 'LEGACY_INACTIVE', description: '더 이상 사용하지 않는 무료배송 정책입니다.',
    threshold: 50000, compare: '이상', basis: '할인 전 상품금액',
    exemptionScope: '기본 배송비', regionalFeeTreatment: '별도 부과', deliveryMethod: '전체', priority: 5,
    startDate: '2026-01-01', endDate: null, active: false, usageCount: 0,
    adminMemo: '기본 무료배송 정책으로 대체되어 비활성화함.', updatedAt: '2026-07-01', updatedBy: 'admin01',
    history: [
      { id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' },
      { id: 'H2', at: '2026-07-01 10:00', by: 'admin01', action: '정책 비활성화' },
    ],
  },
];

export type QuickFilter = '전체' | '적용중' | '적용 예정' | '종료' | '비활성' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '적용중', '적용 예정', '종료', '비활성', '확인 필요'];

export interface PolicyWarnings {
  [policyId: string]: string[];
}

function datesOverlap(a: FreeShippingPolicy, b: FreeShippingPolicy): boolean {
  const aEnd = a.endDate ?? '9999-12-31';
  const bEnd = b.endDate ?? '9999-12-31';
  return a.startDate <= bEnd && b.startDate <= aEnd;
}

export function computeWarnings(policies: FreeShippingPolicy[]): PolicyWarnings {
  const map: PolicyWarnings = {};
  const add = (id: string, message: string) => { (map[id] ??= []).push(message); };

  policies.forEach((p) => {
    if (p.threshold <= 0) add(p.id, '무료배송 기준금액이 0원 이하입니다.');
    if (p.endDate && p.endDate < p.startDate) add(p.id, '적용 시작일이 종료일보다 늦습니다.');
  });

  const active = policies.filter((p) => p.active);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.deliveryMethod !== b.deliveryMethod || a.priority !== b.priority) continue;
      if (!datesOverlap(a, b)) continue;
      add(a.id, `동일 조건(우선순위 ${a.priority}, ${a.deliveryMethod})의 적용중 정책 '${b.name}'과 기간이 겹칩니다.`);
      add(b.id, `동일 조건(우선순위 ${b.priority}, ${b.deliveryMethod})의 적용중 정책 '${a.name}'과 기간이 겹칩니다.`);
    }
  }
  return map;
}

export function matchesQuickFilter(p: FreeShippingPolicy, filter: QuickFilter, warnings: PolicyWarnings): boolean {
  if (filter === '전체') return true;
  if (filter === '확인 필요') return (warnings[p.id]?.length ?? 0) > 0;
  return computeStatus(p) === filter;
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function fmtCondition(p: FreeShippingPolicy): string {
  return `${fmtWon(p.threshold)} ${p.compare}`;
}

export function fmtPeriod(p: FreeShippingPolicy): string {
  return p.endDate ? `${p.startDate} ~ ${p.endDate}` : `${p.startDate} ~ 상시`;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof FreeShippingPolicy; label: string; format: (p: FreeShippingPolicy) => string }[] = [
  { key: 'name', label: '정책명', format: (p) => p.name },
  { key: 'threshold', label: '무료배송 기준금액', format: (p) => fmtWon(p.threshold) },
  { key: 'compare', label: '기준 비교', format: (p) => p.compare },
  { key: 'basis', label: '판정 기준금액', format: (p) => p.basis },
  { key: 'exemptionScope', label: '면제 대상', format: (p) => p.exemptionScope },
  { key: 'regionalFeeTreatment', label: '지역 추가배송비', format: (p) => p.regionalFeeTreatment },
  { key: 'deliveryMethod', label: '적용 배송방법', format: (p) => p.deliveryMethod },
  { key: 'priority', label: '우선순위', format: (p) => `${p.priority}` },
  { key: 'startDate', label: '적용 시작일', format: (p) => p.startDate },
  { key: 'endDate', label: '적용 종료일', format: (p) => p.endDate ?? '상시' },
  { key: 'active', label: '사용 여부', format: (p) => (p.active ? '사용' : '비활성') },
];

export function describeChanges(before: FreeShippingPolicy, after: FreeShippingPolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

// ---- Preview: test order -> matching free-shipping policy + combined fee ----

export interface TestOrder {
  id: string;
  target: string;
  productAmount: number;
  discount: number;
  pointsUsed: number;
  deliveryMethod: DeliveryMethod;
  regionalFee: number;
}

export const TEST_ORDERS: TestOrder[] = [
  { id: 'FSO-1', target: '회사 01', productAmount: 80000, discount: 10000, pointsUsed: 0, deliveryMethod: '일반배송', regionalFee: 0 },
  { id: 'FSO-2', target: '회사 02', productAmount: 35000, discount: 0, pointsUsed: 0, deliveryMethod: '일반배송', regionalFee: 0 },
  { id: 'FSO-3', target: '회사 03', productAmount: 150000, discount: 0, pointsUsed: 0, deliveryMethod: '당일배송', regionalFee: 5000 },
  { id: 'FSO-4', target: '회사 04', productAmount: 20000, discount: 0, pointsUsed: 0, deliveryMethod: '일반배송', regionalFee: 3000 },
];

function computeBasisAmount(order: TestOrder, basis: ComparisonBasis): number {
  switch (basis) {
    case '할인 전 상품금액': return order.productAmount;
    case '할인 후 상품금액': return order.productAmount - order.discount;
    case '배송비 제외 주문금액': return order.productAmount - order.discount;
    case '최종 결제대상 상품금액': return order.productAmount - order.discount - order.pointsUsed;
  }
}

function methodCompatible(p: FreeShippingPolicy, order: TestOrder): boolean {
  return p.deliveryMethod === '전체' || p.deliveryMethod === order.deliveryMethod;
}

function conditionMet(p: FreeShippingPolicy, order: TestOrder): boolean {
  const basisAmount = computeBasisAmount(order, p.basis);
  return p.compare === '이상' ? basisAmount >= p.threshold : basisAmount > p.threshold;
}

export interface MatchResult {
  matched: FreeShippingPolicy | null;
  candidates: FreeShippingPolicy[];
  tie: boolean;
  shortfall: { policy: FreeShippingPolicy; amount: number } | null;
}

export function findMatchingPolicy(order: TestOrder, policies: FreeShippingPolicy[], today: string = TODAY): MatchResult {
  const eligible = policies.filter((p) => computeStatus(p, today) === '적용중' && methodCompatible(p, order));
  const matching = eligible.filter((p) => conditionMet(p, order));

  if (matching.length === 0) {
    let shortfall: { policy: FreeShippingPolicy; amount: number } | null = null;
    eligible.forEach((p) => {
      const basisAmount = computeBasisAmount(order, p.basis);
      const need = p.compare === '이상' ? p.threshold - basisAmount : p.threshold - basisAmount + 1;
      if (need > 0 && (!shortfall || need < shortfall.amount)) shortfall = { policy: p, amount: need };
    });
    return { matched: null, candidates: [], tie: false, shortfall };
  }

  const minPriority = Math.min(...matching.map((p) => p.priority));
  const top = matching.filter((p) => p.priority === minPriority);
  return { matched: top[0], candidates: top, tie: top.length > 1, shortfall: null };
}

export interface ShippingPreviewResult {
  basisAmount: number;
  baseFee: number;
  regionFee: number;
  finalBaseFee: number;
  finalRegionFee: number;
  finalFee: number;
  match: MatchResult;
}

export function computeOrderShippingPreview(order: TestOrder, policies: FreeShippingPolicy[]): ShippingPreviewResult {
  const match = findMatchingPolicy(order, policies);
  const baseFee = BASE_SHIPPING_POLICY.baseFee;
  const basisAmount = computeBasisAmount(order, match.matched?.basis ?? '할인 후 상품금액');

  const applied = !!match.matched;
  const finalBaseFee = applied ? 0 : baseFee;
  const finalRegionFee = (applied && (match.matched!.exemptionScope === '전체 배송비' || match.matched!.regionalFeeTreatment === '무료배송에 포함')) ? 0 : order.regionalFee;

  return { basisAmount, baseFee, regionFee: order.regionalFee, finalBaseFee, finalRegionFee, finalFee: finalBaseFee + finalRegionFee, match };
}

export { BASE_SHIPPING_POLICY };
