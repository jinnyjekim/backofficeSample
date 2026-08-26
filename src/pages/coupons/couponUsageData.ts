import { COUPONS, type CouponApplyUnit, type DiscountMethod, type StackOption } from './couponsData';

export type UsageStatus = '정상 사용' | '부분 취소 반영' | '전체 취소 반영' | '부분 환불 반영' | '전체 환불 반영';

export const TODAY = '2026-08-26';

export const USAGE_STATUS_META: Record<UsageStatus, { bg: string; fg: string }> = {
  '정상 사용': { bg: '#ecfdf5', fg: '#059669' },
  '부분 취소 반영': { bg: '#fff7ed', fg: '#c2410c' },
  '전체 취소 반영': { bg: '#f4f4f5', fg: '#71717a' },
  '부분 환불 반영': { bg: '#fff7ed', fg: '#c2410c' },
  '전체 환불 반영': { bg: '#fef2f2', fg: '#b91c1c' },
};

export interface BenefitSnapshot {
  applyUnit: CouponApplyUnit;
  discountMethod: DiscountMethod;
  discountValue: number;
  maxDiscountAmount: number;
  minPurchaseAmount: number;
  stackPromotion: StackOption;
  stackCoupon: StackOption;
}

export interface Memo {
  id: string;
  at: string;
  by: string;
  text: string;
}

export interface HistoryEntry {
  id: string;
  at: string;
  by: string;
  action: string;
  detail?: string;
}

export interface CouponUsage {
  id: string;
  issueId: string;
  couponId: string;
  couponCode: string;
  couponNameSnapshot: string;
  couponVersion: number;
  benefitSnapshot: BenefitSnapshot;

  member: string;
  orderId: string;

  orderAmount: number;
  promotionCode: string | null;
  promotionDiscount: number;
  baseAmount: number;

  discountAmount: number;
  currentDiscountAmount: number;
  usedAt: string;
  status: UsageStatus;

  restored: boolean;
  restoredAt: string | null;
  restoreNote: string | null;

  memos: Memo[];
  history: HistoryEntry[];
}

function benefitSnapshotOf(code: string): BenefitSnapshot {
  const c = COUPONS.find((x) => x.code === code)!;
  return {
    applyUnit: c.applyUnit,
    discountMethod: c.discountMethod,
    discountValue: c.discountValue,
    maxDiscountAmount: c.maxDiscountAmount,
    minPurchaseAmount: c.minPurchaseAmount,
    stackPromotion: c.stackPromotion,
    stackCoupon: c.stackCoupon,
  };
}

function couponOf(code: string) {
  const c = COUPONS.find((x) => x.code === code)!;
  return { id: c.id, code: c.code, name: c.name };
}

export function targetSummary(u: CouponUsage): string {
  return u.benefitSnapshot.applyUnit === '상품' ? '상품 적용' : '주문 전체';
}

export function computeIssues(u: CouponUsage): string[] {
  const issues: string[] = [];
  if (u.currentDiscountAmount < 0) issues.push('계산 결과가 음수입니다.');
  if ((u.status === '전체 취소 반영' || u.status === '전체 환불 반영') && u.currentDiscountAmount === u.discountAmount) {
    issues.push('취소·환불이 반영됐지만 쿠폰 할인이 회수되지 않았습니다.');
  }
  if ((u.status === '전체 취소 반영' || u.status === '전체 환불 반영') && !u.restored && !u.restoreNote) {
    issues.push('쿠폰 복원 여부에 대한 처리 근거가 없습니다.');
  }
  return issues;
}

export type QuickFilter = '전체' | '정상 사용' | '취소 / 환불' | '쿠폰 복원' | '확인 필요';
export const QUICK_FILTERS: QuickFilter[] = ['전체', '정상 사용', '취소 / 환불', '쿠폰 복원', '확인 필요'];

