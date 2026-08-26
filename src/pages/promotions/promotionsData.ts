import { PRODUCTS } from '../products/productsData';

export type ApplyUnit = '상품' | '주문';
export type DiscountMethod = '정률' | '정액';
export type TargetType = '전체' | '특정 상품' | '특정 카테고리';
export type PromotionStatus = '진행 예정' | '진행중' | '종료' | '비활성';
export type StackOption = '가능' | '불가';

export const TODAY = '2026-08-26';

export const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category)));
export const OWNERS = ['admin01', 'admin02', 'admin03'];

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
}

export interface Promotion {
  id: string;
  code: string;
  name: string;
  active: boolean;

  applyUnit: ApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;

  targetType: TargetType;
  targetProductCodes: string[];
  targetCategories: string[];
  excludeProductCodes: string[];

  startDate: string;
  endDate: string | null;

  stackPromotion: StackOption;
  stackCoupon: StackOption;
  priority: number;

  owner: string;
  adminMemo: string;

  appliedCount: number;
  appliedAmount: number;

  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
}

export const STATUS_META: Record<PromotionStatus, { bg: string; fg: string }> = {
  '진행 예정': { bg: '#eef2ff', fg: '#4338ca' },
  진행중: { bg: '#ecfdf5', fg: '#059669' },
  종료: { bg: '#f4f4f5', fg: '#71717a' },
  비활성: { bg: '#fef2f2', fg: '#b91c1c' },
};

export function computeStatus(p: Promotion, today: string = TODAY): PromotionStatus {
  if (!p.active) return '비활성';
  if (today < p.startDate) return '진행 예정';
  if (p.endDate && today > p.endDate) return '종료';
  return '진행중';
}

export function fmtWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function discountSummary(p: Promotion): string {
  return p.discountMethod === '정률' ? `${p.discountValue}%` : fmtWon(p.discountValue);
}

export function targetSummary(p: Promotion): string {
  if (p.targetType === '전체') return '전체';
  if (p.targetType === '특정 상품') {
    if (p.targetProductCodes.length === 0) return '상품 미지정';
    if (p.targetProductCodes.length === 1) return productName(p.targetProductCodes[0]);
    return `${productName(p.targetProductCodes[0])} 외 ${p.targetProductCodes.length - 1}개`;
  }
  if (p.targetCategories.length === 0) return '카테고리 미지정';
  if (p.targetCategories.length === 1) return p.targetCategories[0];
  return `${p.targetCategories[0]} 외 ${p.targetCategories.length - 1}개`;
}

export function periodSummary(p: Promotion): string {
  const start = p.startDate.replaceAll('-', '.');
  if (!p.endDate) return `${start} ~`;
  return `${start} ~ ${p.endDate.replaceAll('-', '.')}`;
}

function targetsOverlap(a: Promotion, b: Promotion): boolean {
  if (a.targetType === '전체' || b.targetType === '전체') return true;
  if (a.targetType === '특정 상품' && b.targetType === '특정 상품') {
    return a.targetProductCodes.some((c) => b.targetProductCodes.includes(c));
  }
  if (a.targetType === '특정 카테고리' && b.targetType === '특정 카테고리') {
    return a.targetCategories.some((c) => b.targetCategories.includes(c));
  }
  if (a.targetType === '특정 상품' && b.targetType === '특정 카테고리') {
    return a.targetProductCodes.some((code) => b.targetCategories.includes(PRODUCTS.find((p) => p.code === code)?.category ?? ''));
  }
  if (a.targetType === '특정 카테고리' && b.targetType === '특정 상품') {
    return b.targetProductCodes.some((code) => a.targetCategories.includes(PRODUCTS.find((p) => p.code === code)?.category ?? ''));
  }
  return false;
}

function periodsOverlap(a: Promotion, b: Promotion): boolean {
  const aEnd = a.endDate ?? '9999-12-31';
  const bEnd = b.endDate ?? '9999-12-31';
  return a.startDate <= bEnd && b.startDate <= aEnd;
}

