import { PRODUCTS, type Product } from '../products/productsData';
import {
  BASE_SHIPPING_POLICY,
  INITIAL_OVERRIDES,
  REFERENCE_REGIONAL_FEE,
  computeProductShippingFee,
  type ProductShippingOverride,
  type Region,
} from './productShippingOverrideData';

export type BundleDeliveryMethod = '택배' | '화물' | '냉장' | '직배송' | '방문수령';
export type CalcMethod = '그룹당 고정 배송비' | '최고 배송비' | '배송비 합산';
export type NoGroupHandling = '상품별 배송비 각각 계산' | '기본 배송 그룹으로 처리';
export type RegionalFeeUnit = '배송 그룹당 1회' | '상품별 계산';
export type RegionalFeePolicyMode = '기본 정책 사용' | '별도 정책 설정';
export type GroupStatus = '사용' | '비활성';

export const WAREHOUSES = ['창고01', '창고02', '냉장창고', '외부 물류센터'];
export const DELIVERY_METHODS: BundleDeliveryMethod[] = ['택배', '화물', '냉장', '직배송', '방문수령'];
export const CALC_METHODS: CalcMethod[] = ['그룹당 고정 배송비', '최고 배송비', '배송비 합산'];

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

export interface BundleGroup {
  id: string;
  code: string;
  name: string;
  status: GroupStatus;

  warehouse: string;
  deliveryMethod: BundleDeliveryMethod;

  calcMethod: CalcMethod;
  groupFee: number;

  freeShippingEnabled: boolean;
  freeShippingThreshold: number;

  regionalFeePolicy: RegionalFeePolicyMode;
  regionalFeeOverrideAmount: number;

  productCodes: string[];

  startDate: string;
  endDate: string | null;

  orderUsageCount: number;
  adminMemo: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
  memos: Memo[];
}

const TODAY = '2026-08-25';

export interface BaseBundleSettings {
  enabled: boolean;
  requireSameWarehouse: boolean;
  requireSameMethod: boolean;
  noGroupHandling: NoGroupHandling;
  updatedAt: string;
  updatedBy: string;
}

export const INITIAL_BASE_SETTINGS: BaseBundleSettings = {
  enabled: true,
  requireSameWarehouse: true,
  requireSameMethod: true,
  noGroupHandling: '상품별 배송비 각각 계산',
  updatedAt: '2026-07-01',
  updatedBy: 'admin01',
};

export const REGIONAL_FEE_UNIT: RegionalFeeUnit = '배송 그룹당 1회';

export function newGroup(): BundleGroup {
  return {
    id: `GRP-${Date.now()}`,
    code: '',
    name: '',
    status: '사용',
    warehouse: WAREHOUSES[0],
    deliveryMethod: '택배',
    calcMethod: '그룹당 고정 배송비',
    groupFee: 3000,
    freeShippingEnabled: false,
    freeShippingThreshold: 50000,
    regionalFeePolicy: '기본 정책 사용',
    regionalFeeOverrideAmount: 0,
    productCodes: [],
    startDate: TODAY,
    endDate: null,
    orderUsageCount: 0,
    adminMemo: '',
    updatedAt: TODAY,
    updatedBy: 'admin01',
    history: [],
    memos: [],
  };
}