export function matchesQuickFilter(u: CouponUsage, filter: QuickFilter): boolean {
  if (filter === '전체') return true;
  if (filter === '정상 사용') return u.status === '정상 사용';
  if (filter === '취소 / 환불') return u.status !== '정상 사용';
  if (filter === '쿠폰 복원') return u.restored;
  return computeIssues(u).length > 0;
}

const NEW5000 = couponOf('NEW5000');
const PRODUCT10 = couponOf('PRODUCT10');
const CATE01 = couponOf('CATE01');
const LIMIT100 = couponOf('LIMIT100');
const BUGRATE = couponOf('BUGRATE');

export const COUPON_USAGES: CouponUsage[] = [
  {
    id: 'CU-20260825-00201', issueId: 'CI-20260825-00201', couponId: NEW5000.id, couponCode: NEW5000.code, couponNameSnapshot: NEW5000.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(NEW5000.code),
    member: 'user01', orderId: 'O-01041',
    orderAmount: 60000, promotionCode: 'PROMO-202608-002', promotionDiscount: 5000, baseAmount: 55000,
    discountAmount: 5000, currentDiscountAmount: 5000, usedAt: '2026-08-25 14:20', status: '정상 사용',
    restored: false, restoredAt: null, restoreNote: null,
    memos: [], history: [{ id: 'H-1', at: '2026-08-25 14:20', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-01041 · 할인 5,000원' }],
  },
  {
    id: 'CU-20260815-00020', issueId: 'CI-20260810-00020', couponId: LIMIT100.id, couponCode: LIMIT100.code, couponNameSnapshot: LIMIT100.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(LIMIT100.code),
    member: 'user04', orderId: 'O-00920',
    orderAmount: 45000, promotionCode: null, promotionDiscount: 0, baseAmount: 45000,
    discountAmount: 3000, currentDiscountAmount: 3000, usedAt: '2026-08-15 12:00', status: '정상 사용',
    restored: false, restoredAt: null, restoreNote: null,
    memos: [], history: [{ id: 'H-1', at: '2026-08-15 12:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00920 · 할인 3,000원' }],
  },
  {
    id: 'CU-20260824-00060', issueId: 'CI-20260822-00060', couponId: PRODUCT10.id, couponCode: PRODUCT10.code, couponNameSnapshot: PRODUCT10.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(PRODUCT10.code),
    member: 'user08', orderId: 'O-00990',
    orderAmount: 42000, promotionCode: null, promotionDiscount: 0, baseAmount: 42000,
    discountAmount: 4200, currentDiscountAmount: 4200, usedAt: '2026-08-24 10:00', status: '정상 사용',
    restored: false, restoredAt: null, restoreNote: null,
    memos: [], history: [{ id: 'H-1', at: '2026-08-24 10:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00990 · 할인 4,200원' }],
  },
  {
    id: 'CU-20260722-00099', issueId: 'CI-20260722-00099', couponId: LIMIT100.id, couponCode: LIMIT100.code, couponNameSnapshot: LIMIT100.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(LIMIT100.code),
    member: 'user05', orderId: 'O-00700',
    orderAmount: 25000, promotionCode: null, promotionDiscount: 0, baseAmount: 25000,
    discountAmount: 3000, currentDiscountAmount: 0, usedAt: '2026-07-22 11:00', status: '전체 취소 반영',
    restored: true, restoredAt: '2026-07-23 09:30', restoreNote: '주문 전체 취소로 쿠폰을 사용 가능 상태로 복원했습니다.',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-07-22 11:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00700 · 할인 3,000원' },
      { id: 'H-2', at: '2026-07-23 09:00', by: 'admin02', action: '주문 전체 취소' },
      { id: 'H-3', at: '2026-07-23 09:30', by: 'admin02', action: '쿠폰 복원', detail: '3,000원 → 0원' },
    ],
  },
  {
    id: 'CU-20260710-00088', issueId: 'CI-20260710-00088', couponId: CATE01.id, couponCode: CATE01.code, couponNameSnapshot: CATE01.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(CATE01.code),
    member: 'user06', orderId: 'O-00750',
    orderAmount: 100000, promotionCode: null, promotionDiscount: 0, baseAmount: 100000,
    discountAmount: 15000, currentDiscountAmount: 7500, usedAt: '2026-07-10 13:00', status: '부분 환불 반영',
    restored: false, restoredAt: null, restoreNote: '부분 환불 건은 쿠폰을 복원하지 않는 정책입니다.',
    memos: [],
    history: [
      { id: 'H-1', at: '2026-07-10 13:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00750 · 할인 15,000원' },
      { id: 'H-2', at: '2026-07-15 10:00', by: 'admin01', action: '주문 상품 일부 환불' },
      { id: 'H-3', at: '2026-07-15 10:05', by: 'admin01', action: '쿠폰 할인 부분 환불 반영', detail: '15,000원 → 7,500원' },
    ],
  },
  {
    id: 'CU-20260628-00075', issueId: 'CI-20260628-00075', couponId: NEW5000.id, couponCode: NEW5000.code, couponNameSnapshot: NEW5000.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(NEW5000.code),
    member: 'user07', orderId: 'O-00680',
    orderAmount: 33000, promotionCode: null, promotionDiscount: 0, baseAmount: 33000,
    discountAmount: 5000, currentDiscountAmount: 0, usedAt: '2026-06-28 15:00', status: '전체 환불 반영',
    restored: false, restoredAt: null, restoreNote: null,
    memos: [],
    history: [
      { id: 'H-1', at: '2026-06-28 15:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00680 · 할인 5,000원' },
      { id: 'H-2', at: '2026-07-02 10:00', by: 'admin03', action: '주문 전체 환불' },
    ],
  },
  {
    id: 'CU-20260618-00060', issueId: 'CI-20260618-00060', couponId: PRODUCT10.id, couponCode: PRODUCT10.code, couponNameSnapshot: PRODUCT10.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(PRODUCT10.code),
    member: 'user03', orderId: 'O-00600',
    orderAmount: 50000, promotionCode: null, promotionDiscount: 0, baseAmount: 50000,
    discountAmount: 5000, currentDiscountAmount: 5000, usedAt: '2026-06-18 09:00', status: '전체 취소 반영',
    restored: false, restoredAt: null, restoreNote: '확인 중',
    memos: [{ id: 'M-1', at: '2026-08-26 10:00', by: 'admin02', text: '전체 취소인데 쿠폰 할인이 그대로 남아있습니다. 확인 필요.' }],
    history: [
      { id: 'H-1', at: '2026-06-18 09:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00600 · 할인 5,000원' },
      { id: 'H-2', at: '2026-06-19 09:00', by: 'admin02', action: '주문 전체 취소' },
    ],
  },
  {
    id: 'CU-20260701-00055', issueId: 'CI-20260701-00055', couponId: BUGRATE.id, couponCode: BUGRATE.code, couponNameSnapshot: BUGRATE.name, couponVersion: 1,
    benefitSnapshot: benefitSnapshotOf(BUGRATE.code),
    member: 'user02', orderId: 'O-00550',
    orderAmount: 20000, promotionCode: null, promotionDiscount: 0, baseAmount: 20000,
    discountAmount: -10000, currentDiscountAmount: -10000, usedAt: '2026-07-01 10:00', status: '정상 사용',
    restored: false, restoredAt: null, restoreNote: null,
    memos: [{ id: 'M-1', at: '2026-07-01 11:00', by: 'admin02', text: '쿠폰 할인율(150%) 오입력으로 계산 결과가 비정상입니다.' }],
    history: [{ id: 'H-1', at: '2026-07-01 10:00', by: 'SYSTEM', action: '쿠폰 사용', detail: '주문 O-00550 · 할인 -10,000원' }],
  },
];