export function computeIssues(p: Promotion, all: Promotion[]): string[] {
  const issues: string[] = [];
  if (p.targetType === '특정 상품' && p.targetProductCodes.length === 0) issues.push('적용 대상 상품이 지정되지 않았습니다.');
  if (p.targetType === '특정 카테고리' && p.targetCategories.length === 0) issues.push('적용 대상 카테고리가 지정되지 않았습니다.');
  if (p.discountMethod === '정률' && p.discountValue > 100) issues.push('할인율이 100%를 초과합니다.');
  if (!p.endDate) issues.push('종료일이 없는 프로모션입니다.');

  if (p.active && p.stackPromotion === '불가') {
    const conflict = all.find(
      (other) =>
        other.id !== p.id &&
        other.active &&
        other.stackPromotion === '불가' &&
        computeStatus(other) !== '종료' &&
        computeStatus(p) !== '종료' &&
        periodsOverlap(p, other) &&
        targetsOverlap(p, other),
    );
    if (conflict) issues.push(`'${conflict.name}'과(와) 중복 불가 정책이 충돌합니다.`);
  }

  return issues;
}

export type QuickFilter = '전체' | '진행중' | '진행 예정' | '종료' | '비활성' | '검토 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '진행중', '진행 예정', '종료', '비활성', '검토 필요'];

export function matchesQuickFilter(p: Promotion, filter: QuickFilter, issues: Record<string, string[]>): boolean {
  if (filter === '전체') return true;
  if (filter === '검토 필요') return (issues[p.id]?.length ?? 0) > 0;
  return computeStatus(p) === filter;
}

