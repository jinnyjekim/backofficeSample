import { INITIAL_POLICY as BASE_SHIPPING_POLICY } from './shippingBaseFeeData';

export type RegionType = '행정구역' | '우편번호';
export type DeliveryMethod = '전체' | '일반배송' | '당일배송';
export type FreeShippingTreatment = '지역 추가비 부과' | '지역 추가비 면제';
export type PolicyStatus = '적용중' | '적용 예정' | '종료' | '비활성';

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  before?: string;
  after?: string;
}

export interface RegionalFeePolicy {
  id: string;
  name: string;
  code: string;
  description: string;

  regionType: RegionType;
  sido: string;
  sigungu: string;
  postalCodes: string[];

  extraFee: number;
  deliveryMethod: DeliveryMethod;
  freeShippingTreatment: FreeShippingTreatment;
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

export function computeStatus(p: RegionalFeePolicy, today: string = TODAY): PolicyStatus {
  if (!p.active) return '비활성';
  if (p.startDate > today) return '적용 예정';
  if (p.endDate && p.endDate < today) return '종료';
  return '적용중';
}

export const SIDO_OPTIONS = ['제주특별자치도', '인천광역시', '전라남도', '경상북도', '강원특별자치도', '서울특별시'];
export const DELIVERY_METHODS: DeliveryMethod[] = ['전체', '일반배송', '당일배송'];

export function newRegionalFeePolicy(): RegionalFeePolicy {
  return {
    id: `NEW-${Date.now()}`,
    name: '',
    code: '',
    description: '',
    regionType: '행정구역',
    sido: SIDO_OPTIONS[0],
    sigungu: '전체',
    postalCodes: [],
    extraFee: 0,
    deliveryMethod: '전체',
    freeShippingTreatment: '지역 추가비 부과',
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

export const INITIAL_POLICIES: RegionalFeePolicy[] = [
  {
    id: 'RSF-001', name: '제주 지역 추가배송비', code: 'JEJU_SURCHARGE', description: '제주 전역 배송 시 추가되는 배송비입니다.',
    regionType: '행정구역', sido: '제주특별자치도', sigungu: '전체', postalCodes: [],
    extraFee: 3000, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 부과', priority: 5,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 842,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'RSF-002', name: '제주시 우선 지역비', code: 'JEJU_CITY_OVERRIDE', description: '제주시 일반배송 건에 우선 적용되는 지역비입니다.',
    regionType: '행정구역', sido: '제주특별자치도', sigungu: '제주시', postalCodes: [],
    extraFee: 2000, deliveryMethod: '일반배송', freeShippingTreatment: '지역 추가비 부과', priority: 3,
    startDate: '2026-06-01', endDate: null, active: true, usageCount: 120,
    adminMemo: '제주 전역 정책보다 구체적이어서 제주시 주문에는 이 정책이 우선 적용됩니다.', updatedAt: '2026-06-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-06-01 10:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'RSF-003', name: '인천 옹진군 도서지역 추가배송비', code: 'ONGJIN_ISLAND', description: '옹진군 도서지역 일반배송 추가비입니다.',
    regionType: '행정구역', sido: '인천광역시', sigungu: '옹진군', postalCodes: [],
    extraFee: 5000, deliveryMethod: '일반배송', freeShippingTreatment: '지역 추가비 부과', priority: 3,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 64,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'RSF-004', name: '도서산간 우편번호 추가배송비', code: 'REMOTE_POSTAL', description: '개별 등록된 도서산간 우편번호 지역의 추가배송비입니다.',
    regionType: '우편번호', sido: '', sigungu: '', postalCodes: ['23004', '23100', '23200'],
    extraFee: 6000, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 부과', priority: 2,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 31,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'RSF-005', name: '제주 당일배송 할증', code: 'JEJU_SAMEDAY', description: '제주 지역 당일배송 요청 시 적용되는 할증 배송비입니다.',
    regionType: '행정구역', sido: '제주특별자치도', sigungu: '전체', postalCodes: [],
    extraFee: 10000, deliveryMethod: '당일배송', freeShippingTreatment: '지역 추가비 부과', priority: 5,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 12,
    adminMemo: '', updatedAt: '2026-01-01', updatedBy: 'admin01',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin01', action: '정책 등록' }],
  },
  {
    id: 'RSF-006', name: '제주 전역 추가배송비 (구)', code: 'JEJU_OLD', description: '개편 전 제주 전역 추가배송비 정책입니다.',
    regionType: '행정구역', sido: '제주특별자치도', sigungu: '전체', postalCodes: [],
    extraFee: 2500, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 부과', priority: 5,
    startDate: '2026-01-01', endDate: null, active: true, usageCount: 5,
    adminMemo: '신규 정책(JEJU_SURCHARGE) 등록 후 종료 처리가 누락된 것으로 보입니다.', updatedAt: '2026-01-01', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-01-01 09:00', by: 'admin02', action: '정책 등록' }],
  },
  {
    id: 'RSF-007', name: '전남 도서지역 추가배송비 (종료)', code: 'JEONNAM_ISLAND_OLD', description: '2025년까지 적용되던 신안군 도서지역 추가배송비입니다.',
    regionType: '행정구역', sido: '전라남도', sigungu: '신안군', postalCodes: [],
    extraFee: 4000, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 부과', priority: 3,
    startDate: '2025-01-01', endDate: '2025-12-31', active: true, usageCount: 920,
    adminMemo: '', updatedAt: '2025-12-31', updatedBy: 'admin01',
    history: [
      { id: 'H1', at: '2025-01-01 09:00', by: 'admin01', action: '정책 등록' },
      { id: 'H2', at: '2025-12-31 18:00', by: 'admin01', action: '정책 종료', before: '상시', after: '2025-12-31 종료' },
    ],
  },
  {
    id: 'RSF-008', name: '울릉도 추가배송비', code: 'ULLEUNG_DRAFT', description: '울릉군 배송 시 적용 예정인 추가배송비입니다. 무료배송 시에도 면제되지 않습니다.',
    regionType: '행정구역', sido: '경상북도', sigungu: '울릉군', postalCodes: [],
    extraFee: 8000, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 면제', priority: 3,
    startDate: '2026-12-01', endDate: null, active: true, usageCount: 0,
    adminMemo: '', updatedAt: '2026-08-10', updatedBy: 'admin02',
    history: [{ id: 'H1', at: '2026-08-10 11:00', by: 'admin02', action: '정책 등록' }],
  },
  {
    id: 'RSF-009', name: '옛 강원 산간 추가배송비', code: 'GANGWON_OLD_INACTIVE', description: '개편으로 더 이상 사용하지 않는 정책입니다.',
    regionType: '행정구역', sido: '강원특별자치도', sigungu: '전체', postalCodes: [],
    extraFee: 3000, deliveryMethod: '전체', freeShippingTreatment: '지역 추가비 부과', priority: 5,
    startDate: '2026-01-01', endDate: null, active: false, usageCount: 0,
    adminMemo: '강원 지역은 현재 지역비 정책을 운영하지 않기로 결정하여 비활성화함.', updatedAt: '2026-07-01', updatedBy: 'admin01',
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

function regionOverlaps(a: RegionalFeePolicy, b: RegionalFeePolicy): boolean {
  if (a.regionType !== b.regionType) return false;
  if (a.regionType === '행정구역') return a.sido === b.sido && a.sigungu === b.sigungu;
  return a.postalCodes.some((code) => b.postalCodes.includes(code));
}

function datesOverlap(a: RegionalFeePolicy, b: RegionalFeePolicy): boolean {
  const aEnd = a.endDate ?? '9999-12-31';
  const bEnd = b.endDate ?? '9999-12-31';
  return a.startDate <= bEnd && b.startDate <= aEnd;
}

export function computeWarnings(policies: RegionalFeePolicy[]): PolicyWarnings {
  const map: PolicyWarnings = {};
  const add = (id: string, message: string) => { (map[id] ??= []).push(message); };

  policies.forEach((p) => {
    if (p.extraFee < 0) add(p.id, '추가 배송비는 0원 이상이어야 합니다.');
    if (p.regionType === '행정구역' && !p.sido) add(p.id, '대상 지역이 선택되지 않았습니다.');
    if (p.regionType === '우편번호' && p.postalCodes.length === 0) add(p.id, '등록된 우편번호가 없습니다.');
    if (p.endDate && p.endDate < p.startDate) add(p.id, '적용 시작일이 종료일보다 늦습니다.');
  });

  const active = policies.filter((p) => p.active);
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      if (a.deliveryMethod !== b.deliveryMethod || a.priority !== b.priority) continue;
      if (!regionOverlaps(a, b) || !datesOverlap(a, b)) continue;
      add(a.id, `동일 조건(우선순위 ${a.priority}, ${a.deliveryMethod})의 적용중 정책 '${b.name}'과 지역·기간이 겹칩니다.`);
      add(b.id, `동일 조건(우선순위 ${b.priority}, ${b.deliveryMethod})의 적용중 정책 '${a.name}'과 지역·기간이 겹칩니다.`);
    }
  }
  return map;
}

export function matchesQuickFilter(p: RegionalFeePolicy, filter: QuickFilter, warnings: PolicyWarnings): boolean {
  if (filter === '전체') return true;
  if (filter === '확인 필요') return (warnings[p.id]?.length ?? 0) > 0;
  return computeStatus(p) === filter;
}

export function fmtWon(n: number): string {
  return n.toLocaleString('ko-KR') + '원';
}

export function fmtRegion(p: RegionalFeePolicy): string {
  if (p.regionType === '우편번호') return `우편번호 ${p.postalCodes.length}개`;
  return p.sigungu === '전체' ? `${p.sido} 전체` : `${p.sido} ${p.sigungu}`;
}

export function fmtPeriod(p: RegionalFeePolicy): string {
  return p.endDate ? `${p.startDate} ~ ${p.endDate}` : `${p.startDate} ~ 상시`;
}

export interface FieldDiff {
  field: string;
  before: string;
  after: string;
}

const POLICY_FIELD_LABELS: { key: keyof RegionalFeePolicy; label: string; format: (p: RegionalFeePolicy) => string }[] = [
  { key: 'name', label: '정책명', format: (p) => p.name },
  { key: 'regionType', label: '지역 지정 방식', format: (p) => p.regionType },
  { key: 'sido', label: '시/도', format: (p) => p.sido || '-' },
  { key: 'sigungu', label: '시/군/구', format: (p) => p.sigungu || '-' },
  { key: 'extraFee', label: '추가 배송비', format: (p) => fmtWon(p.extraFee) },
  { key: 'deliveryMethod', label: '적용 배송방법', format: (p) => p.deliveryMethod },
  { key: 'freeShippingTreatment', label: '무료배송 시 처리', format: (p) => p.freeShippingTreatment },
  { key: 'priority', label: '우선순위', format: (p) => `${p.priority}` },
  { key: 'startDate', label: '적용 시작일', format: (p) => p.startDate },
  { key: 'endDate', label: '적용 종료일', format: (p) => p.endDate ?? '상시' },
  { key: 'active', label: '사용 여부', format: (p) => (p.active ? '사용' : '비활성') },
];

export function describeChanges(before: RegionalFeePolicy, after: RegionalFeePolicy): FieldDiff[] {
  return POLICY_FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({ field: label, before: format(before), after: format(after) }));
}

// ---- Preview: address -> matching regional policy + combined shipping fee ----

export interface TestAddress {
  id: string;
  label: string;
  postalCode: string;
  sido: string;
  sigungu: string;
  deliveryMethod: DeliveryMethod;
  productAmount: number;
}

export const TEST_ADDRESSES: TestAddress[] = [
  { id: 'ADDR-1', label: '제주시 일반 주소', postalCode: '63100', sido: '제주특별자치도', sigungu: '제주시', deliveryMethod: '일반배송', productAmount: 80000 },
  { id: 'ADDR-2', label: '제주 서귀포시 주소', postalCode: '63500', sido: '제주특별자치도', sigungu: '서귀포시', deliveryMethod: '일반배송', productAmount: 30000 },
  { id: 'ADDR-3', label: '인천 옹진군 도서 주소', postalCode: '23200', sido: '인천광역시', sigungu: '옹진군', deliveryMethod: '일반배송', productAmount: 45000 },
  { id: 'ADDR-4', label: '서울 일반 주소', postalCode: '06000', sido: '서울특별시', sigungu: '강남구', deliveryMethod: '일반배송', productAmount: 60000 },
  { id: 'ADDR-5', label: '제주 당일배송 요청', postalCode: '63100', sido: '제주특별자치도', sigungu: '제주시', deliveryMethod: '당일배송', productAmount: 80000 },
];

function regionSpecificity(p: RegionalFeePolicy): number {
  if (p.regionType === '우편번호') return 3;
  return p.sigungu === '전체' ? 1 : 2;
}

function regionMatches(p: RegionalFeePolicy, addr: TestAddress): boolean {
  if (p.regionType === '우편번호') return p.postalCodes.includes(addr.postalCode);
  return p.sido === addr.sido && (p.sigungu === '전체' || p.sigungu === addr.sigungu);
}

export interface MatchResult {
  matched: RegionalFeePolicy | null;
  candidates: RegionalFeePolicy[];
  tie: boolean;
}

export function findMatchingPolicy(addr: TestAddress, policies: RegionalFeePolicy[], today: string = TODAY): MatchResult {
  const eligible = policies.filter((p) =>
    computeStatus(p, today) === '적용중'
    && (p.deliveryMethod === '전체' || p.deliveryMethod === addr.deliveryMethod)
    && regionMatches(p, addr),
  );
  if (eligible.length === 0) return { matched: null, candidates: [], tie: false };

  const scored = eligible.map((p) => ({ p, score: regionSpecificity(p) * 10 + (p.deliveryMethod === '전체' ? 0 : 1) }));
  const maxScore = Math.max(...scored.map((s) => s.score));
  const top = scored.filter((s) => s.score === maxScore).map((s) => s.p);
  return { matched: top[0], candidates: top, tie: top.length > 1 };
}

export interface ShippingPreviewResult {
  baseFee: number;
  freeShippingApplied: boolean;
  regionFee: number;
  finalBaseFee: number;
  finalRegionFee: number;
  finalFee: number;
  match: MatchResult;
}

export function computeAddressShippingPreview(addr: TestAddress, policies: RegionalFeePolicy[]): ShippingPreviewResult {
  const match = findMatchingPolicy(addr, policies);
  const baseFee = BASE_SHIPPING_POLICY.baseFee;
  const freeShippingApplied = BASE_SHIPPING_POLICY.freeShippingEnabled
    && (BASE_SHIPPING_POLICY.freeShippingCompare === '이상' ? addr.productAmount >= BASE_SHIPPING_POLICY.freeShippingThreshold : addr.productAmount > BASE_SHIPPING_POLICY.freeShippingThreshold);

  const regionFee = match.matched?.extraFee ?? 0;
  const finalBaseFee = freeShippingApplied ? 0 : baseFee;
  const finalRegionFee = (freeShippingApplied && match.matched?.freeShippingTreatment === '지역 추가비 면제') ? 0 : regionFee;

  return { baseFee, freeShippingApplied, regionFee, finalBaseFee, finalRegionFee, finalFee: finalBaseFee + finalRegionFee, match };
}

export { BASE_SHIPPING_POLICY };
