import { PRODUCTS, type Product } from '../products/productsData';
import { INITIAL_POLICY as BASE_SHIPPING_POLICY } from './shippingBaseFeeData';
import { INITIAL_OVERRIDES, REFERENCE_REGIONAL_FEE } from './productShippingOverrideData';

export type RegionKind = '제주' | '도서' | '산간' | '도서산간' | '기타 특수지역';
export type DeliverableStatus = '가능' | '불가';
export type RemoteDeliverable = '가능' | '일부 지역만 가능' | '불가';
export type FreeShippingTreatment = '기본 배송비만 무료' | '지역 추가비까지 모두 무료';
export type BundleFeeUnit = '배송 그룹당 1회' | '상품별 계산';
export type PolicySource = '기본 정책' | '지역 예외';

export const REGION_KINDS: RegionKind[] = ['제주', '도서', '산간', '도서산간', '기타 특수지역'];

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface BasePolicy {
  jejuDeliverable: DeliverableStatus;
  jejuExtraFee: number;
  remoteDeliverable: RemoteDeliverable;
  remoteExtraFee: number;
  freeShippingTreatment: FreeShippingTreatment;
  bundleFeeUnit: BundleFeeUnit;
  updatedAt: string;
  updatedBy: string;
}

const TODAY = '2026-08-25';

export const INITIAL_BASE_POLICY: BasePolicy = {
  jejuDeliverable: '가능',
  jejuExtraFee: REFERENCE_REGIONAL_FEE,
  remoteDeliverable: '일부 지역만 가능',
  remoteExtraFee: 5000,
  freeShippingTreatment: '기본 배송비만 무료',
  bundleFeeUnit: '배송 그룹당 1회',
  updatedAt: '2026-07-01',
  updatedBy: 'admin01',
};

export interface SpecialRegion {
  id: string;
  name: string;
  kind: RegionKind;
  postalCodes: string[];
  deliverable: DeliverableStatus;
  policySource: PolicySource;
  extraFeeOverride: number | null;
  status: '사용' | '비활성';
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
  memos: Memo[];
}

export function newRegion(): SpecialRegion {
  return {
    id: `SR-${Date.now()}`,
    name: '',
    kind: '도서',
    postalCodes: [],
    deliverable: '가능',
    policySource: '기본 정책',
    extraFeeOverride: null,
    status: '사용',
    adminMemo: '',
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [],
    memos: [],
  };
}

export const INITIAL_REGIONS: SpecialRegion[] = [
  {
    id: 'SR-JEJU',
    name: '제주특별자치도',
    kind: '제주',
    postalCodes: ['63000', '63001', '63002', '63122'],
    deliverable: '가능',
    policySource: '기본 정책',
    extraFeeOverride: null,
    status: '사용',
    adminMemo: '제주 본섬 전역. 기본 정책 그대로 사용.',
    updatedAt: '2026-06-01',
    updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-06-01 10:00', by: 'admin01', action: '지역 등록' }],
    memos: [],
  },
  {
    id: 'SR-001',
    name: '지역01 (완도 인근 도서)',
    kind: '도서',
    postalCodes: ['59102', '59103'],
    deliverable: '가능',
    policySource: '기본 정책',
    extraFeeOverride: null,
    status: '사용',
    adminMemo: '',
    updatedAt: '2026-06-05',
    updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-06-05 09:00', by: 'admin01', action: '지역 등록' }],
    memos: [],
  },
  {
    id: 'SR-002',
    name: '지역02 (백령도)',
    kind: '도서',
    postalCodes: ['17334'],
    deliverable: '가능',
    policySource: '지역 예외',
    extraFeeOverride: 8000,
    status: '사용',
    adminMemo: '선박 운임이 높아 별도 정책 적용.',
    updatedAt: '2026-07-10',
    updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-06-05 09:10', by: 'admin01', action: '지역 등록' },
      { id: 'H-2', at: '2026-07-10 14:00', by: 'admin02', action: '추가 배송비 변경', before: '기본 정책(5,000원)', after: '지역 예외(8,000원)' },
    ],
    memos: [],
  },
  {
    id: 'SR-003',
    name: '지역03 (울릉도)',
    kind: '산간',
    postalCodes: ['40200', '40201'],
    deliverable: '불가',
    policySource: '기본 정책',
    extraFeeOverride: null,
    status: '사용',
    adminMemo: '택배사 운송 불가 지역. 발송 자체가 불가능.',
    updatedAt: '2026-05-01',
    updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-05-01 09:00', by: 'admin01', action: '배송 불가 지역 등록' }],
    memos: [],
  },
  {
    id: 'SR-004',
    name: '지역04 (흑산도)',
    kind: '도서산간',
    postalCodes: ['58760'],
    deliverable: '가능',
    policySource: '지역 예외',
    extraFeeOverride: null,
    status: '사용',
    adminMemo: '지역 예외로 등록했지만 담당자가 아직 추가 배송비를 입력하지 않음.',
    updatedAt: '2026-08-20',
    updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-08-20 11:00', by: 'admin02', action: '지역 등록' }],
    memos: [],
  },
  {
    id: 'SR-005',
    name: '지역05 (거제 인근 도서)',
    kind: '도서',
    postalCodes: ['53321', '53322'],
    deliverable: '가능',
    policySource: '기본 정책',
    extraFeeOverride: null,
    status: '비활성',
    adminMemo: '연륙교 개통으로 일반 지역으로 전환, 정책 비활성화.',
    updatedAt: '2026-08-01',
    updatedBy: 'admin01',
    history: [
      { id: 'H-1', at: '2026-04-01 09:00', by: 'admin01', action: '지역 등록' },
      { id: 'H-2', at: '2026-08-01 10:00', by: 'admin01', action: '지역 비활성화', after: '연륙교 개통' },
    ],
    memos: [],
  },
];

