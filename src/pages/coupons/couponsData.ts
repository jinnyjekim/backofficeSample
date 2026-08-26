import { PRODUCTS } from '../products/productsData';

export type CouponApplyUnit = '상품' | '주문';
export type DiscountMethod = '정률' | '정액';
export type TargetType = '전체' | '특정 상품' | '특정 카테고리';
export type IssueMethod = '관리자 발급' | '자동 발급';
export type ValidityType = '발급후N일' | '날짜지정';
export type StackOption = '가능' | '불가';
export type IssueStatus = '발급 예정' | '발급중' | '발급 종료' | '비활성';

export const TODAY = '2026-08-26';

export const CATEGORIES = Array.from(new Set(PRODUCTS.map((p) => p.category)));
export const OWNERS = ['admin01', 'admin02', 'admin03'];

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  active: boolean;

  applyUnit: CouponApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;

  targetType: TargetType;
  targetProductCodes: string[];
  targetCategories: string[];
  excludeProductCodes: string[];

  issueMethod: IssueMethod;
  issueStart: string;
  issueEnd: string | null;

  totalLimit: number;
  perMemberLimit: number;

  validityType: ValidityType;
  validityDays: number;
  validStart: string | null;
  validEnd: string | null;

  stackPromotion: StackOption;
  stackCoupon: StackOption;

  owner: string;
  adminMemo: string;

  issuedCount: number;
  usedCount: number;

  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  history: HistoryEntry[];
}

export const STATUS_META: Record<IssueStatus, { bg: string; fg: string }> = {
  '발급 예정': { bg: '#eef2ff', fg: '#4338ca' },
  발급중: { bg: '#ecfdf5', fg: '#059669' },
  '발급 종료': { bg: '#f4f4f5', fg: '#71717a' },
  비활성: { bg: '#fef2f2', fg: '#b91c1c' },
};

export function computeStatus(c: Coupon, today: string = TODAY): IssueStatus {
  if (!c.active) return '비활성';
  if (today < c.issueStart) return '발급 예정';
  if (c.issueEnd && today > c.issueEnd) return '발급 종료';
  return '발급중';
}

export function fmtWon(n: number): string {
  return `${n.toLocaleString('ko-KR')}원`;
}

export function productName(code: string): string {
  return PRODUCTS.find((p) => p.code === code)?.name ?? code;
}

export function discountSummary(c: Coupon): string {
  return c.discountMethod === '정률' ? `${c.discountValue}%` : fmtWon(c.discountValue);
}

export function targetSummary(c: Coupon): string {
  if (c.targetType === '전체') return '전체';
  if (c.targetType === '특정 상품') {
    if (c.targetProductCodes.length === 0) return '상품 미지정';
    if (c.targetProductCodes.length === 1) return productName(c.targetProductCodes[0]);
    return `${productName(c.targetProductCodes[0])} 외 ${c.targetProductCodes.length - 1}개`;
  }
  if (c.targetCategories.length === 0) return '카테고리 미지정';
  if (c.targetCategories.length === 1) return c.targetCategories[0];
  return `${c.targetCategories[0]} 외 ${c.targetCategories.length - 1}개`;
}

export function issuePeriodSummary(c: Coupon): string {
  const start = c.issueStart.replaceAll('-', '.');
  if (!c.issueEnd) return `${start} ~`;
  return `${start} ~ ${c.issueEnd.replaceAll('-', '.')}`;
}

export function validitySummary(c: Coupon): string {
  if (c.validityType === '발급후N일') return `발급 후 ${c.validityDays}일`;
  const start = c.validStart ? c.validStart.replaceAll('-', '.') : '-';
  const end = c.validEnd ? c.validEnd.replaceAll('-', '.') : '종료일 없음';
  return `${start} ~ ${end}`;
}

export function computeIssues(c: Coupon): string[] {
  const issues: string[] = [];
  if (c.targetType === '특정 상품' && c.targetProductCodes.length === 0) issues.push('발급 대상 상품이 지정되지 않았습니다.');
  if (c.targetType === '특정 카테고리' && c.targetCategories.length === 0) issues.push('발급 대상 카테고리가 지정되지 않았습니다.');
  if (c.discountMethod === '정률' && c.discountValue > 100) issues.push('할인율이 100%를 초과합니다.');
  if (c.totalLimit > 0 && c.issuedCount >= c.totalLimit) issues.push('발급 한도에 도달했습니다.');
  if (c.validityType === '날짜지정' && !c.validEnd) issues.push('사용 유효기간 종료일이 없습니다.');
  if (c.validityType === '발급후N일' && c.validityDays <= 0) issues.push('사용 유효기간 설정이 올바르지 않습니다.');
  return issues;
}

export type QuickFilter = '전체' | '발급중' | '발급 예정' | '발급 종료' | '비활성' | '검토 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '발급중', '발급 예정', '발급 종료', '비활성', '검토 필요'];

export function matchesQuickFilter(c: Coupon, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '검토 필요') return computeIssues(c).length > 0;
  return computeStatus(c) === filter;
}