function nextCode(list: Promotion[]): string {
  const ym = TODAY.slice(0, 7).replace('-', '');
  const prefix = `PROMO-${ym}-`;
  const maxSeq = list.reduce((max, p) => {
    if (!p.code.startsWith(prefix)) return max;
    const n = parseInt(p.code.slice(prefix.length), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

export function newPromotion(list: Promotion[]): Promotion {
  return {
    id: `PR-${Date.now()}`,
    code: nextCode(list),
    name: '',
    active: true,
    applyUnit: '상품',
    discountMethod: '정률',
    discountValue: 10,
    maxDiscountAmount: 0,
    minPurchaseAmount: 0,
    targetType: '전체',
    targetProductCodes: [],
    targetCategories: [],
    excludeProductCodes: [],
    startDate: TODAY,
    endDate: null,
    stackPromotion: '불가',
    stackCoupon: '가능',
    priority: 100,
    owner: OWNERS[0],
    adminMemo: '',
    appliedCount: 0,
    appliedAmount: 0,
    createdAt: TODAY,
    updatedAt: TODAY,
    updatedBy: OWNERS[0],
    history: [],
  };
}

export function clonePromotion(source: Promotion, list: Promotion[]): Promotion {
  return {
    ...source,
    id: `PR-${Date.now()}`,
    code: nextCode(list),
    name: `${source.name} - 복사본`,
    active: true,
    startDate: TODAY,
    endDate: null,
    appliedCount: 0,
    appliedAmount: 0,
    createdAt: TODAY,
    updatedAt: TODAY,
    updatedBy: source.owner,
    history: [{ id: `H-${Date.now()}`, at: `${TODAY} 15:00`, by: source.owner, action: `'${source.name}'에서 복제` }],
  };
}

export interface PreviewResult {
  applicable: boolean;
  reasons: string[];
  orderAmount: number;
  discount: number;
  final: number;
}

export function calcPreview(p: Promotion, orderAmount: number, targetIncluded: boolean): PreviewResult {
  const reasons: string[] = [];
  const status = computeStatus(p);
  if (status === '진행 예정' || status === '종료' || status === '비활성') reasons.push('적용 기간이 아닙니다.');
  if (p.targetType !== '전체' && !targetIncluded) reasons.push('대상 상품 / 카테고리가 아닙니다.');
  if (orderAmount < p.minPurchaseAmount) reasons.push(`최소 구매금액 ${fmtWon(p.minPurchaseAmount)} 미충족`);

  if (reasons.length > 0) {
    return { applicable: false, reasons, orderAmount, discount: 0, final: orderAmount };
  }

  let discount = p.discountMethod === '정률' ? Math.round((orderAmount * p.discountValue) / 100) : p.discountValue;
  if (p.discountMethod === '정률' && p.maxDiscountAmount > 0) discount = Math.min(discount, p.maxDiscountAmount);
  discount = Math.min(discount, orderAmount);

  return { applicable: true, reasons: [], orderAmount, discount, final: orderAmount - discount };
}

export const PROMOTIONS: Promotion[] = [
  {
    id: 'PR-1001', code: 'PROMO-202609-001', name: '9월 상품 할인', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 10, maxDiscountAmount: 20000, minPurchaseAmount: 30000,
    targetType: '특정 상품', targetProductCodes: ['P-001238', 'P-001240'], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-09-01', endDate: '2026-09-30', stackPromotion: '불가', stackCoupon: '가능', priority: 100,
    owner: 'admin01', adminMemo: '9월 프로모션 캘린더 반영.', appliedCount: 0, appliedAmount: 0,
    createdAt: '2026-08-20', updatedAt: '2026-08-20', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-08-20 10:00', by: 'admin01', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1002', code: 'PROMO-202608-002', name: '전 상품 주문 할인', active: true,
    applyUnit: '주문', discountMethod: '정액', discountValue: 5000, maxDiscountAmount: 0, minPurchaseAmount: 50000,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: ['P-001241'],
    startDate: '2026-08-01', endDate: null, stackPromotion: '가능', stackCoupon: '가능', priority: 200,
    owner: 'admin01', adminMemo: '상시 운영 기본 프로모션.', appliedCount: 842, appliedAmount: 4210000,
    createdAt: '2026-08-01', updatedAt: '2026-08-01', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-08-01 09:00', by: 'admin01', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1003', code: 'PROMO-202608-003', name: '카테고리 01 여름 할인', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 15, maxDiscountAmount: 30000, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: ['카테고리 01'], excludeProductCodes: [],
    startDate: '2026-07-15', endDate: '2026-08-31', stackPromotion: '불가', stackCoupon: '가능', priority: 100,
    owner: 'admin02', adminMemo: '', appliedCount: 356, appliedAmount: 2140000,
    createdAt: '2026-07-10', updatedAt: '2026-07-10', updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-07-10 09:00', by: 'admin02', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1004', code: 'PROMO-202608-004', name: '카테고리 01 초특가', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 20, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: ['카테고리 01'], excludeProductCodes: [],
    startDate: '2026-08-15', endDate: '2026-09-15', stackPromotion: '불가', stackCoupon: '가능', priority: 50,
    owner: 'admin02', adminMemo: '카테고리 01 여름 할인과 대상이 겹칩니다. 우선순위로 정리 필요.', appliedCount: 12, appliedAmount: 84000,
    createdAt: '2026-08-14', updatedAt: '2026-08-14', updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-08-14 11:00', by: 'admin02', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1005', code: 'PROMO-202607-005', name: '신규 카테고리 03 런칭 할인', active: true,
    applyUnit: '상품', discountMethod: '정액', discountValue: 3000, maxDiscountAmount: 0, minPurchaseAmount: 10000,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-09-05', endDate: '2026-09-20', stackPromotion: '가능', stackCoupon: '가능', priority: 150,
    owner: 'admin03', adminMemo: '카테고리 확정 전 임시 등록.', appliedCount: 0, appliedAmount: 0,
    createdAt: '2026-08-22', updatedAt: '2026-08-22', updatedBy: 'admin03',
    history: [{ id: 'H-1', at: '2026-08-22 14:00', by: 'admin03', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1006', code: 'PROMO-202607-006', name: '7월 대형가전 할인', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 150, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '특정 상품', targetProductCodes: ['P-001240'], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-07-01', endDate: '2026-07-31', stackPromotion: '불가', stackCoupon: '불가', priority: 100,
    owner: 'admin01', adminMemo: '할인율 오입력 확인 필요.', appliedCount: 4, appliedAmount: 180000,
    createdAt: '2026-06-25', updatedAt: '2026-06-25', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-06-25 09:00', by: 'admin01', action: '프로모션 등록' }],
  },
  {
    id: 'PR-1007', code: 'PROMO-202606-007', name: '6월 신규가입 상품 할인', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 10, maxDiscountAmount: 10000, minPurchaseAmount: 0,
    targetType: '특정 상품', targetProductCodes: ['P-001239'], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-06-01', endDate: '2026-06-30', stackPromotion: '불가', stackCoupon: '가능', priority: 100,
    owner: 'admin02', adminMemo: '', appliedCount: 214, appliedAmount: 998000,
    createdAt: '2026-05-28', updatedAt: '2026-06-30', updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-05-28 09:00', by: 'admin02', action: '프로모션 등록' },
      { id: 'H-2', at: '2026-06-30 23:59', by: 'admin02', action: '프로모션 자동 종료' },
    ],
  },
  {
    id: 'PR-1008', code: 'PROMO-202605-008', name: '5월 가정의달 주문 할인', active: true,
    applyUnit: '주문', discountMethod: '정액', discountValue: 8000, maxDiscountAmount: 0, minPurchaseAmount: 80000,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-05-01', endDate: '2026-05-31', stackPromotion: '가능', stackCoupon: '가능', priority: 200,
    owner: 'admin01', adminMemo: '', appliedCount: 512, appliedAmount: 4096000,
    createdAt: '2026-04-25', updatedAt: '2026-05-31', updatedBy: 'admin01',
    history: [
      { id: 'H-1', at: '2026-04-25 09:00', by: 'admin01', action: '프로모션 등록' },
      { id: 'H-2', at: '2026-05-31 23:59', by: 'admin01', action: '프로모션 자동 종료' },
    ],
  },
  {
    id: 'PR-1009', code: 'PROMO-202604-009', name: '봄맞이 카테고리 02 할인', active: false,
    applyUnit: '상품', discountMethod: '정률', discountValue: 12, maxDiscountAmount: 15000, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: ['카테고리 02'], excludeProductCodes: [],
    startDate: '2026-04-01', endDate: '2026-04-30', stackPromotion: '불가', stackCoupon: '가능', priority: 100,
    owner: 'admin03', adminMemo: '프로모션 종료 후 비활성화함.', appliedCount: 88, appliedAmount: 312000,
    createdAt: '2026-03-25', updatedAt: '2026-05-02', updatedBy: 'admin03',
    history: [
      { id: 'H-1', at: '2026-03-25 09:00', by: 'admin03', action: '프로모션 등록' },
      { id: 'H-2', at: '2026-05-02 10:00', by: 'admin03', action: '프로모션 비활성화' },
    ],
  },
  {
    id: 'PR-1010', code: 'PROMO-202603-010', name: '테스트 프로모션 (미사용)', active: false,
    applyUnit: '상품', discountMethod: '정액', discountValue: 1000, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    startDate: '2026-03-01', endDate: null, stackPromotion: '가능', stackCoupon: '가능', priority: 999,
    owner: 'admin02', adminMemo: '테스트 후 미사용 처리.', appliedCount: 0, appliedAmount: 0,
    createdAt: '2026-03-01', updatedAt: '2026-03-02', updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-03-01 09:00', by: 'admin02', action: '프로모션 등록' },
      { id: 'H-2', at: '2026-03-02 09:00', by: 'admin02', action: '프로모션 비활성화' },
    ],
  },
];

export { PRODUCTS };