export const INITIAL_GROUPS: BundleGroup[] = [
  {
    id: 'GRP-NORMAL',
    code: 'SHIPPING_NORMAL',
    name: '일반 배송',
    status: '사용',
    warehouse: '창고01',
    deliveryMethod: '택배',
    calcMethod: '그룹당 고정 배송비',
    groupFee: 3000,
    freeShippingEnabled: true,
    freeShippingThreshold: 50000,
    regionalFeePolicy: '기본 정책 사용',
    regionalFeeOverrideAmount: 0,
    productCodes: ['P-001238', 'P-001239'],
    startDate: '2026-06-01',
    endDate: null,
    orderUsageCount: 812,
    adminMemo: '가장 많이 쓰이는 기본 묶음 그룹.',
    updatedAt: '2026-06-01',
    updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-06-01 10:00', by: 'admin01', action: '그룹 생성' }],
    memos: [],
  },
  {
    id: 'GRP-LARGE',
    code: 'SHIPPING_LARGE',
    name: '대형상품',
    status: '사용',
    warehouse: '창고02',
    deliveryMethod: '화물',
    calcMethod: '최고 배송비',
    groupFee: 10000,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    regionalFeePolicy: '별도 정책 설정',
    regionalFeeOverrideAmount: 6000,
    productCodes: ['P-001240', 'P-000982'],
    startDate: '2026-01-01',
    endDate: null,
    orderUsageCount: 45,
    adminMemo: '',
    updatedAt: '2026-08-10',
    updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-01-01 09:00', by: 'admin02', action: '그룹 생성' },
      { id: 'H-2', at: '2026-08-10 14:00', by: 'admin02', action: '배송비 계산 방식 변경', before: '배송비 합산', after: '최고 배송비' },
    ],
    memos: [],
  },
  {
    id: 'GRP-COLD',
    code: 'SHIPPING_COLD',
    name: '냉장배송',
    status: '사용',
    warehouse: '냉장창고',
    deliveryMethod: '냉장',
    calcMethod: '배송비 합산',
    groupFee: 5000,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    regionalFeePolicy: '기본 정책 사용',
    regionalFeeOverrideAmount: 0,
    productCodes: ['P-001241'],
    startDate: '2026-03-01',
    endDate: null,
    orderUsageCount: 130,
    adminMemo: '냉장 상품은 개별 포장으로 배송비 합산 계산.',
    updatedAt: '2026-03-01',
    updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-03-01 09:00', by: 'admin01', action: '그룹 생성' }],
    memos: [],
  },
  {
    id: 'GRP-PROMO',
    code: 'SHIPPING_PROMO',
    name: '프로모션 무료배송',
    status: '비활성',
    warehouse: '창고01',
    deliveryMethod: '택배',
    calcMethod: '그룹당 고정 배송비',
    groupFee: 0,
    freeShippingEnabled: false,
    freeShippingThreshold: 0,
    regionalFeePolicy: '기본 정책 사용',
    regionalFeeOverrideAmount: 0,
    productCodes: [],
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    orderUsageCount: 0,
    adminMemo: '5월 프로모션 종료 후 비활성화함. 연결 상품 없음.',
    updatedAt: '2026-06-01',
    updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-05-01 09:00', by: 'admin02', action: '그룹 생성' },
      { id: 'H-2', at: '2026-06-01 10:00', by: 'admin02', action: '그룹 비활성화' },
    ],
    memos: [],
  },
];

export type QuickFilter = '전체' | '사용중' | '비활성' | '설정 확인';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '사용중', '비활성', '설정 확인'];