function nextInternalId(list: Coupon[]): string {
  const maxSeq = list.reduce((max, c) => {
    const n = parseInt(c.id.replace('CPN-', ''), 10);
    return Number.isNaN(n) ? max : Math.max(max, n);
  }, 0);
  return `CPN-${String(maxSeq + 1).padStart(5, '0')}`;
}

export function newCoupon(list: Coupon[]): Coupon {
  return {
    id: nextInternalId(list),
    code: '',
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
    issueMethod: '관리자 발급',
    issueStart: TODAY,
    issueEnd: null,
    totalLimit: 0,
    perMemberLimit: 1,
    validityType: '발급후N일',
    validityDays: 30,
    validStart: null,
    validEnd: null,
    stackPromotion: '가능',
    stackCoupon: '불가',
    owner: OWNERS[0],
    adminMemo: '',
    issuedCount: 0,
    usedCount: 0,
    createdAt: TODAY,
    updatedAt: TODAY,
    updatedBy: OWNERS[0],
    history: [],
  };
}

export function cloneCoupon(source: Coupon, list: Coupon[]): Coupon {
  return {
    ...source,
    id: nextInternalId(list),
    code: `${source.code}-COPY`,
    name: `${source.name} - 복사본`,
    active: true,
    issueStart: TODAY,
    issueEnd: null,
    issuedCount: 0,
    usedCount: 0,
    createdAt: TODAY,
    updatedAt: TODAY,
    updatedBy: source.owner,
    history: [{ id: `H-${Date.now()}`, at: `${TODAY} 15:00`, by: source.owner, action: `'${source.name}'에서 복제` }],
  };
}

export interface PreviewResult {
  applicable: boolean;
  reasons: string[];
  baseAmount: number;
  discount: number;
  final: number;
}

export function calcPreview(c: Coupon, orderAmount: number, promotionDiscount: number, targetIncluded: boolean): PreviewResult {
  const reasons: string[] = [];
  const baseAmount = Math.max(0, orderAmount - promotionDiscount);
  if (c.targetType !== '전체' && !targetIncluded) reasons.push('사용 대상 상품 / 카테고리가 아닙니다.');
  if (baseAmount < c.minPurchaseAmount) reasons.push(`최소 구매금액 ${fmtWon(c.minPurchaseAmount)} 미충족`);

  if (reasons.length > 0) {
    return { applicable: false, reasons, baseAmount, discount: 0, final: baseAmount };
  }

  let discount = c.discountMethod === '정률' ? Math.round((baseAmount * c.discountValue) / 100) : c.discountValue;
  if (c.discountMethod === '정률' && c.maxDiscountAmount > 0) discount = Math.min(discount, c.maxDiscountAmount);
  discount = Math.min(discount, baseAmount);

  return { applicable: true, reasons: [], baseAmount, discount, final: baseAmount - discount };
}

