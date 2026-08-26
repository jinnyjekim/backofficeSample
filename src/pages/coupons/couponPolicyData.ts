export type MinPurchaseBasis = '쿠폰 적용 직전 금액' | '최초 상품 판매금액';
export type MemberLimitBasis = '누적 발급 기준' | '현재 보유 기준';
export type RoundingMode = '버림' | '반올림' | '올림';
export type RoundingUnit = 1 | 10 | 100;
export type MaxDiscountHandling = '결제 대상 금액까지 할인' | '쿠폰 사용 불가';
export type AllocationMethod = '상품 판매금액 비례' | '상품 수량 비례';

export const TODAY = '2026-08-26';

export const DEFAULT_DISCOUNT_ORDER = ['상품 프로모션', '상품 쿠폰', '주문 프로모션', '주문 쿠폰', '포인트', '배송비 쿠폰'];

export interface PolicyChange {
  field: string;
  before: string;
  after: string;
}

export interface PolicyHistoryEntry {
  id: string;
  at: string;
  by: string;
  reason: string;
  changes: PolicyChange[];
}

export interface CouponPolicy {
  discountOrder: string[];

  allowMultipleCoupons: boolean;
  maxProductCoupons: number;
  maxOrderCoupons: number;
  maxShippingCoupons: number;
  allowSameCouponMultiple: boolean;
  promotionStackDefault: boolean;
  pointStackAllowed: boolean;

  minPurchaseBasis: MinPurchaseBasis;
  includeShippingInMin: boolean;

  fullCancelRestore: boolean;
  partialCancelRecalculate: boolean;
  fullRefundRestore: boolean;
  partialRefundRecalculate: boolean;

  restoreExpiredCoupon: boolean;

  memberLimitBasis: MemberLimitBasis;
  blockOnLimitExceeded: boolean;

  roundingMode: RoundingMode;
  roundingUnit: RoundingUnit;
  maxDiscountHandling: MaxDiscountHandling;
  allocationMethod: AllocationMethod;

  updatedAt: string;
  updatedBy: string;
}

export const INITIAL_POLICY: CouponPolicy = {
  discountOrder: DEFAULT_DISCOUNT_ORDER,

  allowMultipleCoupons: true,
  maxProductCoupons: 1,
  maxOrderCoupons: 1,
  maxShippingCoupons: 1,
  allowSameCouponMultiple: false,
  promotionStackDefault: true,
  pointStackAllowed: true,

  minPurchaseBasis: '쿠폰 적용 직전 금액',
  includeShippingInMin: false,

  fullCancelRestore: true,
  partialCancelRecalculate: true,
  fullRefundRestore: true,
  partialRefundRecalculate: true,

  restoreExpiredCoupon: false,

  memberLimitBasis: '누적 발급 기준',
  blockOnLimitExceeded: true,

  roundingMode: '버림',
  roundingUnit: 1,
  maxDiscountHandling: '결제 대상 금액까지 할인',
  allocationMethod: '상품 판매금액 비례',

  updatedAt: '2026-08-20',
  updatedBy: 'admin01',
};

const FIELD_LABELS: { key: keyof CouponPolicy; label: string; format: (p: CouponPolicy) => string }[] = [
  { key: 'discountOrder', label: '할인 적용 순서', format: (p) => p.discountOrder.join(' → ') },
  { key: 'allowMultipleCoupons', label: '여러 쿠폰 사용', format: (p) => (p.allowMultipleCoupons ? '허용' : '허용하지 않음') },
  { key: 'maxProductCoupons', label: '상품 쿠폰 최대 사용', format: (p) => `${p.maxProductCoupons}장` },
  { key: 'maxOrderCoupons', label: '주문 쿠폰 최대 사용', format: (p) => `${p.maxOrderCoupons}장` },
  { key: 'maxShippingCoupons', label: '배송비 쿠폰 최대 사용', format: (p) => `${p.maxShippingCoupons}장` },
  { key: 'allowSameCouponMultiple', label: '동일 쿠폰 중복 사용', format: (p) => (p.allowSameCouponMultiple ? '허용' : '허용하지 않음') },
  { key: 'promotionStackDefault', label: '프로모션 중복 기본값', format: (p) => (p.promotionStackDefault ? '허용' : '허용하지 않음') },
  { key: 'pointStackAllowed', label: '포인트 중복 사용', format: (p) => (p.pointStackAllowed ? '허용' : '허용하지 않음') },
  { key: 'minPurchaseBasis', label: '최소 구매금액 계산 기준', format: (p) => p.minPurchaseBasis },
  { key: 'includeShippingInMin', label: '최소 구매금액에 배송비 포함', format: (p) => (p.includeShippingInMin ? '포함' : '제외') },
  { key: 'fullCancelRestore', label: '전체 취소 시 쿠폰', format: (p) => (p.fullCancelRestore ? '복원' : '복원하지 않음') },
  { key: 'partialCancelRecalculate', label: '부분 취소 시 쿠폰', format: (p) => (p.partialCancelRecalculate ? '잔여 주문 기준 재계산' : '최초 주문 기준 유지') },
  { key: 'fullRefundRestore', label: '전체 반품 시 쿠폰', format: (p) => (p.fullRefundRestore ? '복원' : '복원하지 않음') },
  { key: 'partialRefundRecalculate', label: '부분 반품 시 쿠폰', format: (p) => (p.partialRefundRecalculate ? '잔여 주문 기준 재계산' : '쿠폰 상태 유지') },
  { key: 'restoreExpiredCoupon', label: '유효기간 만료 쿠폰 복원', format: (p) => (p.restoreExpiredCoupon ? '복원' : '복원하지 않음') },
  { key: 'memberLimitBasis', label: '회원당 발급 한도 기준', format: (p) => p.memberLimitBasis },
  { key: 'blockOnLimitExceeded', label: '발급 한도 초과 시', format: (p) => (p.blockOnLimitExceeded ? '발급 차단' : '관리자 예외 허용') },
  { key: 'roundingMode', label: '정률 할인 소수점 처리', format: (p) => p.roundingMode },
  { key: 'roundingUnit', label: '계산 단위', format: (p) => `${p.roundingUnit}원` },
  { key: 'maxDiscountHandling', label: '할인금액이 결제 대상 금액을 초과하는 경우', format: (p) => p.maxDiscountHandling },
  { key: 'allocationMethod', label: '주문 쿠폰 할인 배분 방식', format: (p) => p.allocationMethod },
];

export function describeChanges(before: CouponPolicy, after: CouponPolicy): PolicyChange[] {
  return FIELD_LABELS.filter(({ key }) => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(({ label, format }) => ({
    field: label,
    before: format(before),
    after: format(after),
  }));
}

export const POLICY_HISTORY: PolicyHistoryEntry[] = [
  {
    id: 'PH-1', at: '2026-08-20 14:10', by: 'admin02', reason: '쿠폰-프로모션 중복 정책 통일',
    changes: [{ field: '프로모션 중복 기본값', before: '허용하지 않음', after: '허용' }],
  },
  {
    id: 'PH-2', at: '2026-08-10 10:20', by: 'admin01', reason: '환불 계산 정책 통일',
    changes: [
      { field: '부분 취소 시 쿠폰', before: '최초 주문 기준 유지', after: '잔여 주문 기준 재계산' },
      { field: '부분 반품 시 쿠폰', before: '쿠폰 상태 유지', after: '잔여 주문 기준 재계산' },
    ],
  },
  {
    id: 'PH-3', at: '2026-07-01 09:00', by: 'admin01', reason: '쿠폰 정책 최초 등록',
    changes: [],
  },
];