export function fmtWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function computeWarnings(groups: BundleGroup[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  const add = (id: string, msg: string) => { (map[id] ??= []).push(msg); };

  groups.forEach((g) => {
    if (g.status !== '사용') return;
    if (g.productCodes.length === 0) add(g.id, '연결된 상품이 없습니다.');
    g.productCodes.forEach((code) => {
      const override = INITIAL_OVERRIDES[code];
      if (override?.usesOverride && override.bundleShipping === '불가') {
        add(g.id, `${productName(code)}은(는) 상품별 정책에서 묶음배송 불가로 설정되어 있습니다.`);
      }
    });
    if (g.freeShippingEnabled && g.freeShippingThreshold <= 0) add(g.id, '무료배송 기준금액이 올바르지 않습니다.');
  });
  return map;
}

export function findOtherActiveGroupsContaining(code: string, groups: BundleGroup[], excludeGroupId: string): BundleGroup[] {
  return groups.filter((g) => g.id !== excludeGroupId && g.status === '사용' && g.productCodes.includes(code));
}

export function matchesQuickFilter(g: BundleGroup, filter: QuickFilter, warnings: Record<string, string[]>): boolean {
  if (filter === '전체') return true;
  if (filter === '사용중') return g.status === '사용';
  if (filter === '비활성') return g.status === '비활성';
  return (warnings[g.id]?.length ?? 0) > 0;
}

// ---- Order shipping calculation preview ----

export interface TestOrderItem {
  productCode: string;
  qty: number;
}

export interface TestScenario {
  id: string;
  label: string;
  region: Region;
  items: TestOrderItem[];
}

export const TEST_SCENARIOS: TestScenario[] = [
  { id: 'BS-1', label: '일반배송 그룹 · 무료배송 기준 충족', region: '일반', items: [{ productCode: 'P-001238', qty: 1 }, { productCode: 'P-001239', qty: 1 }] },
  { id: 'BS-2', label: '일반배송 그룹 · 소액 단품 주문', region: '일반', items: [{ productCode: 'P-001238', qty: 1 }] },
  { id: 'BS-3', label: '대형상품 그룹 · 묶음배송 불가 상품 혼합', region: '일반', items: [{ productCode: 'P-001240', qty: 1 }, { productCode: 'P-000982', qty: 1 }] },
  { id: 'BS-4', label: '냉장배송 그룹 · 제주/도서산간', region: '제주/도서산간', items: [{ productCode: 'P-001241', qty: 1 }] },
  { id: 'BS-5', label: '여러 배송 그룹 혼합', region: '일반', items: [{ productCode: 'P-001238', qty: 1 }, { productCode: 'P-001241', qty: 1 }] },
];

export interface UnitResult {
  key: string;
  label: string;
  reason: string;
  items: { code: string; name: string; qty: number }[];
  fee: number;
  regionFee: number;
  unitTotal: number;
}

export interface OrderPreviewResult {
  units: UnitResult[];
  total: number;
}

function effectiveItemFee(override: ProductShippingOverride | undefined, qty: number, price: number): number {
  if (!override?.usesOverride) return BASE_SHIPPING_POLICY.baseFee;
  if (override.feeType === '무료배송') return 0;
  if (override.feeType === '고정 배송비') return override.fixedFee;
  return qty * price >= override.freeShippingThreshold ? 0 : override.fixedFee;
}

function itemRegionFee(override: ProductShippingOverride | undefined): number {
  if (override?.usesOverride && override.regionalFeePolicy === '상품별 별도 설정') return override.regionalFeeOverrideAmount;
  return REFERENCE_REGIONAL_FEE;
}

export function computeOrderShippingPreview(scenario: TestScenario, groups: BundleGroup[], base: BaseBundleSettings): OrderPreviewResult {
  const units: UnitResult[] = [];
  const isRemote = scenario.region === '제주/도서산간';
  const ungrouped: TestOrderItem[] = [];

  const activeGroups = groups.filter((g) => g.status === '사용');
  const byGroup = new Map<string, TestOrderItem[]>();

  scenario.items.forEach((item) => {
    const override = INITIAL_OVERRIDES[item.productCode];
    if (override?.usesOverride && override.bundleShipping === '불가') {
      const product = PRODUCTS.find((p) => p.code === item.productCode);
      const result = computeProductShippingFee(override, { id: 'x', label: 'x', quantity: item.qty, orderAmount: item.qty * (product?.price ?? 0), region: scenario.region });
      units.push({
        key: `solo-${item.productCode}`,
        label: `개별 배송 · ${productName(item.productCode)}`,
        reason: `${productName(item.productCode)}은(는) 묶음배송이 불가능한 상품으로 별도 배송으로 계산됩니다.`,
        items: [{ code: item.productCode, name: productName(item.productCode), qty: item.qty }],
        fee: result.baseFee,
        regionFee: result.regionFee,
        unitTotal: result.finalFee,
      });
      return;
    }

    const group = activeGroups.find((g) => g.productCodes.includes(item.productCode));
    if (group) {
      (byGroup.get(group.id) ?? byGroup.set(group.id, []).get(group.id)!).push(item);
    } else {
      ungrouped.push(item);
    }
  });

  byGroup.forEach((items, groupId) => {
    const group = activeGroups.find((g) => g.id === groupId)!;
    const fees = items.map((it) => {
      const override = INITIAL_OVERRIDES[it.productCode];
      const product = PRODUCTS.find((p) => p.code === it.productCode);
      return effectiveItemFee(override, it.qty, product?.price ?? 0);
    });
    const allFree = fees.every((f) => f === 0);
    let fee = 0;
    if (!allFree) {
      if (group.calcMethod === '그룹당 고정 배송비') fee = group.groupFee;
      else if (group.calcMethod === '최고 배송비') fee = Math.max(...fees);
      else fee = fees.reduce((a, b) => a + b, 0);
    }

    const groupAmount = items.reduce((sum, it) => sum + it.qty * (PRODUCTS.find((p) => p.code === it.productCode)?.price ?? 0), 0);
    let freeApplied = false;
    if (group.freeShippingEnabled && groupAmount >= group.freeShippingThreshold) {
      fee = 0;
      freeApplied = true;
    }

    let regionFee = 0;
    if (isRemote) {
      if (REGIONAL_FEE_UNIT === '배송 그룹당 1회') {
        regionFee = group.regionalFeePolicy === '별도 정책 설정' ? group.regionalFeeOverrideAmount : REFERENCE_REGIONAL_FEE;
      } else {
        regionFee = items.reduce((sum, it) => sum + itemRegionFee(INITIAL_OVERRIDES[it.productCode]), 0);
      }
    }

    units.push({
      key: `group-${groupId}`,
      label: `${group.name} · ${group.warehouse} / ${group.deliveryMethod}`,
      reason: freeApplied
        ? `그룹 상품금액이 무료배송 기준(${fmtWon(group.freeShippingThreshold)}) 이상이라 배송비가 면제되었습니다.`
        : `${group.calcMethod} 방식으로 계산했습니다.`,
      items: items.map((it) => ({ code: it.productCode, name: productName(it.productCode), qty: it.qty })),
      fee,
      regionFee,
      unitTotal: fee + regionFee,
    });
  });

  if (ungrouped.length > 0) {
    if (base.noGroupHandling === '기본 배송 그룹으로 처리') {
      const fees = ungrouped.map((it) => {
        const override = INITIAL_OVERRIDES[it.productCode];
        const product = PRODUCTS.find((p) => p.code === it.productCode);
        return effectiveItemFee(override, it.qty, product?.price ?? 0);
      });
      const fee = fees.every((f) => f === 0) ? 0 : BASE_SHIPPING_POLICY.baseFee;
      const regionFee = isRemote ? REFERENCE_REGIONAL_FEE : 0;
      units.push({
        key: 'no-group',
        label: '기본 배송 그룹 (그룹 미지정 상품)',
        reason: '연결된 묶음 배송 그룹이 없는 상품을 기본 배송 그룹으로 묶어 계산합니다.',
        items: ungrouped.map((it) => ({ code: it.productCode, name: productName(it.productCode), qty: it.qty })),
        fee,
        regionFee,
        unitTotal: fee + regionFee,
      });
    } else {
      ungrouped.forEach((it) => {
        const override = INITIAL_OVERRIDES[it.productCode];
        const product = PRODUCTS.find((p) => p.code === it.productCode);
        const result = computeProductShippingFee(override, { id: 'x', label: 'x', quantity: it.qty, orderAmount: it.qty * (product?.price ?? 0), region: scenario.region });
        units.push({
          key: `solo-${it.productCode}`,
          label: `개별 배송 · ${productName(it.productCode)}`,
          reason: `${productName(it.productCode)}은(는) 연결된 묶음 배송 그룹이 없어 상품/기본 배송 정책으로 각각 계산됩니다.`,
          items: [{ code: it.productCode, name: productName(it.productCode), qty: it.qty }],
          fee: result.baseFee,
          regionFee: result.regionFee,
          unitTotal: result.finalFee,
        });
      });
    }
  }

  const total = units.reduce((sum, u) => sum + u.unitTotal, 0);
  return { units, total };
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const FIELD_LABELS: { key: keyof BundleGroup; label: string; format: (g: BundleGroup) => string }[] = [
  { key: 'name', label: '그룹명', format: (g) => g.name },
  { key: 'status', label: '상태', format: (g) => g.status },
  { key: 'warehouse', label: '출고지', format: (g) => g.warehouse },
  { key: 'deliveryMethod', label: '배송 방식', format: (g) => g.deliveryMethod },
  { key: 'calcMethod', label: '배송비 계산 방식', format: (g) => g.calcMethod },
  { key: 'groupFee', label: '그룹 배송비', format: (g) => fmtWon(g.groupFee) },
  { key: 'freeShippingEnabled', label: '무료배송 사용', format: (g) => (g.freeShippingEnabled ? '사용' : '미사용') },
  { key: 'freeShippingThreshold', label: '무료배송 기준금액', format: (g) => fmtWon(g.freeShippingThreshold) },
  { key: 'regionalFeePolicy', label: '지역 추가배송비', format: (g) => g.regionalFeePolicy },
  { key: 'regionalFeeOverrideAmount', label: '지역 추가비(그룹별)', format: (g) => fmtWon(g.regionalFeeOverrideAmount) },
  { key: 'endDate', label: '적용 종료일', format: (g) => g.endDate ?? '상시' },
];

export function describeChanges(before: BundleGroup, after: BundleGroup): FieldDiff[] {
  return FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

export { PRODUCTS };
export type { Product };