export type QuickFilter = '전체' | '제주' | '도서산간' | '배송 불가' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '제주', '도서산간', '배송 불가', '확인 필요'];

export function fmtWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function effectiveExtraFee(region: SpecialRegion, base: BasePolicy): number {
  if (region.policySource === '지역 예외' && region.extraFeeOverride != null) return region.extraFeeOverride;
  return region.kind === '제주' ? base.jejuExtraFee : base.remoteExtraFee;
}

export function computeWarnings(regions: SpecialRegion[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const add = (id: string, msg: string) => { (map[id] ??= []).push(msg); };

  const postalOwners: Record<string, string[]> = {};
  regions.forEach((r) => {
    if (r.status !== '사용') return;
    r.postalCodes.forEach((code) => { (postalOwners[code] ??= []).push(r.id); });
  });

  regions.forEach((r) => {
    if (r.status !== '사용') return;
    if (r.policySource === '지역 예외' && r.extraFeeOverride == null) {
      add(r.id, '지역 예외로 설정되었지만 추가 배송비가 입력되지 않았습니다.');
    }
    r.postalCodes.forEach((code) => {
      if ((postalOwners[code]?.length ?? 0) > 1) add(r.id, `우편번호 ${code}가 다른 지역과 중복 등록되어 있습니다.`);
    });
  });
  return map;
}

export function matchesQuickFilter(r: SpecialRegion, filter: QuickFilter, warnings: Record<string, string[]>): boolean {
  if (filter === '전체') return true;
  if (filter === '제주') return r.kind === '제주';
  if (filter === '도서산간') return r.kind === '도서' || r.kind === '산간' || r.kind === '도서산간';
  if (filter === '배송 불가') return r.deliverable === '불가';
  return (warnings[r.id]?.length ?? 0) > 0;
}

export function findRegionForPostal(postalCode: string, regions: SpecialRegion[]): SpecialRegion | null {
  return regions.find((r) => r.status === '사용' && r.postalCodes.includes(postalCode)) ?? null;
}

// ---- Shipping calculation preview ----

export interface TestScenarioItem {
  productCode: string;
  qty: number;
}

export interface TestScenario {
  id: string;
  label: string;
  postalCode: string;
  addressLabel: string;
  items: TestScenarioItem[];
}

export const TEST_SCENARIOS: TestScenario[] = [
  { id: 'JS-1', label: '제주 · 소액 주문', postalCode: '63122', addressLabel: '제주특별자치도 제주시', items: [{ productCode: 'P-001238', qty: 1 }] },
  { id: 'JS-2', label: '제주 · 무료배송 기준 충족', postalCode: '63122', addressLabel: '제주특별자치도 제주시', items: [{ productCode: 'P-000982', qty: 1 }] },
  { id: 'JS-3', label: '지역 예외(백령도) · 별도 추가비', postalCode: '17334', addressLabel: '인천광역시 옹진군 백령도', items: [{ productCode: 'P-001238', qty: 1 }] },
  { id: 'JS-4', label: '배송 불가 지역(울릉도)', postalCode: '40200', addressLabel: '경상북도 울릉군', items: [{ productCode: 'P-001238', qty: 1 }] },
  { id: 'JS-5', label: '제주 배송 불가 상품 포함', postalCode: '63122', addressLabel: '제주특별자치도 제주시', items: [{ productCode: 'P-001238', qty: 1 }, { productCode: 'P-001240', qty: 1 }] },
  { id: 'JS-6', label: '일반 지역 (특수지역 아님)', postalCode: '06236', addressLabel: '서울특별시 강남구', items: [{ productCode: 'P-001238', qty: 1 }] },
];

export interface ItemResult {
  code: string;
  name: string;
  qty: number;
  deliverable: boolean;
  blockReason?: string;
}

export interface PreviewResult {
  region: SpecialRegion | null;
  regionKind: RegionKind | '일반';
  matchBasis: string;
  deliverable: boolean;
  items: ItemResult[];
  orderAmount: number;
  baseFee: number;
  extraFee: number;
  freeShippingApplied: boolean;
  finalFee: number;
}

export function computeJejuShippingPreview(scenario: TestScenario, basePolicy: BasePolicy, regions: SpecialRegion[]): PreviewResult {
  const region = findRegionForPostal(scenario.postalCode, regions);
  const orderAmount = scenario.items.reduce((sum, it) => sum + it.qty * (PRODUCTS.find((p) => p.code === it.productCode)?.price ?? 0), 0);

  const items: ItemResult[] = scenario.items.map((it) => {
    const product = PRODUCTS.find((p) => p.code === it.productCode);
    const override = INITIAL_OVERRIDES[it.productCode];
    const blockedByProduct = !!(override?.usesOverride && region && (region.kind === '제주' || region.kind === '도서' || region.kind === '산간' || region.kind === '도서산간') && override.unavailableRegions.includes('제주/도서산간'));
    return {
      code: it.productCode,
      name: product?.name ?? it.productCode,
      qty: it.qty,
      deliverable: !blockedByProduct,
      blockReason: blockedByProduct ? '상품별 배송 정책에서 이 지역으로 배송 불가로 설정되어 있습니다.' : undefined,
    };
  });

  if (!region) {
    const freeShippingApplied = orderAmount >= BASE_SHIPPING_POLICY.freeShippingThreshold;
    return {
      region: null,
      regionKind: '일반',
      matchBasis: `우편번호 ${scenario.postalCode}는 등록된 특수지역과 일치하지 않습니다.`,
      deliverable: items.every((i) => i.deliverable),
      items,
      orderAmount,
      baseFee: freeShippingApplied ? 0 : BASE_SHIPPING_POLICY.baseFee,
      extraFee: 0,
      freeShippingApplied,
      finalFee: freeShippingApplied ? 0 : BASE_SHIPPING_POLICY.baseFee,
    };
  }

  const regionDeliverable = region.deliverable === '가능';
  const allItemsDeliverable = items.every((i) => i.deliverable);
  const deliverable = regionDeliverable && allItemsDeliverable;

  const freeShippingApplied = orderAmount >= BASE_SHIPPING_POLICY.freeShippingThreshold;
  const baseFee = freeShippingApplied ? 0 : BASE_SHIPPING_POLICY.baseFee;
  const extra = effectiveExtraFee(region, basePolicy);
  const extraFee = freeShippingApplied && basePolicy.freeShippingTreatment === '지역 추가비까지 모두 무료' ? 0 : extra;

  return {
    region,
    regionKind: region.kind,
    matchBasis: `우편번호 ${scenario.postalCode} · ${region.name} (${region.policySource})`,
    deliverable,
    items,
    orderAmount,
    baseFee: deliverable ? baseFee : 0,
    extraFee: deliverable ? extraFee : 0,
    freeShippingApplied,
    finalFee: deliverable ? baseFee + extraFee : 0,
  };
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const REGION_FIELD_LABELS: { key: keyof SpecialRegion; label: string; format: (r: SpecialRegion) => string }[] = [
  { key: 'name', label: '지역명', format: (r) => r.name },
  { key: 'kind', label: '지역 유형', format: (r) => r.kind },
  { key: 'deliverable', label: '배송 가능 여부', format: (r) => r.deliverable },
  { key: 'policySource', label: '적용 정책', format: (r) => r.policySource },
  { key: 'extraFeeOverride', label: '추가 배송비(예외)', format: (r) => (r.extraFeeOverride != null ? fmtWon(r.extraFeeOverride) : '-') },
  { key: 'status', label: '상태', format: (r) => r.status },
];

export function describeChanges(before: SpecialRegion, after: SpecialRegion): FieldDiff[] {
  return REGION_FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export { PRODUCTS, BASE_SHIPPING_POLICY };
export type { Product };