export const COUPONS: Coupon[] = [
  {
    id: 'CPN-00182', code: 'NEW5000', name: '신규회원 5천원 쿠폰', active: true,
    applyUnit: '주문', discountMethod: '정액', discountValue: 5000, maxDiscountAmount: 0, minPurchaseAmount: 30000,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    issueMethod: '자동 발급', issueStart: '2026-08-01', issueEnd: '2026-08-31',
    totalLimit: 10000, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 30, validStart: null, validEnd: null,
    stackPromotion: '가능', stackCoupon: '불가',
    owner: 'admin01', adminMemo: '신규회원 가입 프로모션용 쿠폰.',
    issuedCount: 8482, usedCount: 4218,
    createdAt: '2026-07-25', updatedAt: '2026-08-01', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-07-25 10:00', by: 'admin01', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00183', code: 'PRODUCT10', name: '9월 상품 쿠폰', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 10, maxDiscountAmount: 20000, minPurchaseAmount: 0,
    targetType: '특정 상품', targetProductCodes: ['P-001238', 'P-001240'], targetCategories: [], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-09-01', issueEnd: '2026-09-30',
    totalLimit: 5000, perMemberLimit: 2,
    validityType: '날짜지정', validityDays: 0, validStart: '2026-09-01', validEnd: '2026-10-31',
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin02', adminMemo: '',
    issuedCount: 0, usedCount: 0,
    createdAt: '2026-08-20', updatedAt: '2026-08-20', updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-08-20 11:00', by: 'admin02', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00184', code: 'CATE01', name: '카테고리 01 쿠폰', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 15, maxDiscountAmount: 30000, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: ['카테고리 01'], excludeProductCodes: [],
    issueMethod: '자동 발급', issueStart: '2026-07-15', issueEnd: '2026-08-31',
    totalLimit: 2000, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 30, validStart: null, validEnd: null,
    stackPromotion: '불가', stackCoupon: '불가',
    owner: 'admin01', adminMemo: '',
    issuedCount: 1842, usedCount: 960,
    createdAt: '2026-07-10', updatedAt: '2026-07-10', updatedBy: 'admin01',
    history: [{ id: 'H-1', at: '2026-07-10 09:00', by: 'admin01', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00185', code: 'LIMIT100', name: '한정 수량 주문 쿠폰', active: true,
    applyUnit: '주문', discountMethod: '정액', discountValue: 3000, maxDiscountAmount: 0, minPurchaseAmount: 20000,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-08-01', issueEnd: null,
    totalLimit: 100, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 14, validStart: null, validEnd: null,
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin03', adminMemo: '선착순 100장 한정. 소진 확인 필요.',
    issuedCount: 100, usedCount: 88,
    createdAt: '2026-07-28', updatedAt: '2026-08-20', updatedBy: 'admin03',
    history: [{ id: 'H-1', at: '2026-07-28 09:00', by: 'admin03', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00186', code: 'BUGRATE', name: '오입력 할인율 쿠폰', active: true,
    applyUnit: '상품', discountMethod: '정률', discountValue: 150, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '특정 상품', targetProductCodes: ['P-001239'], targetCategories: [], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-07-01', issueEnd: '2026-07-31',
    totalLimit: 0, perMemberLimit: 1,
    validityType: '날짜지정', validityDays: 0, validStart: '2026-07-01', validEnd: '2026-08-31',
    stackPromotion: '불가', stackCoupon: '불가',
    owner: 'admin02', adminMemo: '할인율(150%) 오입력으로 확인이 필요합니다.',
    issuedCount: 42, usedCount: 12,
    createdAt: '2026-06-25', updatedAt: '2026-06-25', updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-06-25 09:00', by: 'admin02', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00187', code: 'BADVALID', name: '유효기간 미설정 쿠폰', active: true,
    applyUnit: '주문', discountMethod: '정액', discountValue: 2000, maxDiscountAmount: 0, minPurchaseAmount: 10000,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    issueMethod: '자동 발급', issueStart: '2026-06-01', issueEnd: '2026-06-30',
    totalLimit: 500, perMemberLimit: 1,
    validityType: '날짜지정', validityDays: 0, validStart: '2026-07-01', validEnd: null,
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin01', adminMemo: '사용 종료일 설정이 누락된 것으로 보입니다.',
    issuedCount: 500, usedCount: 300,
    createdAt: '2026-05-28', updatedAt: '2026-06-30', updatedBy: 'admin01',
    history: [
      { id: 'H-1', at: '2026-05-28 09:00', by: 'admin01', action: '쿠폰 등록' },
      { id: 'H-2', at: '2026-06-30 23:59', by: 'admin01', action: '발급 자동 종료' },
    ],
  },
  {
    id: 'CPN-00188', code: 'SPRING02', name: '봄맞이 카테고리 02 쿠폰', active: false,
    applyUnit: '상품', discountMethod: '정률', discountValue: 12, maxDiscountAmount: 15000, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: ['카테고리 02'], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-04-01', issueEnd: '2026-04-30',
    totalLimit: 1000, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 30, validStart: null, validEnd: null,
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin03', adminMemo: '발급 종료 후 비활성화함.',
    issuedCount: 620, usedCount: 480,
    createdAt: '2026-03-25', updatedAt: '2026-05-02', updatedBy: 'admin03',
    history: [
      { id: 'H-1', at: '2026-03-25 09:00', by: 'admin03', action: '쿠폰 등록' },
      { id: 'H-2', at: '2026-05-02 10:00', by: 'admin03', action: '쿠폰 비활성화' },
    ],
  },
  {
    id: 'CPN-00189', code: 'NOTARGET', name: '카테고리 미지정 쿠폰', active: true,
    applyUnit: '상품', discountMethod: '정액', discountValue: 5000, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '특정 카테고리', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-09-05', issueEnd: '2026-09-20',
    totalLimit: 0, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 14, validStart: null, validEnd: null,
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin02', adminMemo: '카테고리 확정 전 임시 등록.',
    issuedCount: 0, usedCount: 0,
    createdAt: '2026-08-22', updatedAt: '2026-08-22', updatedBy: 'admin02',
    history: [{ id: 'H-1', at: '2026-08-22 14:00', by: 'admin02', action: '쿠폰 등록' }],
  },
  {
    id: 'CPN-00190', code: 'TESTONLY', name: '테스트 쿠폰 (미사용)', active: false,
    applyUnit: '주문', discountMethod: '정액', discountValue: 1000, maxDiscountAmount: 0, minPurchaseAmount: 0,
    targetType: '전체', targetProductCodes: [], targetCategories: [], excludeProductCodes: [],
    issueMethod: '관리자 발급', issueStart: '2026-03-01', issueEnd: null,
    totalLimit: 0, perMemberLimit: 1,
    validityType: '발급후N일', validityDays: 7, validStart: null, validEnd: null,
    stackPromotion: '가능', stackCoupon: '가능',
    owner: 'admin02', adminMemo: '테스트 후 미사용 처리.',
    issuedCount: 0, usedCount: 0,
    createdAt: '2026-03-01', updatedAt: '2026-03-02', updatedBy: 'admin02',
    history: [
      { id: 'H-1', at: '2026-03-01 09:00', by: 'admin02', action: '쿠폰 등록' },
      { id: 'H-2', at: '2026-03-02 09:00', by: 'admin02', action: '쿠폰 비활성화' },
    ],
  },
];

export { PRODUCTS };
